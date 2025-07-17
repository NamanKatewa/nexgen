import { zodResolver } from "@hookform/resolvers/zod";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { rejectOrderSchema } from "~/schemas/order";
import { type RouterOutputs, api } from "~/trpc/react";
import { formatDateToSeconds } from "~/lib/utils";
import { FieldError } from "./FieldError";
import ShipmentDetailsModal from "./ShipmentDetailsModal";

type OrderItemType = RouterOutputs["admin"]["pendingOrders"][number];
type ShipmentItemType = OrderItemType["shipments"][number];

interface OrderDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	orderItem: OrderItemType | null;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
	isOpen,
	onClose,
	orderItem,
}) => {
	const [showShipmentModal, setShowShipmentModal] = useState(false);
	const [selectedShipment, setSelectedShipment] =
		useState<ShipmentItemType | null>(null);
	const approveMutation = api.admin.approveOrder.useMutation();
	const rejectMutation = api.admin.rejectOrder.useMutation();

	const utils = api.useUtils();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(rejectOrderSchema),
		defaultValues: {
			orderId: orderItem?.order_id || "",
			reason: "",
		},
	});

	const handleApprove = () => {
		approveMutation.mutate(
			{ orderId: orderItem?.order_id as string },
			{
				onSuccess: () => {
					utils.admin.pendingOrders.invalidate();
					onClose();
				},
			},
		);
	};

	const handleReject = handleSubmit((data) => {
		rejectMutation.mutate(
			{ orderId: orderItem?.order_id as string, reason: data.reason },
			{
				onSuccess: () => {
					utils.admin.pendingOrders.invalidate();
					onClose();
				},
			},
		);
	});

	const handleViewShipment = (shipment: ShipmentItemType) => {
		setSelectedShipment(shipment);
		setShowShipmentModal(true);
	};

	return (
		<>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="sm:max-w-[800px]">
					<DialogHeader>
						<DialogTitle>Order Details</DialogTitle>
						<DialogDescription>
							Details of the selected order.
						</DialogDescription>
					</DialogHeader>
					{orderItem && (
						<div className="grid gap-4 py-4">
							<p>{orderItem.user.name}</p>
							<p>{orderItem.user.email}</p>
							<p>Created At: {formatDateToSeconds(orderItem.created_at)}</p>
							<div className="mt-4">
								<h3 className="font-medium text-lg">Shipments</h3>
								<ul className="mt-2 divide-y divide-gray-200">
									{orderItem.shipments.map((shipment) => (
										<li
											key={shipment.shipment_id}
											className="flex items-center justify-between py-2"
										>
											<p>{shipment.recipient_name}</p>
											<Button
												variant="link"
												onClick={() => handleViewShipment(shipment)}
											>
												View Shipment
											</Button>
										</li>
									))}
								</ul>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="rejectionReason">Rejection Reason</Label>
								<Textarea
									id="rejectionReason"
									{...register("reason")}
									placeholder="Enter rejection reason (required for rejection)"
								/>
								{errors.reason && (
									<FieldError message={errors.reason.message} />
								)}
							</div>
							<div className="flex justify-end space-x-2">
								<Button variant="outline" onClick={onClose}>
									Close
								</Button>
								<Button
									onClick={handleApprove}
									disabled={
										approveMutation.isPending ||
										rejectMutation.isPending ||
										isSubmitting
									}
								>
									{approveMutation.isPending ? "Approving..." : "Approve"}
								</Button>
								<Button
									variant="destructive"
									onClick={handleReject}
									disabled={
										approveMutation.isPending ||
										rejectMutation.isPending ||
										isSubmitting
									}
								>
									{rejectMutation.isPending ? "Rejecting..." : "Reject"}
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
			<ShipmentDetailsModal
				isOpen={showShipmentModal}
				onClose={() => setShowShipmentModal(false)}
				shipment={selectedShipment}
			/>
		</>
	);
};

export default OrderDetailsModal;
