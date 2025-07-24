"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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

export const description = "A simple area chart";

const chartConfig = {
	shipmentCount: {
		label: "Shipment Count",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export default function ChartAreaClientShipmentsOverTime({
	data,
}: {
	data: inferRouterOutputs<AppRouter>["userDash"]["getDashboardData"]["shipmentsOverTime"];
}) {
	return (
		<Card className="col-span-1 h-[500px]">
			<CardHeader>
				<CardTitle>Shipments Over Time</CardTitle>
				<CardDescription>Showing shipments for the last 5 days</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="p-4">
					<AreaChart
						accessibilityLayer
						data={data}
						margin={{ left: 20, right: 20 }}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickFormatter={(value) =>
								new Date(value).toLocaleDateString("en-IN", {
									month: "short",
									day: "numeric",
								})
							}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="line" />}
						/>
						<Area
							dataKey="shipmentCount"
							type="natural"
							fill="var(--color-shipmentCount)"
							fillOpacity={0.4}
							stroke="var(--color-shipmentCount)"
							label={{ position: "top" }}
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
