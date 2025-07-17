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

type ShipmentItemType =
	RouterOutputs["order"]["getOrderById"]["shipments"][number];

export default function AdminOrderDetailPage() {
	const params = useParams();
	const orderId = params.orderId as string;

	const [showShipmentModal, setShowShipmentModal] = useState(false);
	const [selectedShipment, setSelectedShipment] =
		useState<ShipmentItemType | null>(null);

	const {
		data: order,
		isLoading,
		error,
	} = api.order.getOrderById.useQuery({ orderId });

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
		return <div className="p-8">Loading order details...</div>;
	}

	if (error) {
		return <div className="p-8 text-red-500">Error: {error.message}</div>;
	}

	if (!order) {
		return <div className="p-8">Order not found.</div>;
	}

	return (
		<div className="p-8">
			<h1 className="mb-6 font-bold text-3xl">
				Order Details - {order.order_id}
			</h1>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Order Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<p>
						<strong>User:</strong> {order.user.name} ({order.user.email})
					</p>
					<p>
						<strong>Total Amount:</strong> ₹
						{Number(order.total_amount).toFixed(2)}
					</p>
					<p>
						<strong>Order Status:</strong> {order.order_status}
					</p>
					<p>
						<strong>Payment Status:</strong> {order.payment_status}
					</p>
					<p>
						<strong>Created At:</strong> {formatDateToSeconds(order.created_at)}
					</p>
					{order.rejection_reason && (
						<p className="text-red-500">
							<strong>Rejection Reason:</strong> {order.rejection_reason}
						</p>
					)}
				</CardContent>
			</Card>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Shipments</CardTitle>
				</CardHeader>
				<CardContent>
					{order.shipments.length === 0 ? (
						<p>No shipments for this order.</p>
					) : (
						<div className="space-y-4">
							{order.shipments.map((shipment) => {
								const companyName =
									order.user.kyc?.entity_name || "NEX GEN COURIER SERVICE";
								return (
									<div
										key={shipment.shipment_id}
										className="rounded-md border p-4"
									>
										<p>
											<strong>Shipment ID:</strong>{" "}
											{shipment.human_readable_shipment_id}
										</p>
										<p>
											<strong>Recipient:</strong> {shipment.recipient_name}
										</p>
										<p>
											<strong>AWB Number:</strong>{" "}
											{shipment.awb_number || "N/A"}
										</p>
										<p>
											<strong>Status:</strong> {shipment.current_status}
										</p>
										<Button
											variant="link"
											onClick={() => handleViewShipment(shipment)}
											className="p-0"
										>
											View Details
										</Button>
										{shipment.awb_number &&
											order.order_status === "Approved" && (
												<Button
													variant="outline"
													onClick={() =>
														handleDownloadLabel(shipment.shipment_id)
													}
													className="ml-2"
												>
													Download Label
												</Button>
											)}
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			<ShipmentDetailsModal
				isOpen={showShipmentModal}
				onClose={() => setShowShipmentModal(false)}
				shipment={selectedShipment}
			/>
		</div>
	);
}
