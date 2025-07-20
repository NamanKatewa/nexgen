"use client";

import Link from "next/link";
import { useState } from "react";
import Copyable from "~/components/Copyable";
import { DataTable } from "~/components/DataTable";
import type { ColumnConfig } from "~/components/DataTable";
import PaginationButtons from "~/components/PaginationButtons";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import useDebounce from "~/lib/hooks/useDebounce";
import { cn } from "~/lib/utils";
import { formatDate } from "~/lib/utils";
import { type RouterOutputs, api } from "~/trpc/react";

type Shipment =
	RouterOutputs["shipment"]["getUserShipments"]["shipments"][number];

export default function UserOrdersPage() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [statusFilter, setStatusFilter] = useState<
		"PendingApproval" | "Approved" | "Rejected" | undefined
	>(undefined);
	const [searchText, setSearchText] = useState("");
	const debouncedSearchFilter = useDebounce(searchText, 500);

	const { data, isLoading } = api.shipment.getUserShipments.useQuery({
		page,
		pageSize,
		status: statusFilter,
		searchFilter:
			debouncedSearchFilter === "" ? undefined : debouncedSearchFilter,
	});

	const columns: ColumnConfig<Shipment>[] = [
		{
			key: "shipment_id",
			header: "Shipment ID",
			className: "px-4 w-30",
			render: (item) => <Copyable content={item.human_readable_shipment_id} />,
		},
		{
			key: "client_name",
			header: "Client Name",
			className: "px-4 w-40 whitespace-normal",
			render: (item) => item.recipient_name,
		},
		{
			key: "client_contact",
			header: "Client Contact",
			className: "px-4 w-30 whitespace-normal",
			render: (item) => item.recipient_mobile,
		},
		{
			key: "shipping_cost",
			header: "Shipping Cost",
			className: "px-4 w-30 text-center",
			render: (item) => `₹ ${Number(item.shipping_cost).toFixed(2)}`,
		},
		{
			key: "shipment_status",
			header: "Shipment Status",
			className: "px-4 w-40 text-center",
			render: (item) => (
				<Badge
					className={cn("text-950", {
						"bg-green-200": item.shipment_status === "Approved",
						"bg-yellow-200": item.shipment_status === "PendingApproval",
						"bg-red-200": item.shipment_status === "Rejected",
					})}
				>
					{item.shipment_status}
				</Badge>
			),
		},
		{
			key: "payment_status",
			header: "Payment Status",
			className: "px-4 w-40 text-center",
			render: (item) => (
				<Badge
					className={cn("text-950", {
						"bg-green-200": item.payment_status === "Paid",
						"bg-yellow-200": item.payment_status === "Pending",
					})}
				>
					{item.payment_status}
				</Badge>
			),
		},
		{
			key: "date",
			header: "Date",
			className: "px-4 w-40",
			render: (item) => formatDate(item.created_at),
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-30 px-4",
			render: (item) => (
				<Button className="cursor-pointer">
					<Link href={`/dashboard/shipments/${item.shipment_id}`}>
						View Shipment
					</Link>
				</Button>
			),
		},
	];

	const filters = [
		{
			id: "status",
			label: "Status",
			type: "select" as const,
			options: [
				{ label: "All", value: "" },
				{ label: "Pending Approval", value: "PendingApproval" },
				{ label: "Approved", value: "Approved" },
				{ label: "Rejected", value: "Rejected" },
			],
			selectedValue: statusFilter || "",
			onValueChange: (value: string) =>
				setStatusFilter(
					value === ""
						? undefined
						: (value as "PendingApproval" | "Approved" | "Rejected"),
				),
		},
		{
			id: "search",
			label: "Search",
			type: "text" as const,
			value: searchText,
			onChange: setSearchText,
		},
	];

	const handleClearFilters = () => {
		setStatusFilter(undefined);
		setSearchText("");
	};

	return (
		<>
			<DataTable
				title="My Shipments"
				data={data?.shipments || []}
				columns={columns}
				filters={filters}
				onClearFilters={handleClearFilters}
				isLoading={isLoading}
				idKey="shipment_id"
			/>
			<PaginationButtons
				page={page}
				totalPages={data?.totalPages || 1}
				setPage={setPage}
			/>
		</>
	);
}
