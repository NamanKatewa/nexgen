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
	activeUsers: {
		label: "Active Users",
		color: "var(--chart-1)",
	},
	inactiveUsers: {
		label: "Inactive Users",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

export default function ChartBarAdminClientDemographics({
	data,
}: {
	data: inferRouterOutputs<AppRouter>["adminDash"]["getDashboardData"]["userDemographics"];
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Client Demographics</CardTitle>
				<CardDescription>By Type</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart accessibilityLayer data={data}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="business_type"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							tickFormatter={(value) => value.slice(0, 3)}
						/>
						<ChartTooltip content={<ChartTooltipContent hideLabel />} />
						<ChartLegend content={<ChartLegendContent />} />
						<Bar
							dataKey="activeUsers"
							stackId="a"
							fill="var(--color-activeUsers)"
							radius={[0, 0, 4, 4]}
						/>
						<Bar
							dataKey="inactiveUsers"
							stackId="a"
							fill="var(--color-inactiveUsers)"
							radius={[4, 4, 0, 0]}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
