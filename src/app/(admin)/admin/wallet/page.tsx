"use client";

import { format } from "date-fns";
import React, { useState } from "react";
import { Badge } from "~/components/ui/badge";

import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { DataTable } from "~/components/DataTable";

const paymentStatusTypes = ["Pending", "Completed", "Failed"];

const WalletTopupPage = () => {
	const { data: transactions, isLoading } = api.admin.getTransactions.useQuery(
		undefined,
		{
			retry: 3,
			refetchOnWindowFocus: false,
		},
	);

	const [filterType, setFilterType] = useState("ALL");

	const handleClearFilters = () => {
		setFilterType("ALL");
	};

	const filteredData = (transactions ?? []).filter((item) => {
		return filterType === "ALL" || item.payment_status === filterType;
	});

	const columns = [
		{
			key: "user.name",
			header: "Name",
			className: "w-40 px-4 text-blue-950",
			render: (item) => item.user.name,
		},
		{
			key: "user.email",
			header: "Email",
			className: "w-50 px-4 text-blue-950",
			render: (item) => item.user.email,
		},
		{
			key: "amount",
			header: "Amount",
			className: "w-20 px-4 text-center text-blue-950",
			render: (item) => String(item.amount),
		},
		{
			key: "transaction_date",
			header: "Date",
			className: "w-30 px-4 text-center text-blue-950",
			render: (item) =>
				item.transaction_date
					? format(new Date(item.transaction_date), "dd/MM/yyyy")
					: "N/A",
		},
		{
			key: "payment_status",
			header: "Payment Status",
			className: "w-50 px-4 text-center text-blue-950",
			render: (item) => (
				<Badge
					className={cn("text-950", {
						"bg-green-200": item.payment_status === "Completed",
						"bg-yellow-200": item.payment_status === "Pending",
						"bg-red-200": item.payment_status === "Failed",
					})}
				>
					{" "}
					{item.payment_status}
				</Badge>
			),
		},
	];

	const filters = [
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
		/>
	);
};

export default WalletTopupPage;
