"use client";

import { DollarSign, Package, Ticket, Users } from "lucide-react";
import ChartBarAdminClientDemographics from "~/components/charts/BarAdminClientDemographics";
import ChartBarRevenueVsRefund from "~/components/charts/BarAdminRevenueVsRefund";
import ChartBarAdminShipmentFunnel from "~/components/charts/BarAdminShipmentFunnel";
import ChartBarAdminTopUsers from "~/components/charts/BarAdminTopUsers";
import ChartRadarAdminPlatformHealth from "~/components/charts/ChartRadarAdminPlatformHealth";
import ChartLineAdminUserGrowth from "~/components/charts/LineAdminUserGrowth";
import ChartPieAdminShipmentPercentage from "~/components/charts/PieAdminShipmentPercentage";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

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
				<ChartRadarAdminPlatformHealth data={platformHealthOverview} />
				<ChartLineAdminUserGrowth data={userGrowth} />
				<ChartBarRevenueVsRefund data={revenueRefunds} />
				<ChartBarAdminClientDemographics data={userDemographics} />
				<ChartBarAdminShipmentFunnel data={shipmentFunnel} />
				<ChartBarAdminTopUsers data={topUsersByShipmentVolume} />
				<ChartPieAdminShipmentPercentage data={courierUsageDistribution} />
			</div>
		</div>
	);
}
