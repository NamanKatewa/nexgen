"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Badge } from "~/components/ui/badge";
import useDebounce from "~/lib/hooks/useDebounce";

import Copyable from "~/components/Copyable";
import { type ColumnConfig, DataTable } from "~/components/DataTable";
import { cn } from "~/lib/utils";
import { formatDate } from "~/lib/utils";
import { api } from "~/trpc/react";

import { paymentStatusTypes } from "~/constants";

import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import PaginationButtons from "~/components/PaginationButtons";
import { Button } from "~/components/ui/button";
import { exportToXlsx } from "~/lib/xlsx";
import type { AppRouter } from "~/server/api/root";

type Transactions = inferRouterOutputs<AppRouter>["admin"]["getTransactions"];
type Transaction = Transactions extends { transactions: Array<infer T> }
	? T
	: never;

const WalletTopupPage = () => {
	const router = useRouter();
	const [filterType, setFilterType] = useState("ALL");
	const [searchText, setSearchText] = useState("");
	const debouncedSearchFilter = useDebounce(searchText, 500);

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});

	const handleClearFilters = () => {
		setFilterType("ALL");
		setSearchText("");
		setDateRange({ from: undefined, to: undefined });
	};

	const { data: transactions, isLoading } = api.admin.getTransactions.useQuery(
		{
			page,
			pageSize,
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

	const exportMutation = api.export.exportTransactions.useMutation({
		onSuccess: (data) => {
			const wb = exportToXlsx(data, "Transactions");
			XLSX.writeFile(wb, "transactions.xlsx");
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const handleExport = () => {
		exportMutation.mutate({
			filterType: filterType === "ALL" ? undefined : filterType,
			searchFilter:
				debouncedSearchFilter === "" ? undefined : debouncedSearchFilter,
			startDate: dateRange?.from?.toISOString(),
			endDate: dateRange?.to?.toISOString(),
		});
	};

	const columns: ColumnConfig<Transaction>[] = [
		{
			key: "transaction_id",
			header: "Transaction ID",
			className: "w-50 px-4 text-blue-950",
			render: (item: Transaction) => <Copyable content={item.transaction_id} />,
		},
		{
			key: "user.name",
			header: "User Name",
			className: "w-40 px-4 text-blue-950",
			render: (item: Transaction) => (
				<Link href={`/admin/user/${item.user_id}`}>{item.user.name}</Link>
			),
		},
		{
			key: "user.email",
			header: "User Email",
			className: "w-30 px-4 text-blue-950",
			render: (item: Transaction) => <Copyable content={item.user.email} />,
		},
		{
			key: "amount",
			header: "Amount",
			className: "w-20 px-4 text-center text-blue-950",
			render: (item: Transaction) => `₹ ${String(item.amount)}`,
		},
		{
			key: "transaction_date",
			header: "Date",
			className: "w-30 px-4 text-blue-950",
			render: (item: Transaction) =>
				item.created_at ? formatDate(new Date(item.created_at)) : "N/A",
		},
		{
			key: "payment_status",
			header: "Payment Status",
			className: "w-50 px-4 text-center text-blue-950",
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
				{ label: "All", value: "ALL" },
				...paymentStatusTypes.map((type) => ({ label: type, value: type })),
			],
			selectedValue: filterType,
			onValueChange: setFilterType,
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
					{exportMutation.isPending ? "Exporting..." : "Export"}
				</Button>
			</div>

			<DataTable
				title="Wallet Recharges"
				data={transactions?.transactions || []}
				columns={columns}
				filters={filters}
				onClearFilters={handleClearFilters}
				isLoading={isLoading}
				idKey="transaction_id"
				dateRange={dateRange}
				onDateRangeChange={setDateRange}
				actions={(item: Transaction) => {
					const currentActions = [];
					if (item.shipment_id) {
						currentActions.push({
							label: "View Shipment",
							onClick: () => {
								router.push(`/shipments/${item.shipment_id}`);
							},
						});
					}
					return currentActions;
				}}
			/>
			<PaginationButtons
				isLoading={isLoading}
				page={page}
				totalPages={transactions?.totalPages || 1}
				setPage={setPage}
			/>
		</>
	);
};

export default WalletTopupPage;
