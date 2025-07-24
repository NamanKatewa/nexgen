"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";
import type { AppRouter } from "~/server/api/root";

export const description = "A stacked bar chart with a legend";

const chartConfig = {
	totalRevenue: {
		label: "Total Revenue",
		color: "var(--chart-1)",
	},
	totalRefunds: {
		label: "Total Refund",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

export default function ChartBarRevenueVsRefund({
	data,
}: {
	data: inferRouterOutputs<AppRouter>["adminDash"]["getDashboardData"]["revenueRefunds"];
}) {
	return (
		<Card className="col-span-full h-[900px]">
			<CardHeader>
				<CardTitle>Revenue Vs Refund</CardTitle>
				<CardDescription>Last 6 Months</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart accessibilityLayer data={data}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							tickFormatter={(value) => value.slice(0, 3)}
						/>
						<ChartTooltip content={<ChartTooltipContent hideLabel />} />
						<ChartLegend content={<ChartLegendContent />} />
						<Bar
							dataKey="totalRevenue"
							stackId="a"
							fill="var(--color-totalRevenue)"
							radius={[0, 0, 4, 4]}
						/>
						<Bar
							dataKey="totalRefunds"
							stackId="a"
							fill="var(--color-totalRefunds)"
							radius={[4, 4, 0, 0]}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
