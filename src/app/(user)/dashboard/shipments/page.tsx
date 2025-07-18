"use client";

import Link from "next/link";
import { useState } from "react";
import CopyableId from "~/components/CopyableId";
import { DataTable } from "~/components/DataTable";
import { Button } from "~/components/ui/button";
import { formatDateToSeconds } from "~/lib/utils";
import { type RouterOutputs, api } from "~/trpc/react";

type Shipment =
	RouterOutputs["shipment"]["getUserShipments"]["shipments"][number];

export default function UserOrdersPage() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [statusFilter, setStatusFilter] = useState<
		"PendingApproval" | "Approved" | "Rejected" | undefined
	>(undefined);

	const { data, isLoading } = api.shipment.getUserShipments.useQuery({
		page,
		pageSize,
		status: statusFilter,
	});

	const columns = [
		{
			key: "shipment_id",
			header: "Shipment ID",
			render: (shipment: Shipment) => (
				<div className="overflow-x-auto text-ellipsis whitespace-nowrap">
					<CopyableId id={shipment.shipment_id} />
					<Link
						href={`/dashboard/shipments/${shipment.shipment_id}`}
						className="text-blue-600 hover:underline"
					>
						View
					</Link>
				</div>
			),
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
	];

	const handleClearFilters = () => {
		setStatusFilter(undefined);
	};

	return (
		<div className="p-8">
			<DataTable
				title="My Shipments"
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
