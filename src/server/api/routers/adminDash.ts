import {
	type BUSINESS_TYPE,
	SHIPMENT_STATUS,
	USER_STATUS,
} from "@prisma/client";
import { adminProcedure, createTRPCRouter } from "../trpc";

export const adminDashRouter = createTRPCRouter({
	getDashboardData: adminProcedure.query(async ({ ctx }) => {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const twelveMonthsAgo = new Date();
		twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

		const [
			totalUsers,
			pendingKycApprovals,
			pendingShipments,
			totalRevenueLast30DaysResult,
			highPriorityTickets,
			totalUserBalanceResult,
			userGrowth,
			revenueRefunds,
			userDemographics,
			shipmentFunnel,
			topUsersByShipmentVolume,
			totalShipmentsAll,
			courierUsageDistribution,
		] = await Promise.all([
			ctx.db.user.count(),
			ctx.db.kyc.count({
				where: { kyc_status: "Pending" },
			}),
			ctx.db.shipment.count({
				where: { shipment_status: "PendingApproval" },
			}),
			ctx.db.transaction.aggregate({
				where: {
					transaction_type: "Credit",
					created_at: { gte: thirtyDaysAgo },
				},
				_sum: { amount: true },
			}),
			ctx.db.supportTicket.count({
				where: { status: "Open", priority: "High" },
			}),
			ctx.db.wallet.aggregate({
				_sum: { balance: true },
			}),
			ctx.db.$queryRaw`
                SELECT
                    TO_CHAR(created_at, 'Mon YYYY') as month,
                    COUNT(user_id) as "newUserCount"
                FROM "User"
                WHERE created_at >= ${twelveMonthsAgo}
                GROUP BY month
                ORDER BY MIN(created_at) ASC
            `,
			ctx.db.$queryRaw`
                SELECT
                    TO_CHAR(created_at, 'Mon') as month,
                    SUM(CASE WHEN transaction_type = 'Credit' THEN amount ELSE 0 END) as "totalRevenue",
                    SUM(CASE WHEN transaction_type = 'Debit' THEN amount ELSE 0 END) as "totalRefunds"
                FROM "Transaction"
                WHERE created_at >= ${sixMonthsAgo}
                GROUP BY month
                ORDER BY MIN(created_at) ASC
            `,
			ctx.db.user.groupBy({
				by: ["business_type", "status"],
				_count: { user_id: true },
			}),
			Promise.all(
				[
					SHIPMENT_STATUS.SHIPMENT_BOOKED,
					SHIPMENT_STATUS.PICKED_UP,
					SHIPMENT_STATUS.IN_TRANSIT,
					SHIPMENT_STATUS.OUT_FOR_DELIVERY,
					SHIPMENT_STATUS.DELIVERED,
				].map(async (stage) => ({
					stage,
					count: await ctx.db.shipment.count({
						where: { current_status: stage },
					}),
				})),
			),
			ctx.db.shipment.groupBy({
				by: ["user_id"],
				where: { created_at: { gte: thirtyDaysAgo } },
				_count: { user_id: true },
				orderBy: { _count: { user_id: "desc" } },
				take: 10,
			}),
			ctx.db.shipment.count(),
			ctx.db.shipment.groupBy({
				by: ["courier_id"],
				where: { courier_id: { not: null } },
				_count: { courier_id: true },
			}),
		]);

		const totalRevenueLast30Days =
			totalRevenueLast30DaysResult._sum.amount?.toNumber() || 0;
		const totalUserBalance =
			totalUserBalanceResult._sum.balance?.toNumber() || 0;

		const kpis = {
			totalUsers,
			pendingKycApprovals,
			pendingShipments,
			totalRevenueLast30Days: Number.parseFloat(
				totalRevenueLast30Days.toFixed(2),
			),
			highPriorityTickets,
			totalUserBalance: Number.parseFloat(totalUserBalance.toFixed(2)),
		};

		const platformHealthOverviewRaw = [
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

		const logTransformedHealthOverview = platformHealthOverviewRaw.map(
			(item) => ({
				...item,
				value: Math.log10(item.value + 1), // Apply logarithmic transformation
			}),
		);

		const maxLogHealthValue = Math.max(
			...logTransformedHealthOverview.map((item) => item.value),
		);

		const platformHealthOverview = logTransformedHealthOverview.map((item) => ({
			...item,
			value: maxLogHealthValue === 0 ? 0 : item.value / maxLogHealthValue, // Normalize log-transformed values
		}));

		const formattedUserGrowth = (
			userGrowth as { month: string; newUserCount: bigint }[]
		).map((u) => ({
			month: u.month,
			newUserCount: Number(u.newUserCount),
		}));

		const formattedUserDemographics = Object.values(
			(
				userDemographics as {
					business_type: BUSINESS_TYPE;
					status: USER_STATUS;
					_count: { user_id: number };
				}[]
			).reduce(
				(acc, curr) => {
					const businessType = curr.business_type;
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

		const userIds = topUsersByShipmentVolume.map((u) => u.user_id);
		const users = await ctx.db.user.findMany({
			where: { user_id: { in: userIds } },
			select: { user_id: true, name: true },
		});
		const userMap = new Map(users.map((user) => [user.user_id, user.name]));

		const formattedTopUsersByShipmentVolume = topUsersByShipmentVolume.map(
			(u) => ({
				userName: userMap.get(u.user_id) || "Unknown User",
				shipmentCount: u._count.user_id,
			}),
		);

		const courierIds = (
			courierUsageDistribution as {
				courier_id: string;
				_count: { courier_id: number };
			}[]
		)
			.map((c) => c.courier_id)
			.filter((id) => id !== null) as string[];
		const couriers = await ctx.db.courier.findMany({
			where: { id: { in: courierIds } },
			select: { id: true, name: true },
		});
		const courierMap = new Map(
			couriers.map((courier) => [courier.id, courier.name]),
		);

		const formattedCourierUsageDistribution = (
			courierUsageDistribution as {
				courier_id: string;
				_count: { courier_id: number };
			}[]
		).map((c) => {
			if (c.courier_id === null) {
				return { courierName: "Unknown Courier", shipmentPercentage: 0 }; // Handle null courier_id
			}
			return {
				courierName: courierMap.get(c.courier_id) || "Unknown Courier",
				shipmentPercentage:
					totalShipmentsAll > 0
						? (c._count.courier_id / totalShipmentsAll) * 100
						: 0,
			};
		});

		return {
			kpis,
			platformHealthOverview,
			userGrowth: formattedUserGrowth,
			revenueRefunds: (
				revenueRefunds as {
					month: string;
					totalRevenue: bigint;
					totalRefunds: bigint;
				}[]
			).map((r) => ({
				month: r.month,
				totalRevenue: Number(r.totalRevenue),
				totalRefunds: Number(r.totalRefunds),
			})),
			userDemographics: formattedUserDemographics,
			shipmentFunnel,
			topUsersByShipmentVolume: formattedTopUsersByShipmentVolume,
			courierUsageDistribution: formattedCourierUsageDistribution,
		};
	}),
});
