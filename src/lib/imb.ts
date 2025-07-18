import { env } from "~/env";
import logger from "~/lib/logger";

interface CreateOrderPayload {
	customer_mobile: string;
	user_token: string;
	amount: number;
	order_id: string;
	redirect_url: string;
	remark1: string;
}

interface IMBCreateOrderSuccessResponse {
	status: true;
	message: string;
	result: {
		orderId: string;
		payment_url: string;
	};
}

interface IMBCreateOrderFailedResponse {
	status: "false";
	message: string;
}

type IMBCreateOrderResponse =
	| IMBCreateOrderSuccessResponse
	| IMBCreateOrderFailedResponse;

export async function createIMBPaymentOrder(
	payload: CreateOrderPayload,
): Promise<IMBCreateOrderSuccessResponse> {
	const params = new URLSearchParams();

	for (const key in payload) {
		const value = payload[key as keyof CreateOrderPayload];
		if (value !== undefined) {
			params.append(key, String(value));
		}
	}

	logger.info("Creating IMB payment order", { payload });

	const response = await fetch(`${env.IMB_API_URL}/create-order`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params.toString(),
	});

	const data: IMBCreateOrderResponse = await response.json();

	if (data.status !== true) {
		logger.error("IMB Error", { payload, response: data });
		throw new Error(`IMB Error: ${data.message}`);
	}

	logger.info("IMB payment order created successfully", {
		payload,
		response: data,
	});
	return data;
}

interface CheckOrderStatusPayload {
	order_id: string;
}

interface IMBCheckOrderStatusSuccessResponse {
	status: "COMPLETED";
	message: string;
	result: {
		status: "SUCCESS" | "PENDING" | "FAILED";
	};
}

interface IMBCheckOrderStatusFailedResponse {
	status: "ERROR";
	message: string;
}

type IMBCheckOrderStatusResponse =
	| IMBCheckOrderStatusSuccessResponse
	| IMBCheckOrderStatusFailedResponse;

export async function checkIMBOrderStatus(
	payload: CheckOrderStatusPayload,
): Promise<IMBCheckOrderStatusSuccessResponse> {
	const params = new URLSearchParams();
	params.append("user_token", env.IMB_TOKEN);
	params.append("order_id", payload.order_id);

	logger.info("Checking IMB order status", { payload });

	const response = await fetch(`${env.IMB_API_URL}/check-order-status`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params.toString(),
	});

	const data: IMBCheckOrderStatusResponse = await response.json();

	if (data.status !== "COMPLETED") {
		logger.error("IMB Order Status Check Error", { payload, response: data });
		throw new Error(`IMB Order Status Check Error: ${data.message}`);
	}

	logger.info("IMB order status checked successfully", {
		payload,
		response: data,
	});
	return data;
}
