import { TRPCError } from "@trpc/server";
import bwipjs from "bwip-js";

import QRCode from "qrcode";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const labelRouter = createTRPCRouter({
	generateLabel: protectedProcedure
		.input(z.object({ shipmentId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const shipment = await db.shipment.findFirst({
				where: {
					OR: [
						{ shipment_id: input.shipmentId },
						{ awb_number: input.shipmentId },
						{ human_readable_shipment_id: input.shipmentId },
					],
					shipment_status: "Approved",
				},
				select: {
					shipment_id: true,
					declared_value: true,
					user_id: true,
					human_readable_shipment_id: true,
					updated_at: true,
					current_status: true,
					shipment_status: true,
					courier_id: true,
					payment_status: true,
					awb_number: true,
					created_at: true,
					recipient_name: true,
					recipient_mobile: true,
					user: {
						select: { user_id: true, kyc: { select: { entity_name: true } } },
					},
					courier: true,
					destination_address: {
						select: {
							address_line: true,
							landmark: true,
							city: true,
							state: true,
							zip_code: true,
						},
					},
					origin_address: {
						select: {
							address_line: true,
							landmark: true,
							city: true,
							state: true,
							zip_code: true,
						},
					},
				},
			});

			if (!shipment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Shipment not found",
				});
			}

			if (ctx.user?.role !== "Admin") {
				if (shipment.user.user_id !== ctx.user?.user_id) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "Unauthorized",
					});
				}
			}

			if (!shipment.user.kyc?.entity_name) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to Generate Label: KYC entity name not found",
				});
			}

			let barcodeImageBase64 = "";
			if (shipment.awb_number) {
				const barcodeBuffer = await bwipjs.toBuffer({
					bcid: "code128",
					text: shipment.awb_number,
					scale: 3,
					height: 10,
					includetext: true,
					textxalign: "center",
				});
				barcodeImageBase64 = `data:image/png;base64,${barcodeBuffer.toString(
					"base64",
				)}`;
			}

			let qrCodeDataUrl = "";
			if (shipment.awb_number) {
				qrCodeDataUrl = await QRCode.toDataURL(shipment.awb_number);
			}

			return {
				shipment: {
					...shipment,
					created_at: shipment.created_at.toISOString(),
				},
				courierImage: shipment.courier?.image_url || "",
				barcodeSvg: barcodeImageBase64,
				qrCodeDataUrl,
			};
		}),
});
