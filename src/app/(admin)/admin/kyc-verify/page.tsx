"use client";

import React, { useState } from "react";
import { Button } from "~/components/ui/button";

import { DataTable } from "~/components/DataTable";
import KycDetailsModal from "~/components/KycDetailsModal";
import { api } from "~/trpc/react";
import type { KycItem } from "~/types/kyc";

import { entityTypes } from "~/constants";

const VerifyKycPage = () => {
	const { data: kycList, isLoading } = api.admin.pendingKyc.useQuery<KycItem[]>(
		undefined,
		{
			retry: 3,
			refetchOnWindowFocus: false,
		},
	);

	const [filterGST, setFilterGST] = useState("ALL");
	const [filterType, setFilterType] = useState("ALL");
	const [showKycDetailsModal, setShowKycDetailsModal] = useState(false);
	const [selectedKycItem, setSelectedKycItem] = useState<KycItem | null>(null);

	const handleClearFilters = () => {
		setFilterGST("ALL");
		setFilterType("ALL");
	};

	const filteredData = React.useMemo(() => {
		return ((kycList as KycItem[]) ?? []).filter((item) => {
			return (
				(filterGST === "ALL" || (filterGST === "YES" ? item.gst : !item.gst)) &&
				(filterType === "ALL" || item.entity_type === filterType)
			);
		});
	}, [kycList, filterGST, filterType]);

	const columns = [
		{
			key: "entity_name",
			header: "Entity",
			className: "w-70 px-4 text-blue-950",
			render: (item: KycItem) => item.entity_name,
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
