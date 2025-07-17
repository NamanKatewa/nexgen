"use client";

import { format } from "date-fns";
import React, { useState } from "react";
import { Badge } from "~/components/ui/badge";

import { DataTable } from "~/components/DataTable";
import { cn } from "~/lib/utils";
import { formatDateToSeconds } from "~/lib/utils";
import { api } from "~/trpc/react";

import { paymentStatusTypes } from "~/constants";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

const WalletTopupPage = () => {
	const { data: transactions, isLoading } = api.admin.getTransactions.useQuery(
		undefined,
		{
			retry: 3,
			refetchOnWindowFocus: false,
		},
	);

	type Transactions = inferRouterOutputs<AppRouter>["admin"]["getTransactions"];
	type Transaction = Transactions extends Array<infer T> ? T : never;

	const [filterType, setFilterType] = useState("ALL");
	const [searchFilter, setSearchFilter] = useState("");

	const handleClearFilters = () => {
		setFilterType("ALL");
		setSearchFilter("");
	};

	const filteredData = React.useMemo(() => {
		return (transactions ?? []).filter((item) => {
			const searchLower = searchFilter.toLowerCase();
			const paymentMatch =
				filterType === "ALL" || item.payment_status === filterType;
			const searchMatch =
				item.user.email.toLowerCase().includes(searchLower) ||
				item.user.name.toLowerCase().includes(searchLower) ||
				item.transaction_id.toLowerCase().includes(searchLower);
			return paymentMatch && searchMatch;
		});
	}, [transactions, filterType, searchFilter]);

	const columns = [
		{
			key: "user.name",
			header: "Name",
			className: "w-40 px-4 text-blue-950",
			render: (item: Transaction) => item.user.name,
		},
		{
			key: "user.email",
			header: "Email",
			className: "w-50 px-4 text-blue-950",
			render: (item: Transaction) => item.user.email,
		},
		{
			key: "amount",
			header: "Amount",
			className: "w-20 px-4 text-center text-blue-950",
			render: (item: Transaction) => String(item.amount),
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
				{ label: "All", value: "ALL" },
				...paymentStatusTypes.map((type) => ({ label: type, value: type })),
			],
			selectedValue: filterType,
			onValueChange: setFilterType,
		},
	];

	return (
		<DataTable
			title="Wallet Recharges"
			data={filteredData}
			columns={columns}
			filters={filters}
			onClearFilters={handleClearFilters}
			isLoading={isLoading}
			idKey="transaction_id"
		/>
	);
};

export default WalletTopupPage;
