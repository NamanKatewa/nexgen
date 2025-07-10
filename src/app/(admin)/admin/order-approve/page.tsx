"use client";

import React, { useState } from "react";
import { DataTable } from "~/components/DataTable";
import OrderDetailsModal from "~/components/OrderDetailsModal";
import { Button } from "~/components/ui/button";
import { type RouterOutputs, api } from "~/trpc/react";

type OrderListItem = RouterOutputs["admin"]["pendingOrders"][number];

const ApproveOrderPage = () => {
  const { data: orderList, isLoading } = api.admin.pendingOrders.useQuery(
    undefined,
    {
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );

  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] =
    useState<OrderListItem | null>(null);

  const [emailFilter, setEmailFilter] = useState("");

  const handleClearFilters = () => {
    setEmailFilter("");
  };

  const filteredData = React.useMemo(() => {
    return ((orderList as OrderListItem[]) ?? []).filter((item) => {
      return item.user.email.toLowerCase().includes(emailFilter.toLowerCase());
    });
  }, [orderList, emailFilter]);

  const columns = [
    {
      key: "user_name",
      header: "Name",
      className: "w-50 px-4",
      render: (item: OrderListItem) => item.user.name,
    },
    {
      key: "user_email",
      header: "Email",
      className: "w-70 px-4",
      render: (item: OrderListItem) => item.user.email,
    },
    {
      key: "total_amount",
      header: "Amount",
      className: "w-50 px-4",
      render: (item: OrderListItem) => `₹${item.total_amount}`,
    },
    {
      key: "date",
      header: "Created On",
      className: "w-50 px-4",
      render: (item: OrderListItem) =>
        item.created_at
          ? new Date(item.created_at).toLocaleString(undefined, {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "-",
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-50 px-4 text-right",
      render: (item: OrderListItem) => (
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={() => {
            setSelectedOrderItem(item);
            setShowOrderDetailsModal(true);
          }}
          className="cursor-pointer"
        >
          View Details
        </Button>
      ),
    },
  ];

  const filters = [
    {
      id: "email-filter",
      label: "Email",
      type: "text" as const,
      value: emailFilter,
      onChange: setEmailFilter,
    },
  ];

  return (
    <>
      <DataTable
        title="Order Approval"
        data={filteredData}
        columns={columns}
        filters={filters}
        onClearFilters={handleClearFilters}
        isLoading={isLoading}
        idKey="order_id"
        onRowClick={(row: OrderListItem) => {
          setSelectedOrderItem(row);
          setShowOrderDetailsModal(true);
        }}
      />
      <OrderDetailsModal
        isOpen={showOrderDetailsModal}
        onClose={() => setShowOrderDetailsModal(false)}
        orderItem={selectedOrderItem}
      />
    </>
  );
};

export default ApproveOrderPage;
