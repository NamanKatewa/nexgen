import { Decimal } from "@prisma/client/runtime/library";
import { TRPCError } from "@trpc/server";
import { findRate } from "~/lib/rate";
import { getPincodeDetails, getZone } from "~/lib/rate-calculator";
import { uploadFileToS3 } from "~/lib/s3";
import { generateShipmentId } from "~/lib/utils";
import { submitShipmentSchema } from "~/schemas/order";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const orderRouter = createTRPCRouter({
	createShipment: protectedProcedure
		.input(submitShipmentSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.user?.user_id;

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

				if (wallet.balance < Decimal(rate)) {
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
});
