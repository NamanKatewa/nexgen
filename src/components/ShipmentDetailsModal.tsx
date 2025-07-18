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
import {
	type approveShipmentSchema,
	rejectShipmentSchema,
} from "~/schemas/shipment";
import { type RouterOutputs, api } from "~/trpc/react";
import { FieldError } from "./FieldError";

type ShipmentItemType =
	RouterOutputs["admin"]["pendingShipments"]["shipments"][number];
type ShipmentDetailType = ShipmentItemType;

// Define a combined schema for form data
const combinedShipmentSchema = z.object({
	shipmentId: z.string(),
	awbNumber: z.string().optional(),
	reason: z.string().optional(),
});

type CombinedShipmentFormData = z.infer<typeof combinedShipmentSchema>;

interface ShipmentDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	shipmentItem: ShipmentItemType | null;
}

const ShipmentDetailsModal: React.FC<ShipmentDetailsModalProps> = ({
	isOpen,
	onClose,
	shipmentItem,
}) => {
	const [showShipmentModal, setShowShipmentModal] = useState(false);
	const [selectedShipment, setSelectedShipment] =
		useState<ShipmentItemType | null>(null);
	const approveMutation = api.admin.approveShipment.useMutation();
	const rejectMutation = api.admin.rejectShipment.useMutation();

	const utils = api.useUtils();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
		control,
		setError, // Add setError from useForm
		clearErrors, // Add clearErrors from useForm
	} = useForm<CombinedShipmentFormData>({
		resolver: zodResolver(combinedShipmentSchema), // Use the combined schema
		defaultValues: {
			shipmentId: shipmentItem?.shipment_id || "",
			awbNumber: shipmentItem?.awb_number || "",
			reason: "",
		},
	});

	useEffect(() => {
		if (shipmentItem) {
			setValue("shipmentId", shipmentItem.shipment_id);
			setValue("awbNumber", shipmentItem.awb_number || "");
			setValue("reason", ""); // Clear reason when shipment item changes
			clearErrors(); // Clear all errors on shipment item change
		}
	}, [shipmentItem, setValue, clearErrors]);

	const handleApprove = handleSubmit((data) => {
		// Custom validation for approval
		if (!data.awbNumber || data.awbNumber.trim() === "") {
			setError("awbNumber", {
				type: "manual",
				message: "AWB Number is required.",
			});
			toast.error("AWB Number is required.");
			return;
		}
		clearErrors("awbNumber"); // Clear AWB Number errors if validation passes

		approveMutation.mutate(
			{
				shipmentId: data.shipmentId,
				awbNumber: data.awbNumber,
			},
			{
				onSuccess: () => {
					utils.admin.pendingShipments.invalidate();
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
			{ shipmentId: data.shipmentId, reason: data.reason },
			{
				onSuccess: () => {
					utils.admin.pendingShipments.invalidate();
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
						<DialogTitle>Shipment Details</DialogTitle>
						<DialogDescription>
							Details of the selected shipment.
						</DialogDescription>
					</DialogHeader>
					{shipmentItem && (
						<div className="grid gap-4 overflow-y-auto py-4">
							<p>
								<strong>User:</strong> {shipmentItem.user.name}
							</p>
							<p>
								<strong>Email:</strong> {shipmentItem.user.email}
							</p>
							<p>
								<strong>Created At:</strong>{" "}
								{formatDateToSeconds(shipmentItem.created_at)}
							</p>
							<p>
								<strong>Shipment ID:</strong>{" "}
								{shipmentItem.human_readable_shipment_id}
							</p>
							<p>
								<strong>Recipient Name:</strong> {shipmentItem.recipient_name}
							</p>
							<p>
								<strong>Recipient Mobile:</strong>{" "}
								{shipmentItem.recipient_mobile}
							</p>
							<p>
								<strong>Package Weight:</strong>{" "}
								{Number(shipmentItem.package_weight).toFixed(2)} Kg
							</p>
							<p>
								<strong>Package Dimensions:</strong>{" "}
								{shipmentItem.package_dimensions}
							</p>
							<p>
								<strong>Amount:</strong> ₹
								{Number(shipmentItem.shipping_cost).toFixed(2)}
							</p>
							<p>
								<strong>Payment Status:</strong> {shipmentItem.payment_status}
							</p>
							<p>
								<strong>Approval Status:</strong> {shipmentItem.shipment_status}
							</p>
							{shipmentItem.rejection_reason && (
								<p>
									<strong>Rejection Reason:</strong>{" "}
									{shipmentItem.rejection_reason}
								</p>
							)}
							{shipmentItem.shipment_status === "PendingApproval" && (
								<div className="mt-2 w-full">
									<Label htmlFor={`awbNumber-${shipmentItem.shipment_id}`}>
										AWB Number
									</Label>
									<Input
										id={`awbNumber-${shipmentItem.shipment_id}`}
										{...register("awbNumber")}
										placeholder="Enter AWB Number"
									/>
									{errors.awbNumber && (
										<FieldError message={errors.awbNumber.message} />
									)}
								</div>
							)}
							<div className="mt-4 flex justify-end space-x-2">
								{shipmentItem.shipment_status === "PendingApproval" && (
									<>
										<Button
											onClick={handleApprove}
											disabled={
												approveMutation.isPending || rejectMutation.isPending
											}
										>
											{approveMutation.isPending ? "Approving..." : "Approve"}
										</Button>
										<Button
											variant="destructive"
											onClick={handleReject}
											disabled={
												approveMutation.isPending || rejectMutation.isPending
											}
										>
											{rejectMutation.isPending ? "Rejecting..." : "Reject"}
										</Button>
									</>
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
};

export default ShipmentDetailsModal;
