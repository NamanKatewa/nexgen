"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
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
	const [pageSize, setPageSize] = useState(10);
	const searchParams = useSearchParams();
	const initialUserId = searchParams.get("userId") || "";

	const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
	const [selectedShipmentItem, setSelectedShipmentItem] =
		useState<ShipmentListItem | null>(null);

	const [searchText, setSearchText] = useState(initialUserId);
	const debouncedSearchFilter = useDebounce(searchText, 500);

	const { data, isLoading } = api.admin.pendingShipments.useQuery(
		{
			page,
			pageSize,
			searchFilter:
				debouncedSearchFilter === "" ? undefined : debouncedSearchFilter,
		},
		{
			retry: 3,
			refetchOnWindowFocus: false,
		},
	);

	const handleClearFilters = () => {
		setSearchText("");
	};

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
			key: "date",
			header: "Date",
			className: "w-30 px-4",
			render: (item: ShipmentListItem) =>
				item.created_at ? formatDate(item.created_at) : "-",
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-50 px-4",
			render: (item: ShipmentListItem) => (
				<div className="flex flex-col gap-2">
					<Button
						type="button"
						size="sm"
						variant="default"
						onClick={() => {
							setSelectedShipmentItem(item);
							setShowOrderDetailsModal(true);
						}}
						className="cursor-pointer"
					>
						View Details
					</Button>
				</div>
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
				onRowClick={(row: ShipmentListItem) => {
					setSelectedShipmentItem(row);
					setShowOrderDetailsModal(true);
				}}
			/>
			<PaginationButtons
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
