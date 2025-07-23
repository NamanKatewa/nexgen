import {
	type BUSINESS_TYPE,
	SHIPMENT_STATUS,
	USER_STATUS,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../trpc";

export const adminDashRouter = createTRPCRouter({
	getDashboardData: adminProcedure.query(async ({ ctx }) => {
		// Fetch KPIs
		const totalUsers = await ctx.db.user.count();
		const pendingKycApprovals = await ctx.db.kyc.count({
			where: { kyc_status: "Pending" },
		});
		const pendingShipments = await ctx.db.shipment.count({
			where: { shipment_status: "PendingApproval" },
		});

		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const totalRevenueLast30DaysResult = await ctx.db.transaction.aggregate({
			where: {
				transaction_type: "Credit",
				created_at: { gte: thirtyDaysAgo },
			},
			_sum: { amount: true },
		});
		const totalRevenueLast30Days =
			totalRevenueLast30DaysResult._sum.amount?.toNumber() || 0;

		const highPriorityTickets = await ctx.db.supportTicket.count({
			where: { status: "Open", priority: "High" },
		});

		const kpis = {
			totalUsers,
			pendingKycApprovals,
			pendingShipments,
			totalRevenueLast30Days: Number.parseFloat(
				totalRevenueLast30Days.toFixed(2),
			),
			highPriorityTickets,
		};

		// Platform Health Overview (Radar Chart)
		const platformHealthOverview = [
			{ metric: "Pending KYCs", value: pendingKycApprovals },
			{ metric: "Pending Shipments", value: pendingShipments },
			{ metric: "Open High-Priority Tickets", value: highPriorityTickets },
			{
				metric: "New Users (30d)",
				value: await ctx.db.user.count({
					where: { created_at: { gte: thirtyDaysAgo } },
				}),
			},
			{ metric: "Revenue (30d)", value: totalRevenueLast30Days },
		];

		// User Growth (last 12 months)
		const twelveMonthsAgo = new Date();
		twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

		const userGrowth = await ctx.db.user.groupBy({
			by: ["created_at"],
			where: { created_at: { gte: twelveMonthsAgo } },
			_count: { created_at: true },
			orderBy: { created_at: "asc" },
		});

		const formattedUserGrowth = userGrowth.map((u) => ({
			month: u.created_at.toLocaleString("en-IN", {
				month: "short",
				year: "numeric",
			}),
			newUserCount: u._count.created_at,
		}));

		// Revenue vs. Refunds (last 6 months)
		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

		const revenueRefunds = await ctx.db.$queryRaw`
      SELECT
        TO_CHAR(created_at, 'Mon') as month,
        SUM(CASE WHEN transaction_type = 'Credit' THEN amount ELSE 0 END) as "totalRevenue",
        SUM(CASE WHEN transaction_type = 'Debit' THEN amount ELSE 0 END) as "totalRefunds"
      FROM "Transaction"
      WHERE created_at >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY MIN(created_at) ASC
    `;

		// User Demographics (Stacked Bar Chart)
		const userDemographics = await ctx.db.user.groupBy({
			by: ["business_type", "status"],
			_count: { user_id: true },
		});

		const formattedUserDemographics = Object.values(
			userDemographics.reduce(
				(acc, curr) => {
					const businessType = curr.business_type as BUSINESS_TYPE;
					if (!acc[businessType]) {
						acc[businessType] = {
							businessType,
							activeUsers: 0,
							inactiveUsers: 0,
						};
					}
					if (curr.status === USER_STATUS.Active) {
						acc[businessType].activeUsers += curr._count.user_id;
					} else if (curr.status === USER_STATUS.Inactive) {
						acc[businessType].inactiveUsers += curr._count.user_id;
					}
					return acc;
				},
				{} as Record<
					BUSINESS_TYPE,
					{
						businessType: BUSINESS_TYPE;
						activeUsers: number;
						inactiveUsers: number;
					}
				>,
			),
		);

		// Shipment Funnel
		const shipmentFunnelStages = [
			SHIPMENT_STATUS.SHIPMENT_BOOKED,
			SHIPMENT_STATUS.PICKED_UP,
			SHIPMENT_STATUS.IN_TRANSIT,
			SHIPMENT_STATUS.OUT_FOR_DELIVERY,
			SHIPMENT_STATUS.DELIVERED,
		];

		const shipmentFunnel = await Promise.all(
			shipmentFunnelStages.map(async (stage) => ({
				stage,
				count: await ctx.db.shipment.count({
					where: { current_status: stage },
				}),
			})),
		);

		// Top Users by Shipment Volume (last 30 days)
		const topUsersByShipmentVolume = await ctx.db.shipment.groupBy({
			by: ["user_id"],
			where: { created_at: { gte: thirtyDaysAgo } },
			_count: { user_id: true },
			orderBy: { _count: { user_id: "desc" } },
			take: 10,
		});

		const formattedTopUsersByShipmentVolume = await Promise.all(
			topUsersByShipmentVolume.map(async (u) => {
				const user = await ctx.db.user.findUnique({
					where: { user_id: u.user_id },
					select: { name: true },
				});
				return {
					userName: user?.name || "Unknown User",
					shipmentCount: u._count.user_id,
				};
			}),
		);

		// Courier Usage Distribution
		const totalShipmentsAll = await ctx.db.shipment.count();

		const courierUsageDistribution = await ctx.db.shipment.groupBy({
			by: ["courier_id"],
			where: { courier_id: { not: null } },
			_count: { courier_id: true },
		});

		const formattedCourierUsageDistribution = await Promise.all(
			courierUsageDistribution.map(async (c) => {
				if (c.courier_id === null) {
					return { courierName: "Unknown Courier", shipmentPercentage: 0 }; // Handle null courier_id
				}
				const courier = await ctx.db.courier.findUnique({
					where: { id: c.courier_id },
					select: { name: true },
				});
				return {
					courierName: courier?.name || "Unknown Courier",
					shipmentPercentage:
						totalShipmentsAll > 0
							? (c._count.courier_id / totalShipmentsAll) * 100
							: 0,
				};
			}),
		);

		return {
			kpis,
			platformHealthOverview,
			userGrowth: formattedUserGrowth,
			revenueRefunds: revenueRefunds as {
				month: string;
				totalRevenue: number;
				totalRefunds: number;
			}[],
			userDemographics: formattedUserDemographics,
			shipmentFunnel,
			topUsersByShipmentVolume: formattedTopUsersByShipmentVolume,
			courierUsageDistribution: formattedCourierUsageDistribution,
		};
	}),
});
