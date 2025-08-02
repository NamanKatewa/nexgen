import { PrismaClient } from "@prisma/client";

import { seedCouriers } from "./seedCouriers";
import { seedRates } from "./seedRates";

const prisma = new PrismaClient();

async function main() {
	await seedRates();
	await seedCouriers();
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
