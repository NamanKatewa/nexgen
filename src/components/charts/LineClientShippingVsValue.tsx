"use client";

import type { inferRouterOutputs } from "@trpc/server";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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

export const description = "A multiple line chart";

const chartConfig = {
	totalShippingCost: {
		label: "Shipping Cost",
		color: "var(--chart-1)",
	},
	totalDeclaredValue: {
		label: "Declared Value",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

export default function ChartLineClientShippingVsValue({
	data,
}: {
	data: inferRouterOutputs<AppRouter>["userDash"]["getDashboardData"]["shippingCostsDeclaredValue"];
}) {
	return (
		<Card className="col-span-full">
			<CardHeader>
				<CardTitle>Shipping Costs vs Declared Value</CardTitle>
				<CardDescription>Past Few Months</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="w-full">
					<LineChart
						accessibilityLayer
						data={data}
						margin={{
							left: 20,
							right: 20,
							top: 20,
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
						<YAxis
							yAxisId="left"
							stroke="var(--color-totalShippingCost)"
							type="number"
							domain={[0, (dataMax: number) => dataMax * 10]}
							padding={{ top: 20 }}
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							stroke="var(--color-totalDeclaredValue)"
							type="number"
							domain={[0, (dataMax: number) => dataMax * 10]}
							padding={{ top: 20 }}
						/>

						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<ChartLegend content={<ChartLegendContent />} />
						<Line
							yAxisId="left"
							dataKey="totalShippingCost"
							type="monotone"
							stroke="var(--color-totalShippingCost)"
							strokeWidth={2}
						/>
						<Line
							yAxisId="right"
							dataKey="totalDeclaredValue"
							type="monotone"
							stroke="var(--color-totalDeclaredValue)"
							strokeWidth={2}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
