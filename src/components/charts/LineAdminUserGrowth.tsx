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
	newUserCount: {
		label: "New User Count",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export default function ChartLineAdminUserGrowth({
	data,
}: {
	data: inferRouterOutputs<AppRouter>["adminDash"]["getDashboardData"]["userGrowth"];
}) {
	return (
		<Card className="col-span-1 h-[500px]">
			<CardHeader>
				<CardTitle>User Growth</CardTitle>
				<CardDescription>Last 12 Months</CardDescription>
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
							dataKey="newUserCount"
							type="natural"
							stroke="var(--color-newUserCount)"
							strokeWidth={2}
							dot={{
								fill: "var(--color-newUserCount)",
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
