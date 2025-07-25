"use client";

import React, { useState, useEffect } from "react";
import PaginationButtons from "~/components/PaginationButtons";
import { Button } from "~/components/ui/button";
import useDebounce from "~/lib/hooks/useDebounce";

import Copyable from "~/components/Copyable";
import { type ColumnConfig, DataTable } from "~/components/DataTable";
import KycDetailsModal from "~/components/KycDetailsModal";
import { api } from "~/trpc/react";

import { entityTypes } from "~/constants";

import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import type { DateRange } from "react-day-picker";
import { formatDate } from "~/lib/utils";
import type { AppRouter } from "~/server/api/root";

const VerifyKycPage = () => {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	type KycItem =
		inferRouterOutputs<AppRouter>["admin"]["pendingKyc"]["kycList"][number];

	const [filterGST, setFilterGST] = useState("ALL");
	const [filterType, setFilterType] = useState("ALL");
	const [searchText, setSearchText] = useState("");
	const debouncedSearchFilter = useDebounce(searchText, 500);
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});

	const [showKycDetailsModal, setShowKycDetailsModal] = useState(false);
	const [selectedKycItem, setSelectedKycItem] = useState<KycItem | null>(null);

	const { data, isLoading } = api.admin.pendingKyc.useQuery(
		{
			page,
			pageSize,
			filterGST: filterGST === "ALL" ? undefined : filterGST,
			filterType: filterType === "ALL" ? undefined : filterType,
			searchFilter:
				debouncedSearchFilter === "" ? undefined : debouncedSearchFilter,
			startDate: dateRange?.from?.toISOString(),
			endDate: dateRange?.to?.toISOString(),
		},
		{
			retry: 3,
			refetchOnWindowFocus: false,
		},
	);

	const handleClearFilters = () => {
		setFilterGST("ALL");
		setFilterType("ALL");
		setSearchText("");
		setDateRange({ from: undefined, to: undefined });
	};

	const columns: ColumnConfig<KycItem>[] = [
		{
			key: "kyc_id",
			header: "KYC ID",
			className: "w-50 px-4 text-blue-950",
			render: (item: KycItem) => <Copyable content={item.kyc_id} />,
		},
		{
			key: "entity_name",
			header: "Entity",
			className: "w-70 px-4 text-blue-950",
			render: (item: KycItem) => item.entity_name ?? "N/A",
		},
		{
			key: "user_email",
			header: "User Email",
			className: "w-70 px-4 text-blue-950",
			render: (item: KycItem) => (
				<Link href={`/admin/user/${item.user_id}`}>{item.user.email}</Link>
			),
		},
		{
			key: "date",
			header: "Date",
			className: "w-70 px-4 text-blue-950",
			render: (item: KycItem) =>
				item.submission_date ? formatDate(new Date(item.submission_date)) : "",
		},
	];

	const filters = [
		{
			id: "search",
			label: "Search",
			type: "text" as const,
			value: searchText,
			onChange: setSearchText,
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
				dateRange={dateRange}
				onDateRangeChange={setDateRange}
				actions={(item: KycItem) => [
					{
						label: "View Details",
						onClick: () => {
							setSelectedKycItem(item);
							setShowKycDetailsModal(true);
						},
					},
				]}
			/>

			<PaginationButtons
				isLoading={isLoading}
				page={page}
				totalPages={data?.totalPages || 1}
				setPage={setPage}
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
