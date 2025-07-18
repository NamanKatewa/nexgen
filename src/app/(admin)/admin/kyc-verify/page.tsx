"use client";

import React, { useState } from "react";
import { Button } from "~/components/ui/button";

import CopyableId from "~/components/CopyableId";
import { DataTable } from "~/components/DataTable";
import KycDetailsModal from "~/components/KycDetailsModal";
import { api } from "~/trpc/react";

import { entityTypes } from "~/constants";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

const VerifyKycPage = () => {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const { data, isLoading } = api.admin.pendingKyc.useQuery(
		{ page, pageSize },
		{
			retry: 3,
			refetchOnWindowFocus: false,
		},
	);

	type KycListOutput = inferRouterOutputs<AppRouter>["admin"]["pendingKyc"];
	type KycItem = KycListOutput["kycList"][number];

	const [filterGST, setFilterGST] = useState("ALL");
	const [filterType, setFilterType] = useState("ALL");
	const [searchFilter, setSearchFilter] = useState("");
	const [showKycDetailsModal, setShowKycDetailsModal] = useState(false);
	const [selectedKycItem, setSelectedKycItem] = useState<KycItem | null>(null);

	const handleClearFilters = () => {
		setFilterGST("ALL");
		setFilterType("ALL");
		setSearchFilter("");
	};

	const filteredData = React.useMemo(() => {
		return (data?.kycList ?? []).filter((item) => {
			const searchLower = searchFilter.toLowerCase();
			const matchesSearch =
				(item.entity_name ?? "").toLowerCase().includes(searchLower) ||
				item.user.email.toLowerCase().includes(searchLower) ||
				(item.user.name ?? "").toLowerCase().includes(searchLower) ||
				(item.entity_type ?? "").toLowerCase().includes(searchLower) ||
				(item.gst ? "yes" : "no").includes(searchLower);

			return (
				(filterGST === "ALL" || (filterGST === "YES" ? item.gst : !item.gst)) &&
				(filterType === "ALL" || item.entity_type === filterType) &&
				matchesSearch
			);
		});
	}, [data?.kycList, filterGST, filterType, searchFilter]);

	const columns = [
		{
			key: "kyc_id",
			header: "KYC ID",
			className: "w-50 px-4 text-blue-950",
			render: (item: KycItem) => <CopyableId id={item.kyc_id} />,
		},
		{
			key: "entity_name",
			header: "Entity",
			className: "w-70 px-4 text-blue-950",
			render: (item: KycItem) => item.entity_name ?? "N/A",
		},
		{
			key: "user_email",
			header: "Email",
			className: "w-70 px-4 text-blue-950",
			render: (item: KycItem) => item.user.email,
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-50 px-4 text-right text-blue-950",
			render: (item: KycItem) => (
				<Button
					size="sm"
					variant="default"
					onClick={() => {
						setSelectedKycItem(item);
						setShowKycDetailsModal(true);
					}}
					className="cursor-pointer"
				>
					View Details
				</Button>
			),
		},
	];

	const filters = [
		{
			id: "search",
			label: "Search",
			type: "text" as const,
			value: searchFilter,
			onChange: setSearchFilter,
		},
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
		<div className="p-8">
			<DataTable
				title="KYC Verification"
				data={data?.kycList || []}
				columns={columns}
				filters={filters}
				onClearFilters={handleClearFilters}
				isLoading={isLoading}
				idKey="kyc_id"
				onRowClick={(row: KycItem) => {
					setSelectedKycItem(row);
					setShowKycDetailsModal(true);
				}}
			/>
			<div className="mt-4 flex justify-between">
				<Button
					type="button"
					onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
					disabled={page === 1}
					variant="outline"
					className="px-4 py-2"
				>
					Previous
				</Button>
				<span>
					Page {page} of {data?.totalPages || 1}
				</span>
				<Button
					type="button"
					onClick={() => setPage((prev) => prev + 1)}
					disabled={page === (data?.totalPages || 1)}
					variant="outline"
					className="px-4 py-2"
				>
					Next
				</Button>
			</div>
			<KycDetailsModal
				isOpen={showKycDetailsModal}
				onClose={() => setShowKycDetailsModal(false)}
				kycItem={selectedKycItem}
			/>
		</div>
	);
};

export default VerifyKycPage;
