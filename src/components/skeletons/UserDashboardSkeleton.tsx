import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const UserDashboardSkeleton = () => {
	return (
		<div className="flex flex-col gap-4 p-4 md:p-8">
			<h1 className="font-bold text-2xl">Hello! Welcome to User Dashboard</h1>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4, 5].map((i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-5 w-1/2" />
							<Skeleton className="h-5 w-5" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-24" />
						</CardContent>
					</Card>
				))}
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				<Skeleton className="col-span-1 h-[500px]" />
				<Skeleton className="col-span-1 h-[500px]" />
				<Skeleton className="col-span-full h-[900px]" />
				<Skeleton className="col-span-1 h-[500px]" />
				<Skeleton className="col-span-1 h-[500px]" />
				<Skeleton className="col-span-full h-[900px]" />
			</div>
		</div>
	);
};

export default UserDashboardSkeleton;
