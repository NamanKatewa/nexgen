import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../trpc";

export const refundRouter = createTRPCRouter({
	getShipmentDetails: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const shipment = await ctx.db.shipment.findFirst({
				where: {
					OR: [
						{ shipment_id: input.id },
						{ human_readable_shipment_id: input.id },
					],
				},
				select: {
					shipment_id: true,
					shipping_cost: true,
					awb_number: true,
					current_status: true,
					destination_address: true,
					origin_address: true,
				},
			});

			if (!shipment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Shipment not found.",
				});
			}

			return {
				...shipment,
				shipping_cost: shipment.shipping_cost.toNumber(),
			};
		}),

	processRefund: adminProcedure
		.input(
			z.object({
				shipmentId: z.string(),
				refundAmount: z.number().min(0),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const shipment = await ctx.db.shipment.findUnique({
				where: { shipment_id: input.shipmentId },
				select: {
					shipment_id: true,
					user_id: true,
				},
			});

			if (!shipment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Shipment not found.",
				});
			}

			await ctx.db.$transaction(async (tx) => {
				await tx.shipment.update({
					where: { shipment_id: shipment.shipment_id },
					data: { shipment_status: "Rejected", rejection_reason: "Refund" },
				});

				await tx.wallet.update({
					where: { user_id: shipment.user_id },
					data: {
						balance: {
							increment: input.refundAmount,
						},
					},
				});
			});

			return { message: "Refund processed successfully." };
		}),
});
