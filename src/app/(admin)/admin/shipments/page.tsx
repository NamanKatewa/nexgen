"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import Copyable from "~/components/Copyable";
import { DataTable } from "~/components/DataTable";
import type { ColumnConfig } from "~/components/DataTable";
import PaginationButtons from "~/components/PaginationButtons";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import useDebounce from "~/lib/hooks/useDebounce";
import { generateAndDownloadLabel } from "~/lib/pdf-generator";
import { cn } from "~/lib/utils";
import { formatDate } from "~/lib/utils";
import { type RouterOutputs, api } from "~/trpc/react";
import { exportToXlsx } from "~/lib/xlsx";
import * as XLSX from "xlsx";

type Shipment =
	RouterOutputs["shipment"]["getAllShipments"]["shipments"][number];

function AdminOrdersContent() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [statusFilter, setStatusFilter] = useState<
		"PendingApproval" | "Approved" | "Rejected" | undefined
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
			id: "status",
			label: "Status",
			type: "select" as const,
			options: [
				{ label: "All", value: "all" },
				{ label: "Pending Approval", value: "PendingApproval" },
				{ label: "Approved", value: "Approved" },
				{ label: "Rejected", value: "Rejected" },
			],
			selectedValue: statusFilter || "all",
			onValueChange: (value: string) =>
				setStatusFilter(
					value === "all"
						? undefined
						: (value as "PendingApproval" | "Approved" | "Rejected"),
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
			<div className="flex justify-end p-4">
				<Button onClick={handleExport} disabled={exportMutation.isPending}>
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
