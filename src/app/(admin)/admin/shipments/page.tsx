"use client";

import Link from "next/link";
import { useState } from "react";
import Copyable from "~/components/Copyable";
import { DataTable } from "~/components/DataTable";
import PaginationButtons from "~/components/PaginationButtons";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import useDebounce from "~/lib/hooks/useDebounce";
import { cn } from "~/lib/utils";
import { formatDateToSeconds } from "~/lib/utils";
import { type RouterOutputs, api } from "~/trpc/react";

type Shipment =
	RouterOutputs["shipment"]["getAllShipments"]["shipments"][number];

export default function AdminOrdersPage() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [statusFilter, setStatusFilter] = useState<
		"PendingApproval" | "Approved" | "Rejected" | undefined
	>(undefined);
	const [userIdSearchText, setUserIdSearchText] = useState("");
	const debouncedUserIdFilter = useDebounce(userIdSearchText, 500);

	const { data, isLoading } = api.shipment.getAllShipments.useQuery({
		page,
		pageSize,
		status: statusFilter,
		userId: debouncedUserIdFilter === "" ? undefined : debouncedUserIdFilter,
	});

	const columns = [
		{
			key: "human_readable_shipment_id",
			header: "Shipment ID",
			className: "w-30 px-4",
			render: (item: Shipment) => (
				<Copyable content={item.human_readable_shipment_id} />
			),
		},
		{
			key: "user.name",
			header: "User Name",
			className: "w-40 px-4 whitespace-normal",
			render: (item: Shipment) => (
				<Link href={`/admin/user/${item.user_id}`}>{item.user.name}</Link>
			),
		},
		{
			key: "user.email",
			header: "User Email",
			className: "w-40 px-4",
			render: (item: Shipment) => <Copyable content={item.user.email} />,
		},
		{
			key: "shipping_cost",
			header: "Shipping Cost",
			className: "w-30 px-4 text-center",
			render: (item: Shipment) => `₹${Number(item.shipping_cost).toFixed(2)}`,
		},
		{
			key: "shipment_status",
			header: "Shipment Status",
			className: "w-30 px-4 text-center",
			render: (item: Shipment) => (
				<Badge
					className={cn("text-blue-950", {
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
			className: "w-30 px-4 text-center",
			render: (item: Shipment) => (
				<Badge
					className={cn("text-blue-950", {
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
			className: "w-40 px-4",
			render: (item: Shipment) => formatDateToSeconds(item.created_at),
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-30 px-4",
			render: (item: Shipment) => (
				<Button className="cursor-pointer">
					<Link href={`/admin/shipments/${item.shipment_id}`}>
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
			id: "userId",
			label: "User ID",
			type: "text" as const,
			value: userIdSearchText,
			onChange: setUserIdSearchText,
		},
	];

	const handleClearFilters = () => {
		setStatusFilter(undefined);
		setUserIdSearchText("");
	};

	return (
		<>
			<DataTable
				title="All Shipments"
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
