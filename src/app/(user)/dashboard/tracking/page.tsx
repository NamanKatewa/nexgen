"use client";

import type { SHIPMENT_STATUS } from "@prisma/client";
import { useRouter } from "next/navigation";
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
	RouterOutputs["shipment"]["getUserTrackingShipments"]["shipments"][number];

function UserOrdersContent() {
	const router = useRouter();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [searchText, setSearchText] = useState("");
	const [statusFilter, setStatusFilter] = useState<SHIPMENT_STATUS | undefined>(
		undefined,
	);
	const debouncedSearchFilter = useDebounce(searchText, 500);
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});

	const { data, isLoading } = api.shipment.getUserTrackingShipments.useQuery({
		page,
		pageSize,
		searchFilter:
			debouncedSearchFilter === "" ? undefined : debouncedSearchFilter,
		currentStatus: statusFilter,
		startDate: dateRange?.from?.toISOString(),
		endDate: dateRange?.to?.toISOString(),
	});

	const { data: shipmentCounts } =
		api.shipment.getUserShipmentStatusCounts.useQuery();

	const exportUserShipmentsMutation = api.export.userTracking.useMutation({
		onSuccess: (data) => {
			const wb = exportToXlsx(data, "Shipments");
			XLSX.writeFile(wb, "shipments.xlsx");
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const handleExport = () => {
		exportUserShipmentsMutation.mutate({
			searchFilter:
				debouncedSearchFilter === "" ? undefined : debouncedSearchFilter,
			currentStatus: statusFilter,
			startDate: dateRange?.from?.toISOString(),
			endDate: dateRange?.to?.toISOString(),
		});
	};

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
			key: "awb",
			header: "AWB",
			className: "px-4 w-30 text-center",
			render: (item) => {
				return item.awb_number ? <Copyable content={item.awb_number} /> : null;
			},
		},
		{
			key: "courier",
			header: "Courier",
			className: "px-4 w-30 text-center",
			render: (item) => (item.courier ? item.courier.name : "N/A"),
		},
		{
			key: "shipment_status",
			header: "Status",
			className: "px-4 w-30 text-center",
			render: (item) => {
				const statusInfo = SHIPMENT_STATUS_MAP[
					item.current_status as keyof typeof SHIPMENT_STATUS_MAP
				] || {
					displayName: item.current_status,
					color: "bg-gray-200 text-gray-800 text-center",
				};
				return (
					<Badge
						className={cn(
							"w-fit text-center text-md capitalize",
							statusInfo.color,
						)}
					>
						{statusInfo.displayName ? statusInfo.displayName : "N/A"}
					</Badge>
				);
			},
		},
		{
			key: "date",
			header: "Date",
			className: "px-4 w-40",
			render: (item) => formatDate(item.created_at),
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
			id: "search",
			label: "Search",
			type: "text" as const,
			value: searchText,
			onChange: setSearchText,
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

	const handleClearFilters = () => {
		setSearchText("");
		setStatusFilter(undefined);
		setDateRange({ from: undefined, to: undefined });
	};

	return (
		<>
			<div className="flex p-4">
				<Button
					onClick={handleExport}
					disabled={exportUserShipmentsMutation.isPending || isLoading}
					className="w-full"
				>
					{exportUserShipmentsMutation.isPending ? "Exporting..." : "Export"}
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
								router.push(`/dashboard/shipments/${item.shipment_id}`);
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

export default function UserOrdersPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<UserOrdersContent />
		</Suspense>
	);
}
