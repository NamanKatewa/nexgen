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

interface GetOrderShipmentDetailsPayload {
	order_id: string;
}

interface ShipwayScan {
	time: string;
	status: string;
	location?: string;
}

interface GetOrderShipmentDetailsResponse {
	status: "Success" | "Failed";
	response?: {
		current_status: string;
		current_status_code: string;
		carrier: string;
		awbno: string;
		from?: string;
		to?: string;
		customer_name?: string;
		order_data?: string;
		pickup_date?: string;
		time?: string;
		scans?: ShipwayScan[];
	};
	message?: string;
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

export async function getOrderShipmentDetails(
	payload: GetOrderShipmentDetailsPayload,
): Promise<GetOrderShipmentDetailsResponse> {
	logger.info("Calling Shipway getOrderShipmentDetails API", payload);
	try {
		const shipwayResponse = await fetch(
			"https://shipway.in/api/getOrderShipmentDetails",
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
			logger.error("Shipway getOrderShipmentDetails API call failed", {
				status: shipwayResponse.status,
				errorText,
			});
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: `Failed to get order shipment details from Shipway: ${errorText}`,
			});
		}

		const responseData: GetOrderShipmentDetailsResponse =
			await shipwayResponse.json();
		logger.info("Shipway getOrderShipmentDetails API response", responseData);

		if (responseData.status !== "Success") {
			logger.error(
				"Shipway getOrderShipmentDetails API returned non-success status",
				responseData,
			);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: `Shipway reported an error: ${responseData.message || "Unknown error"}`,
			});
		}

		return responseData;
	} catch (error) {
		logger.error(
			"Error during Shipway getOrderShipmentDetails API call",
			error,
		);
		throw error;
	}
}
