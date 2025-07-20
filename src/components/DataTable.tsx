"use client";

import type React from "react";
import { useRef } from "react";
import { DataTableFilter } from "~/components/DataTableFilter";
import { Button } from "~/components/ui/button";
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
		<div className="flex h-[50vw] w-full flex-col">
			<div
				ref={topRef}
				className="sticky top-0 z-30 flex flex-col justify-between gap-4 border-b bg-blue-50 p-4"
			>
				<h1 className="font-semibold text-2xl text-blue-950">{title}</h1>
				<div className="flex items-center justify-between gap-4">
					<div className="flex flex-wrap items-center gap-4">
						{filters.map((filter) => (
							<DataTableFilter key={filter.id} {...filter} />
						))}
					</div>
					<div>
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
