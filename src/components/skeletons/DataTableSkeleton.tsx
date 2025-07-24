import { nanoid } from "nanoid";
import type { FilterConfig } from "~/components/DataTable";
import { Skeleton } from "~/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";

interface DataTableSkeletonProps {
	columns: number;
	rows: number;
	columnClassNames?: string[];
	filters: FilterConfig[];
}

const DataTableSkeleton: React.FC<DataTableSkeletonProps> = ({
	columns,
	rows,
	columnClassNames,
	filters,
}) => {
	return (
		<div className="flex h-[50vw] w-full flex-col">
			<div className="sticky top-0 z-30 flex flex-col justify-between gap-4 border-b bg-blue-50 p-4">
				<Skeleton className="h-10 w-1/4" />
				<div className="flex items-center justify-between gap-4">
					<div className="flex flex-col gap-4">
						<div className="flex flex-wrap items-center gap-4">
							{filters.map((filter) => (
								<div key={nanoid()} className="flex items-center gap-2">
									<Skeleton
										className="h-10"
										style={{
											width: `${filter.label.length}ch`,
										}}
									/>
									<Skeleton className="h-10 w-[240px]" />
								</div>
							))}
						</div>
						<div className="flex flex-wrap items-center gap-4">
							{Array.from({ length: 2 }).map((_, i) => (
								<Skeleton key={nanoid()} className="h-10 w-[240px]" />
							))}
						</div>
					</div>
					<div>
						<Skeleton className="h-10 w-32" />
					</div>
				</div>
			</div>
			<div className="flex-1 overflow-auto">
				<div className="min-w-fit">
					<Table className="table-fixed text-blue-950">
						<TableHeader className="z-20 bg-blue-100 shadow-sm">
							<TableRow>
								{Array.from({ length: columns }).map((_, i) => (
									<TableHead key={nanoid()} className={columnClassNames?.[i]}>
										<Skeleton className="h-6 w-3/4" />
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{Array.from({ length: rows }).map(() => (
								<TableRow key={nanoid()} className="py-4 text-sm">
									{Array.from({ length: columns }).map((_, colIndex) => (
										<TableCell
											key={nanoid()}
											className={columnClassNames?.[colIndex]}
										>
											<Skeleton className="h-6 w-full" />
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
};

export default DataTableSkeleton;
