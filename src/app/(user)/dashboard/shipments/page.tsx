"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import Copyable from "~/components/Copyable";
import { DataTable } from "~/components/DataTable";
import type { ColumnConfig } from "~/components/DataTable";
import PaginationButtons from "~/components/PaginationButtons";
import { Badge } from "~/components/ui/badge";
import { SHIPMENT_STATUS_MAP } from "~/constants";
import useDebounce from "~/lib/hooks/useDebounce";
import { generateAndDownloadLabel } from "~/lib/pdf-generator";
import { cn } from "~/lib/utils";
import { formatDate } from "~/lib/utils";
import { type RouterOutputs, api } from "~/trpc/react";

type Shipment =
	RouterOutputs["shipment"]["getUserShipments"]["shipments"][number];

export default function UserOrdersPage() {
	const router = useRouter();
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [statusFilter, setStatusFilter] = useState<
		"PendingApproval" | "Approved" | "Rejected" | "Hold" | undefined
	>(undefined);
	const [searchText, setSearchText] = useState("");
	const debouncedSearchFilter = useDebounce(searchText, 500);
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});

	const { data, isLoading } = api.shipment.getUserShipments.useQuery({
		page,
		pageSize,
		status: statusFilter,
		searchFilter:
			debouncedSearchFilter === "" ? undefined : debouncedSearchFilter,
		startDate: dateRange?.from?.toISOString(),
		endDate: dateRange?.to?.toISOString(),
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
			header: "Customer Name",
			className: "px-4 w-40 whitespace-normal",
			render: (item) => item.recipient_name,
		},
		{
			key: "client_contact",
			header: "Customer Contact",
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
			key: "approval_status",
			header: "Approval Status",
			className: "px-4 w-40 text-center",
			render: (item) => (
				<Badge
					className={cn("text-950", {
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
		setSearchText("");
		setDateRange({ from: undefined, to: undefined });
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
