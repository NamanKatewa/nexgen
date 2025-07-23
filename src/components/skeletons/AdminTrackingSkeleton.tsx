import { nanoid } from "nanoid";
import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

const AdminTrackingSkeleton = () => {
	return (
		<div className="space-y-4">
			<div className="flex justify-between">
				<Skeleton className="h-8 w-48" />
				<div className="flex gap-2">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-8 w-24" />
				</div>
			</div>
			<div className="space-y-2">
				{[...Array(10)].map(() => (
					<div
						key={nanoid()}
						className="flex items-center justify-between space-x-4 p-4"
					>
						<div className="flex items-center space-x-4">
							<Skeleton className="h-8 w-32" />
							<Skeleton className="h-8 w-48" />
							<Skeleton className="h-8 w-48" />
							<Skeleton className="h-8 w-48" />
							<Skeleton className="h-8 w-32" />
							<Skeleton className="h-8 w-32" />
							<Skeleton className="h-8 w-32" />
							<Skeleton className="h-8 w-48" />
						</div>
						<Skeleton className="h-8 w-32" />
					</div>
				))}
			</div>
		</div>
	);
};

export default AdminTrackingSkeleton;
