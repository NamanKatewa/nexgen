import { NextResponse } from "next/server";
import logger from "~/lib/logger";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

export async function POST(req: Request) {
	try {
		const webhookData = await req.json();
		logger.info("Received Shipway webhook at proxy route", webhookData);

		const createContext = await createTRPCContext({
			headers: req.headers,
			req,
		});
		const caller = appRouter.createCaller(createContext);

		const result = await caller.tracking.receiveShipwayWebhook(webhookData);

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		logger.error("Error processing Shipway webhook at proxy route", {
			error: error instanceof Error ? error.message : error,
			stack: error instanceof Error ? error.stack : undefined,
		});
		return NextResponse.json(
			{ status: "error", message: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
