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

export const description = "A mixed bar chart";

const chartConfig = {
	shipmentCount: {
		label: "Shipment Count",
		color: "var(--chart-2)",
	},
	userName: {
		label: "User Name",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export default function ChartBarAdminTopUsers({
	data,
}: {
	data: inferRouterOutputs<AppRouter>["adminDash"]["getDashboardData"]["topUsersByShipmentVolume"];
}) {
	const chartConfig = data.reduce((acc, item, index) => {
		acc[item.shipmentCount] = {
			label: item.userName,
			color: `var(--chart-${index + 1})`,
		};
		return acc;
	}, {} as ChartConfig);

	const chartData = data.map((item, index) => ({
		...item,
		fill: `var(--chart-${index + 1})`,
	}));
	return (
		<Card className="col-span-full h-[900px]">
			<CardHeader>
				<CardTitle>Top Users By Shipment Volume</CardTitle>
				<CardDescription>Top 10</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer className="min-h-[300px] w-full" config={chartConfig}>
					<BarChart
						accessibilityLayer
						data={chartData}
						layout="vertical"
						margin={{ right: 20 }}
					>
						<YAxis
							dataKey="userName"
							type="category"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							width={150}
						/>
						<XAxis dataKey="shipmentCount" type="number" hide />
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Bar
							dataKey="shipmentCount"
							fill="var(--chart-1)"
							layout="vertical"
							radius={5}
							label={{ position: "right" }}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
