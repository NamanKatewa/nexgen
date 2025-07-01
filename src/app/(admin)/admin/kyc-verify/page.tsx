"use client";

import { format } from "date-fns";
import Image from "next/image";
import React, { useState } from "react";
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

import type { ADDRESS_TYPE, ENTITY_TYPE, KYC_STATUS } from "@prisma/client";
import { DataTable } from "~/components/DataTable";
import { api } from "~/trpc/react";

const entityTypes = [
	"Individual",
	"SelfEmployement",
	"ProprietorshipFirm",
	"LimitedLiabilityParternship",
	"PrivateLimitedCompany",
	"PublicLimitedCompany",
	"PartnershipFirm",
];

interface KycItem {
	kyc_id: string;
	user_id: string;
	entity_name: string | null;
	entity_type: ENTITY_TYPE | null;
	website_url: string | null;
	address_id: string | null;
	aadhar_number: string;
	aadhar_image_front: string | null;
	aadhar_image_back: string | null;
	pan_number: string;
	pan_image_front: string | null;
	pan_image_back: string | null;
	gst: boolean;
	kyc_status: KYC_STATUS;
	submission_date: Date | null;
	verification_date: Date | null;
	verified_by_user_id: string | null;
	rejection_reason: string | null;
	address: PrismaAddress | null;
}

interface PrismaAddress {
	address_id: string;
	user_id: string;
	name: string;
	address_line: string;
	city: string;
	state: string;
	zip_code: number;
	type: ADDRESS_TYPE;
}

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

