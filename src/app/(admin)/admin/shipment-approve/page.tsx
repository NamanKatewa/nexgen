"use client";

import { View } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import Copyable from "~/components/Copyable";
import { type ColumnConfig, DataTable } from "~/components/DataTable";
import PaginationButtons from "~/components/PaginationButtons";
import ShipmentDetailsModal from "~/components/ShipmentDetailsModal";
import { Button } from "~/components/ui/button";
import useDebounce from "~/lib/hooks/useDebounce";
import { formatDate } from "~/lib/utils";
import { type RouterOutputs, api } from "~/trpc/react";

type ShipmentListOutput = RouterOutputs["admin"]["pendingShipments"];
type ShipmentListItem = ShipmentListOutput["shipments"][number];

function ApproveOrderContent() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const searchParams = useSearchParams();
	const initialUserId = searchParams.get("userId") || "";

	const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
	const [selectedShipmentItem, setSelectedShipmentItem] =
		useState<ShipmentListItem | null>(null);

	const [searchText, setSearchText] = useState(initialUserId);
	const debouncedSearchFilter = useDebounce(searchText, 500);
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});

	const handleClearFilters = () => {
		setSearchText("");
		setDateRange({ from: undefined, to: undefined });
	};

	const utils = api.useUtils();

	const { data, isLoading } = api.admin.pendingShipments.useQuery(
		{
			page,
			pageSize,
			searchFilter:
				debouncedSearchFilter === "" ? undefined : debouncedSearchFilter,
			startDate: dateRange?.from?.toISOString(),
			endDate: dateRange?.to?.toISOString(),
		},
		{
			retry: 3,
			refetchOnWindowFocus: false,
		},
	);

	const { mutate: holdShipment, isPending: isHolding } =
		api.hold.holdShipment.useMutation({
			onSuccess: () => {
				toast.success("Shipment held successfully!");
				utils.admin.pendingShipments.invalidate();
			},
			onError: (error) => {
				toast.error(`Failed to hold shipment: ${error.message}`);
			},
		});

	const { mutate: releaseShipment, isPending: isReleasing } =
		api.hold.releaseShipment.useMutation({
			onSuccess: () => {
				toast.success("Shipment released successfully!");
				utils.admin.pendingShipments.invalidate();
			},
			onError: (error) => {
				toast.error(`Failed to release shipment: ${error.message}`);
			},
		});

	const columns: ColumnConfig<ShipmentListItem>[] = [
		{
			key: "human_readable_shipment_id",
			header: "Shipment ID",
			className: "w-30 px-4",
			render: (item: ShipmentListItem) => (
				<Copyable content={item.human_readable_shipment_id} />
			),
		},
		{
			key: "package_weight",
			header: "Package Weight",
			className: "w-40 px-4 whitespace-normal text-center",
		},
		{
			key: "package_dimensions",
			header: "Package Dimensions",
			className: "w-40 px-4 text-center",
		},
		{
			key: "shipping_cost",
			header: "Amount",
			className: "w-30 px-4 text-center",
			render: (item: ShipmentListItem) => `₹${item.shipping_cost}`,
		},
		{
			key: "recipient_name",
			header: "Recipient Name",
			className: "w-40 px-4 text-center whitespace-normal",
			render: (item: ShipmentListItem) => item.recipient_name,
		},
		{
			key: "recipient Contact",
			header: "Recipient Contact",
			className: "w-40 px-4 text-center whitespace-normal",
			render: (item: ShipmentListItem) => item.recipient_mobile,
		},
		{
			key: "date",
			header: "Date",
			className: "w-40 px-4",
			render: (item: ShipmentListItem) =>
				item.created_at ? formatDate(item.created_at) : "-",
		},
		{
			key: "hold",
			header: "Hold Status",
			className: "w-30 text-center",
			render: (item) => {
				if (item.shipment_status === "PendingApproval") {
					return (
						<Button
							onClick={() => holdShipment({ shipmentId: item.shipment_id })}
							disabled={isHolding}
						>
							{isHolding ? "Holding..." : "Hold"}
						</Button>
					);
				}
				if (item.shipment_status === "Hold") {
					return (
						<Button
							onClick={() => releaseShipment({ shipmentId: item.shipment_id })}
							disabled={isReleasing}
						>
							{isReleasing ? "Releasing..." : "Release"}
						</Button>
					);
				}
				return null; // Or some other indicator for other statuses
			},
		},
		{
			key: "view",
			header: "View",
			className: "w-30 px-4 text-center",
			render: (item: ShipmentListItem) => (
				<Button
					variant="ghost"
					onClick={() => {
						setSelectedShipmentItem(item);
						setShowOrderDetailsModal(true);
					}}
				>
					<View />
				</Button>
			),
		},
	];

	const filters = [
		{
			id: "search",
			label: "Search",
			type: "text" as const,
			value: searchText,
			onChange: setSearchText,
		},
	];

	return (
		<>
			<DataTable
				title="Shipment Approval"
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
				isLoading={isLoading}
				page={page}
				totalPages={data?.totalPages || 1}
				setPage={setPage}
			/>
			<ShipmentDetailsModal
				isOpen={showOrderDetailsModal}
				onClose={() => setShowOrderDetailsModal(false)}
				shipmentItem={selectedShipmentItem}
			/>
		</>
	);
}

export default function ApproveOrderPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ApproveOrderContent />
		</Suspense>
	);
}
