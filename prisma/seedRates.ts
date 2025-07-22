import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	const weightSlabs = [0.5, 1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 45, 50];
	const zones = ["a", "b", "c", "d", "e"];

	const defaultRates = [];

	for (const weightSlab of weightSlabs) {
		for (const zone of zones) {
			let rate = 0;
			switch (zone) {
				case "a":
					rate = 50 + weightSlab * 8;
					break;
				case "b":
					rate = 60 + weightSlab * 10;
					break;
				case "c":
					rate = 70 + weightSlab * 12;
					break;
				case "d":
					rate = 80 + weightSlab * 15;
					break;
				case "e":
					rate = 90 + weightSlab * 18;
					break;
				default:
					rate = 0;
			}

			defaultRates.push({
				zone_from: "z",
				zone_to: zone,
				weight_slab: weightSlab,
				rate: Number.parseFloat(rate.toFixed(2)),
			});
		}
	}

	console.log(`Seeding ${defaultRates.length} default rates...`);

	for (const rateData of defaultRates) {
		await prisma.defaultRate.upsert({
			where: {
				zone_from_zone_to_weight_slab: {
					zone_from: rateData.zone_from,
					zone_to: rateData.zone_to,
					weight_slab: rateData.weight_slab,
				},
			},
			update: {
				rate: rateData.rate,
			},
			create: rateData,
		});
	}

	console.log("Default rates seeding complete.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
