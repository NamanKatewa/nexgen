import { TRPCError } from "@trpc/server";
import { z } from "zod";
import logger from "~/lib/logger";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

import { SHIPMENT_STATUS, USER_ROLE } from "@prisma/client";
import { env } from "~/env";
import { sendEmail } from "~/lib/email";
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
				select: {
					current_status: true,
					human_readable_shipment_id: true,
					awb_number: true,
					created_at: true,
					courier: { select: { name: true } },
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

	getCouriers: publicProcedure.query(async () => {
		const couriers = await db.courier.findMany();
		return couriers;
	}),

	receiveShipwayWebhook: publicProcedure
		.input(webhookSchema)
		.mutation(async ({ input }) => {
			const { hash, status_feed } = input;
			if (hash !== env.SHIPWAY_HASH && hash !== env.SHIPWAY_HASH_TEMP) {
				logger.warn("Shipway webhook received with invalid hash", {
					receivedHash: hash,
					expectedHash: `${env.SHIPWAY_HASH} | ${env.SHIPWAY_HASH_TEMP}`,
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

			const result = await db.$transaction(async (tx) => {
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

					const nonDeliveryStatuses: SHIPMENT_STATUS[] = [
						SHIPMENT_STATUS.UNDELIVERED,
						SHIPMENT_STATUS.RTO,
						SHIPMENT_STATUS.ON_HOLD,
						SHIPMENT_STATUS.NETWORK_ISSUE,
						SHIPMENT_STATUS.NOT_FOUND_INCORRECT,
						SHIPMENT_STATUS.OUT_OF_DELIVERY_AREA,
						SHIPMENT_STATUS.OTHERS,
						SHIPMENT_STATUS.DELIVERY_DELAYED,
						SHIPMENT_STATUS.CUSTOMER_REFUSED,
						SHIPMENT_STATUS.CONSIGNEE_UNAVAILABLE,
						SHIPMENT_STATUS.DELIVERY_EXCEPTION,
						SHIPMENT_STATUS.DELIVERY_RESCHEDULED,
						SHIPMENT_STATUS.COD_PAYMENT_NOT_READY,
						SHIPMENT_STATUS.SHIPMENT_LOST,
						SHIPMENT_STATUS.PICKUP_FAILED,
						SHIPMENT_STATUS.PICKUP_CANCELLED,
						SHIPMENT_STATUS.ADDRESS_INCORRECT,
						SHIPMENT_STATUS.DELIVERY_ATTEMPTED,
						SHIPMENT_STATUS.PENDING_UNDELIVERED,
						SHIPMENT_STATUS.DELIVERY_ATTEMPTED_PREMISES_CLOSED,
					];

					if (
						newShipmentStatus &&
						nonDeliveryStatuses.includes(newShipmentStatus)
					) {
						logger.info("Non-delivery status detected, sending email", {
							awbno,
							newShipmentStatus,
						});

						const user = await tx.user.findUnique({
							where: { user_id: shipment.user_id },
						});

						const admins = await tx.user.findMany({
							where: { role: USER_ROLE.Admin },
						});

						if (user?.email) {
							await sendEmail({
								to: user.email,
								subject: `Shipment ${shipment.human_readable_shipment_id} - Non-Delivery Update`,
								html: `
								<p>Dear ${user.name || "User"},</p>
								<p>Your shipment with AWB number <strong>${awbno}</strong> (ID: ${shipment.human_readable_shipment_id}) has an important update.</p>
								<p>The current status is: <strong>${newShipmentStatus.replace(/_/g, " ")}</strong>.</p>
								<p>Please visit our tracking page for more details: <a href="${env.BASE_URL}/track?id=${awbno}">${env.BASE_URL}/track?id=${awbno}</a></p>
								<p>If you have any concerns, please contact our support team.</p>
								<p>Thank you,</p>
								<p>Nexgen Courier Services</p>
							`,
							});
						}

						for (const admin of admins) {
							if (admin.email) {
								await sendEmail({
									to: admin.email,
									subject: `ADMIN ALERT: Shipment ${shipment.human_readable_shipment_id} - Non-Delivery Update`,
									html: `
									<p>Dear Admin,</p>
									<p>Shipment with AWB number <strong>${awbno}</strong> (ID: ${shipment.human_readable_shipment_id}) has a non-delivery status update.</p>
									<p>User Email: ${user?.email || "N/A"}</p>
									<p>Current Status: <strong>${newShipmentStatus.replace(/_/g, " ")}</strong>.</p>
									<p>Please investigate and take necessary action.</p>
									<p>Thank you,</p>
									<p>Nexgen Courier Services</p>
								`,
								});
							}
						}
					}
				}

				return {
					status: "success",
					message: "Webhook received and processed",
				};
			});

			return result;
		}),
});
