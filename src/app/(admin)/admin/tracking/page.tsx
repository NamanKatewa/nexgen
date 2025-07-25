"use client";

import type { SHIPMENT_STATUS } from "@prisma/client";
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
import { Skeleton } from "~/components/ui/skeleton";
import { DISPLAY_SHIPMENT_STATUSES, SHIPMENT_STATUS_MAP } from "~/constants";
import useDebounce from "~/lib/hooks/useDebounce";
import { generateAndDownloadLabel } from "~/lib/pdf-generator";
import { cn } from "~/lib/utils";
import { formatDate } from "~/lib/utils";
import { exportToXlsx } from "~/lib/xlsx";
import { type RouterOutputs, api } from "~/trpc/react";

type Shipment =
	RouterOutputs["shipment"]["getAllTrackingShipments"]["shipments"][number];

function AdminOrdersContent() {
	const router = useRouter();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [statusFilter, setStatusFilter] = useState<SHIPMENT_STATUS | undefined>(
		undefined,
	);
	const searchParams = useSearchParams();
	const initialUserId = searchParams.get("userId") || "";
	const [userIdSearchText, setUserIdSearchText] = useState(initialUserId);
	const debouncedUserIdFilter = useDebounce(userIdSearchText, 500);
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});

	const handleClearFilters = () => {
		setStatusFilter(undefined);
		setUserIdSearchText("");
		setDateRange({ from: undefined, to: undefined });
	};

	const { data, isLoading } = api.shipment.getAllTrackingShipments.useQuery({
		page,
		pageSize,
		userId: debouncedUserIdFilter === "" ? undefined : debouncedUserIdFilter,
		currentStatus: statusFilter,
		startDate: dateRange?.from?.toISOString(),
		endDate: dateRange?.to?.toISOString(),
	});

	const { data: shipmentCounts } =
		api.shipment.getShipmentStatusCounts.useQuery();

	const exportAdminShipmentsMutation = api.export.allTracking.useMutation({
		onSuccess: (data) => {
			const wb = exportToXlsx(data, "Shipments");
			XLSX.writeFile(wb, "shipments.xlsx");
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const handleExport = () => {
		exportAdminShipmentsMutation.mutate({
			searchFilter:
				debouncedUserIdFilter === "" ? undefined : debouncedUserIdFilter,
			currentStatus: statusFilter,
			startDate: dateRange?.from?.toISOString(),
			endDate: dateRange?.to?.toISOString(),
		});
	};

	const columns: ColumnConfig<Shipment>[] = [
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
			key: "user.company_name",
			header: "Company Name",
			className: "w-40 px-4",
			render: (item: Shipment) => item.user.company_name,
		},
		{
			key: "recipient_name",
			header: "Customer Name",
			className: "w-30 px-4 text-center",
			render: (item: Shipment) => item.recipient_name,
		},
		{
			key: "awb_number",
			header: "AWB",
			className: "w-30 px-4 text-center",
			render: (item: Shipment) => <Copyable content={item.awb_number || ""} />,
		},
		{
			key: "item.courier.name",
			header: "Courier",
			className: "w-30 px-4 text-center",
			render: (item: Shipment) => (item.courier ? item.courier.name : ""),
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
					<Badge className={cn("w-fit text-md capitalize", statusInfo.color)}>
						{statusInfo.displayName ? statusInfo.displayName : "N/A"}
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
			selectedValue: statusFilter || "all",
			onValueChange: (value: string) =>
				setStatusFilter(
					value === "all" ? undefined : (value as SHIPMENT_STATUS),
				),
			options: [
				{ label: "All", value: "all" },
				...Object.entries(SHIPMENT_STATUS_MAP).map(([key, value]) => ({
					label: value.displayName,
					value: key,
				})),
			],
		},
	];

	return (
		<>
			<div className="flex p-4">
				<Button
					onClick={handleExport}
					disabled={exportAdminShipmentsMutation.isPending || isLoading}
					className="w-full"
				>
					{exportAdminShipmentsMutation.isPending ? "Exporting..." : "Export"}
				</Button>
			</div>
			<div className="flex w-full flex-nowrap justify-evenly gap-0 p-4">
				{isLoading ? (
					<Skeleton className="h-16 w-full" />
				) : (
					<>
						<div
							onMouseDown={() => setStatusFilter(undefined)}
							className="flex min-w-0 flex-auto cursor-pointer flex-col items-center justify-between bg-blue-100 p-2 text-center"
						>
							<p>All</p>
							<p className="text-md">({data?.totalShipments})</p>
						</div>
						{shipmentCounts &&
							DISPLAY_SHIPMENT_STATUSES.map((status) => {
								const count =
									shipmentCounts[status as keyof typeof shipmentCounts] || 0;
								const statusInfo = SHIPMENT_STATUS_MAP[
									status as keyof typeof SHIPMENT_STATUS_MAP
								] || {
									displayName: status,
									color: "bg-gray-200 text-gray-800",
								};
								return (
									<div
										key={status}
										onMouseDown={() =>
											setStatusFilter(status as SHIPMENT_STATUS)
										}
										className={cn(
											"flex min-w-0 flex-auto cursor-pointer flex-col items-center justify-between bg-blue-100 p-2 text-center",
											statusInfo.color,
										)}
									>
										<p>{statusInfo.displayName}</p>
										<p className="text-md">({count})</p>
									</div>
								);
							})}
					</>
				)}
			</div>

			<DataTable
				title="Track Shipments"
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
									router.push(`/track/${item.human_readable_shipment_id}`);
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
