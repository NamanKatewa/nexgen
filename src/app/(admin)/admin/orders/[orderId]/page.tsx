"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FieldError } from "~/components/FieldError";
import ShipmentDetailsModal from "~/components/ShipmentDetailsModal";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";

import { Textarea } from "~/components/ui/textarea";
import { formatDateToSeconds } from "~/lib/utils";
import { rejectOrderSchema } from "~/schemas/order";
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

	const approveMutation = api.admin.approveOrder.useMutation();
	const rejectMutation = api.admin.rejectOrder.useMutation();
	const utils = api.useUtils();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
	} = useForm({
		resolver: zodResolver(rejectOrderSchema),
		defaultValues: {
			orderId: orderId,
			reason: "",
		},
	});

	const handleApprove = () => {
		// Assuming all shipments need an AWB number for approval
		const shipmentsWithAwbs =
			order?.shipments.map((s) => ({
				shipmentId: s.shipment_id,
				awbNumber: s.awb_number || "", // Use existing AWB or empty string
			})) || [];

		approveMutation.mutate(
			{ orderId: orderId, shipments: shipmentsWithAwbs },
			{
				onSuccess: () => {
					utils.order.getOrderById.invalidate({ orderId });
					utils.admin.pendingOrders.invalidate(); // Invalidate pending orders list
				},
			},
		);
	};

	const handleReject = handleSubmit((data) => {
		rejectMutation.mutate(
			{ orderId: orderId, reason: data.reason },
			{
				onSuccess: () => {
					utils.order.getOrderById.invalidate({ orderId });
					utils.admin.pendingOrders.invalidate(); // Invalidate pending orders list
				},
			},
		);
	});

	const handleViewShipment = (shipment: ShipmentItemType) => {
		setSelectedShipment(shipment);
		setShowShipmentModal(true);
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
							{order.shipments.map((shipment) => (
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
										<strong>AWB Number:</strong> {shipment.awb_number || "N/A"}
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
								</div>
							))}
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
