"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

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

export const description = "A bar chart with a label";

const chartConfig = {
	DELIVERED: {
		label: "Delivered",
		color: "var(--chart-1)",
	},
	IN_TRANSIT: {
		label: "In Transit",
		color: "var(--chart-2)",
	},
	RTO: {
		label: "RTO",
		color: "var(--chart-3)",
	},
	CANCELLED: {
		label: "Cancelled",
		color: "var(--chart-4)",
	},
	SHIPMENT_BOOKED: {
		label: "Shipment Booked",
		color: "var(--chart-5)",
	},
} satisfies ChartConfig;

export default function ChartBarClientCourierPerformance({
	data,
}: {
	data: inferRouterOutputs<AppRouter>["userDash"]["getDashboardData"]["courierPerformance"];
}) {
	return (
		<Card className="col-span-full">
			<CardHeader>
				<CardTitle>Courier Performance</CardTitle>
				<CardDescription>Last 6 Months</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart
						accessibilityLayer
						data={data}
						margin={{
							top: 40,
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="courierName"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<ChartLegend content={<ChartLegendContent />} />
						<Bar dataKey="DELIVERED" fill="var(--color-DELIVERED)" radius={8}>
							<LabelList
								position="top"
								offset={12}
								className="fill-foreground"
								fontSize={12}
							/>
						</Bar>
						<Bar dataKey="IN_TRANSIT" fill="var(--color-IN_TRANSIT)" radius={8}>
							<LabelList
								position="top"
								offset={12}
								className="fill-foreground"
								fontSize={12}
							/>
						</Bar>
						<Bar dataKey="RTO" fill="var(--color-RTO)" radius={8}>
							<LabelList
								position="top"
								offset={12}
								className="fill-foreground"
								fontSize={12}
							/>
						</Bar>
						<Bar dataKey="CANCELLED" fill="var(--color-CANCELLED)" radius={8}>
							<LabelList
								position="top"
								offset={12}
								className="fill-foreground"
								fontSize={12}
							/>
						</Bar>
						<Bar
							dataKey="SHIPMENT_BOOKED"
							fill="var(--color-SHIPMENT_BOOKED)"
							radius={8}
						>
							<LabelList
								position="top"
								offset={12}
								className="fill-foreground"
								fontSize={12}
							/>
						</Bar>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
