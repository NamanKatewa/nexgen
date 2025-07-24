"use client";
import type React from "react";
import { useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { DataTableFilter } from "~/components/DataTableFilter";
import DataTableSkeleton from "~/components/skeletons/DataTableSkeleton";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { formatDateOnly } from "~/lib/utils";

interface FilterOption {
	label: string;
	value: string;
}

export interface FilterConfig {
	id: string;
	label: string;
	type?: "select" | "text";
	options?: FilterOption[];
	selectedValue?: string;
	onValueChange?: (value: string) => void;
	value?: string;
	onChange?: (value: string) => void;
}

export interface ColumnConfig<T> {
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
	idKey?: string;
	onRowClick?: (row: T) => void;
	dateRange?: DateRange;
	onDateRangeChange?: (dateRange?: DateRange) => void;
}

const DataTable = <T,>({
	title,
	data,
	columns,
	filters = [],
	onClearFilters,
	isLoading,
	noResultsMessage = "No results found.",
	idKey,
	dateRange,
	onDateRangeChange,
}: DataTableProps<T>) => {
	const topRef = useRef<HTMLDivElement>(null);
	const [dateRangePreset, setDateRangePreset] = useState<string>("all");

	if (isLoading) {
		return (
			<>
				<DataTableSkeleton
					filters={filters}
					columns={columns.length}
					rows={10}
					columnClassNames={columns.map((col) => col.className || "")}
				/>
			</>
		);
	}

	return (
		<div className="flex h-[50vw] w-full flex-col">
			<div
				ref={topRef}
				className="sticky top-0 z-30 flex flex-col justify-between gap-4 border-b bg-blue-50 p-4"
			>
				<h1 className="font-semibold text-3xl text-blue-950">{title}</h1>
				<div className="flex items-center justify-between gap-4">
					<div className="flex flex-col gap-4">
						<div className="flex flex-wrap items-center gap-4">
							{filters.map((filter) => (
								<DataTableFilter key={filter.id} {...filter} />
							))}
						</div>
						<div className="flex flex-wrap items-center gap-4">
							{onDateRangeChange && (
								<>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												className="w-[240px] justify-start bg-blue-100/20 text-left font-normal"
											>
												{dateRange?.from ? (
													dateRange.to ? (
														<>
															{formatDateOnly(dateRange.from)} -{" "}
															{formatDateOnly(dateRange.to)}
														</>
													) : (
														formatDateOnly(dateRange.from)
													)
												) : (
													<span>Date range</span>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="range"
												selected={dateRange}
												onSelect={onDateRangeChange}
												numberOfMonths={2}
											/>
										</PopoverContent>
									</Popover>
									<DataTableFilter
										id="date-range-preset"
										label="Range"
										type="select"
										options={[
											{ label: "All", value: "all" },
											{ label: "Today", value: "today" },
											{ label: "This Week", value: "this-week" },
											{ label: "This Month", value: "this-month" },
											{ label: "Two Months", value: "two-months" },
											{ label: "This Year", value: "this-year" },
										]}
										selectedValue={dateRangePreset}
										onValueChange={(value) => {
											setDateRangePreset(value);
											if (value === "all") {
												if (onDateRangeChange) {
													onDateRangeChange(undefined);
												}
												return;
											}

											const now = new Date();
											let from: Date | undefined;
											let to: Date | undefined;

											switch (value) {
												case "today":
													from = new Date(now.setHours(0, 0, 0, 0));
													to = new Date(now.setHours(23, 59, 59, 999));
													break;
												case "this-week":
													from = new Date(
														now.setDate(now.getDate() - now.getDay()),
													);
													from.setHours(0, 0, 0, 0);
													to = new Date(
														now.setDate(now.getDate() - now.getDay() + 6),
													);
													to.setHours(23, 59, 59, 999);
													break;
												case "this-month":
													from = new Date(now.getFullYear(), now.getMonth(), 1);
													to = new Date(
														now.getFullYear(),
														now.getMonth() + 1,
														0,
													);
													to.setHours(23, 59, 59, 999);
													break;
												case "two-months":
													from = new Date(
														now.getFullYear(),
														now.getMonth() - 1,
														1,
													);
													to = new Date(
														now.getFullYear(),
														now.getMonth() + 1,
														0,
													);
													to.setHours(23, 59, 59, 999);
													break;
												case "this-year":
													from = new Date(now.getFullYear(), 0, 1);
													to = new Date(now.getFullYear(), 11, 31);
													to.setHours(23, 59, 59, 999);
													break;
												default:
													break;
											}

											if (from && to && onDateRangeChange) {
												onDateRangeChange({ from, to });
											}
										}}
									/>
								</>
							)}
						</div>
					</div>
					<div>
						{filters.length > 0 && onClearFilters && (
							<Button
								variant="secondary"
								className="bg-blue-100 text-sm hover:bg-blue-200/50"
								onClick={() => {
									onClearFilters();
									setDateRangePreset("all");
								}}
							>
								Clear Filters
							</Button>
						)}
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-auto">
				<div className="min-w-fit">
					<Table className="table-fixed text-blue-950">
						<TableHeader className="z-20 bg-blue-100 shadow-sm">
							<TableRow>
								{columns.map((column) => (
									<TableHead
										key={column.key as string}
										className={column.className}
									>
										{column.header}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.map((item: T, index: number) => (
								<TableRow
									key={idKey ? String(item[idKey as keyof T]) : index}
									className="py-4 text-sm hover:bg-blue-200"
								>
									{columns.map((column) => (
										<TableCell
											key={column.key as string}
											className={column.className}
										>
											{column.render
												? column.render(item)
												: String(item[column.key as keyof T])}
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