const VerifyKycPage = () => {
	const { data: kycList, isLoading } = api.admin.pendingKyc.useQuery<KycItem[]>(
		undefined,
		{
			retry: 3,
			refetchOnWindowFocus: false,
		},
	);

	const utils = api.useUtils();
	const verifyKyc = api.admin.verifyKyc.useMutation({
		onSuccess: () => utils.admin.pendingKyc.invalidate(),
	});
	const rejectKyc = api.admin.rejectKyc.useMutation({
		onSuccess: () => utils.admin.pendingKyc.invalidate(),
	});

	const [filterGST, setFilterGST] = useState("ALL");
	const [filterType, setFilterType] = useState("ALL");
	const [showModal, setShowModal] = useState(false);
	const [selectedKycId, setSelectedKycId] = useState<string | null>(null);
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [rejectReason, setRejectReason] = useState("");

	const handleClearFilters = () => {
		setFilterGST("ALL");
		setFilterType("ALL");
	};

	const filteredData = ((kycList as KycItem[]) ?? []).filter((item) => {
		return (
			(filterGST === "ALL" || (filterGST === "YES" ? item.gst : !item.gst)) &&
			(filterType === "ALL" || item.entity_type === filterType)
		);
	});

	const previewImage = (src: string) => {
		window.open(src, "_blank");
	};

	const columns = [
		{
			key: "entity_name",
			header: "Entity",
			className: "w-70 px-4 text-blue-950",
			render: (item: KycItem) => item.entity_name,
		},
		{
			key: "entity_type",
			header: "Type",
			className: "w-50 px-4 text-blue-950",
			render: (item: KycItem) => item.entity_type,
		},
		{
			key: "website_url",
			header: "Website",
			className: "w-50 px-4 text-blue-950",
			render: (item: KycItem) =>
				item.website_url ? (
					<a
						href={item.website_url}
						target="_blank"
						rel="noreferrer"
						className="whitespace-normal text-blue-600 underline"
					>
						{item.website_url}
					</a>
				) : (
					<span className="italic">Not provided</span>
				),
		},
		{
			key: "address",
			header: "Billing Address",
			className: "w-70 px-4 text-blue-950",
			render: (item: KycItem) => {
				const address: BillingAddress | null = isBillingAddress(item.address)
					? (item.address as BillingAddress)
					: null;
				return address ? (
					<div className="whitespace-normal text-sm leading-snug">
						{address.address_line}
						<br />
						{address.city}
						<br />
						{address.state}
						<br />
						Pincode: {address.zip_code}
					</div>
				) : (
					<span className="italic">Not provided</span>
				);
			},
		},
		{
			key: "aadhar",
			header: "Aadhar",
			className: "w-50 px-4 text-blue-950",
			render: (item: KycItem) => (
				<div className="flex flex-col gap-3">
					<span>{item.aadhar_number}</span>
					<div className="flex gap-1">
						{item.aadhar_image_front && (
							<Image
								src={item.aadhar_image_front}
								alt="Aadhar Front"
								width={64}
								height={64}
								className="cursor-pointer rounded border"
								onClick={() =>
									item.aadhar_image_front &&
									previewImage(item.aadhar_image_front)
								}
							/>
						)}
						{item.aadhar_image_back && (
							<Image
								src={item.aadhar_image_back}
								alt="Aadhar Back"
								width={64}
								height={64}
								className="cursor-pointer rounded border"
								onClick={() =>
									item.aadhar_image_back && previewImage(item.aadhar_image_back)
								}
							/>
						)}
					</div>
				</div>
			),
		},
		{
			key: "pan",
			header: "PAN",
			className: "w-50 px-4 text-blue-950",
			render: (item: KycItem) => (
				<div className="flex flex-col gap-3">
					<span>{item.pan_number}</span>
					<div className="flex gap-1">
						{item.pan_image_front && (
							<Image
								src={item.pan_image_front}
								alt="PAN Front"
								width={64}
								height={64}
								className="cursor-pointer rounded border"
								onClick={() =>
									item.pan_image_front && previewImage(item.pan_image_front)
								}
							/>
						)}
						{item.pan_image_back && (
							<Image
								src={item.pan_image_back}
								alt="PAN Back"
								width={64}
								height={64}
								className="cursor-pointer rounded border"
								onClick={() =>
									item.pan_image_back && previewImage(item.pan_image_back)
								}
							/>
						)}
					</div>
				</div>
			),
		},
		{
			key: "gst",
			header: "GST",
			className: "w-[120px] whitespace-nowrap px-4 text-blue-950",
			render: (item: KycItem) => (
				<Badge
					variant={item.gst ? "default" : "secondary"}
					className="min-w-[48px] px-3 py-1 text-center text-xs"
				>
					{item.gst ? "Yes" : "No"}
				</Badge>
			),
		},
		{
			key: "submission_date",
			header: "Submitted On",
			className: "w-30 px-4 text-blue-950",
			render: (item: KycItem) =>
				item.submission_date
					? format(new Date(item.submission_date), "dd/MM/yyyy")
					: "N/A",
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-50 px-4 text-right text-blue-950",
			render: (item: KycItem) => (
				<>
					<Button
						size="sm"
						variant="default"
						className="bg-green-600 text-white hover:bg-green-700"
						onClick={() => {
							setSelectedKycId(item.kyc_id);
							setShowModal(true);
						}}
					>
						Accept
					</Button>{" "}
					<Button
						size="sm"
						variant="destructive"
						onClick={() => {
							setSelectedKycId(item.kyc_id);
							setRejectReason("");
							setShowRejectModal(true);
						}}
					>
						Reject
					</Button>
				</>
			),
		},
	];

	const filters = [
		{
			id: "gst-filter",
			label: "GST",
			options: [
				{ label: "All", value: "ALL" },
				{ label: "Yes", value: "YES" },
				{ label: "No", value: "NO" },
			],
			selectedValue: filterGST,
			onValueChange: setFilterGST,
		},
		{
			id: "entity-type-filter",
			label: "Entity Type",
			options: [
				{ label: "All Types", value: "ALL" },
				...entityTypes.map((type) => ({ label: type, value: type })),
			],
			selectedValue: filterType,
			onValueChange: setFilterType,
		},
	];

	return (
		<>
			<DataTable
				title="KYC Verification"
				data={filteredData}
				columns={columns}
				filters={filters}
				onClearFilters={handleClearFilters}
				isLoading={isLoading}
				idKey="kyc_id"
			/>
			<Dialog open={showModal} onOpenChange={setShowModal}>
				<DialogContent className="max-w-md bg-blue-50 text-blue-950">
					<DialogHeader>
						<DialogTitle>Confirm KYC Approval</DialogTitle>
						<DialogDescription className="text-blue-950">
							Are you sure you want to approve this KYC request?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2">
						<Button variant="outline" onClick={() => setShowModal(false)}>
							Cancel
						</Button>
						<Button
							variant="default"
							className="bg-green-600 text-white hover:bg-green-700"
							onClick={async () => {
								if (selectedKycId) {
									await verifyKyc.mutateAsync({ kycId: selectedKycId });
									setShowModal(false);
								}
							}}
							disabled={verifyKyc.isPending}
						>
							{verifyKyc.isPending ? "Confirming" : "Confirm"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
				<DialogContent className="max-w-md bg-blue-50 text-blue-950">
					<DialogHeader>
						<DialogTitle>Reject KYC</DialogTitle>
						<DialogDescription className="text-blue-950">
							Please provide a reason for rejecting this KYC.
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4">
						<textarea
							className="h-28 w-full rounded border border-blue-200 p-2 text-sm"
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							placeholder="Enter reason for rejection..."
						/>
					</div>
					<DialogFooter className="mt-4 gap-2">
						<Button variant="outline" onClick={() => setShowRejectModal(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={async () => {
								if (selectedKycId && rejectReason.trim()) {
									await rejectKyc.mutateAsync({
										kycId: selectedKycId,
										reason: rejectReason,
									});
									setShowRejectModal(false);
								}
							}}
						>
							Confirm Rejection
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default VerifyKycPage;
