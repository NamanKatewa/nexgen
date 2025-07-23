import { SHIPMENT_STATUS } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userDashRouter = createTRPCRouter({
	getDashboardData: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.user.user_id;

		// Fetch KPIs
		const user = await ctx.db.user.findUnique({
			where: { user_id: userId },
			include: { wallet: true },
		});

		if (!user) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
		}

		const totalShipments = await ctx.db.shipment.count({
			where: { user_id: userId },
		});

		const deliveredShipments = await ctx.db.shipment.count({
			where: { user_id: userId, current_status: SHIPMENT_STATUS.DELIVERED },
		});

		const totalShippingCostResult = await ctx.db.shipment.aggregate({
			where: { user_id: userId },
			_sum: { shipping_cost: true },
			_count: { shipping_cost: true },
		});

		const avgShippingCost = totalShippingCostResult._sum.shipping_cost
			? totalShippingCostResult._sum.shipping_cost.toNumber() /
				totalShippingCostResult._count.shipping_cost
			: 0;

		const deliveredRate =
			totalShipments > 0 ? (deliveredShipments / totalShipments) * 100 : 0;

		const openSupportTickets = await ctx.db.supportTicket.count({
			where: { user_id: userId, status: "Open" },
		});

		const kpis = {
			walletBalance: user.wallet?.balance.toNumber() || 0,
			totalShipments,
			avgShippingCost: Number.parseFloat(avgShippingCost.toFixed(2)),
			deliveredRate: Number.parseFloat(deliveredRate.toFixed(2)),
			openSupportTickets,
		};

		// Shipment Status Distribution
		const shipmentStatusDistribution = await ctx.db.shipment.groupBy({
			by: ["current_status"],
			where: { user_id: userId, current_status: { not: null } },
			_count: { current_status: true },
		});

		const formattedShipmentStatusDistribution = shipmentStatusDistribution.map(
			(s) => ({
				status: s.current_status as SHIPMENT_STATUS,
				count: s._count.current_status,
			}),
		);

		// Shipments Over Time (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const shipmentsOverTime = await ctx.db.shipment.groupBy({
			by: ["created_at"],
			where: { user_id: userId, created_at: { gte: thirtyDaysAgo } },
			_count: { created_at: true },
			orderBy: { created_at: "asc" },
		});

		const formattedShipmentsOverTime = shipmentsOverTime.map((s) => ({
			date: s.created_at.toISOString().split("T")[0],
			shipmentCount: s._count.created_at,
		}));

		// Shipping Costs vs. Declared Value (last 6 months)
		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

		const shippingCostsDeclaredValue = await ctx.db.$queryRaw`
      SELECT
        TO_CHAR(created_at, 'Mon') as month,
        SUM(shipping_cost) as "totalShippingCost",
        SUM(declared_value) as "totalDeclaredValue"
      FROM "Shipment"
      WHERE user_id = ${userId} AND created_at >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY MIN(created_at) ASC
    `;

		// Top 5 Destination States
		const topDestinationStates = await ctx.db.shipment.groupBy({
			by: ["destination_address_id"],
			where: { user_id: userId },
			_count: { destination_address_id: true },
			orderBy: { _count: { destination_address_id: "desc" } },
			take: 5,
		});

		const formattedTopDestinationStates = await Promise.all(
			topDestinationStates.map(async (s) => {
				const address = await ctx.db.address.findUnique({
					where: { address_id: s.destination_address_id },
					select: { state: true },
				});
				return {
					state: address?.state || "Unknown",
					shipmentCount: s._count.destination_address_id,
				};
			}),
		);

		// Courier Performance (for top 5 couriers by shipment count)
		const topCouriers = await ctx.db.shipment.groupBy({
			by: ["courier_id"],
			where: { user_id: userId, courier_id: { not: null } },
			_count: { courier_id: true },
			orderBy: { _count: { courier_id: "desc" } },
			take: 5,
		});

		const courierPerformance = await Promise.all(
			topCouriers.map(async (c) => {
				if (c.courier_id === null) {
					return {
						courierName: "Unknown Courier",
						DELIVERED: 0,
						IN_TRANSIT: 0,
						RTO: 0,
						CANCELLED: 0,
					}; // Or handle as appropriate
				}
				const courier = await ctx.db.courier.findUnique({
					where: { id: c.courier_id },
					select: { name: true },
				});

				const statusCounts = await ctx.db.shipment.groupBy({
					by: ["current_status"],
					where: {
						user_id: userId,
						courier_id: c.courier_id,
						current_status: { not: null },
					},
					_count: { current_status: true },
				});

				const formattedStatusCounts = statusCounts.reduce(
					(acc, curr) => {
						acc[curr.current_status as SHIPMENT_STATUS] =
							curr._count.current_status;
						return acc;
					},
					{} as Record<SHIPMENT_STATUS, number>,
				);

				return {
					courierName: courier?.name || "Unknown Courier",
					...formattedStatusCounts,
				};
			}),
		);

		// Average Delivery Time (last 6 months)
		const avgDeliveryTime = await ctx.db.$queryRaw`
      SELECT
        TO_CHAR(created_at, 'Mon') as month,
        AVG(EXTRACT(EPOCH FROM (SELECT timestamp FROM "Tracking" WHERE "shipment_id" = s.shipment_id AND status_description = 'DELIVERED' LIMIT 1)) - EXTRACT(EPOCH FROM (SELECT timestamp FROM "Tracking" WHERE "shipment_id" = s.shipment_id AND status_description = 'PICKED_UP' LIMIT 1))) / (60 * 60 * 24) as "averageDeliveryTimeDays"
      FROM "Shipment" s
      WHERE user_id = ${userId} AND created_at >= ${sixMonthsAgo} AND current_status = 'DELIVERED'
      GROUP BY month
      ORDER BY MIN(created_at) ASC
    `;

		return {
			kpis,
			shipmentStatusDistribution: formattedShipmentStatusDistribution,
			shipmentsOverTime: formattedShipmentsOverTime,
			shippingCostsDeclaredValue: shippingCostsDeclaredValue as {
				month: string;
				totalShippingCost: number;
				totalDeclaredValue: number;
			}[],
			topDestinationStates: formattedTopDestinationStates,
			courierPerformance,
			averageDeliveryTime: avgDeliveryTime as {
				month: string;
				averageDeliveryTimeDays: number;
			}[],
		};
	}),
});
