import { faker } from "@faker-js/faker";
import {
	BUSINESS_TYPE,
	PrismaClient,
	USER_ROLE,
	USER_STATUS,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	console.log("Start seeding...");

	const numberOfUsers = 10; // You can change this number

	for (let i = 0; i < numberOfUsers; i++) {
		const password = faker.internet.password();
		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await prisma.user.create({
			data: {
				email: faker.internet.email(),
				mobile_number: faker.phone.number({ style: "national" }),
				password_hash: hashedPassword,
				name: faker.person.fullName(),
				company_name: faker.company.name(),
				monthly_order: faker.string.numeric(4),
				business_type: faker.helpers.arrayElement(Object.values(BUSINESS_TYPE)),
				role: faker.helpers.arrayElement([
					USER_ROLE.Client,
					USER_ROLE.Admin,
					USER_ROLE.Employee,
				]),
				status: faker.helpers.arrayElement(Object.values(USER_STATUS)),
			},
		});
		console.log(`Created user with id: ${user.user_id}`);

		// Create a KYC entry for the user
		await prisma.kyc.create({
			data: {
				user_id: user.user_id,
				kyc_status: faker.helpers.arrayElement([
					"Pending",
					"Submitted",
					"Approved",
					"Rejected",
				]),
				submission_date: faker.date.past(),
				// Optional fields, only include some for variety
				...(faker.datatype.boolean() && { entity_name: faker.company.name() }),
				...(faker.datatype.boolean() && {
					entity_type: faker.helpers.arrayElement([
						"Individual",
						"SelfEmployement",
						"ProprietorshipFirm",
						"LimitedLiabilityParternship",
						"PrivateLimitedCompany",
						"PublicLimitedCompany",
						"PartnershipFirm",
					]),
				}),
				...(faker.datatype.boolean() && { website_url: faker.internet.url() }),
				...(faker.datatype.boolean() && {
					aadhar_number: faker.string.numeric(12),
				}),
				...(faker.datatype.boolean() && {
					aadhar_image_front: faker.image.url(),
				}),
				...(faker.datatype.boolean() && {
					aadhar_image_back: faker.image.url(),
				}),
				...(faker.datatype.boolean() && {
					pan_number: faker.string.alphanumeric(10).toUpperCase(),
				}),
				...(faker.datatype.boolean() && { pan_image_front: faker.image.url() }),
				...(faker.datatype.boolean() && { pan_image_back: faker.image.url() }),
				...(faker.datatype.boolean() && { gst: faker.datatype.boolean() }),
				...(faker.helpers.arrayElement(["Approved", "Rejected"]) && {
					verification_date: faker.date.recent(),
				}),
				...(faker.helpers.arrayElement(["Rejected"]) && {
					rejection_reason: faker.lorem.sentence(),
				}),
			},
		});
		console.log(`Created KYC for user ${user.user_id}`);

		// Create a Wallet for the user
		const wallet = await prisma.wallet.create({
			data: {
				user_id: user.user_id,
				balance: faker.finance.amount({ min: 0, max: 10000, dec: 2 }),
			},
		});
		console.log(
			`Created wallet with id: ${wallet.wallet_id} for user ${user.user_id}`,
		);

		// Create some Transactions for the wallet
		const numberOfTransactions = faker.number.int({ min: 1, max: 5 });
		for (let j = 0; j < numberOfTransactions; j++) {
			await prisma.transaction.create({
				data: {
					wallet_id: wallet.wallet_id,
					user_id: user.user_id,
					transaction_type: faker.helpers.arrayElement(["Credit", "Debit"]),
					amount: faker.finance.amount({ min: 10, max: 1000, dec: 2 }),
					transaction_date: faker.date.past(),
					payment_status: faker.helpers.arrayElement([
						"Pending",
						"Completed",
						"Failed",
					]),
				},
			});
		}
		console.log(
			`Created ${numberOfTransactions} transactions for wallet ${wallet.wallet_id}`,
		);
	}

	console.log("Seeding finished.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
