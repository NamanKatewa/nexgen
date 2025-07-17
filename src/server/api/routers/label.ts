import { TRPCError } from "@trpc/server";
import bwipjs from "bwip-js";
import puppeteer from "puppeteer";
import QRCode from "qrcode";
import { z } from "zod";
import { getLabelHTML } from "~/lib/label-template";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const labelRouter = createTRPCRouter({
	generateLabel: protectedProcedure
		.input(z.object({ shipmentId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const shipment = await db.shipment.findUnique({
				where: {
					shipment_id: input.shipmentId,
				},
				include: {
					destination_address: true,
					origin_address: true,
					order: { include: { user: { include: { kyc: true } } } },
				},
			});

			if (!shipment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Shipment not found",
				});
			}

			// Authorization check
			if (ctx.user?.role !== "Admin") {
				if (shipment.order.user.user_id !== ctx.user?.user_id) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "Unauthorized",
					});
				}
			}

			const companyName = shipment.order.user.kyc?.entity_name;
			if (!companyName) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to Generate Label: KYC entity name not found",
				});
			}

			let barcodeImageBase64 = "";
			if (shipment.awb_number) {
				const barcodeBuffer = await bwipjs.toBuffer({
					bcid: "code128", // Barcode type
					text: shipment.awb_number, // Text to encode
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

			const htmlContent = getLabelHTML(
				shipment,
				companyName,
				barcodeImageBase64,
				qrCodeDataUrl,
			);

			const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
			const page = await browser.newPage();
			await page.setContent(htmlContent, { waitUntil: "networkidle0" });
			const pdf = await page.pdf({ format: "A4" });
			await browser.close();

			return { pdf: Buffer.from(pdf).toString("base64") };
		}),
});
