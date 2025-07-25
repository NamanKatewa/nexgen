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
					<div className="grid grid-cols-2 gap-4 overflow-y-auto py-4">
						<div className="font-semibold text-gray-700">User</div>
						<div>{shipmentItem.user.name}</div>

						<div className="font-semibold text-gray-700">Email</div>
						<div>{shipmentItem.user.email}</div>

						<div className="font-semibold text-gray-700">Created At</div>
						<div>{formatDate(shipmentItem.created_at)}</div>

						<div className="font-semibold text-gray-700">Shipment ID</div>
						<div>{shipmentItem.human_readable_shipment_id}</div>

						<div className="font-semibold text-gray-700">Recipient Name</div>
						<div>{shipmentItem.recipient_name}</div>

						<div className="font-semibold text-gray-700">Recipient Mobile</div>
						<div>{shipmentItem.recipient_mobile}</div>

						<div className="font-semibold text-gray-700">Package Weight</div>
						<div>{Number(shipmentItem.package_weight).toFixed(2)} Kg</div>

						<div className="font-semibold text-gray-700">
							Package Dimensions
						</div>
						<div className="space-y-1">
							<div>
								<span className="text-gray-600">Breadth:</span>{" "}
								{shipmentItem.package_dimensions.split(/\s*x\s*/i)[0]} cm
							</div>
							<div>
								<span className="text-gray-600">Height:</span>{" "}
								{shipmentItem.package_dimensions.split(/\s*x\s*/i)[1]} cm
							</div>
							<div>
								<span className="text-gray-600">Length:</span>{" "}
								{shipmentItem.package_dimensions.split(/\s*x\s*/i)[2]} cm
							</div>
						</div>

						<div className="font-semibold text-gray-700">Origin Address</div>
						<div className="space-y-1">
							<div>
								<span className="text-gray-600">Address Line:</span>{" "}
								{shipmentItem.origin_address.address_line}
							</div>
							<div>
								<span className="text-gray-600">Landmark:</span>{" "}
								{shipmentItem.origin_address.landmark}
							</div>
							<div>
								<span className="text-gray-600">City:</span>{" "}
								{shipmentItem.origin_address.city}
							</div>
							<div>
								<span className="text-gray-600">State:</span>{" "}
								{shipmentItem.origin_address.state}
							</div>
							<div>
								<span className="text-gray-600">PIN Code:</span>{" "}
								{shipmentItem.origin_address.zip_code}
							</div>
						</div>
						<div className="font-semibold text-gray-700">
							Destination Address
						</div>
						<div className="space-y-1">
							<div>
								<span className="text-gray-600">Address Line:</span>{" "}
								{shipmentItem.destination_address.address_line}
							</div>
							<div>
								<span className="text-gray-600">Landmark:</span>{" "}
								{shipmentItem.destination_address.landmark}
							</div>
							<div>
								<span className="text-gray-600">City:</span>{" "}
								{shipmentItem.destination_address.city}
							</div>
							<div>
								<span className="text-gray-600">State:</span>{" "}
								{shipmentItem.destination_address.state}
							</div>
							<div>
								<span className="text-gray-600">PIN Code:</span>{" "}
								{shipmentItem.destination_address.zip_code}
							</div>
						</div>

						{shipmentItem.package_image_url && (
							<>
								<div className="font-semibold text-gray-700">Package Image</div>
								<div>
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
											className="h-48 w-48 rounded-md object-cover"
										/>
									</a>
								</div>
							</>
						)}

						<div className="font-semibold text-gray-700">Amount</div>
						<div>₹{Number(shipmentItem.shipping_cost).toFixed(2)}</div>

						<div className="font-semibold text-gray-700">Payment Status</div>
						<div>{shipmentItem.payment_status}</div>

						<div className="font-semibold text-gray-700">Approval Status</div>
						<div>{shipmentItem.shipment_status}</div>

						{shipmentItem.rejection_reason && (
							<>
								<div className="font-semibold text-gray-700">
									Rejection Reason
								</div>
								<div>{shipmentItem.rejection_reason}</div>
							</>
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
