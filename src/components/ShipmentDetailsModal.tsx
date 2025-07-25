import Image from "next/image";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { formatDate } from "~/lib/utils";
import { type RouterOutputs, api } from "~/trpc/react";

type ShipmentItemType =
	RouterOutputs["admin"]["pendingShipments"]["shipments"][number];

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
	const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
	const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);
	const [awbNumber, setAwbNumber] = useState("");
	const [courierId, setCourierId] = useState("");
	const [rejectReason, setRejectReason] = useState("");

	const utils = api.useUtils();
	const approveMutation = api.admin.approveShipment.useMutation({
		onSuccess: () => {
			setAwbNumber("");
			setCourierId("");
			utils.admin.pendingShipments.invalidate();
			toast.success("Shipment approved successfully!");
			onClose();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
	const rejectMutation = api.admin.rejectShipment.useMutation({
		onSuccess: () => {
			setRejectReason("");
			utils.admin.pendingShipments.invalidate();
			toast.success("Shipment rejected successfully!");
			onClose();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const { data: couriers, isLoading: isLoadingCouriers } =
		api.tracking.getCouriers.useQuery();

	const handleApprove = async () => {
		if (!shipmentItem) return;

		if (!awbNumber.trim() || !courierId.trim()) {
			toast.error("AWB Number and Courier are required for approval.");
			return;
		}

		await approveMutation.mutateAsync({
			shipmentId: shipmentItem.shipment_id,
			awbNumber,
			courierId,
		});
		setShowApproveConfirmModal(false);
		onClose();
	};

	const handleReject = async () => {
		if (!shipmentItem) return;

		if (!rejectReason.trim()) {
			toast.error("Rejection reason cannot be empty.");
			return;
		}

		await rejectMutation.mutateAsync({
			shipmentId: shipmentItem.shipment_id,
			reason: rejectReason,
		});
		setShowRejectConfirmModal(false);
		onClose();
	};

	if (!shipmentItem) {
		return null;
	}

	return (
		<>
			<Dialog
				open={showApproveConfirmModal}
				onOpenChange={setShowApproveConfirmModal}
			>
				<DialogContent className="w-4xl bg-blue-50 text-blue-950">
					<DialogHeader>
						<DialogTitle>Confirm Approval</DialogTitle>
						<DialogDescription className="text-blue-950">
							Please provide the AWB Number and select a courier to approve this
							shipment.
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4 space-y-4">
						<div>
							<Label htmlFor="awbNumber">AWB Number</Label>
							<Input
								id="awbNumber"
								value={awbNumber}
								onChange={(e) => setAwbNumber(e.target.value)}
								placeholder="Enter AWB Number"
							/>
						</div>
						<div>
							<Label htmlFor="courier">Select Courier</Label>
							<Select onValueChange={setCourierId} value={courierId}>
								<SelectTrigger id="courier">
									<SelectValue placeholder="Select a courier" />
								</SelectTrigger>
								<SelectContent>
									{isLoadingCouriers ? (
										<SelectItem value="" disabled>
											Loading couriers...
										</SelectItem>
									) : (
										couriers?.map((courier) => (
											<SelectItem key={courier.id} value={courier.id}>
												{courier.name}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter className="mt-4 gap-2">
						<Button
							variant="outline"
							onClick={() => setShowApproveConfirmModal(false)}
							disabled={approveMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="default"
							className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
							onClick={handleApprove}
							disabled={approveMutation.isPending}
						>
							{approveMutation.isPending ? "Approving..." : "Confirm Approve"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={showRejectConfirmModal}
				onOpenChange={setShowRejectConfirmModal}
			>
				<DialogContent className="w-4xl bg-blue-50 text-blue-950">
					<DialogHeader>
						<DialogTitle>Confirm Rejection</DialogTitle>
						<DialogDescription className="text-blue-950">
							Are you sure you want to reject this shipment? This action cannot
							be undone.
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4">
						<Label htmlFor="reject-reason">Reason for Rejection</Label>
						<Textarea
							id="reject-reason"
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							placeholder="Enter reason for rejection..."
							className="mt-1"
						/>
					</div>
					<DialogFooter className="mt-4 gap-2">
						<Button
							variant="outline"
							onClick={() => setShowRejectConfirmModal(false)}
							disabled={rejectMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleReject}
							disabled={rejectMutation.isPending}
						>
							{rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isOpen}
				onOpenChange={(open) => {
					if (!open) {
						onClose();
						setAwbNumber("");
						setCourierId("");
						setRejectReason("");
						setShowApproveConfirmModal(false);
						setShowRejectConfirmModal(false);
					}
				}}
			>
				<DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[800px]">
					<DialogHeader>
						<DialogTitle>Shipment Details</DialogTitle>
						<DialogDescription>
							Details of the selected shipment.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 overflow-y-auto py-4">
						<p>
							<strong>User:</strong> {shipmentItem.user.name}
						</p>
						<p>
							<strong>Email:</strong> {shipmentItem.user.email}
						</p>
						<p>
							<strong>Created At:</strong> {formatDate(shipmentItem.created_at)}
						</p>
						<p>
							<strong>Shipment ID:</strong>{" "}
							{shipmentItem.human_readable_shipment_id}
						</p>
						<p>
							<strong>Recipient Name:</strong> {shipmentItem.recipient_name}
						</p>
						<p>
							<strong>Recipient Mobile:</strong> {shipmentItem.recipient_mobile}
						</p>
						<p>
							<strong>Package Weight:</strong>{" "}
							{Number(shipmentItem.package_weight).toFixed(2)} Kg
						</p>
						<p>
							<strong>Package Dimensions:</strong>{" "}
							{shipmentItem.package_dimensions}
						</p>
						{shipmentItem.package_image_url && (
							<div className="flex flex-col gap-2">
								<strong>Package Image:</strong>
								<a
									href={shipmentItem.package_image_url}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Image
										src={shipmentItem.package_image_url}
										alt="Package Image"
										width={200}
										height={200}
										className="h-48 w-48 object-cover"
									/>
								</a>
							</div>
						)}
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
					</div>
					<DialogFooter className="mt-4 flex justify-end space-x-2">
						{shipmentItem.shipment_status === "PendingApproval" && (
							<>
								<Button
									variant="destructive"
									onClick={() => setShowRejectConfirmModal(true)}
									disabled={
										approveMutation.isPending || rejectMutation.isPending
									}
								>
									Reject
								</Button>
								<Button
									className="bg-green-600 text-white hover:bg-green-700"
									onClick={() => setShowApproveConfirmModal(true)}
									disabled={
										approveMutation.isPending || rejectMutation.isPending
									}
								>
									{approveMutation.isPending ? "Approving..." : "Approve"}
								</Button>
							</>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default ShipmentDetailsModal;
