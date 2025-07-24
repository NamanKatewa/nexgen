"use client";

import type { inferRouterOutputs } from "@trpc/server";
import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
} from "recharts";

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

export const description = "A radar chart with dots";

const chartConfig = {
	value: {
		label: "value",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export default function ChartRadarAdminPlatformHealth({
	data,
}: {
	data: inferRouterOutputs<AppRouter>["adminDash"]["getDashboardData"]["platformHealthOverview"];
}) {
	return (
		<Card className="col-span-1 h-[500px]">
			<CardHeader className="items-center">
				<CardTitle>Health Overview</CardTitle>
				<CardDescription>Overall Health of Nexgen</CardDescription>
			</CardHeader>
			<CardContent className="pb-0">
				<ChartContainer config={chartConfig} className="mx-auto h-full w-full">
					<RadarChart data={data}>
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<PolarAngleAxis dataKey="metric" />
						<PolarGrid />
						<PolarRadiusAxis angle={30} domain={[0, 1]} />
						<Radar
							dataKey="value"
							fill="var(--color-value)"
							fillOpacity={0.6}
						/>
					</RadarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
