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

export default function ChartPieAdminShipmentPercentage({
	data,
}: {
	data: inferRouterOutputs<AppRouter>["adminDash"]["getDashboardData"]["courierUsageDistribution"];
}) {
	const chartConfig: ChartConfig = data.reduce((acc, item, index) => {
		acc[item.courierName] = {
			label: item.courierName,
			color: `var(--chart-${index + 1})`,
		};
		return acc;
	}, {} as ChartConfig);

	const chartData = data.map((item, index) => ({
		...item,
		fill: `var(--chart-${index + 1})`,
	}));

	return (
		<Card className="col-span-full h-[500px]">
			<CardHeader>
				<CardTitle>Courier Usage</CardTitle>
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
							dataKey="shipmentPercentage"
							nameKey="courierName"
							innerRadius={30}
							strokeWidth={2}
							activeIndex={0}
							activeShape={({
								outerRadius = 0,
								...props
							}: PieSectorDataItem) => (
								<Sector {...props} outerRadius={outerRadius + 10} />
							)}
							label={({ courierName, shipmentPercentage }) =>
								`${courierName} (${shipmentPercentage.toFixed(1)}%)`
							}
						/>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
