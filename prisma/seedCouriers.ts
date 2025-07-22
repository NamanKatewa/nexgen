import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("Seeding couriers...");
	const filePath = path.join(process.cwd(), "data", "couriers.json");

	const fileContent = await fs.readFile(filePath, "utf-8");
	const couriers = JSON.parse(fileContent);

	for (const courier of couriers) {
		await prisma.courier.upsert({
			where: { shipway_id: String(courier.id) },
			update: {},
			create: {
				shipway_id: String(courier.id),
				name: courier.courier_name,
				image_url: courier.image,
			},
		});
	}
	console.log("Couriers seeded successfully.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
