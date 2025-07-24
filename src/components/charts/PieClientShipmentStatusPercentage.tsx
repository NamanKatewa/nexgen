"use client";
import type { inferRouterOutputs } from "@trpc/server";
import { Pie, PieChart, Sector } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";
import type { AppRouter } from "~/server/api/root";

export const description = "A donut chart with an active sector";

export default function ChartPieClientShipmenStatustPercentage({
	data,
}: {
	data: inferRouterOutputs<AppRouter>["userDash"]["getDashboardData"]["shipmentStatusDistribution"];
}) {
	const chartConfig: ChartConfig = data.reduce((acc, item, index) => {
		acc[item.status] = {
			label: item.status,
			color: `var(--chart-${index + 1})`,
		};
		return acc;
	}, {} as ChartConfig);

	const chartData = data.map((item, index) => ({
		...item,
		fill: `var(--chart-${index + 1})`,
	}));

	return (
		<Card className="col-span-1 flex flex-col">
			<CardHeader className="items-center pb-0">
				<CardTitle>Courier Status</CardTitle>
				<CardDescription>Percentage</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					config={chartConfig}
					className="mx-auto aspect-square h-[300px] w-full"
				>
					<PieChart>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Pie
							data={chartData}
							dataKey="count"
							nameKey="status"
							innerRadius={30}
							strokeWidth={2}
							activeIndex={0}
							activeShape={({
								outerRadius = 0,
								...props
							}: PieSectorDataItem) => (
								<Sector {...props} outerRadius={outerRadius + 10} />
							)}
							label={({ status, percent, count }) =>
								`${status} ${(percent * 100).toFixed(0)}%`
							}
						/>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
