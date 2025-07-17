"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { format } from "date-fns";
import React, { useState } from "react";
import CopyableId from "~/components/CopyableId";
import { DataTable } from "~/components/DataTable";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { formatDateToSeconds } from "~/lib/utils";
import type { AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";

type Transactions = inferRouterOutputs<AppRouter>["wallet"]["getPassbook"];
type Transaction = Transactions extends Array<infer T> ? T : never;

import { paymentStatusTypes, transactionTypes } from "~/constants";

const PassbookPage = () => {
	const { data: transactions = [], isLoading } =
		api.wallet.getPassbook.useQuery(undefined, {
			retry: 3,
			refetchOnWindowFocus: false,
		});

	const [filterStatus, setFilterStatus] = useState("ALL");
	const [filterTxnType, setFilterTxnType] = useState("ALL");
	const [searchFilter, setSearchFilter] = useState("");

	const handleClearFilters = () => {
		setFilterStatus("ALL");
		setFilterTxnType("ALL");
		setSearchFilter("");
	};

	const filteredData = React.useMemo(() => {
		return transactions.filter((item) => {
			const searchLower = searchFilter.toLowerCase();
			const statusMatch =
				filterStatus === "ALL" || item.payment_status === filterStatus;
			const typeMatch =
				filterTxnType === "ALL" || item.transaction_type === filterTxnType;
			const searchMatch =
				(item.description ?? "").toLowerCase().includes(searchLower) ||
				item.amount.toString().includes(searchLower);
			return statusMatch && typeMatch && searchMatch;
		});
	}, [transactions, filterStatus, filterTxnType, searchFilter]);

	const columns = [
		{
			key: "transaction_id",
			header: "Transaction ID",
			className: "w-50 px-4 text-blue-950",
			render: (item: Transaction) => <CopyableId id={item.transaction_id} />,
		},
		{
			key: "amount",
			header: "Amount",
			className: "w-20 px-4 text-center text-blue-950",
			render: (item: Transaction) => `₹${String(item.amount)}`,
		},
		{
			key: "transaction_date",
			header: "Date",
			className: "w-30 px-4 text-center text-blue-950",
			render: (item: Transaction) =>
				item.created_at
					? formatDateToSeconds(new Date(item.created_at))
					: "N/A",
		},
		{
			key: "transaction_type",
			header: "Transaction Type",
			className: "w-40 px-4 text-center text-blue-950",
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
			value: searchFilter,
			onChange: setSearchFilter,
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
		<DataTable
			title="Transactions"
			data={filteredData}
			columns={columns}
			filters={filters}
			onClearFilters={handleClearFilters}
			isLoading={isLoading}
		/>
	);
};

export default PassbookPage;
