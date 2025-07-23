"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { type ColumnConfig, DataTable } from "~/components/DataTable";
import { Badge } from "~/components/ui/badge";
import useDebounce from "~/lib/hooks/useDebounce";
import { cn } from "~/lib/utils";
import { formatDate } from "~/lib/utils";
import type { AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";
import { exportToXlsx } from "~/lib/xlsx";
import * as XLSX from "xlsx";

type PassbookOutput = inferRouterOutputs<AppRouter>["admin"]["getPassbook"];
type Transaction = PassbookOutput["transactions"][number];

import { paymentStatusTypes, transactionTypes } from "~/constants";

import Link from "next/link";
import type { DateRange } from "react-day-picker";
import Copyable from "~/components/Copyable";
import PaginationButtons from "~/components/PaginationButtons";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import PassbookSkeleton from "~/components/skeletons/PassbookSkeleton";

function PassbookContent() {
	const searchParams = useSearchParams();
	const initialUserId = searchParams.get("userId") || "";
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [filterStatus, setFilterStatus] = useState("ALL");
	const [filterTxnType, setFilterTxnType] = useState("ALL");
	const [searchText, setSearchText] = useState(initialUserId);
	const debouncedSearchFilter = useDebounce(searchText, 500);
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});

	const { data, isLoading } = api.admin.getPassbook.useQuery(
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

	const exportMutation = api.export.exportPassbook.useMutation({
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
			className: "w-50 px-4",
			render: (item: Transaction) => <Copyable content={item.transaction_id} />,
		},
		{
			key: "user.name",
			header: "User Name",
			className: "w-40 px-4 whitespace-normal",
			render: (item: Transaction) => (
				<Link href={`/admin/user/${item.user_id}`}>{item.user.name}</Link>
			),
		},
		{
			key: "user.email",
			header: "User Email",
			className: "w-50 px-4 whitespace-normal break-all",
			render: (item: Transaction) => <Copyable content={item.user.email} />,
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
			className: "w-50 px-4",
			render: (item: Transaction) => formatDate(new Date(item.created_at)),
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
			className: "w-40 px-4 text-center",
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
		{
			key: "description",
			header: "Description",
			className: "px-4 w-50 whitespace-normal",
			render: (item: Transaction) =>
				item.description ? item.description : "N/A",
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-50 px-4 text-blue-950",
			render: (item: Transaction) => {
				return item.shipment_id ? (
					<div className="flex flex-col gap-2">
						<Button>
							<Link href={`/shipments/${item.shipment_id}`}>View Shipment</Link>
						</Button>
					</div>
				) : null;
			},
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
			selectedValue: filterStatus,
			onValueChange: setFilterStatus,
		},
		{
			id: "transaction-type-filter",
			label: "Transaction Type",
			options: [
				{ label: "All", value: "ALL" },
				...transactionTypes.map((type) => ({ label: type, value: type })),
			],
			selectedValue: filterTxnType,
			onValueChange: setFilterTxnType,
		},
	];

	return (
		<>
			<div className="flex justify-end p-4">
				<Button onClick={handleExport} disabled={exportMutation.isPending}>
					{exportMutation.isPending ? "Exporting..." : "Export"}
				</Button>
			</div>
			{isLoading ? (
				<PassbookSkeleton />
			) : (
				<DataTable
					title="Transactions"
					data={data?.transactions || []}
					columns={columns}
					filters={filters}
					onClearFilters={handleClearFilters}
					isLoading={isLoading}
					idKey="transaction_id"
					dateRange={dateRange}
					onDateRangeChange={setDateRange}
				/>
			)}
			<PaginationButtons
				page={page}
				totalPages={data?.totalPages || 1}
				setPage={setPage}
			/>
		</>
	);
}

export default function PassbookPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<PassbookContent />
		</Suspense>
	);
}
