"use client";

import { format } from "date-fns";
import Image from "next/image";
import React, { useRef, useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";

import { api } from "~/trpc/react";
import type { ADDRESS_TYPE, ENTITY_TYPE, KYC_STATUS } from "@prisma/client";

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

	const topRef = useRef<HTMLDivElement>(null);

	const [filterGST, setFilterGST] = useState("ALL");
	const [filterType, setFilterType] = useState("ALL");
	const [showModal, setShowModal] = useState(false);
	const [selectedKycId, setSelectedKycId] = useState<string | null>(null);
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [rejectReason, setRejectReason] = useState("");

	const handleClearFilters = () => {
		setFilterGST("ALL");
		setFilterType("ALL");
		topRef.current?.scrollIntoView({ behavior: "smooth" });
	};

		const filteredList = (kycList as KycItem[] ?? []).filter((item) => {
		return (
			(filterGST === "ALL" || (filterGST === "YES" ? item.gst : !item.gst)) &&
			(filterType === "ALL" || item.entity_type === filterType)
		);
	});

	const previewImage = (src: string) => {
		window.open(src, "_blank");
	};

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center text-blue-950">
				Loading...
			</div>
		);
	}

	return (
		<>
			<div className="flex h-screen w-full flex-col">
				<div
					ref={topRef}
					className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b p-4"
				>
					<h1 className="font-semibold text-2xl text-blue-950">
						KYC Verification
					</h1>
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex items-center gap-2">
							<label htmlFor="gst-filter" className="text-blue-950 text-sm">
								GST:
							</label>
							<Select value={filterGST} onValueChange={setFilterGST}>
								<SelectTrigger
									id="gst-filter"
									className="w-[140px] text-blue-950"
								>
									<SelectValue placeholder="GST: " />
								</SelectTrigger>
								<SelectContent className="text-blue-950">
									<SelectItem value="ALL">All</SelectItem>
									<SelectItem value="YES">Yes</SelectItem>
									<SelectItem value="NO">No</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center gap-2">
							<label
								htmlFor="entity-type-filter"
								className="text-blue-950 text-sm"
							>
								Entity Type:
							</label>
							<Select value={filterType} onValueChange={setFilterType}>
								<SelectTrigger
									id="entity-type-filter"
									className="w-[240px] text-blue-950"
								>
									<SelectValue placeholder="Entity Type: " />
								</SelectTrigger>
								<SelectContent className="text-blue-950">
									<SelectItem value="ALL">All Types</SelectItem>
									{entityTypes.map((type) => (
										<SelectItem key={type} value={type}>
											{type}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<Button
							variant="secondary"
							className="bg-blue-100 text-sm hover:bg-blue-200/50"
							onClick={handleClearFilters}
						>
							Clear Filters
						</Button>
					</div>
				</div>

				<div className="flex-1 overflow-auto">
					<div className="min-w-fit">
						<Table className="table-fixed text-blue-950">
							<TableHeader className="z-20 bg-blue-100 shadow-sm">
								<TableRow>
									<TableHead className="w-70 px-4 text-blue-950">
										Entity
									</TableHead>
									<TableHead className="w-50 px-4 text-blue-950">
										Type
									</TableHead>
									<TableHead className="w-50 px-4 text-blue-950">
										Website
									</TableHead>
									<TableHead className="w-70 px-4 text-blue-950">
										Billing Address
									</TableHead>
									<TableHead className="w-50 px-4 text-blue-950">
										Aadhar
									</TableHead>
									<TableHead className="w-50 px-4 text-blue-950">PAN</TableHead>
									<TableHead className="w-30 px-4 text-blue-950">GST</TableHead>
									<TableHead className="w-30 px-4 text-blue-950">
										Submitted On
									</TableHead>
									<TableHead className="w-50 px-4 text-right text-blue-950">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredList.map((kyc: KycItem) => {
									const address: BillingAddress | null = isBillingAddress(kyc.address)
										? (kyc.address as BillingAddress)
										: null;

									return (
										<TableRow
											key={kyc.kyc_id}
											className="py-4 text-sm hover:bg-blue-200"
										>
											<TableCell className="whitespace-normal px-4">
												{kyc.entity_name}
											</TableCell>
											<TableCell className="px-4">{kyc.entity_type}</TableCell>
											<TableCell className="px-4">
												{kyc.website_url ? (
													<a
														href={kyc.website_url}
														target="_blank"
														rel="noreferrer"
														className="whitespace-normal text-blue-600 underline"
													>
														{kyc.website_url}
													</a>
												) : (
													<span className="italic">Not provided</span>
												)}
											</TableCell>
											<TableCell className="w-70 px-4">
												{address ? (
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
												)}
											</TableCell>
											<TableCell className="px-4">
												<div className="flex flex-col gap-3">
													<span>{kyc.aadhar_number}</span>
													<div className="flex gap-1">
														{kyc.aadhar_image_front && (
															<Image
																src={kyc.aadhar_image_front}
																alt="Aadhar Front"
																width={64}
																height={64}
																className="cursor-pointer rounded border"
																onClick={() =>
																	kyc.aadhar_image_front && previewImage(kyc.aadhar_image_front)
																}
															/>
														)}
														{kyc.aadhar_image_back && (
															<Image
																src={kyc.aadhar_image_back}
																alt="Aadhar Back"
																width={64}
																height={64}
																className="cursor-pointer rounded border"
																onClick={() =>
																	kyc.aadhar_image_back && previewImage(kyc.aadhar_image_back)
																}
															/>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell className="px-4">
												<div className="flex flex-col gap-3">
													<span>{kyc.pan_number}</span>
													<div className="flex gap-1">
														{kyc.pan_image_front && (
															<Image
																src={kyc.pan_image_front}
																alt="PAN Front"
																width={64}
																height={64}
																className="cursor-pointer rounded border"
																onClick={() =>
																	kyc.pan_image_front && previewImage(kyc.pan_image_front)
																}
															/>
														)}
														{kyc.pan_image_back && (
															<Image
																src={kyc.pan_image_back}
																alt="PAN Back"
																width={64}
																height={64}
																className="cursor-pointer rounded border"
																onClick={() => kyc.pan_image_back && previewImage(kyc.pan_image_back)}
															/>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell className="w-[120px] whitespace-nowrap px-4">
												<Badge
													variant={kyc.gst ? "default" : "secondary"}
													className="min-w-[48px] px-3 py-1 text-center text-xs"
												>
													{kyc.gst ? "Yes" : "No"}
												</Badge>
											</TableCell>
											<TableCell className="px-4">
												{kyc.submission_date
													? format(new Date(kyc.submission_date), "dd/MM/yyyy")
													: "N/A"}
											</TableCell>
											<TableCell className="px-4 text-right">
												<Button
													size="sm"
													variant="default"
													className="bg-green-600 text-white hover:bg-green-700"
													onClick={() => {
														setSelectedKycId(kyc.kyc_id);
														setShowModal(true);
													}}
												>
													Accept
												</Button>{" "}
												<Button
													size="sm"
													variant="destructive"
													onClick={() => {
														setSelectedKycId(kyc.kyc_id);
														setRejectReason("");
														setShowRejectModal(true);
													}}
												>
													Reject
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
						{filteredList.length === 0 && (
							<div className="p-6 text-center text-gray-500">
								No results found.
							</div>
						)}
					</div>
				</div>
			</div>
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
