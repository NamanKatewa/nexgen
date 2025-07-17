import { zodResolver } from "@hookform/resolvers/zod";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { formatDateToSeconds } from "~/lib/utils";
import { type approveOrderSchema, rejectOrderSchema } from "~/schemas/order";
import { type RouterOutputs, api } from "~/trpc/react";
import { FieldError } from "./FieldError";
import ShipmentDetailsModal from "./ShipmentDetailsModal";

type OrderItemType = RouterOutputs["admin"]["pendingOrders"][number];
type ShipmentItemType = OrderItemType["shipments"][number];

// Define a combined schema for form data
const combinedOrderSchema = z.object({
	orderId: z.string(),
	shipments: z
		.array(
			z.object({
				shipmentId: z.string(),
				awbNumber: z.string(),
			}),
		)
		.optional(), // Make optional for rejection case
	reason: z.string().optional(), // Make optional for approval case
});

type CombinedOrderFormData = z.infer<typeof combinedOrderSchema>;

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
		setValue,
		control,
		setError, // Add setError from useForm
		clearErrors, // Add clearErrors from useForm
	} = useForm<CombinedOrderFormData>({
		resolver: zodResolver(combinedOrderSchema), // Use the combined schema
		defaultValues: {
			orderId: orderItem?.order_id || "",
			shipments:
				orderItem?.shipments.map((s) => ({
					shipmentId: s.shipment_id,
					awbNumber: s.awb_number || "",
				})) || [],
			reason: "",
		},
	});

	useEffect(() => {
		if (orderItem) {
			setValue("orderId", orderItem.order_id);
			setValue(
				"shipments",
				orderItem.shipments.map((s) => ({
					shipmentId: s.shipment_id,
					awbNumber: s.awb_number || "",
				})),
			);
			setValue("reason", ""); // Clear reason when order item changes
			clearErrors(); // Clear all errors on order item change
		}
	}, [orderItem, setValue, clearErrors]);

	const handleApprove = handleSubmit((data) => {
		// Custom validation for approval
		if (
			!data.shipments ||
			data.shipments.some((s) => !s.awbNumber || s.awbNumber.trim() === "")
		) {
			setError("shipments", {
				type: "manual",
				message: "All shipments must have an AWB Number.",
			});
			toast.error("All shipments must have an AWB Number.");
			return;
		}
		clearErrors("shipments"); // Clear shipment errors if validation passes

		approveMutation.mutate(
			{
				orderId: data.orderId,
				shipments: data.shipments as z.infer<
					typeof approveOrderSchema
				>["shipments"],
			},
			{
				onSuccess: () => {
					utils.admin.pendingOrders.invalidate();
					onClose();
				},
			},
		);
	});

	const handleReject = handleSubmit((data) => {
		// Custom validation for rejection
		if (!data.reason || data.reason.trim() === "") {
			setError("reason", {
				type: "manual",
				message: "Rejection reason is required.",
			});
			toast.error("Rejection reason is required.");
			return;
		}
		clearErrors("reason"); // Clear reason errors if validation passes

		rejectMutation.mutate(
			{ orderId: data.orderId, reason: data.reason },
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
				<DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[800px]">
					<DialogHeader>
						<DialogTitle>Order Details</DialogTitle>
						<DialogDescription>
							Details of the selected order.
						</DialogDescription>
					</DialogHeader>
					{orderItem && (
						<div className="grid gap-4 overflow-y-auto py-4">
							<p>
								<strong>User:</strong> {orderItem.user.name}
							</p>
							<p>
								<strong>Email:</strong> {orderItem.user.email}
							</p>
							<p>
								<strong>Created At:</strong>{" "}
								{formatDateToSeconds(orderItem.created_at)}
							</p>
							<div className="mt-4">
								<h3 className="font-medium text-lg">Shipments</h3>
								<ul className="mt-2 divide-y divide-gray-200">
									{orderItem.shipments.map((shipment, index) => (
										<li
											key={shipment.shipment_id}
											className="flex flex-col items-start justify-between py-2"
										>
											<p>
												<strong>Recipient:</strong> {shipment.recipient_name}
											</p>
											<p>
												<strong>Shipment ID:</strong>{" "}
												{shipment.human_readable_shipment_id}
											</p>
											<Button
												variant="link"
												onClick={() => handleViewShipment(shipment)}
												className="p-0"
											>
												View Shipment
											</Button>
											{orderItem.order_status === "PendingApproval" ? (
												<div className="mt-2 w-full">
													<Label htmlFor={`awbNumber-${shipment.shipment_id}`}>
														AWB Number
													</Label>
													<Input
														id={`awbNumber-${shipment.shipment_id}`}
														{...register(`shipments.${index}.awbNumber`)}
														placeholder="Enter AWB Number"
													/>
													{errors.shipments?.[index]?.awbNumber && (
														<FieldError
															message={
																errors.shipments[index]?.awbNumber?.message
															}
														/>
													)}
												</div>
											) : (
												<p>
													<strong>AWB Number:</strong>{" "}
													{shipment.awb_number || "N/A"}
												</p>
											)}
										</li>
									))}
								</ul>
								{errors.shipments &&
									typeof errors.shipments.message === "string" && (
										<FieldError message={errors.shipments.message} />
									)}
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
								{orderItem.order_status === "PendingApproval" && (
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
								)}
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
