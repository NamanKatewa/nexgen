"use client";

import Link from "next/link";
import { useState } from "react";
import { DataTable } from "~/components/DataTable";
import CopyableId from "~/components/CopyableId";
import { Button } from "~/components/ui/button";
import { formatDateToSeconds } from "~/lib/utils";
import { type RouterOutputs, api } from "~/trpc/react";

type Order = RouterOutputs["order"]["getAllOrders"]["orders"][number];

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<
    "PendingApproval" | "Approved" | "Rejected" | undefined
  >(undefined);
  const [userIdFilter, setUserIdFilter] = useState<string | undefined>(
    undefined
  );

  const { data, isLoading } = api.order.getAllOrders.useQuery({
    page,
    pageSize,
    status: statusFilter,
    userId: userIdFilter,
  });

  const columns = [
    {
      key: "order_id",
      header: "Order ID",
      render: (order: Order) => (
        <div className="overflow-x-auto whitespace-nowrap text-ellipsis">
          <CopyableId id={order.order_id} />
          <Link
            href={`/admin/orders/${order.order_id}`}
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
      render: (order: Order) => order.user.name,
    },
    {
      key: "user.email",
      header: "User Email",
      render: (order: Order) => order.user.email,
    },
    {
      key: "total_amount",
      header: "Total Amount",
      render: (order: Order) => `₹${Number(order.total_amount).toFixed(2)}`,
    },
    { key: "order_status", header: "Order Status" },
    { key: "payment_status", header: "Payment Status" },
    {
      key: "created_at",
      header: "Created At",
      render: (order: Order) => formatDateToSeconds(order.created_at),
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
            : (value as "PendingApproval" | "Approved" | "Rejected")
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
        title="All Orders"
        data={data?.orders || []}
        columns={columns}
        filters={filters}
        onClearFilters={handleClearFilters}
        isLoading={isLoading}
        idKey="order_id"
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
