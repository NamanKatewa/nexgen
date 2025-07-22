"use client";

import type { SHIPMENT_STATUS } from "@prisma/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import Copyable from "~/components/Copyable";
import { DataTable } from "~/components/DataTable";
import type { ColumnConfig } from "~/components/DataTable";
import PaginationButtons from "~/components/PaginationButtons";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { SHIPMENT_STATUS_MAP } from "~/constants";
import useDebounce from "~/lib/hooks/useDebounce";
import { generateAndDownloadLabel } from "~/lib/pdf-generator";
import { cn } from "~/lib/utils";
import { formatDate } from "~/lib/utils";
import { type RouterOutputs, api } from "~/trpc/react";

type Shipment =
	RouterOutputs["shipment"]["getAllShipments"]["shipments"][number];

function AdminOrdersContent() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [statusFilter, setStatusFilter] = useState<
		SHIPMENT_STATUS | "ALL" | undefined
	>(undefined);
	const searchParams = useSearchParams();
	const initialUserId = searchParams.get("userId") || "";
	const [userIdSearchText, setUserIdSearchText] = useState(initialUserId);
	const debouncedUserIdFilter = useDebounce(userIdSearchText, 500);

	const { data, isLoading } = api.shipment.getAllTrackingShipments.useQuery({
		page,
		pageSize,
		userId: debouncedUserIdFilter === "" ? undefined : debouncedUserIdFilter,
		currentStatus: statusFilter === "ALL" ? undefined : statusFilter,
	});

	const { data: shipmentCounts } =
		api.shipment.getShipmentStatusCounts.useQuery();

	const columns: ColumnConfig<Shipment>[] = [
		{
			key: "human_readable_shipment_id",
			header: "Shipment ID",
			className: "w-30 px-4",
			render: (item) => <Copyable content={item.human_readable_shipment_id} />,
		},
		{
			key: "user.name",
			header: "User Name",
			className: "w-40 px-4 whitespace-normal",
			render: (item) => (
				<Link href={`/admin/user/${item.user_id}`}>{item.user.name}</Link>
			),
		},
		{
			key: "user.email",
			header: "User Email",
			className: "w-40 px-4",
			render: (item) => <Copyable content={item.user.email} />,
		},
		{
			key: "shipping_cost",
			header: "Shipping Cost",
			className: "w-30 px-4 text-center",
			render: (item: Shipment) => `₹${Number(item.shipping_cost).toFixed(2)}`,
		},
		{
			key: "shipment_status",
			header: "Status",
			className: "px-4 w-30 text-center",
			render: (item) => {
				const statusInfo =
					SHIPMENT_STATUS_MAP[
						item.current_status as keyof typeof SHIPMENT_STATUS_MAP
					] || SHIPMENT_STATUS_MAP.NA;
				return (
					<Badge className={cn("w-fit text-md capitalize", statusInfo.color)}>
						{statusInfo.displayName}
					</Badge>
				);
			},
		},
		{
			key: "date",
			header: "Date",
			className: "w-40 px-4",
			render: (item: Shipment) => formatDate(item.created_at),
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-30 px-4",
			render: (item: Shipment) => (
				<div className="flex flex-col gap-2">
					<Button className="cursor-pointer">
						<Link href={`/admin/shipments/${item.shipment_id}`}>View</Link>
					</Button>
					{item.shipment_status === "Approved" && (
						<>
							<Button
								className="cursor-pointer"
								onClick={() => handleGetLabel(item.shipment_id)}
								disabled={isGettingLabel}
							>
								{isGettingLabel ? "Label..." : "Label"}
							</Button>
							<Button>
								<Link href={`/track/${item.human_readable_shipment_id}`}>
									Track
								</Link>
							</Button>
						</>
					)}
				</div>
			),
		},
	];

	const { mutateAsync: getLabel, isPending: isGettingLabel } =
		api.label.generateLabel.useMutation();

	const handleGetLabel = async (shipmentId: string) => {
		try {
			await generateAndDownloadLabel(shipmentId, getLabel);
		} catch (error) {
			toast.error("Failed to generate label");
		}
	};

	const filters = [
		{
			id: "userId",
			label: "User ID",
			type: "text" as const,
			value: userIdSearchText,
			onChange: setUserIdSearchText,
		},
		{
			id: "current_status",
			label: "Status",
			type: "select" as const,
			value: statusFilter,
			onChange: (value: string) =>
				setStatusFilter(value as SHIPMENT_STATUS | "ALL"),
			options: [
				{ label: "All", value: "ALL" },
				...Object.entries(SHIPMENT_STATUS_MAP).map(([key, value]) => ({
					label: value.displayName,
					value: key,
				})),
			],
		},
	];

	const handleClearFilters = () => {
		setStatusFilter(undefined);
		setUserIdSearchText("");
	};

	return (
		<>
			<div className="mb-4 flex flex-wrap gap-2">
				{shipmentCounts &&
					Object.entries(shipmentCounts).map(([status, count]) => {
						const statusInfo =
							SHIPMENT_STATUS_MAP[status as keyof typeof SHIPMENT_STATUS_MAP] ||
							SHIPMENT_STATUS_MAP.NA;
						return (
							<Badge
								key={status}
								className={cn("text-md", statusInfo.color)}
							>{`${statusInfo.displayName}: ${count}`}</Badge>
						);
					})}
			</div>
			<DataTable
				title="Track Shipments"
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

export default function AdminOrdersPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<AdminOrdersContent />
		</Suspense>
	);
}
