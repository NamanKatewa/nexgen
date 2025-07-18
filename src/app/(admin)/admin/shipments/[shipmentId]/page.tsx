"use client";

import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import ShipmentDetailsModal from "~/components/ShipmentDetailsModal";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { formatDateToSeconds } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

type ShipmentItemType = RouterOutputs["shipment"]["getShipmentById"];

export default function AdminOrderDetailPage() {
	const params = useParams();
	const shipmentId = params.shipmentId as string;

	const [showShipmentModal, setShowShipmentModal] = useState(false);
	const [selectedShipment, setSelectedShipment] =
		useState<ShipmentItemType | null>(null);

	const {
		data: shipment,
		isLoading,
		error,
	} = api.shipment.getShipmentById.useQuery({ shipmentId });

	const utils = api.useUtils();

	const handleViewShipment = (shipment: ShipmentItemType) => {
		setSelectedShipment(shipment);
		setShowShipmentModal(true);
	};

	const generateLabelMutation = api.label.generateLabel.useMutation();

	const handleDownloadLabel = async (shipmentId: string) => {
		try {
			const result = await generateLabelMutation.mutateAsync({ shipmentId });
			const byteCharacters = atob(result.pdf);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: "application/pdf" });
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = `shipment-label-${shipmentId}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			toast.error("Failed to generate label");
		}
	};

	if (isLoading) {
		return <div className="p-8">Loading shipment details...</div>;
	}

	if (error) {
		return <div className="p-8 text-red-500">Error: {error.message}</div>;
	}

	if (!shipment) {
		return <div className="p-8">Shipment not found.</div>;
	}

	return (
		<div className="p-8">
			<h1 className="mb-6 font-bold text-3xl">
				Shipment Details - {shipment.human_readable_shipment_id}
			</h1>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Shipment Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<p>
						<strong>User:</strong> {shipment.user.name} ({shipment.user.email})
					</p>
					<p>
						<strong>Total Amount:</strong> ₹
						{shipment.shipping_cost.toNumber().toFixed(2)}
					</p>
					<p>
						<strong>Shipment Status:</strong> {shipment.shipment_status}
					</p>
					<p>
						<strong>Payment Status:</strong> {shipment.payment_status}
					</p>
					<p>
						<strong>Created At:</strong>{" "}
						{formatDateToSeconds(shipment.created_at)}
					</p>
					{shipment.rejection_reason && (
						<p className="text-red-500">
							<strong>Rejection Reason:</strong> {shipment.rejection_reason}
						</p>
					)}
					<p>
						<strong>AWB Number:</strong> {shipment.awb_number || "N/A"}
					</p>
					<p>
						<strong>Recipient:</strong> {shipment.recipient_name}
					</p>
					<p>
						<strong>Recipient Mobile:</strong> {shipment.recipient_mobile}
					</p>
					<p>
						<strong>Package Weight:</strong>{" "}
						{Number(shipment.package_weight).toFixed(2)} Kg
					</p>
					<p>
						<strong>Package Dimensions:</strong> {shipment.package_dimensions}
					</p>
					<p>
						<strong>Origin Address:</strong>{" "}
						{shipment.origin_address.address_line},{" "}
						{shipment.origin_address.city}, {shipment.origin_address.state} -{" "}
						{shipment.origin_address.zip_code}
					</p>
					<p>
						<strong>Destination Address:</strong>{" "}
						{shipment.destination_address.address_line},{" "}
						{shipment.destination_address.city},{" "}
						{shipment.destination_address.state} -{" "}
						{shipment.destination_address.zip_code}
					</p>
					{shipment.awb_number && shipment.shipment_status === "Approved" && (
						<Button
							variant="outline"
							onClick={() => handleDownloadLabel(shipment.shipment_id)}
							className="mt-4"
						>
							Download Label
						</Button>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
