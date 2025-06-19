import { env } from "~/env";

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
  payload: CreateOrderPayload
): Promise<IMBCreateOrderSuccessResponse> {
  const params = new URLSearchParams();

  for (const key in payload) {
    const value = payload[key as keyof CreateOrderPayload];
    if (value !== undefined) {
      params.append(key, String(value));
    }
  }

  const response = await fetch(`${env.IMB_API_URL}/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data: IMBCreateOrderResponse = await response.json();

  if (data.status !== true) {
    throw new Error(`IMB Error: ${data.message}`);
  }

  return data;
}
