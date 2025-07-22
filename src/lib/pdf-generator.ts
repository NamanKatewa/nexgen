import type { UseMutateAsyncFunction } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import pdfMake from "pdfmake/build/pdfmake";
import { vfs } from "pdfmake/build/vfs_fonts";
import { imageUrlToBase64 } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";
import { getLabelHTML } from "./label-template";

pdfMake.vfs = vfs;

export async function generateAndDownloadLabel(
	shipmentId: string,
	generateLabelMutation: UseMutateAsyncFunction<
		RouterOutputs["label"]["generateLabel"],
		any,
		{ shipmentId: string },
		unknown
	>,
) {
	let imgData = "";
	const data = await generateLabelMutation({ shipmentId });

	let courierImageBase64 = "";
	if (data.courierImage) {
		courierImageBase64 = await imageUrlToBase64(data.courierImage);
	}

	const htmlContent = getLabelHTML(
		{
			...data.shipment,
			created_at: data.shipment.created_at as string,
		},
		data.companyName,
		courierImageBase64,
		data.barcodeSvg,
		data.qrCodeDataUrl,
	);

	const iframe = document.createElement("iframe");
	iframe.style.position = "absolute";
	iframe.style.left = "-9999px";
	iframe.style.top = "-9999px";
	iframe.style.width = "1px";
	iframe.style.height = "1px";
	iframe.style.visibility = "hidden";
	document.body.appendChild(iframe);

	const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
	if (!iframeDoc) {
		throw new Error("Could not get iframe document.");
	}
	iframeDoc.open();
	iframeDoc.write(htmlContent);
	iframeDoc.close();

	await new Promise<void>((resolve) => {
		iframe.onload = () => resolve();
		if (iframeDoc.readyState === "complete") {
			resolve();
		}
	});

	try {
		const canvas = await html2canvas(iframeDoc.body, { scale: 10 });
		imgData = canvas.toDataURL("image/png");
		document.body.removeChild(iframe);
	} catch (html2canvasError) {
		document.body.removeChild(iframe);
		throw new Error("Failed to capture HTML as image.");
	}

	const docDefinition = {
		content: [
			{
				image: imgData,
				width: 550,
			},
		],
	};

	try {
		pdfMake
			.createPdf(docDefinition)
			.download(`shipment-label-${data.shipment.shipment_id}.pdf`);
	} catch (error) {
		throw new Error("Failed to generate PDF label.");
	}
}
