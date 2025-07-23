"use client";

import { DollarSign, Package, Ticket, TrendingUp } from "lucide-react";
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
	shipmentCount: {
		label: "Shipment Count",
		color: "hsl(var(--chart-1))",
	},
	totalShippingCost: {
		label: "Total Shipping Cost",
		color: "hsl(var(--chart-2))",
	},
	totalDeclaredValue: {
		label: "Total Declared Value",
		color: "hsl(var(--chart-3))",
	},
	DELIVERED: {
		label: "Delivered",
		color: "hsl(var(--chart-1))",
	},
	IN_TRANSIT: {
		label: "In Transit",
		color: "hsl(var(--chart-2))",
	},
	RTO: {
		label: "RTO",
		color: "hsl(var(--chart-3))",
	},
	CANCELLED: {
		label: "Cancelled",
		color: "hsl(var(--chart-4))",
	},
	SHIPMENT_BOOKED: {
		label: "Booked",
		color: "hsl(var(--chart-5))",
	},
	averageDeliveryTimeDays: {
		label: "Avg. Delivery Time (Days)",
		color: "hsl(var(--chart-1))",
	},
	shipmentPercentage: {
		label: "Shipment Percentage",
		color: "hsl(var(--chart-1))",
	},
};

export default function UserDashboardPage() {
	const { data, isLoading, isError } = api.userDash.getDashboardData.useQuery();

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
		shipmentStatusDistribution,
		shipmentsOverTime,
		shippingCostsDeclaredValue,
		topDestinationStates,
		courierPerformance,
		averageDeliveryTime,
	} = data;

	return (
		<div className="flex flex-col gap-4 p-4 md:p-8">
			<h1 className="font-bold text-2xl">User Dashboard</h1>

			{/* KPIs */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Wallet Balance
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							₹{kpis.walletBalance.toFixed(2)}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Shipments
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{kpis.totalShipments}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Avg. Shipping Cost
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							₹{kpis.avgShippingCost.toFixed(2)}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Delivered Rate
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{kpis.deliveredRate.toFixed(1)}%
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Open Support Tickets
						</CardTitle>
						<Ticket className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{kpis.openSupportTickets}</div>
					</CardContent>
				</Card>
			</div>

			{/* Charts */}
			<div className="grid gap-4 lg:grid-cols-2">
				<Card className="col-span-1">
					<CardHeader>
						<CardTitle>Shipment Status Distribution</CardTitle>
					</CardHeader>
					<CardContent className="flex aspect-square items-center justify-center p-6">
						<ChartContainer
							config={chartConfig}
							className="min-h-[300px] w-full"
						>
							<PieChart>
								<ChartTooltip
									content={<ChartTooltipContent nameKey="status" hideLabel />}
								/>
								<Pie
									data={shipmentStatusDistribution}
									dataKey="count"
									nameKey="status"
									innerRadius={60}
									outerRadius={100}
									fill="var(--color-DELIVERED)"
									stroke="var(--color-DELIVERED)"
									label={({ status, percent, count }) =>
										`${status}: ${count} (${(percent * 100).toFixed(0)}%)`
									}
								/>
								<ChartLegend
									content={<ChartLegendContent nameKey="status" />}
								/>
							</PieChart>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card className="col-span-1">
					<CardHeader>
						<CardTitle>Shipments Over Time</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							config={chartConfig}
							className="min-h-[300px] w-full"
						>
							<AreaChart accessibilityLayer data={shipmentsOverTime}>
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
								<YAxis />
								<ChartTooltip
									content={<ChartTooltipContent indicator="dot" />}
								/>
								<Area
									dataKey="shipmentCount"
									type="natural"
									fill="var(--color-shipmentCount)"
									stroke="var(--color-shipmentCount)"
									stackId="a"
									label={{ position: "top" }}
								/>
							</AreaChart>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card className="col-span-full">
					<CardHeader>
						<CardTitle>Shipping Costs vs. Declared Value</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							config={chartConfig}
							className="min-h-[300px] w-full"
						>
							<BarChart accessibilityLayer data={shippingCostsDeclaredValue}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="month"
									tickLine={false}
									tickMargin={10}
									axisLine={false}
								/>
								<YAxis yAxisId="left" stroke="var(--color-totalShippingCost)" />
								<YAxis
									yAxisId="right"
									orientation="right"
									stroke="var(--color-totalDeclaredValue)"
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<ChartLegend content={<ChartLegendContent />} />
								<Bar
									yAxisId="left"
									dataKey="totalShippingCost"
									fill="var(--color-totalShippingCost)"
									radius={4}
									label={{ position: "top" }}
								/>
								<Line
									yAxisId="right"
									dataKey="totalDeclaredValue"
									type="monotone"
									stroke="var(--color-totalDeclaredValue)"
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
						<CardTitle>Top 5 Destination States</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							config={chartConfig}
							className="min-h-[300px] w-full"
						>
							<BarChart
								accessibilityLayer
								data={topDestinationStates}
								layout="vertical"
							>
								<CartesianGrid horizontal={false} />
								<YAxis
									dataKey="state"
									type="category"
									tickLine={false}
									tickMargin={10}
									axisLine={false}
									width={100}
								/>
								<XAxis type="number" dataKey="shipmentCount" />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Bar
									dataKey="shipmentCount"
									fill="var(--color-shipmentCount)"
									radius={4}
									label={{ position: "right" }}
								/>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card className="col-span-1">
					<CardHeader>
						<CardTitle>Average Delivery Time</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							config={chartConfig}
							className="min-h-[300px] w-full"
						>
							<LineChart accessibilityLayer data={averageDeliveryTime}>
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
									dataKey="averageDeliveryTimeDays"
									type="monotone"
									stroke="var(--color-averageDeliveryTimeDays)"
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
						<CardTitle>Courier Performance</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							config={chartConfig}
							className="min-h-[300px] w-full"
						>
							<BarChart accessibilityLayer data={courierPerformance}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="courierName"
									tickLine={false}
									tickMargin={10}
									axisLine={false}
								/>
								<YAxis />
								<ChartTooltip content={<ChartTooltipContent />} />
								<ChartLegend content={<ChartLegendContent />} />
								<Bar
									dataKey="DELIVERED"
									stackId="a"
									fill="var(--color-DELIVERED)"
									label={{ position: "top" }}
								/>
								<Bar
									dataKey="IN_TRANSIT"
									stackId="a"
									fill="var(--color-IN_TRANSIT)"
									label={{ position: "top" }}
								/>
								<Bar
									dataKey="RTO"
									stackId="a"
									fill="var(--color-RTO)"
									label={{ position: "top" }}
								/>
								<Bar
									dataKey="CANCELLED"
									stackId="a"
									fill="var(--color-CANCELLED)"
									label={{ position: "top" }}
								/>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
