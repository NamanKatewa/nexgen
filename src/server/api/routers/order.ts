import { Decimal } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import logger from "~/lib/logger";
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
			const { user } = ctx;
			const logData = { userId: user.user_id, input };
			logger.info("Creating single shipment", logData);

			try {
				const addresses = await db.address.findMany({
					where: {
						user_id: user.user_id as string,
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
					logger.warn("Origin address not found", {
						...logData,
						addressId: input.originAddressId,
					});
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Origin address not found.",
					});
				}
				if (!destinationAddress) {
					logger.warn("Destination address not found", {
						...logData,
						addressId: input.destinationAddressId,
					});
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
					logger.warn("Invalid origin pincode", {
						...logData,
						pincode: originAddress.zip_code,
					});
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Invalid pincode for origin address: ${originAddress.zip_code}`,
					});
				}
				if (!destinationDetails) {
					logger.warn("Invalid destination pincode", {
						...logData,
						pincode: destinationAddress.zip_code,
					});
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Invalid pincode for destination address: ${destinationAddress.zip_code}`,
					});
				}

				const { zone } = getZone(originDetails, destinationDetails);
				const weightSlab = Math.ceil(input.packageWeight * 2) / 2;

				let rate = null;

				if (user.user_id) {
					const userRate = await findRate({
						userId: user.user_id,
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
					logger.error("Rate not found for shipment", {
						...logData,
						zone,
						weightSlab,
					});
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Rate not found for the given shipment details.",
					});
				}

				const human_readable_shipment_id = generateShipmentId(user.user_id);

				await db.$transaction(async (tx) => {
					const wallet = await tx.wallet.findUnique({
						where: { user_id: user.user_id },
					});

					if (!wallet) {
						logger.error("User wallet not found", { ...logData });
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "User wallet not found.",
						});
					}

					if (wallet.balance.lessThan(new Decimal(rate))) {
						logger.warn("Insufficient wallet balance", {
							...logData,
							balance: wallet.balance,
							rate,
						});
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
						data: { balance: { decrement: new Decimal(rate) } },
					});

					await tx.transaction.create({
						data: {
							user_id: wallet.user_id,
							transaction_type: "Debit",
							amount: new Decimal(rate),
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

				logger.info("Successfully created single shipment", {
					...logData,
					shipmentId: human_readable_shipment_id,
				});
				return {
					success: true,
					message: "Shipment created successfully",
					shipmentId: human_readable_shipment_id,
				};
			} catch (error) {
				logger.error("Failed to create single shipment", { ...logData, error });
				throw error;
			}
		}),

	createBulkShipments: protectedProcedure
		.input(orderSchema)
		.mutation(async ({ ctx, input }) => {
			const { user } = ctx;
			const logData = {
				userId: user.user_id,
				shipmentCount: input.shipments.length,
			};
			logger.info("Creating bulk shipments", logData);

			try {
				const allAddressIds = input.shipments.flatMap((s) => [
					s.originAddressId,
					s.destinationAddressId,
				]);
				const uniqueAddressIds = [...new Set(allAddressIds)];

				const addresses = await db.address.findMany({
					where: {
						user_id: user.user_id as string,
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

				const shipmentsWithRatesAndImages: ShipmentDetail[] = [];

				for (const shipmentInput of input.shipments) {
					const originAddress = addressMap.get(shipmentInput.originAddressId);
					const destinationAddress = addressMap.get(
						shipmentInput.destinationAddressId,
					);

					if (!originAddress) {
						logger.warn("Origin address not found in bulk creation", {
							...logData,
							addressId: shipmentInput.originAddressId,
						});
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Origin address not found for shipment ${shipmentInput.recipientName}.`,
						});
					}
					if (!destinationAddress) {
						logger.warn("Destination address not found in bulk creation", {
							...logData,
							addressId: shipmentInput.destinationAddressId,
						});
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
						logger.warn("Invalid pincode in bulk creation", {
							...logData,
							originPincode: originAddress.zip_code,
							destPincode: destinationAddress.zip_code,
						});
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

				const calculatedRates = await findBulkRates({
					userId: user.user_id,
					shipmentDetails: shipmentDetailsForRateCalculation,
					isUserRate: !!user.user_id,
				});

				for (let i = 0; i < input.shipments.length; i++) {
					const shipmentInput = input.shipments[i];
					if (!shipmentInput) {
						logger.error("Shipment input is undefined in bulk creation loop", {
							...logData,
							index: i,
						});
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Shipment data is missing.",
						});
					}

					const rate = calculatedRates[i];
					if (rate === null || rate === undefined) {
						logger.error("Rate not found for bulk shipment", {
							...logData,
							shipment: shipmentInput,
						});
						throw new TRPCError({
							code: "NOT_FOUND",
							message: `Rate not found for shipment ${shipmentInput.recipientName}.`,
						});
					}

					if (typeof shipmentInput.packageWeight !== "number") {
						logger.error("Package weight is not a number for bulk shipment", {
							...logData,
							shipment: shipmentInput,
						});
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Package weight is invalid for shipment ${shipmentInput.recipientName}.`,
						});
					}

					const packageImageUrl = await uploadFileToS3(
						shipmentInput.packageImage,
						"order/",
					);
					shipmentsWithRatesAndImages.push({
						...shipmentInput,
						rate,
						packageImageUrl,
					});
					totalAmount = totalAmount.add(new Decimal(rate));
				}

				const wallet = await db.wallet.findUnique({
					where: { user_id: user.user_id },
				});
				if (!wallet) {
					logger.error("User wallet not found for bulk creation", {
						...logData,
					});
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User wallet not found.",
					});
				}
				if (wallet.balance.lessThan(totalAmount)) {
					logger.warn("Insufficient wallet balance for bulk creation", {
						...logData,
						balance: wallet.balance,
						totalAmount,
					});
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Insufficient wallet balance to create all shipments.",
					});
				}

				const results = await db.$transaction(async (tx) => {
					const order = await tx.order.create({
						data: {
							user_id: user.user_id as string,
							total_amount: totalAmount,
							order_status: "PendingApproval",
							payment_status: "Pending",
						},
					});

					await tx.wallet.update({
						where: { user_id: user.user_id },
						data: { balance: { decrement: totalAmount } },
					});

					await tx.transaction.create({
						data: {
							user_id: user.user_id as string,
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
						const human_readable_shipment_id = generateShipmentId(user.user_id);
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

				logger.info("Successfully created bulk shipments", {
					...logData,
					orderId: results.orderId,
					createdCount: results.shipments.length,
				});
				return {
					success: true,
					message: "Bulk shipments created successfully under a single order.",
					...results,
				};
			} catch (error) {
				logger.error("Failed to create bulk shipments", { ...logData, error });
				throw error;
			}
		}),
});
