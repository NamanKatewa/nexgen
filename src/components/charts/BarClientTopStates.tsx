"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

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

export const description = "A horizontal bar chart";

const chartConfig = {
	shipmentCount: {
		label: "Shipment Count",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

export default function ChartBarClientTopStates({
	data,
}: {
	data: inferRouterOutputs<AppRouter>["userDash"]["getDashboardData"]["topDestinationStates"];
}) {
	return (
		<Card className="col-span-1">
			<CardHeader>
				<CardTitle>Top Destination States</CardTitle>
				<CardDescription>Top 5</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart accessibilityLayer data={data} layout="vertical">
						<XAxis type="number" dataKey="shipmentCount" hide />
						<YAxis
							dataKey="state"
							type="category"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							tickFormatter={(value: string) =>
								value
									.split(" ")
									.map(
										(word) =>
											word.charAt(0).toUpperCase() +
											word.slice(1).toLowerCase(),
									)
									.join(" ")
							}
							width={120}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Bar
							dataKey="shipmentCount"
							fill="var(--color-shipmentCount)"
							radius={5}
							label={{ position: "right" }}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
