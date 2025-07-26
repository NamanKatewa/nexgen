import { SHIPMENT_STATUS } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userDashRouter = createTRPCRouter({
	getDashboardData: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.user.user_id;

		const userShipmentStatusStages = [
			SHIPMENT_STATUS.SHIPMENT_BOOKED,
			SHIPMENT_STATUS.IN_TRANSIT,
			SHIPMENT_STATUS.DELIVERED,
			SHIPMENT_STATUS.RTO,
			SHIPMENT_STATUS.CANCELLED,
		];

		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

		const sixMonthsAgoAvg = new Date();
		sixMonthsAgoAvg.setMonth(sixMonthsAgoAvg.getMonth() - 6);

		const [
			user,
			totalShipments,
			deliveredShipments,
			totalShippingCostResult,
			openSupportTickets,
			shipmentStatusCounts,
			shipmentsOverTime,
			shippingCostsDeclaredValue,
			topDestinationStatesRaw,
			topCouriers,
			shipmentsForAvgDelivery,
		] = await Promise.all([
			ctx.db.user.findUnique({
				where: { user_id: userId },
				include: { wallet: true },
			}),
			ctx.db.shipment.count({
				where: { user_id: userId },
			}),
			ctx.db.shipment.count({
				where: { user_id: userId, current_status: SHIPMENT_STATUS.DELIVERED },
			}),
			ctx.db.shipment.aggregate({
				where: { user_id: userId },
				_sum: { shipping_cost: true },
				_count: { shipping_cost: true },
			}),
			ctx.db.supportTicket.count({
				where: { user_id: userId, status: "Open" },
			}),
			ctx.db.shipment.groupBy({
				by: ["current_status"],
				where: {
					user_id: userId,
					current_status: { in: userShipmentStatusStages },
				},
				_count: { current_status: true },
			}),
			ctx.db.$queryRaw`
				SELECT
					DATE(created_at) as date,
					COUNT(*) as "shipmentCount"
				FROM "Shipment"
				WHERE user_id = ${userId} AND created_at >= ${thirtyDaysAgo}
				GROUP BY DATE(created_at)
				ORDER BY date ASC
			`,
			ctx.db.$queryRaw`
				SELECT
					TO_CHAR(created_at, 'Mon') as month,
					SUM(shipping_cost) as "totalShippingCost",
					SUM(declared_value) as "totalDeclaredValue"
				FROM "Shipment"
				WHERE user_id = ${userId} AND created_at >= ${sixMonthsAgo}
				GROUP BY month
				ORDER BY MIN(created_at) ASC
			`,
			ctx.db.shipment.groupBy({
				by: ["destination_address_id"],
				where: { user_id: userId },
				_count: { destination_address_id: true },
				orderBy: { _count: { destination_address_id: "desc" } },
				take: 5,
			}),
			ctx.db.shipment.groupBy({
				by: ["courier_id"],
				where: { user_id: userId, courier_id: { not: null } },
				_count: { courier_id: true },
				orderBy: { _count: { courier_id: "desc" } },
				take: 5,
			}),
			ctx.db.shipment.findMany({
				where: {
					user_id: userId,
					created_at: { gte: sixMonthsAgoAvg },
				},
				include: {
					tracking: {
						where: {
							status_description: { in: ["DELIVERED", "PICKED_UP"] },
						},
						select: { timestamp: true, status_description: true },
					},
				},
			}),
		]);

		if (!user) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
		}

		const avgShippingCost = totalShippingCostResult._sum.shipping_cost
			? totalShippingCostResult._sum.shipping_cost.toNumber() /
				totalShippingCostResult._count.shipping_cost
			: 0;

		const deliveredRate =
			totalShipments > 0 ? (deliveredShipments / totalShipments) * 100 : 0;

		const kpis = {
			walletBalance: user.wallet?.balance.toNumber() || 0,
			totalShipments,
			avgShippingCost: Number.parseFloat(avgShippingCost.toFixed(2)),
			deliveredRate: Number.parseFloat(deliveredRate.toFixed(2)),
			openSupportTickets,
		};

		const shipmentStatusDistribution = userShipmentStatusStages.map(
			(status) => {
				const found = shipmentStatusCounts.find(
					(s) => s.current_status === status,
				);
				return {
					status,
					count: found ? found._count.current_status : 0,
				};
			},
		);

		const formattedShipmentStatusDistribution = shipmentStatusDistribution.map(
			(s) => ({
				status: s.status as SHIPMENT_STATUS,
				count: s.count,
			}),
		);

		const formattedShipmentsOverTime = (
			shipmentsOverTime as { date: Date; shipmentCount: bigint }[]
		).map((s) => ({
			date: s.date.toISOString().split("T")[0],
			shipmentCount: Number(s.shipmentCount),
		}));

		const destinationAddressIds = topDestinationStatesRaw.map(
			(s) => s.destination_address_id,
		);
		const addresses = await ctx.db.address.findMany({
			where: { address_id: { in: destinationAddressIds } },
			select: { address_id: true, state: true },
		});
		const addressMap = new Map(
			addresses.map((address) => [address.address_id, address.state]),
		);

		const formattedTopDestinationStates = topDestinationStatesRaw.map((s) => ({
			state: addressMap.get(s.destination_address_id) || "Unknown",
			shipmentCount: s._count.destination_address_id,
		}));

		const relevantShipmentStatuses: SHIPMENT_STATUS[] = [
			SHIPMENT_STATUS.DELIVERED,
			SHIPMENT_STATUS.IN_TRANSIT,
			SHIPMENT_STATUS.RTO,
			SHIPMENT_STATUS.CANCELLED,
			SHIPMENT_STATUS.SHIPMENT_BOOKED,
		];

		const courierIds = topCouriers
			.map((c) => c.courier_id)
			.filter((id) => id !== null) as string[];
		const couriers = await ctx.db.courier.findMany({
			where: { id: { in: courierIds } },
			select: { id: true, name: true },
		});
		const courierMap = new Map(
			couriers.map((courier) => [courier.id, courier.name]),
		);

		const allCourierStatusCounts = await ctx.db.shipment.groupBy({
			by: ["courier_id", "current_status"],
			where: {
				user_id: userId,
				courier_id: { in: courierIds },
				current_status: { in: relevantShipmentStatuses },
			},
			_count: { current_status: true },
		});

		const courierPerformance = topCouriers.map((c) => {
			if (c.courier_id === null) {
				return {
					courierName: "Unknown Courier",
					DELIVERED: 0,
					IN_TRANSIT: 0,
					RTO: 0,
					CANCELLED: 0,
					SHIPMENT_BOOKED: 0,
				}; // Or handle as appropriate
			}

			const initialStatusCounts = relevantShipmentStatuses.reduce(
				(acc, status) => {
					acc[status] = 0;
					return acc;
				},
				{} as Record<SHIPMENT_STATUS, number>,
			);

			const courierSpecificCounts = allCourierStatusCounts.filter(
				(s) => s.courier_id === c.courier_id,
			);

			const formattedStatusCounts = courierSpecificCounts.reduce(
				(acc, curr) => {
					acc[curr.current_status as SHIPMENT_STATUS] =
						curr._count.current_status;
					return acc;
				},
				initialStatusCounts,
			);

			return {
				courierName: courierMap.get(c.courier_id) || "Unknown Courier",
				...formattedStatusCounts,
			};
		});

		const monthlyDeliveryTimes: Record<string, number[]> = {};

		for (const shipment of shipmentsForAvgDelivery) {
			const deliveredTracking = shipment.tracking.find(
				(t: { status_description: string; timestamp: Date }) =>
					t.status_description === "DELIVERED",
			);
			const pickedUpTracking = shipment.tracking.find(
				(t: { status_description: string; timestamp: Date }) =>
					t.status_description === "PICKED_UP",
			);

			if (deliveredTracking && pickedUpTracking) {
				const deliveryTimeMs =
					deliveredTracking.timestamp.getTime() -
					pickedUpTracking.timestamp.getTime();
				const deliveryTimeDays = deliveryTimeMs / (1000 * 60 * 60 * 24);

				const month = shipment.created_at.toISOString().substring(0, 7); // YYYY-MM
				if (!monthlyDeliveryTimes[month]) {
					monthlyDeliveryTimes[month] = [];
				}
				monthlyDeliveryTimes[month].push(deliveryTimeDays);
			}
		}

		const avgDeliveryTime = Object.keys(monthlyDeliveryTimes)
			.sort()
			.map((month) => ({
				month,
				averageDeliveryTimeDays: Number.parseFloat(
					(
						(monthlyDeliveryTimes[month] || []).reduce(
							(sum, time) => sum + time,
							0,
						) / (monthlyDeliveryTimes[month] || []).length
					).toFixed(2),
				),
			}));

		return {
			user: { name: user.name },
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
