"use client";

import type { inferRouterOutputs } from "@trpc/server";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Copyable from "~/components/Copyable";
import { type ColumnConfig, DataTable } from "~/components/DataTable";
import PaginationButtons from "~/components/PaginationButtons";
import { Badge } from "~/components/ui/badge";
import useDebounce from "~/lib/hooks/useDebounce";
import { cn } from "~/lib/utils";
import { formatDate } from "~/lib/utils";
import { exportToXlsx } from "~/lib/xlsx";
import type { AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";

type PassbookOutput = inferRouterOutputs<AppRouter>["wallet"]["getPassbook"];
type Transaction = PassbookOutput["transactions"][number];

import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { paymentStatusTypes, transactionTypes } from "~/constants";

const PassbookPage = () => {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [filterStatus, setFilterStatus] = useState("ALL");
	const [filterTxnType, setFilterTxnType] = useState("ALL");
	const [searchText, setSearchText] = useState("");
	const debouncedSearchFilter = useDebounce(searchText, 500);
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});

	const { data, isLoading } = api.wallet.getPassbook.useQuery(
		{
			page,
			pageSize,
			filterStatus: filterStatus === "ALL" ? undefined : filterStatus,
			filterTxnType: filterTxnType === "ALL" ? undefined : filterTxnType,
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

	const exportMutation = api.export.exportUserPassbook.useMutation({
		onSuccess: (data) => {
			const wb = exportToXlsx(data, "Passbook");
			XLSX.writeFile(wb, "passbook.xlsx");
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const handleExport = () => {
		exportMutation.mutate({
			filterStatus: filterStatus === "ALL" ? undefined : filterStatus,
			filterTxnType: filterTxnType === "ALL" ? undefined : filterTxnType,
			searchFilter:
				debouncedSearchFilter === "" ? undefined : debouncedSearchFilter,
			startDate: dateRange?.from?.toISOString(),
			endDate: dateRange?.to?.toISOString(),
		});
	};

	const handleClearFilters = () => {
		setFilterStatus("ALL");
		setFilterTxnType("ALL");
		setSearchText("");
		setDateRange({ from: undefined, to: undefined });
	};

	const columns: ColumnConfig<Transaction>[] = [
		{
			key: "transaction_id",
			header: "Transaction ID",
			className: "w-20 px-4",
			render: (item: Transaction) => <Copyable content={item.transaction_id} />,
		},
		{
			key: "amount",
			header: "Amount",
			className: "w-20 px-4 text-center",
			render: (item: Transaction) => `₹${String(item.amount)}`,
		},
		{
			key: "transaction_date",
			header: "Date",
			className: "w-30 px-4",
			render: (item: Transaction) =>
				item.created_at ? formatDate(new Date(item.created_at)) : "N/A",
		},
		{
			key: "transaction_type",
			header: "Transaction Type",
			className: "w-30 px-4 text-center",
			render: (item: Transaction) => (
				<Badge
					className={cn("text-950", {
						"bg-blue-200": item.transaction_type === "Credit",
						"bg-orange-200": item.transaction_type === "Debit",
					})}
				>
					{item.transaction_type}
				</Badge>
			),
		},
		{
			key: "payment_status",
			header: "Payment Status",
			className: "w-30 px-4 text-center",
			render: (item: Transaction) => (
				<Badge
					className={cn("text-950", {
						"bg-green-200": item.payment_status === "Completed",
						"bg-yellow-200": item.payment_status === "Pending",
						"bg-red-200": item.payment_status === "Failed",
					})}
				>
					{item.payment_status}
				</Badge>
			),
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
			id: "payment-status-filter",
			label: "Payment Status",
			options: [
				{ label: "All Types", value: "ALL" },
				...paymentStatusTypes.map((type) => ({ label: type, value: type })),
			],
			selectedValue: filterStatus,
			onValueChange: setFilterStatus,
		},
		{
			id: "transaction-type-filter",
			label: "Transaction Type",
			options: [
				{ label: "All Types", value: "ALL" },
				...transactionTypes.map((type) => ({ label: type, value: type })),
			],
			selectedValue: filterTxnType,
			onValueChange: setFilterTxnType,
		},
	];

	return (
		<>
			<div className="flex p-4">
				<Button
					onClick={handleExport}
					disabled={exportMutation.isPending || isLoading}
					className="w-full"
				>
					{exportMutation.isPending ? "Exporting..." : "Export to XLSX"}
				</Button>
			</div>

			<DataTable
				title="Transactions"
				data={data?.transactions || []}
				columns={columns}
				filters={filters}
				onClearFilters={handleClearFilters}
				isLoading={isLoading}
				dateRange={dateRange}
				onDateRangeChange={setDateRange}
			/>

			<PaginationButtons
				isLoading={isLoading}
				page={page}
				totalPages={data?.totalPages || 1}
				setPage={setPage}
			/>
		</>
	);
};

export default PassbookPage;
