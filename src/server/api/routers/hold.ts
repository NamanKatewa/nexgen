import { TRPCError } from "@trpc/server";
import { z } from "zod";
import logger from "~/lib/logger";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";

export const holdRouter = createTRPCRouter({
	holdShipment: adminProcedure
		.input(
			z.object({
				shipmentId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const { shipmentId } = input;

				const shipment = await ctx.db.shipment.findUnique({
					where: { shipment_id: shipmentId },
					select: { shipment_id: true, shipment_status: true },
				});

				if (!shipment) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Shipment not found.",
					});
				}

				if (shipment.shipment_status === "Hold") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Shipment is already on hold.",
					});
				}

				await ctx.db.shipment.update({
					where: { shipment_id: shipmentId },
					data: { shipment_status: "Hold" },
				});

				return { success: true, message: "Shipment held successfully." };
			} catch (error) {
				logger.error("admin.holdShipment", {
					req: ctx.req,
					user: ctx.user,
					input,
					error,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to hold shipment: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),
	releaseShipment: adminProcedure
		.input(
			z.object({
				shipmentId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const { shipmentId } = input;

				const shipment = await ctx.db.shipment.findUnique({
					where: { shipment_id: shipmentId },
					select: { shipment_id: true, shipment_status: true },
				});

				if (!shipment) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Shipment not found.",
					});
				}

				if (shipment.shipment_status !== "Hold") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Shipment is not on hold.",
					});
				}

				await ctx.db.shipment.update({
					where: { shipment_id: shipmentId },
					data: { shipment_status: "PendingApproval" },
				});

				return { success: true, message: "Shipment released successfully." };
			} catch (error) {
				logger.error("admin.releaseShipment", {
					req: ctx.req,
					user: ctx.user,
					input,
					error,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Failed to release shipment: ${error instanceof Error ? error.message : "Unknown error"}`,
				});
			}
		}),
});
