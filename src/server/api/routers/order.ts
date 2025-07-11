import { Decimal } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { findBulkRates, findRate } from "~/lib/rate";
import { getPincodeDetails, getZone } from "~/lib/rate-calculator";
import { uploadFileToS3 } from "~/lib/s3";
import { generateShipmentId } from "~/lib/utils";
import {
	type TShipmentSchema,
	orderSchema,
	submitShipmentSchema,
} from "~/schemas/order";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

interface ShipmentDetail extends TShipmentSchema {
	rate: number;
	packageImageUrl: string;
}

export const orderRouter = createTRPCRouter({
	createShipment: protectedProcedure
		.input(submitShipmentSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.user?.user_id;

			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User not found.",
				});
			}

			const addresses = await db.address.findMany({
				where: {
					user_id: ctx.user.user_id,
					address_id: {
						in: [input.originAddressId, input.destinationAddressId],
					},
				},
			});

			const originAddress = addresses.find(
				(address) => address.address_id === input.originAddressId,
			);
			const destinationAddress = addresses.find(
				(address) => address.address_id === input.destinationAddressId,
			);
			if (!originAddress) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Origin address not found.",
				});
			}
			if (!destinationAddress) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Destination address not found.",
				});
			}

			const originDetails = await getPincodeDetails(
				String(originAddress.zip_code),
			);
			const destinationDetails = await getPincodeDetails(
				String(destinationAddress.zip_code),
			);

			if (!originDetails) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Invalid pincode for origin address: ${originAddress.zip_code}`,
				});
			}
			if (!destinationDetails) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Invalid pincode for destination address: ${destinationAddress.zip_code}`,
				});
			}

			const { zone } = getZone(originDetails, destinationDetails);
			const weightSlab = Math.ceil(input.packageWeight * 2) / 2;

			let rate = null;

			if (userId) {
				const userRate = await findRate({
					userId,
					zoneFrom: "z",
					zoneTo: zone,
					weightSlab,
					packageWeight: input.packageWeight,
					isUserRate: true,
				});
				if (userRate !== null) {
					rate = userRate;
				}
			} else {
				const defaultRate = await findRate({
					zoneFrom: "z",
					zoneTo: zone,
					weightSlab,
					packageWeight: input.packageWeight,
					isUserRate: false,
				});
				if (defaultRate !== null) {
					rate = defaultRate;
				}
			}

			if (rate === null) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Rate not found for the given shipment details.",
				});
			}

			const human_readable_shipment_id = generateShipmentId(ctx.user.user_id);

			await db.$transaction(async (tx) => {
				const wallet = await tx.wallet.findUnique({
					where: { user_id: ctx.user.user_id },
				});

				if (!wallet) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User wallet not found.",
					});
				}

								if (wallet.balance.lessThan(new Decimal(rate))) {
					throw new TRPCError({
						code: "BAD_GATEWAY",
						message: "Insufficient wallet balance. Recharge your wallet.",
					});
				}
				const order = await tx.order.create({
					data: {
						user_id: wallet.user_id,
						total_amount: rate,
						order_status: "PendingApproval",
						payment_status: "Pending",
					},
				});

				await tx.wallet.update({
					where: { user_id: wallet.user_id },
					data: { balance: { decrement: Decimal(rate) } },
				});

				await tx.transaction.create({
					data: {
						user_id: wallet.user_id,
						transaction_type: "Debit",
						amount: Decimal(rate),
						payment_status: "Completed",
						order_id: order.order_id,
						description: "Single Shipment Created",
					},
				});

				await tx.order.update({
					where: { order_id: order.order_id },
					data: { payment_status: "Paid" },
				});

				const packageImageUrl = await uploadFileToS3(
					input.packageImage,
					"order/",
				);

				await tx.shipment.create({
					data: {
						human_readable_shipment_id,
						order_id: order.order_id,
						current_status: "Booked",
						origin_address_id: originAddress?.address_id,
						destination_address_id: destinationAddress?.address_id,
						recipient_name: input.recipientName,
						recipient_mobile: input.recipientMobile,
						package_image_url: packageImageUrl,
						package_weight: input.packageWeight,
						package_dimensions: `${input.packageBreadth} X ${input.packageHeight} X ${input.packageLength}`,
						shipping_cost: rate,
					},
				});
			});

			return {
				success: true,
				message: "Shipment created successfully",
				shipmentId: human_readable_shipment_id,
			};
		}),

	createBulkShipments: protectedProcedure
		.input(orderSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.user.user_id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User not found.",
				});
			}

			// 1. Collect all unique address IDs from all shipments
			const allAddressIds = input.shipments.flatMap((s) => [
				s.originAddressId,
				s.destinationAddressId,
			]);
			const uniqueAddressIds = [...new Set(allAddressIds)];

			// 2. Fetch all addresses in a single query
			const addresses = await db.address.findMany({
				where: {
					user_id: userId,
					address_id: {
						in: uniqueAddressIds,
					},
				},
			});

			const addressMap = new Map(
				addresses.map((addr) => [addr.address_id, addr]),
			);

			let totalAmount = new Decimal(0);
			const shipmentDetailsForRateCalculation: {
				zoneFrom: string;
				zoneTo: string;
				weightSlab: number;
				packageWeight: number;
			}[] = [];

			const shipmentsWithRatesAndImages: (TShipmentSchema & {
				rate: number;
				packageImageUrl: string;
			})[] = [];

			// Prepare data for bulk rate calculation and S3 uploads
			for (const shipmentInput of input.shipments) {
				const originAddress = addressMap.get(shipmentInput.originAddressId);
				const destinationAddress = addressMap.get(
					shipmentInput.destinationAddressId,
				);

				if (!originAddress) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Origin address not found for shipment ${shipmentInput.recipientName}.`,
					});
				}
				if (!destinationAddress) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Destination address not found for shipment ${shipmentInput.recipientName}.`,
					});
				}

				const originDetails = await getPincodeDetails(
					String(originAddress.zip_code),
				);
				const destinationDetails = await getPincodeDetails(
					String(destinationAddress.zip_code),
				);

				if (!originDetails || !destinationDetails) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid pincode for one of the shipments.",
					});
				}

				const { zone } = getZone(originDetails, destinationDetails);
				const weightSlab = Math.ceil(shipmentInput.packageWeight * 2) / 2;

				shipmentDetailsForRateCalculation.push({
					zoneFrom: "z",
					zoneTo: zone,
					weightSlab,
					packageWeight: shipmentInput.packageWeight,
				});
			}

			// Perform bulk rate calculation
			const calculatedRates = await findBulkRates({
				userId,
				shipmentDetails: shipmentDetailsForRateCalculation,
				isUserRate: !!userId,
			});

			// Upload images and associate rates
			for (let i = 0; i < input.shipments.length; i++) {
				const shipmentInput = input.shipments[i];
				if (!shipmentInput) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Shipment input is undefined.",
					});
				}
				const rate = calculatedRates[i] as number;
				if (rate === null || rate === undefined) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Rate not found for shipment ${shipmentInput.recipientName}.`,
					});
				}

				if (rate === null) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Rate not found for shipment ${shipmentInput.recipientName}.`,
					});
				}

				const packageImageUrl = await uploadFileToS3(
					shipmentInput.packageImage,
					"order/",
				);
				shipmentsWithRatesAndImages.push({
					recipientName: shipmentInput.recipientName,
					recipientMobile: shipmentInput.recipientMobile,
					packageWeight: shipmentInput.packageWeight,
					packageHeight: shipmentInput.packageHeight,
					packageLength: shipmentInput.packageLength,
					packageBreadth: shipmentInput.packageBreadth,
					originAddressId: shipmentInput.originAddressId,
					destinationAddressId: shipmentInput.destinationAddressId,
					packageImage: shipmentInput.packageImage,
					rate,
					packageImageUrl,
				});
				totalAmount = totalAmount.add(new Decimal(rate));
			}

			const wallet = await db.wallet.findUnique({ where: { user_id: userId } });
			if (!wallet) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User wallet not found.",
				});
			}
			if (wallet.balance.lessThan(totalAmount)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Insufficient wallet balance to create all shipments.",
				});
			}

			const results = await db.$transaction(async (tx) => {
				const order = await tx.order.create({
					data: {
						user_id: userId,
						total_amount: totalAmount,
						order_status: "PendingApproval",
						payment_status: "Pending",
					},
				});

				await tx.wallet.update({
					where: { user_id: userId },
					data: { balance: { decrement: totalAmount } },
				});

				await tx.transaction.create({
					data: {
						user_id: userId,
						transaction_type: "Debit",
						amount: totalAmount,
						payment_status: "Completed",
						order_id: order.order_id,
						description: "Bulk Shipments Created",
					},
				});

				await tx.order.update({
					where: { order_id: order.order_id },
					data: { payment_status: "Paid" },
				});

				const createdShipments = [];
				for (const detail of shipmentsWithRatesAndImages) {
					const human_readable_shipment_id = generateShipmentId(userId);
					const shipment = await tx.shipment.create({
						data: {
							human_readable_shipment_id,
							order_id: order.order_id,
							current_status: "Booked",
							origin_address_id: detail.originAddressId,
							destination_address_id: detail.destinationAddressId,
							recipient_name: detail.recipientName,
							recipient_mobile: detail.recipientMobile,
							package_image_url: detail.packageImageUrl,
							package_weight: detail.packageWeight,
							package_dimensions: `${detail.packageBreadth} X ${detail.packageHeight} X ${detail.packageLength}`,
							shipping_cost: detail.rate ?? 0,
						},
					});
					createdShipments.push({
						shipmentId: shipment.human_readable_shipment_id,
						success: true,
						message: "Shipment created successfully.",
					});
				}

				return {
					orderId: order.order_id,
					shipments: createdShipments,
				};
			});

			return {
				success: true,
				message: "Bulk shipments created successfully under a single order.",
				...results,
			};
		}),
});
