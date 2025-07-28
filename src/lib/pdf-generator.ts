import type { UseMutateAsyncFunction } from "@tanstack/react-query";
import { imageUrlToBase64 } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";
import { getLabelHTML } from "./label-template";

export async function generateAndDownloadLabel(
	shipmentId: string,
	generateLabelMutation: UseMutateAsyncFunction<
		RouterOutputs["label"]["generateLabel"],
		any,
		{ shipmentId: string },
		unknown
	>,
) {
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
		courierImageBase64,
		data.barcodeSvg,
		data.qrCodeDataUrl,
	);

	const printWindow = window.open("", "_blank");
	if (!printWindow) {
		throw new Error(
			"Could not open print window. Please allow pop-ups for this site.",
		);
	}

	printWindow.document.write(htmlContent);
	printWindow.document.close();

	printWindow.onload = () => {
		printWindow.focus();
		printWindow.print();
		// Optionally close the window after printing, or leave it open for the user to review
		// printWindow.close();
	};
}
