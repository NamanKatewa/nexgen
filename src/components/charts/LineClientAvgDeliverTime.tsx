"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";

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

export const description = "A line chart with a label";

const chartConfig = {
	averageDeliveryTimeDays: {
		label: "Average Delivery Time in Days",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export default function ChartLineClientAvgDeliverTime({
	data,
}: {
	data: inferRouterOutputs<AppRouter>["userDash"]["getDashboardData"]["averageDeliveryTime"];
}) {
	return (
		<Card className="col-span-1">
			<CardHeader>
				<CardTitle>Average Delivery Time In Days</CardTitle>
				<CardDescription>By Year</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<LineChart
						accessibilityLayer
						data={data}
						margin={{
							top: 20,
							left: 12,
							right: 12,
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => value.slice(0, 3)}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="line" />}
						/>
						<Line
							dataKey="averageDeliveryTimeDays"
							type="natural"
							stroke="var(--color-averageDeliveryTimeDays)"
							strokeWidth={2}
							dot={{
								fill: "var(--color-averageDeliveryTimeDays)",
							}}
							activeDot={{
								r: 6,
							}}
						>
							<LabelList
								position="top"
								offset={12}
								className="fill-foreground"
								fontSize={12}
							/>
						</Line>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
