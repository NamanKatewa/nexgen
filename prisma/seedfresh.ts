import {
	BUSINESS_TYPE,
	PrismaClient,
	USER_ROLE,
	USER_STATUS,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import { seedRates } from "./seedRates";
import { seedCouriers } from "./seedCouriers";

const prisma = new PrismaClient();

async function seedAdminUser(hashedPassword: string) {
	console.log("\n--- Seeding Admin User ---");
	const adminUser = await prisma.user.upsert({
		where: { email: "namankatewa@gmail.com" },
		update: {},
		create: {
			email: "namankatewa@gmail.com",
			mobile_number: "9876543210",
			password_hash: hashedPassword,
			name: "Naman Katewa Admin",
			company_name: "NexGen Admin",
			monthly_order: "1000",
			business_type: BUSINESS_TYPE.Ecommerce,
			role: USER_ROLE.Admin,
			status: USER_STATUS.Active,
			created_at: faker.date.past(),
		},
	});
	console.log(`Created/Upserted Admin user with id: ${adminUser.user_id}`);
	return adminUser;
}

async function main() {
	console.log("Starting admin user seeding...");

	const password = "Tarzan678$";
	const hashedPassword = await bcrypt.hash(password, 10);

	await seedAdminUser(hashedPassword);

	console.log("Admin user seeding finished.");
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
