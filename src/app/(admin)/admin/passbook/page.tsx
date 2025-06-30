"use client";

import { format } from "date-fns";
import React, { useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react"; // ✅ Restored API hook

const paymentStatusTypes = ["Pending", "Completed", "Failed"];
const transactionTypes = ["Credit", "Debit"];

const PassbookPage = () => {
	const { data: transactions = [], isLoading } = api.admin.getPassbook.useQuery(
		undefined,
		{
			retry: 3,
			refetchOnWindowFocus: false,
		},
	);

	const [filterStatus, setFilterStatus] = useState("ALL");
	const [filterTxnType, setFilterTxnType] = useState("ALL");

	const topRef = useRef<HTMLDivElement>(null);

	const handleClearFilters = () => {
		setFilterStatus("ALL");
		setFilterTxnType("ALL");
		topRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const filteredList = transactions.filter((item) => {
		const statusMatch =
			filterStatus === "ALL" || item.payment_status === filterStatus;
		const typeMatch =
			filterTxnType === "ALL" || item.transaction_type === filterTxnType;
		return statusMatch && typeMatch;
	});

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center text-blue-950">
				Loading...
			</div>
		);
	}

	return (
		<div className="flex h-screen w-full flex-col">
			<div
				ref={topRef}
				className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b p-4"
			>
				<h1 className="font-semibold text-2xl text-blue-950">Transactions</h1>
				<div className="flex flex-wrap items-center gap-4">
					<div className="flex items-center gap-2">
						<label
							htmlFor="entity-type-filter"
							className="text-blue-950 text-sm"
						>
							Payment Status:
						</label>
						<Select value={filterStatus} onValueChange={setFilterStatus}>
							<SelectTrigger
								id="entity-type-filter"
								className="w-[240px] text-blue-950"
							>
								<SelectValue placeholder="Payment Status" />
							</SelectTrigger>
							<SelectContent className="text-blue-950">
								<SelectItem value="ALL">All Types</SelectItem>
								{paymentStatusTypes.map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex items-center gap-2">
						<label
							htmlFor="transaction-type-filter"
							className="text-blue-950 text-sm"
						>
							Transaction Type:
						</label>
						<Select value={filterTxnType} onValueChange={setFilterTxnType}>
							<SelectTrigger
								id="transaction-type-filter"
								className="w-[240px] text-blue-950"
							>
								<SelectValue placeholder="Transaction Type" />
							</SelectTrigger>
							<SelectContent className="text-blue-950">
								<SelectItem value="ALL">All Types</SelectItem>
								{transactionTypes.map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<Button
						variant="secondary"
						className="bg-blue-100 text-sm hover:bg-blue-200/50"
						onClick={handleClearFilters}
					>
						Clear Filters
					</Button>
				</div>
			</div>

			<div className="flex-1 overflow-auto">
				<div className="min-w-fit">
					<Table className="table-fixed text-blue-950">
						<TableHeader className="z-20 bg-blue-100 shadow-sm">
							<TableRow>
								<TableHead className="w-40 px-4 text-blue-950">Name</TableHead>
								<TableHead className="w-50 px-4 text-blue-950">Email</TableHead>
								<TableHead className="w-20 px-4 text-center text-blue-950">
									Amount
								</TableHead>
								<TableHead className="w-30 px-4 text-center text-blue-950">
									Date
								</TableHead>
								<TableHead className="w-40 px-4 text-center text-blue-950">
									Transaction Type
								</TableHead>
								<TableHead className="w-50 px-4 text-center text-blue-950">
									Payment Status
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredList.map((transaction) => (
								<TableRow
									key={transaction.transaction_id}
									className="py-4 text-sm hover:bg-blue-200"
								>
									<TableCell className="whitespace-normal px-4">
										{transaction.user.name}
									</TableCell>
									<TableCell className="px-4">
										{transaction.user.email}
									</TableCell>
									<TableCell className="px-4 text-center">
										₹{String(transaction.amount)}
									</TableCell>
									<TableCell className="px-4 text-center">
										{transaction.transaction_date
											? format(
													new Date(transaction.transaction_date),
													"dd/MM/yyyy",
												)
											: "N/A"}
									</TableCell>
									<TableCell className="px-4 text-center">
										<Badge
											className={cn("text-950", {
												"bg-blue-200":
													transaction.transaction_type === "Credit",
												"bg-orange-200":
													transaction.transaction_type === "Debit",
											})}
										>
											{transaction.transaction_type}
										</Badge>
									</TableCell>
									<TableCell className="px-4 text-center">
										<Badge
											className={cn("text-950", {
												"bg-green-200":
													transaction.payment_status === "Completed",
												"bg-yellow-200":
													transaction.payment_status === "Pending",
												"bg-red-200": transaction.payment_status === "Failed",
											})}
										>
											{transaction.payment_status}
										</Badge>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{filteredList.length === 0 && (
						<div className="p-6 text-center text-gray-500">
							No results found.
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default PassbookPage;
