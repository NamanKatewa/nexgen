"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import * as XLSX from "xlsx";
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
import { exportToXlsx } from "~/lib/xlsx";
import { type RouterOutputs, api } from "~/trpc/react";

type Shipment =
	RouterOutputs["shipment"]["getAllShipments"]["shipments"][number];

function AdminOrdersContent() {
	const router = useRouter();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [statusFilter, setStatusFilter] = useState<
		"PendingApproval" | "Approved" | "Rejected" | "Hold" | undefined
	>(undefined);
	const searchParams = useSearchParams();
	const initialUserId = searchParams.get("userId") || "";
	const [userIdSearchText, setUserIdSearchText] = useState(initialUserId);
	const debouncedUserIdFilter = useDebounce(userIdSearchText, 500);
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});

	const { data, isLoading } = api.shipment.getAllShipments.useQuery({
		page,
		pageSize,
		status: statusFilter,
		userId: debouncedUserIdFilter === "" ? undefined : debouncedUserIdFilter,
		startDate: dateRange?.from?.toISOString(),
		endDate: dateRange?.to?.toISOString(),
	});

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
			key: "approval_status",
			header: "Approval Status",
			className: "w-30 px-4 text-center",
			render: (item: Shipment) => (
				<Badge
					className={cn("text-blue-950", {
						"bg-green-200": item.shipment_status === "Approved",
						"bg-yellow-200": item.shipment_status === "PendingApproval",
						"bg-red-200": item.shipment_status === "Rejected",
						"bg-orange-200": item.shipment_status === "Hold",
					})}
				>
					{item.shipment_status}
				</Badge>
			),
		},
		{
			key: "shipment_status",
			header: "Status",
			className: "px-4 w-60 text-center",
			render: (item) => {
				const statusInfo = SHIPMENT_STATUS_MAP[
					item.current_status as keyof typeof SHIPMENT_STATUS_MAP
				] || {
					displayName: item.current_status,
					color: "bg-gray-200 text-gray-800",
				};
				return (
					<Badge className={cn("w-fit capitalize", statusInfo.color)}>
						{statusInfo.displayName ? statusInfo.displayName : "N/A"}
					</Badge>
				);
			},
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
			render: (item: Shipment) => formatDate(item.created_at),
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
			label: "Search",
			type: "text" as const,
			value: userIdSearchText,
			onChange: setUserIdSearchText,
		},
		{
			id: "status",
			label: "Status",
			type: "select" as const,
			options: [
				{ label: "All", value: "all" },
				{ label: "Pending Approval", value: "PendingApproval" },
				{ label: "Approved", value: "Approved" },
				{ label: "Rejected", value: "Rejected" },
				{ label: "Hold", value: "Hold" },
			],
			selectedValue: statusFilter || "all",
			onValueChange: (value: string) =>
				setStatusFilter(
					value === "all"
						? undefined
						: (value as "PendingApproval" | "Approved" | "Rejected" | "Hold"),
				),
		},
	];

	const handleClearFilters = () => {
		setStatusFilter(undefined);
		setUserIdSearchText("");
		setDateRange({ from: undefined, to: undefined });
	};

	const exportMutation = api.export.exportShipments.useMutation({
		onSuccess: (data) => {
			const wb = exportToXlsx(data, "Shipments");
			XLSX.writeFile(wb, "shipments.xlsx");
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const handleExport = () => {
		exportMutation.mutate({
			searchFilter:
				debouncedUserIdFilter === "" ? undefined : debouncedUserIdFilter,
			startDate: dateRange?.from?.toISOString(),
			endDate: dateRange?.to?.toISOString(),
			filterStatus: statusFilter,
		});
	};

	return (
		<>
			<div className="flex flex-col gap-2 py-6">
				<Button
					onClick={handleExport}
					disabled={exportMutation.isPending || isLoading}
					className="w-full"
				>
					{exportMutation.isPending ? "Exporting..." : "Export"}
				</Button>
			</div>
			<DataTable
				title="All Shipments"
				data={data?.shipments || []}
				columns={columns}
				filters={filters}
				onClearFilters={handleClearFilters}
				isLoading={isLoading}
				idKey="shipment_id"
				dateRange={dateRange}
				onDateRangeChange={setDateRange}
				actions={(item: Shipment) => {
					const currentActions = [
						{
							label: "View",
							onClick: () => {
								router.push(`/admin/shipments/${item.shipment_id}`);
							},
						},
					];

					if (item.shipment_status === "Approved") {
						currentActions.push(
							{
								label: isGettingLabel ? "Label..." : "Label",
								onClick: () => handleGetLabel(item.shipment_id),
							},
							{
								label: "Track",
								onClick: () => {
									window.location.href = `/track/${item.human_readable_shipment_id}`;
								},
							},
						);
					}
					return currentActions;
				}}
			/>
			<PaginationButtons
				isLoading={isLoading}
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
