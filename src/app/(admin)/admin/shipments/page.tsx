"use client";

import Link from "next/link";
import { useState } from "react";
import CopyableId from "~/components/CopyableId";
import { DataTable } from "~/components/DataTable";
import { Button } from "~/components/ui/button";
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
	const [userIdFilter, setUserIdFilter] = useState<string | undefined>(
		undefined,
	);

	const { data, isLoading } = api.shipment.getAllShipments.useQuery({
		page,
		pageSize,
		status: statusFilter,
		userId: userIdFilter,
	});

	const columns = [
		{
			key: "human_readable_shipment_id",
			header: "Shipment ID",
			render: (shipment: Shipment) => (
				<div className="overflow-x-auto text-ellipsis whitespace-nowrap">
					<CopyableId id={shipment.human_readable_shipment_id} />
					<Link
						href={`/admin/shipments/${shipment.human_readable_shipment_id}`}
						className="text-blue-600 hover:underline"
					>
						View
					</Link>
				</div>
			),
		},
		{
			key: "user.name",
			header: "User Name",
			render: (shipment: Shipment) => shipment.user.name,
		},
		{
			key: "user.email",
			header: "User Email",
			render: (shipment: Shipment) => shipment.user.email,
		},
		{
			key: "shipping_cost",
			header: "Shipping Cost",
			render: (shipment: Shipment) =>
				`₹${Number(shipment.shipping_cost).toFixed(2)}`,
		},
		{ key: "shipment_status", header: "Shipment Status" },
		{ key: "payment_status", header: "Payment Status" },
		{
			key: "created_at",
			header: "Created At",
			render: (shipment: Shipment) => formatDateToSeconds(shipment.created_at),
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
			value: userIdFilter || "",
			onChange: (value: string) => setUserIdFilter(value || undefined),
		},
	];

	const handleClearFilters = () => {
		setStatusFilter(undefined);
		setUserIdFilter(undefined);
	};

	return (
		<div className="p-8">
			<DataTable
				title="All Shipments"
				data={data?.shipments || []}
				columns={columns}
				filters={filters}
				onClearFilters={handleClearFilters}
				isLoading={isLoading}
				idKey="shipment_id"
			/>
			<div className="mt-4 flex justify-between">
				<Button
					type="button"
					onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
					disabled={page === 1}
					variant="outline"
					className="px-4 py-2"
				>
					Previous
				</Button>
				<span>
					Page {page} of {data?.totalPages || 1}
				</span>
				<Button
					type="button"
					onClick={() => setPage((prev) => prev + 1)}
					disabled={page === (data?.totalPages || 1)}
					variant="outline"
					className="px-4 py-2"
				>
					Next
				</Button>
			</div>
		</div>
	);
}
