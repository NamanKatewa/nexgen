import { TRPCError } from "@trpc/server";
import logger from "~/lib/logger";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

import { env } from "~/env";
import { webhookSchema } from "~/schemas/webhook";

export const trackingRouter = createTRPCRouter({
	getCouriers: publicProcedure.query(async ({ ctx }) => {
		const couriers = await db.courier.findMany();
		return couriers;
	}),

	receiveShipwayWebhook: publicProcedure
		.input(webhookSchema)
		.mutation(async ({ input }) => {
			const { hash, status_feed } = input;
			const expectedHash = env.SHIPWAY_HASH;
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

			for (const update of status_feed) {
				const {
					awbno,
					current_status,
					status_time,
					carrier,
					carrier_id,
					scans,
				} = update;

				const shipment = await db.shipment.findUnique({
					where: { awb_number: awbno },
				});

				if (!shipment) {
					logger.warn("Shipment not found for AWB", { awbno });
					continue;
				}

				const courier = await db.courier.findUnique({
					where: { shipway_id: String(shipment.courier_id) },
				});

				if (!courier) {
					logger.warn("Courier not found for Shipway ID", { carrier_id });
					continue;
				}

				if (scans && scans.length > 0) {
					for (const scan of scans) {
						logger.info("Processing Shipway tracking scan update", {
							shipment_id: shipment.shipment_id,
							courier_id: courier.id,
							timestamp: new Date(scan.time),
							location: scan.location,
							status_description: scan.status,
							event_details: JSON.stringify({
								time: scan.time,
								status: scan.status,
								location: scan.location,
							}),
						});

						// TODO: For now, only log the data. Saving to DB will be implemented later.
						// await db.tracking.create({
						//   data: {
						//     shipment_id: shipment.shipment_id,
						//     courier_id: courier.id,
						//     timestamp: new Date(scan.time),
						//     location: scan.location,
						//     status_description: mappedStatusDescription,
						//     carrier_update_code: mappedCarrierUpdateCode,
						//     event_details: JSON.stringify({ time: scan.time, status: scan.status, location: scan.location }),
						//   },
						// });
					}
				} else {
					// If no scans, log the main update details as a single tracking entry

					logger.info("Processing Shipway tracking update (no scans)", {
						shipment_id: shipment.shipment_id,
						courier_id: courier.id,
						location: update.from || update.to || null,
						event_details: JSON.stringify({
							time: status_time,
							status: current_status,
							location: update.from || update.to || null,
						}),
					});
					// TODO: For now, only log the data. Saving to DB will be implemented later.
					// await db.tracking.create({
					//   data: {
					//     shipment_id: shipment.shipment_id,
					//     courier_id: courier.id,
					//     timestamp: new Date(status_time),
					//     location: update.from || update.to || null,
					//     status_description: mappedStatusDescription,
					//     carrier_update_code: mappedCarrierUpdateCode,
					//     event_details: JSON.stringify({ time: status_time, status: current_status, location: update.from || update.to || null }),
					//   },
					// });
				}
			}

			return { status: "success", message: "Webhook received and processed" };
		}),
});
