"use client";

import { DollarSign, Package, Ticket, TrendingUp, Users } from "lucide-react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	Pie,
	PieChart,
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	XAxis,
	YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

const chartConfig = {
	newUserCount: {
		label: "New Users",
		color: "hsl(var(--chart-1))",
	},
	totalRevenue: {
		label: "Total Revenue",
		color: "hsl(var(--chart-2))",
	},
	totalRefunds: {
		label: "Total Refunds",
		color: "hsl(var(--chart-3))",
	},
	activeUsers: {
		label: "Active Users",
		color: "hsl(var(--chart-1))",
	},
	inactiveUsers: {
		label: "Inactive Users",
		color: "hsl(var(--chart-2))",
	},
	count: {
		label: "Count",
		color: "hsl(var(--chart-1))",
	},
	shipmentPercentage: {
		label: "Shipment Percentage",
		color: "hsl(var(--chart-1))",
	},
	value: {
		label: "Value",
		color: "hsl(var(--chart-1))",
	},
};

export default function AdminDashboardPage() {
	const { data, isLoading, isError } =
		api.adminDash.getDashboardData.useQuery();

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Skeleton className="h-[120px] w-full" />
				<Skeleton className="h-[120px] w-full" />
				<Skeleton className="h-[120px] w-full" />
				<Skeleton className="h-[120px] w-full" />
				<Skeleton className="col-span-full h-[400px]" />
				<Skeleton className="col-span-full h-[400px]" />
				<Skeleton className="col-span-full h-[400px]" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="text-center text-red-500">
				Failed to load dashboard data.
			</div>
		);
	}

	if (!data) return null;

	const {
		kpis,
		platformHealthOverview,
		userGrowth,
		revenueRefunds,
		userDemographics,
		shipmentFunnel,
		topUsersByShipmentVolume,
		courierUsageDistribution,
	} = data;

	return (
		<div className="flex flex-col gap-4 p-4 md:p-8">
			<h1 className="font-bold text-2xl">Admin Dashboard</h1>

			{/* KPIs */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Users</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{kpis.totalUsers}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Pending KYC Approvals
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{kpis.pendingKycApprovals}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Shipments
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{kpis.pendingShipments}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Revenue (Last 30 Days)
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							₹{kpis.totalRevenueLast30Days.toFixed(2)}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							High-Priority Tickets
						</CardTitle>
						<Ticket className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{kpis.highPriorityTickets}</div>
					</CardContent>
				</Card>
			</div>

			{/* Charts */}
			<div className="grid gap-4 lg:grid-cols-2">
				<Card className="col-span-1">
					<CardHeader>
						<CardTitle>Platform Health Overview</CardTitle>
					</CardHeader>
					<CardContent className="flex aspect-square items-center justify-center p-6">
						<ChartContainer
							config={chartConfig}
							className="min-h-[300px] w-full"
						>
							<RadarChart data={platformHealthOverview}>
								<ChartTooltip content={<ChartTooltipContent />} />
								<PolarGrid />
								<PolarAngleAxis dataKey="metric" />
								<PolarRadiusAxis angle={30} domain={[0, 150]} />
								<Radar
									name="Metrics"
									dataKey="value"
									stroke="hsl(var(--chart-1))"
									fill="hsl(var(--chart-1))"
									fillOpacity={0.6}
									label={{ position: "top" }}
								/>
							</RadarChart>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card className="col-span-1">
					<CardHeader>
						<CardTitle>User Growth</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							config={chartConfig}
							className="min-h-[300px] w-full"
						>
							<LineChart accessibilityLayer data={userGrowth}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="month"
									tickLine={false}
									axisLine={false}
									tickMargin={10}
								/>
								<YAxis />
								<ChartTooltip
									content={<ChartTooltipContent indicator="dot" />}
								/>
								<Line
									dataKey="newUserCount"
									type="monotone"
									stroke="var(--color-newUserCount)"
									strokeWidth={2}
									dot={true}
									label={{ position: "top" }}
								/>
							</LineChart>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card className="col-span-full">
					<CardHeader>
						<CardTitle>Revenue vs. Refunds</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							config={chartConfig}
							className="min-h-[300px] w-full"
						>
							<BarChart accessibilityLayer data={revenueRefunds}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="month"
									tickLine={false}
									tickMargin={10}
									axisLine={false}
								/>
								<YAxis yAxisId="left" stroke="var(--color-totalRevenue)" />
								<YAxis
									yAxisId="right"
									orientation="right"
									stroke="var(--color-totalRefunds)"
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<ChartLegend content={<ChartLegendContent />} />
								<Bar
									yAxisId="left"
									dataKey="totalRevenue"
									fill="var(--color-totalRevenue)"
									radius={4}
									label={{ position: "top" }}
								/>
								<Line
									yAxisId="right"
									dataKey="totalRefunds"
									type="monotone"
									stroke="var(--color-totalRefunds)"
									strokeWidth={2}
									dot={false}
									label={{ position: "top" }}
								/>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card className="col-span-1">
					<CardHeader>
						<CardTitle>User Demographics</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							config={chartConfig}
							className="min-h-[300px] w-full"
						>
							<BarChart accessibilityLayer data={userDemographics}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="businessType"
									tickLine={false}
									tickMargin={10}
									axisLine={false}
								/>
								<YAxis />
								<ChartTooltip content={<ChartTooltipContent />} />
								<ChartLegend content={<ChartLegendContent />} />
								<Bar
									dataKey="activeUsers"
									stackId="a"
									fill="var(--color-activeUsers)"
									label={{ position: "top" }}
								/>
								<Bar
									dataKey="inactiveUsers"
									stackId="a"
									fill="var(--color-inactiveUsers)"
									label={{ position: "top" }}
								/>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card className="col-span-1">
					<CardHeader>
						<CardTitle>Shipment Funnel</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							config={chartConfig}
							className="min-h-[300px] w-full"
						>
							<BarChart
								accessibilityLayer
								data={shipmentFunnel}
								layout="vertical"
							>
								<CartesianGrid horizontal={false} />
								<YAxis
									dataKey="stage"
									type="category"
									tickLine={false}
									tickMargin={10}
									axisLine={false}
									width={150}
								/>
								<XAxis type="number" dataKey="count" />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Bar dataKey="count" fill="var(--color-count)" radius={4} label={{ position: "right" }} />
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card className="col-span-full">
					<CardHeader>
						<CardTitle>Top Users by Shipment Volume</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							config={chartConfig}
							className="min-h-[300px] w-full"
						>
							<BarChart
								accessibilityLayer
								data={topUsersByShipmentVolume}
								layout="vertical"
							>
								<CartesianGrid horizontal={false} />
								<YAxis
									dataKey="userName"
									type="category"
									tickLine={false}
									tickMargin={10}
									axisLine={false}
									width={150}
								/>
								<XAxis type="number" dataKey="shipmentCount" />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Bar
									dataKey="shipmentCount"
									fill="var(--color-count)"
									radius={4}
									label={{ position: "right" }}
								/>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card className="col-span-full">
					<CardHeader>
						<CardTitle>Courier Usage Distribution</CardTitle>
					</CardHeader>
					<CardContent className="flex aspect-square items-center justify-center p-6">
						<ChartContainer
							config={chartConfig}
							className="min-h-[300px] w-full"
						>
							<PieChart>
								<ChartTooltip
									content={
										<ChartTooltipContent nameKey="courierName" hideLabel />
									}
								/>
								<Pie
									data={courierUsageDistribution}
									dataKey="shipmentPercentage"
									nameKey="courierName"
									innerRadius={60}
									outerRadius={100}
									fill="var(--color-shipmentPercentage)"
									stroke="var(--color-shipmentPercentage)"
									label={({ courierName, shipmentPercentage, count }) =>
										`${courierName}: ${count} (${shipmentPercentage.toFixed(1)}%)`
									}
								/>
								<ChartLegend
									content={<ChartLegendContent nameKey="courierName" />}
								/>
							</PieChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
