"use client";

import { DollarSign, Package, Ticket, TrendingUp } from "lucide-react";
import ChartAreaClientShipmentsOverTime from "~/components/charts/AreaClientShipmentsOverTime";
import ChartBarClientCourierPerformance from "~/components/charts/BarClientCourierPerformance";
import ChartBarClientTopStates from "~/components/charts/BarClientTopStates";
import ChartLineClientAvgDeliverTime from "~/components/charts/LineClientAvgDeliverTime";
import ChartLineClientShippingVsValue from "~/components/charts/LineClientShippingVsValue";
import ChartPieClientShipmenStatustPercentage from "~/components/charts/PieClientShipmentStatusPercentage";
import UserDashboardSkeleton from "~/components/skeletons/UserDashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";

export default function UserDashboardPage() {
	const { data, isLoading, isError } = api.userDash.getDashboardData.useQuery();

	if (isLoading) {
		return <UserDashboardSkeleton />;
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
			<h1 className="font-bold text-2xl">
				👋 Hello {data.user.name}! Welcome to your Dashboard
			</h1>
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
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Today's Shipments
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{kpis.todayShipments}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Yesterday's Shipments
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{kpis.yesterdayShipments}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Today's Wallet Recharges
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							₹{kpis.todayWalletRecharges.toFixed(2)}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Yesterday's Wallet Recharges
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							₹{kpis.yesterdayWalletRecharges.toFixed(2)}
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<ChartPieClientShipmenStatustPercentage
					data={shipmentStatusDistribution}
				/>
				<ChartAreaClientShipmentsOverTime data={shipmentsOverTime} />
				<ChartLineClientShippingVsValue data={shippingCostsDeclaredValue} />
				<ChartBarClientTopStates data={topDestinationStates} />
				<ChartLineClientAvgDeliverTime data={averageDeliveryTime} />
				<ChartBarClientCourierPerformance data={courierPerformance} />
			</div>
		</div>
	);
}
