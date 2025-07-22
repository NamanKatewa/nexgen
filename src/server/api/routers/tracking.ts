import { TRPCError } from "@trpc/server";
import { z } from "zod";
import logger from "~/lib/logger";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

import { env } from "~/env";
import { shipwayStatusMap } from "~/lib/shipment-status-map";
import { webhookSchema } from "~/schemas/webhook";

export const trackingRouter = createTRPCRouter({
	getTrackingData: publicProcedure
		.input(z.object({ identifier: z.string() }))
		.query(async ({ ctx, input }) => {
			const { identifier } = input;

			const shipment = await ctx.db.shipment.findFirst({
				where: {
					OR: [
						{ awb_number: identifier },
						{ shipment_id: identifier },
						{ human_readable_shipment_id: identifier },
					],
				},
				include: {
					courier: true,
					tracking: {
						orderBy: { timestamp: "desc" },
					},
				},
			});

			if (!shipment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Shipment not found.",
				});
			}

			return { shipment, trackingEvents: shipment.tracking };
		}),

	getCouriers: publicProcedure.query(async ({ ctx }) => {
		const couriers = await db.courier.findMany();
		return couriers;
	}),

	receiveShipwayWebhook: publicProcedure
		.input(webhookSchema)
		.mutation(async ({ input }) => {
			const { hash, status_feed } = input;
			const expectedHash = env.SHIPWAY_HASH.replace(/^"|"$/g, "");
			if (hash !== expectedHash) {
				logger.warn("Shipway webhook received with invalid hash", {
					receivedHash: hash,
					expectedHash,
				});
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Unauthorized: Invalid hash",
				});
			}

			if (!status_feed || status_feed.length === 0) {
				logger.warn("Shipway webhook received with no status_feed", input);
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No status_feed found",
				});
			}

			await db.$transaction(async (tx) => {
				for (const update of status_feed) {
					const { awbno, current_status, status_time, carrier_id, scans } =
						update;

					const shipment = await tx.shipment.findUnique({
						where: { awb_number: awbno },
					});

					if (!shipment) {
						logger.warn("Shipment not found for AWB", { awbno });
						continue;
					}

					const courier = await tx.courier.findUnique({
						where: { shipway_id: String(carrier_id) },
					});

					if (!courier) {
						logger.warn("Courier not found for Shipway ID", { carrier_id });
						continue;
					}

					if (scans && scans.length > 0) {
						for (const scan of scans) {
							const timestamp = new Date(scan.time || new Date().toISOString()); // Ensure scan.time is string
							const location = scan.location || "";
							const status_description = scan.status || "";

							const existingTracking = await tx.tracking.findFirst({
								where: {
									shipment_id: shipment.shipment_id,
									courier_id: courier.id,
									timestamp: timestamp,
									location: location,
									status_description: status_description,
								},
							});

							if (!existingTracking) {
								logger.info("Creating new tracking record", {
									shipment_id: shipment.shipment_id,
									courier_id: courier.id,
									timestamp: timestamp,
									location: location,
									status_description: status_description,
								});
								await tx.tracking.create({
									data: {
										shipment_id: shipment.shipment_id,
										courier_id: courier.id,
										timestamp: timestamp,
										location: location,
										status_description: status_description,
									},
								});
							}
						}
					}

					if (!current_status) {
						continue;
					}

					// Update shipment current_status
					const newShipmentStatus = shipwayStatusMap[current_status];
					if (newShipmentStatus) {
						logger.info("Updating shipment status", {
							awbno,
							oldStatus: shipment.current_status,
							newStatus: newShipmentStatus,
						});
						await tx.shipment.update({
							where: { awb_number: awbno },
							data: { current_status: newShipmentStatus },
						});
					} else {
						logger.warn("Unknown Shipway status code received", {
							awbno,
							current_status,
						});
					}
				}
			});

			return { status: "success", message: "Webhook received and processed" };
		}),
});
