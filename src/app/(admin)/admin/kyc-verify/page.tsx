"use client";

import React, { useState } from "react";
import { Button } from "~/components/ui/button";

import { DataTable } from "~/components/DataTable";
import CopyableId from "~/components/CopyableId";
import KycDetailsModal from "~/components/KycDetailsModal";
import { api } from "~/trpc/react";

import { entityTypes } from "~/constants";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

const VerifyKycPage = () => {
	const { data: kycList, isLoading } = api.admin.pendingKyc.useQuery(
		undefined,
		{
			retry: 3,
			refetchOnWindowFocus: false,
		},
	);

	type KycList = inferRouterOutputs<AppRouter>["admin"]["pendingKyc"];
	type KycItem = KycList extends Array<infer T> ? T : never;

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
		return (kycList ?? []).filter((item) => {
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
	}, [kycList, filterGST, filterType, searchFilter]);

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
		<>
			<DataTable
				title="KYC Verification"
				data={filteredData}
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
			<KycDetailsModal
				isOpen={showKycDetailsModal}
				onClose={() => setShowKycDetailsModal(false)}
				kycItem={selectedKycItem}
			/>
		</>
	);
};

export default VerifyKycPage;
