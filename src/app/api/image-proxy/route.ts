import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const imageUrl = req.nextUrl.searchParams.get("url");

	if (!imageUrl) {
		return NextResponse.json(
			{ error: "Image URL is required" },
			{ status: 400 },
		);
	}

	try {
		const response = await fetch(imageUrl);

		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.statusText}`);
		}

		const contentType = response.headers.get("content-type");
		const imageBuffer = await response.arrayBuffer();

		const headers = new Headers();
		if (contentType) {
			headers.set("Content-Type", contentType);
		}
		headers.set("Access-Control-Allow-Origin", "*"); // Allow all origins for now, refine if needed

		return new NextResponse(Buffer.from(imageBuffer), { headers });
	} catch (error) {
		console.error("Image proxy error:", error);
		return NextResponse.json(
			{ error: "Failed to proxy image" },
			{ status: 500 },
		);
	}
}
