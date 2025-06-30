"use client";

import React, { useRef } from "react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
}

interface ColumnConfig<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: ColumnConfig<T>[];
  filters?: FilterConfig[];
  onClearFilters?: () => void;
  isLoading: boolean;
  noResultsMessage?: string;
}

const DataTable = <T,>({
  title,
  data,
  columns,
  filters = [],
  onClearFilters,
  isLoading,
  noResultsMessage = "No results found.",
}: DataTableProps<T>) => {
  const topRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-blue-950">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <div
        ref={topRef}
        className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b p-4"
      >
        <h1 className="font-semibold text-2xl text-blue-950">{title}</h1>
        <div className="flex flex-wrap items-center gap-4">
          {filters.map((filter) => (
            <div key={filter.id} className="flex items-center gap-2">
              <label htmlFor={filter.id} className="text-blue-950 text-sm">
                {filter.label}:
              </label>
              <Select
                value={filter.selectedValue}
                onValueChange={filter.onValueChange}
              >
                <SelectTrigger
                  id={filter.id}
                  className="w-[240px] text-blue-950"
                >
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent className="text-blue-950">
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          {filters.length > 0 && onClearFilters && (
            <Button
              variant="secondary"
              className="bg-blue-100 text-sm hover:bg-blue-200/50"
              onClick={onClearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-fit">
          <Table className="table-fixed text-blue-950">
            <TableHeader className="z-20 bg-blue-100 shadow-sm">
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key as string} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: T, index: number) => (
                <TableRow key={index} className="py-4 text-sm hover:bg-blue-200">
                  {columns.map((column) => (
                    <TableCell key={column.key as string} className={column.className}>
                      {column.render ? column.render(item) : (item as any)[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              {noResultsMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { DataTable };
