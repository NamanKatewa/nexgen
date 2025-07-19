import { TRPCError } from "@trpc/server";
import { env } from "~/env";
import logger from "~/lib/logger";

interface PushOrderDataPayload {
	carrier_id: string;
	awb: string;
	order_id: string;
	first_name: string;
	last_name: string;
	email: string;
	phone: string;
	products: string;
	company: string;
	shipment_type: string;
}

export async function pushOrderToShipway(payload: PushOrderDataPayload) {
	logger.info("Calling Shipway PushOrderData API", payload);
	try {
		const shipwayResponse = await fetch(
			"https://shipway.in/api/PushOrderData",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...payload,
					username: env.SHIPWAY_USERNAME,
					password: env.SHIPWAY_PASSWORD,
				}),
			},
		);

		if (!shipwayResponse.ok) {
			const errorText = await shipwayResponse.text();
			logger.error("Shipway API call failed", {
				status: shipwayResponse.status,
				errorText,
			});
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: `Failed to push order to Shipway: ${errorText}`,
			});
		}

		const responseData = await shipwayResponse.json();
		logger.info("Shipway API response", responseData);

		if (responseData.status !== "Success") {
			logger.error("Shipway API returned non-success status", responseData);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: `Shipway reported an error: ${responseData.message || "Unknown error"}`,
			});
		}

		return responseData;
	} catch (error) {
		logger.error("Error during Shipway API call", error);
		throw error;
	}
}
