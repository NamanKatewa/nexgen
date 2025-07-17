import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
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
import { Textarea } from "~/components/ui/textarea";
import { formatDateToSeconds } from "~/lib/utils";

import { api } from "~/trpc/react";

import type { inferRouterOutputs } from "@trpc/server";
import Image from "next/image";
import { useState } from "react";
import type { AppRouter } from "~/server/api/root";

type KycListType = inferRouterOutputs<AppRouter>["admin"]["pendingKyc"];
type KycItemType = KycListType extends Array<infer T> ? T : never;

type BillingAddress = {
	address_line: string;
	city: string;
	state: string;
	zip_code: number;
};

function isBillingAddress(obj: unknown): obj is BillingAddress {
	if (typeof obj !== "object" || obj === null) {
		return false;
	}
	const potentialAddress = obj as Record<string, unknown>;

	return (
		"address_line" in potentialAddress &&
		typeof potentialAddress.address_line === "string" &&
		"city" in potentialAddress &&
		typeof potentialAddress.city === "string" &&
		"state" in potentialAddress &&
		typeof potentialAddress.state === "string" &&
		"zip_code" in potentialAddress &&
		typeof potentialAddress.zip_code === "number"
	);
}

interface KycDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	kycItem: KycItemType | null;
}

const KycDetailsModal: React.FC<KycDetailsModalProps> = ({
	isOpen,
	onClose,
	kycItem,
}) => {
	const [rejectReason, setRejectReason] = useState("");
	const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
	const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);

	const utils = api.useUtils();
	const verifyKyc = api.admin.verifyKyc.useMutation({
		onSuccess: () => {
			utils.admin.pendingKyc.invalidate();
			toast.success("KYC application approved successfully!");
			onClose();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
	const rejectKyc = api.admin.rejectKyc.useMutation({
		onSuccess: () => {
			utils.admin.pendingKyc.invalidate();
			toast.success("KYC application rejected successfully!");
			onClose();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const previewImage = (src: string) => {
		window.open(src, "_blank");
	};

	if (!kycItem) {
		return null;
	}

	const address: BillingAddress | null = isBillingAddress(kycItem.address)
		? (kycItem.address as BillingAddress)
		: null;

	return (
		<>
			{/* Approve Confirmation Modal */}
			<Dialog
				open={showApproveConfirmModal}
				onOpenChange={setShowApproveConfirmModal}
			>
				<DialogContent className="w-4xl bg-blue-50 text-blue-950">
					<DialogHeader>
						<DialogTitle>Confirm Approval</DialogTitle>
						<DialogDescription className="text-blue-950">
							Are you sure you want to approve this KYC application? This action
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-4 gap-2">
						<Button
							variant="outline"
							onClick={() => setShowApproveConfirmModal(false)}
							disabled={verifyKyc.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="default"
							className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
							onClick={async () => {
								await verifyKyc.mutateAsync({ kycId: kycItem.kyc_id });
								setShowApproveConfirmModal(false);
								onClose();
							}}
							disabled={verifyKyc.isPending}
						>
							{verifyKyc.isPending ? "Approving..." : "Confirm Approve"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reject Confirmation Modal */}
			<Dialog
				open={showRejectConfirmModal}
				onOpenChange={setShowRejectConfirmModal}
			>
				<DialogContent className="w-4xl bg-blue-50 text-blue-950">
					<DialogHeader>
						<DialogTitle>Confirm Rejection</DialogTitle>
						<DialogDescription className="text-blue-950">
							Are you sure you want to reject this KYC application? This action
							cannot be undone.
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
							disabled={rejectKyc.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={async () => {
								if (rejectReason.trim()) {
									await rejectKyc.mutateAsync({
										kycId: kycItem.kyc_id,
										reason: rejectReason,
									});
									setShowRejectConfirmModal(false);
									onClose();
								} else {
									toast.error("Rejection reason cannot be empty.");
								}
							}}
							disabled={rejectKyc.isPending}
						>
							{rejectKyc.isPending ? "Rejecting..." : "Confirm Rejection"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isOpen}
				onOpenChange={(open) => {
					if (!open) {
						onClose();
						setRejectReason("");
						setShowApproveConfirmModal(false);
						setShowRejectConfirmModal(false);
					}
				}}
			>
				<DialogContent className="w-4xl bg-blue-50 text-blue-950">
					<DialogHeader>
						<DialogTitle>KYC Details for {kycItem.entity_name}</DialogTitle>
						<DialogDescription className="text-blue-950">
							Review the details.
						</DialogDescription>
					</DialogHeader>
					<div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Entity Name</Label>
							<Input
								value={kycItem.entity_name || "N/A"}
								readOnly
								tabIndex={-1}
							/>
						</div>
						<div className="space-y-2">
							<Label>Email</Label>
							<Input
								value={kycItem.user.email || "N/A"}
								readOnly
								tabIndex={-1}
							/>
						</div>
						<div className="space-y-2">
							<Label>Entity Type</Label>
							<Input
								value={kycItem.entity_type || "N/A"}
								readOnly
								tabIndex={-1}
							/>
						</div>
						<div className="space-y-2">
							<Label>Website URL</Label>
							{kycItem.website_url ? (
								<a
									href={kycItem.website_url}
									target="_blank"
									rel="noreferrer"
									className="block w-full rounded-md border border-input bg-background px-3 py-2 text-blue-600 text-sm underline"
									tabIndex={-1}
								>
									{kycItem.website_url}
								</a>
							) : (
								<Input value="N/A" readOnly tabIndex={-1} />
							)}
						</div>
						<div className="space-y-2">
							<Label>GST</Label>
							<Badge
								variant={kycItem.gst ? "default" : "secondary"}
								className="min-w-[48px] px-3 py-1 text-center text-xs"
							>
								{kycItem.gst ? "Yes" : "No"}
							</Badge>
						</div>
						<div className="space-y-2">
							<Label>Submission Date</Label>
							<Input
								value={
									kycItem.submission_date
										? formatDateToSeconds(new Date(kycItem.submission_date))
										: "N/A"
								}
								readOnly
								tabIndex={-1}
							/>
						</div>

						<div className="space-y-2 md:col-span-2">
							<Label>Billing Address</Label>
							{address ? (
								<div
									className="rounded-md border border-input bg-background px-3 py-2 text-sm"
									tabIndex={-1}
								>
									{address.address_line}
									<br />
									{address.city}, {address.state} - {address.zip_code}
								</div>
							) : (
								<Input value="N/A" readOnly tabIndex={-1} />
							)}
						</div>

						<div className="space-y-2">
							<Label>Aadhar Number</Label>
							<Input
								value={kycItem.aadhar_number || "N/A"}
								readOnly
								tabIndex={-1}
							/>
							<div className="flex items-center justify-between">
								{kycItem.aadhar_image_front && (
									<Image
										src={kycItem.aadhar_image_front as string}
										alt="Aadhar Front"
										width={100}
										height={70}
										className="h-14 w-24 cursor-pointer rounded border"
										onClick={() =>
											previewImage(kycItem.aadhar_image_front as string)
										}
										tabIndex={-1}
									/>
								)}
								{kycItem.aadhar_image_back && (
									<Image
										src={kycItem.aadhar_image_back as string}
										alt="Aadhar Back"
										width={100}
										height={70}
										className="h-14 w-24 cursor-pointer rounded border"
										onClick={() =>
											previewImage(kycItem.aadhar_image_back as string)
										}
										tabIndex={-1}
									/>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label>PAN Number</Label>
							<Input
								value={kycItem.pan_number || "N/A"}
								readOnly
								tabIndex={-1}
							/>
							<div className="flex gap-2">
								{kycItem.pan_image_front && (
									<Image
										src={kycItem.pan_image_front as string}
										alt="PAN Front"
										width={100}
										height={70}
										className="h-14 w-24 cursor-pointer rounded border"
										onClick={() =>
											previewImage(kycItem.pan_image_front as string)
										}
										tabIndex={-1}
									/>
								)}
								{kycItem.pan_image_back && (
									<Image
										src={kycItem.pan_image_back as string}
										alt="PAN Back"
										width={100}
										height={70}
										className="h-14 w-24 cursor-pointer rounded border"
										onClick={() =>
											previewImage(kycItem.pan_image_back as string)
										}
										tabIndex={-1}
									/>
								)}
							</div>
						</div>
					</div>

					<DialogFooter className="mt-4 gap-2">
						<Button
							variant="destructive"
							onClick={() => setShowRejectConfirmModal(true)}
							className="cursor-pointer"
							disabled={verifyKyc.isPending || rejectKyc.isPending}
						>
							Reject
						</Button>
						<Button
							variant="default"
							className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
							onClick={() => setShowApproveConfirmModal(true)}
							disabled={verifyKyc.isPending || rejectKyc.isPending}
						>
							{verifyKyc.isPending ? "Approving..." : "Approve"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default KycDetailsModal;
