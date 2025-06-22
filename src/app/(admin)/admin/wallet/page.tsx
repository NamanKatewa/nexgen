"use client";

import React, { useRef, useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";

import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";

const paymentStatusTypes = ["Pending", "Completed", "Failed"];

const VerifyKycPage = () => {
  const { data: transactions, isLoading } = api.wallet.getTransactions.useQuery(
    undefined,
    {
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );

  const topRef = useRef<HTMLDivElement>(null);

  const [filterType, setFilterType] = useState("ALL");

  const handleClearFilters = () => {
    setFilterType("ALL");
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredList = (transactions ?? []).filter((item) => {
    return filterType === "ALL" || item.payment_status === filterType;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-blue-950">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col">
      <div
        ref={topRef}
        className="p-4 border-b flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30"
      >
        <h1 className="text-2xl font-semibold text-blue-950">
          Wallet Recharges
        </h1>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex gap-2 items-center">
            <label
              htmlFor="entity-type-filter"
              className="text-sm text-blue-950"
            >
              Entity Type:
            </label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger
                id="entity-type-filter"
                className="w-[240px] text-blue-950"
              >
                <SelectValue placeholder="Entity Type: " />
              </SelectTrigger>
              <SelectContent className="text-blue-950">
                <SelectItem value="ALL">All Types</SelectItem>
                {paymentStatusTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="secondary"
            className="text-sm bg-blue-100 hover:bg-blue-200/50"
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-fit">
          <Table className="table-fixed text-blue-950">
            <TableHeader className="bg-blue-100 z-20 shadow-sm">
              <TableRow>
                <TableHead className="px-4 w-40 text-blue-950">Name</TableHead>
                <TableHead className="px-4 w-50 text-blue-950">Email</TableHead>
                <TableHead className="px-4 w-20 text-center text-blue-950">
                  Amount
                </TableHead>
                <TableHead className="px-4 w-30 text-center text-blue-950">
                  Date
                </TableHead>
                <TableHead className="px-4 w-50 text-center text-blue-950">
                  Payment Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map((transaction, i) => {
                return (
                  <TableRow key={i} className="hover:bg-blue-200 text-sm py-4">
                    <TableCell className="px-4 whitespace-normal">
                      {transaction.user.name}
                    </TableCell>
                    <TableCell className="px-4">
                      {transaction.user.email}
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      {String(transaction.amount)}
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      {transaction.transaction_date
                        ? format(
                            new Date(transaction.transaction_date),
                            "dd/MM/yyyy"
                          )
                        : "N/A"}
                    </TableCell>

                    <TableCell className="px-4 text-center">
                      <Badge
                        className={cn("text-950", {
                          "bg-green-200":
                            transaction.payment_status === "Completed",
                          "bg-yellow-200":
                            transaction.payment_status === "Pending",
                          "bg-red-200": transaction.payment_status === "Failed",
                        })}
                      >
                        {" "}
                        {transaction.payment_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredList.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No results found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyKycPage;
