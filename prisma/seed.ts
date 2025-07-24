import fs from "node:fs/promises";
import path from "node:path";
import { faker } from "@faker-js/faker";
import {
	ADDRESS_TYPE,
	type Address,
	BUSINESS_TYPE,
	type Courier,
	EMPLOYEE_STATUS,
	ENTITY_TYPE,
	KYC_STATUS,
	PAYMENT_STATUS,
	PrismaClient,
	SHIPMENT_APPROVAL_STATUS,
	SHIPMENT_PAYMENT_STATUS,
	SHIPMENT_STATUS,
	SUPPORT_PRIORITY,
	SUPPORT_STATUS,
	type Shipment,
	TRANSACTION_TYPE,
	type Transaction,
	USER_ROLE,
	USER_STATUS,
	type User,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { seedCouriers } from "./seedCouriers";
import { seedRates } from "./seedRates";

const prisma = new PrismaClient();

// --- Helper Functions ---

// Function to generate a dummy base64 image
function generateBase64Image(): {
	data: string;
	name: string;
	type: string;
	size: number;
} {
	const width = faker.number.int({ min: 100, max: 500 });
	const height = faker.number.int({ min: 100, max: 500 });
	const color = faker.color.rgb({
		format: "hex",
		prefix: "",
	});
	const base64Data = `data:image/svg+xml;base64,${Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#${color}"/></svg>`,
	).toString("base64")}`;

	return {
		data: base64Data,
		name: `${faker.system.fileName()}.svg`, // Use faker.system.fileName() and append extension
		type: "image/svg+xml",
		size: base64Data.length, // Approximation
	};
}

// Function to generate a dummy base64 file (for invoices)
function generateBase64File(): {
	data: string;
	name: string;
	type: string;
	size: number;
} {
	const content = faker.lorem.paragraph();
	const base64Data = `data:text/plain;base64,${Buffer.from(content).toString(
		"base64",
	)}`;

	return {
		data: base64Data,
		name: `${faker.system.fileName()}.txt`, // Use faker.system.fileName() and append extension
		type: "text/plain",
		size: base64Data.length, // Approximation
	};
}

// Pincode data
interface PincodeDetails {
	city: string;
	state: string;
}

let pincodeMap: Map<string, PincodeDetails>;

async function loadPincodeMap() {
	console.log("Attempting to load pincode map...");
	if (pincodeMap) {
		console.log("Pincode map already loaded.");
		return;
	}
	const filePath = path.join(process.cwd(), "data", "pincode_map.json");
	console.log(`Pincode map file path: ${filePath}`);
	try {
		const fileContent = await fs.readFile(filePath, "utf-8");
		const parsedData: { [key: string]: PincodeDetails } =
			JSON.parse(fileContent);
		pincodeMap = new Map(
			Object.entries(parsedData).map(([pincode, details]) => [
				pincode,
				{
					city:
						typeof details.city === "string" ? details.city.toLowerCase() : "",
					state:
						typeof details.state === "string"
							? details.state.toLowerCase()
							: "",
				},
			]),
		);
		console.log("Pincode map loaded successfully.");
	} catch (error) {
		console.error("Error loading pincode map:", error);
		throw error; // Re-throw to ensure main() catch block is hit
	}
}

function getPincodeDetails(pincode: string): PincodeDetails | undefined {
	return pincodeMap.get(pincode);
}

function getZone(
	origin: PincodeDetails | undefined,
	destination: PincodeDetails | undefined,
): string {
	if (!origin?.city || !destination?.city) {
		return "d";
	}
	if (origin.city.toLowerCase() === destination.city.toLowerCase()) {
		return "a";
	}

	if (!origin.state || !destination.state) {
		return "d";
	}

	if (origin.state.toLowerCase() === destination.state.toLowerCase()) {
		return "b";
	}

	const neighbors: Record<string, string[]> = {
		"andhra pradesh": [
			"telangana",
			"chhattisgarh",
			"odisha",
			"tamil nadu",
			"karnataka",
		],
		"arunachal pradesh": ["assam", "nagaland"],
		assam: [
			"arunachal pradesh",
			"nagaland",
			"manipur",
			"meghalaya",
			"mizoram",
			"tripura",
			"west bengal",
		],
		bihar: ["uttar pradesh", "jharkhand", "west bengal"],
		chhattisgarh: [
			"madhya pradesh",
			"maharashtra",
			"telangana",
			"andhra pradesh",
			"odisha",
			"jharkhand",
			"uttar pradesh",
		],
		goa: ["maharashtra", "karnataka"],
		gujarat: [
			"rajasthan",
			"madhya pradesh",
			"maharashtra",
			"dadra and nagar haveli and daman and diu",
		],
		haryana: [
			"punjab",
			"himachal pradesh",
			"uttarakhand",
			"uttar pradesh",
			"rajasthan",
			"delhi",
		],
		"himachal pradesh": [
			"jammu and kashmir",
			"ladakh",
			"punjab",
			"haryana",
			"uttarakhand",
		],
		jharkhand: [
			"bihar",
			"west bengal",
			"odisha",
			"chhattisgarh",
			"uttar pradesh",
		],
		karnataka: [
			"goa",
			"maharashtra",
			"telangana",
			"andhra pradesh",
			"tamil nadu",
			"kerala",
		],
		kerala: ["karnataka", "tamil nadu"],
		"madhya pradesh": [
			"uttar pradesh",
			"chhattisgarh",
			"maharashtra",
			"gujarat",
			"rajasthan",
		],
		maharashtra: [
			"gujarat",
			"madhya pradesh",
			"chhattisgarh",
			"telangana",
			"karnataka",
			"goa",
		],
		manipur: ["nagaland", "mizoram", "assam"],
		meghalaya: ["assam"],
		mizoram: ["assam", "manipur", "tripura"],
		nagaland: ["assam", "arunachal pradesh", "manipur"],
		odisha: ["west bengal", "jharkhand", "chhattisgarh", "andhra pradesh"],
		punjab: ["jammu and kashmir", "himachal pradesh", "haryana", "rajasthan"],
		rajasthan: [
			"punjab",
			"haryana",
			"uttar pradesh",
			"madhya pradesh",
			"gujarat",
		],
		sikkim: ["west bengal"],
		"tamil nadu": ["andhra pradesh", "karnataka", "kerala"],
		telangana: ["maharashtra", "chhattisgarh", "andhra pradesh", "karnataka"],
		tripura: ["assam", "mizoram"],
		"uttar pradesh": [
			"uttarakhand",
			"himachal pradesh",
			"haryana",
			"delhi",
			"rajasthan",
			"madhya pradesh",
			"chhattisgarh",
			"jharkhand",
			"bihar",
		],
		uttarakhand: ["himachal pradesh", "uttar pradesh", "haryana"],
		"west bengal": ["bihar", "jharkhand", "odisha", "sikkim", "assam"],
		"andaman and nicobar islands": [],
		chandigarh: ["punjab", "haryana"],
		"dadra and nagar haveli and daman and diu": ["gujarat", "maharashtra"],
		delhi: ["haryana", "uttar pradesh"],
		"jammu and kashmir": ["ladakh", "himachal pradesh", "punjab"],
		ladakh: ["jammu and kashmir", "himachal pradesh"],
		lakshadweep: [],
		puducherry: ["tamil nadu"],
	};

	if (
		neighbors[origin.state.toLowerCase()]?.includes(
			destination.state.toLowerCase(),
		)
	) {
		return "b";
	}

	const metroCities = [
		"mumbai",
		"bengaluru",
		"chennai",
		"delhi",
		"hyderabad",
		"kolkata",
		"ahmedabad",
		"pune",
		"surat",
	];

	const isOriginMetro = metroCities.includes(origin.city.toLowerCase());
	const isDestinationMetro = metroCities.includes(
		destination.city.toLowerCase(),
	);

	if (isOriginMetro && isDestinationMetro) {
		return "c";
	}

	const specialZoneEStates = [
		"jammu and kashmir",
		"ladakh",
		"arunachal pradesh",
		"assam",
		"manipur",
		"meghalaya",
		"mizoram",
		"nagaland",
		"sikkim",
		"tripura",
	];

	if (specialZoneEStates.includes(destination.state.toLowerCase())) {
		return "e";
	}

	return "d";
}

function interpolateRate(
	lower: { rate: number; weight_slab: number },
	upper: { rate: number; weight_slab: number },
	packageWeight: number,
): number {
	const rateDiff = upper.rate - lower.rate;
	const weightDiff = upper.weight_slab - lower.weight_slab;

	if (weightDiff <= 0) {
		return (lower.rate / lower.weight_slab) * packageWeight;
	}

	const ratePerKgInRange = rateDiff / weightDiff;
	const weightAboveLower = packageWeight - lower.weight_slab;
	return lower.rate + weightAboveLower * ratePerKgInRange;
}

async function findRateSimulated({
	zoneFrom,
	zoneTo,
	weightSlab,
	packageWeight,
}: {
	zoneFrom: string;
	zoneTo: string;
	weightSlab: number;
	packageWeight: number;
}) {
	const defaultZoneFromMap = defaultRatesCache.get(zoneFrom);
	if (defaultZoneFromMap) {
		const defaultZoneToMap = defaultZoneFromMap.get(zoneTo);
		if (defaultZoneToMap) {
			const exactDefaultRate = defaultZoneToMap.get(weightSlab);
			if (exactDefaultRate) return exactDefaultRate.rate;

			const defaultRatesForZone = Array.from(defaultZoneToMap.values());
			const lowerDefault = defaultRatesForZone
				.filter((r) => r.weight_slab < weightSlab)
				.sort((a, b) => b.weight_slab - a.weight_slab)[0];
			const upperDefault = defaultRatesForZone
				.filter((r) => r.weight_slab > weightSlab)
				.sort((a, b) => a.weight_slab - b.weight_slab)[0];

			if (lowerDefault && upperDefault) {
				return interpolateRate(lowerDefault, upperDefault, packageWeight);
			}
			if (lowerDefault) {
				return (lowerDefault.rate / lowerDefault.weight_slab) * packageWeight;
			}
		}
	}

	return 0; // Should not happen if default rates are properly seeded
}

function calculateInsurancePremiumSimulated(
	actualRate: number,
	isInsuranceSelected?: boolean,
): { insurancePremium: number; compensationAmount: number } {
	let insurancePremium = 0;
	let compensationAmount = 0;

	// Simplified logic for seeding, assuming valid rates are passed
	// In real app, TRPCError would be thrown for invalid rates or mandatory insurance

	if (isInsuranceSelected) {
		if (actualRate >= 1 && actualRate <= 2499) {
			insurancePremium = 100;
			compensationAmount = actualRate; // 100% of actual rate
		} else if (actualRate >= 2500 && actualRate <= 5000) {
			insurancePremium = 100;
			compensationAmount = actualRate * 0.8; // 80% of actual rate
		} else if (actualRate >= 5001 && actualRate <= 12999) {
			insurancePremium = actualRate * 0.02; // 2% of actual rate
			compensationAmount = actualRate * 0.8; // 80% of actual rate
		} else if (actualRate >= 13000 && actualRate <= 21999) {
			const premiumPercentage =
				0.021 + (0.029 - 0.021) * ((actualRate - 13000) / (21999 - 13000));
			const coveragePercentage =
				0.58 + (0.78 - 0.58) * ((actualRate - 13000) / (21999 - 13000));
			insurancePremium = actualRate * premiumPercentage;
			compensationAmount = actualRate * coveragePercentage;
		} else if (actualRate >= 22000 && actualRate <= 26999) {
			insurancePremium = actualRate * 0.03; // 3%
			const coveragePercentage =
				0.51 + (0.55 - 0.51) * ((actualRate - 22000) / (26999 - 22000));
			compensationAmount = actualRate * coveragePercentage;
		} else if (actualRate >= 27000 && actualRate <= 49999) {
			insurancePremium = actualRate * 0.03; // 3% of actual rate
			compensationAmount = actualRate * 0.5; // 50% of actual rate
		}
	}

	return { insurancePremium, compensationAmount };
}

function generateShipmentId(userId: string): string {
	const prefix = "NEX";
	const timePart = Date.now().toString(); // Use full timestamp
	const userPart = userId.slice(-4).toUpperCase(); // Use a larger slice of user ID
	const randomPart = faker.string.alphanumeric(6).toUpperCase(); // Increase random part length
	return `${prefix}${timePart}${userPart}${randomPart}`;
}

function generateUuid(): string {
	return uuidv4();
}

// --- Seeding Functions ---

async function seedUsers(hashedPassword: string, numberOfRandomUsers: number) {
	console.log("\n--- Seeding Users ---");
	// Create default admin user
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

	// Create default client user
	const clientUser = await prisma.user.upsert({
		where: { email: "namankatewa2004@gmail.com" },
		update: {},
		create: {
			email: "namankatew2004@gmail.com",
			mobile_number: "1234567890",
			password_hash: hashedPassword,
			name: "Naman Katewa Client",
			company_name: "NexGen Client",
			monthly_order: "500",
			business_type: BUSINESS_TYPE.Retailer,
			role: USER_ROLE.Client,
			status: USER_STATUS.Active,
			created_at: faker.date.past(),
		},
	});
	console.log(`Created/Upserted Client user with id: ${clientUser.user_id}`);

	// Prepare data for employee and random users
	const usersToCreate = [];

	// Employee user data
	const employeeUserData = {
		email: faker.internet.email(),
		mobile_number: faker.string.numeric(10),
		password_hash: hashedPassword,
		name: faker.person.fullName(),
		company_name: faker.company.name(),
		monthly_order: faker.string.numeric(3),
		business_type: faker.helpers.arrayElement(Object.values(BUSINESS_TYPE)),
		role: USER_ROLE.Employee,
		status: USER_STATUS.Active,
		created_at: faker.date.past(),
	};
	usersToCreate.push(employeeUserData);

	// Random users data
	for (let i = 0; i < numberOfRandomUsers; i++) {
		usersToCreate.push({
			email: faker.internet.email(),
			mobile_number: faker.string.numeric(10),
			password_hash: hashedPassword,
			name: faker.person.fullName(),
			company_name: faker.company.name(),
			monthly_order: faker.string.numeric(4),
			business_type: faker.helpers.arrayElement(Object.values(BUSINESS_TYPE)),
			role: USER_ROLE.Client,
			status: faker.helpers.arrayElement(Object.values(USER_STATUS)),
			created_at: faker.date.past(),
		});
	}

	// Batch create users
	await prisma.user.createMany({
		data: usersToCreate,
		skipDuplicates: true, // In case any generated email clashes with existing ones
	});
	console.log(`Created ${usersToCreate.length} new users.`);

	// Fetch the newly created employee and random users
	// This is a workaround as createMany does not return the created records.
	// We fetch them based on their unique emails.
	const createdUsers = await prisma.user.findMany({
		where: {
			email: {
				in: usersToCreate.map((u) => u.email),
			},
		},
	});

	const employeeUser: User | undefined = createdUsers.find(
		(u) => u.role === USER_ROLE.Employee,
	);
	if (!employeeUser) {
		throw new Error(
			"Employee user not found after batch creation. This should not happen.",
		);
	}
	await prisma.employee.create({
		data: {
			user_id: employeeUser.user_id,
			employee_code: faker.string.alphanumeric(10).toUpperCase(),
			designation: faker.person.jobTitle(),
			department: faker.commerce.department(),
			hire_date: faker.date.past(),
			status: EMPLOYEE_STATUS.Active,
		},
	});
	console.log(`Created Employee with id: ${employeeUser.user_id}`);

	const randomUsers = createdUsers.filter((u) => u.role === USER_ROLE.Client);

	return { adminUser, clientUser, employeeUser, randomUsers };
}

async function seedWalletsAndTransactions(users: User[]) {
	console.log("\n--- Seeding Wallets and Transactions ---");

	const existingWallets = await prisma.wallet.findMany({
		where: { user_id: { in: users.map((u) => u.user_id) } },
		select: { user_id: true },
	});

	const existingWalletUserIds = new Set(existingWallets.map((w) => w.user_id));

	const walletsToCreate = users
		.filter((user) => !existingWalletUserIds.has(user.user_id))
		.map((user) => ({
			user_id: user.user_id,
			balance: new Decimal(
				faker.finance.amount({ min: 0, max: 10000, dec: 2 }),
			),
			created_at: faker.date.past(),
		}));

	if (walletsToCreate.length > 0) {
		await prisma.wallet.createMany({ data: walletsToCreate });
		console.log(`Created ${walletsToCreate.length} new wallets.`);
	}

	const transactionsToCreate = [];
	for (const user of users) {
		const numberOfTransactions = faker.number.int({ min: 50, max: 100 });
		for (let j = 0; j < numberOfTransactions; j++) {
			transactionsToCreate.push({
				user_id: user.user_id,
				transaction_type: faker.helpers.arrayElement(
					Object.values(TRANSACTION_TYPE),
				),
				amount: new Decimal(
					faker.finance.amount({ min: 100, max: 10000, dec: 2 }),
				),
				created_at: faker.date.past(),
				payment_status: faker.helpers.arrayElement(
					Object.values(PAYMENT_STATUS),
				),
				description: faker.lorem.sentence(),
			});
		}
	}

	if (transactionsToCreate.length > 0) {
		await prisma.transaction.createMany({ data: transactionsToCreate });
		console.log(`Created ${transactionsToCreate.length} transactions.`);
	}
}

async function seedAddresses(users: User[], allPincodes: string[]) {
	console.log("\n--- Seeding Addresses ---");
	const addressesToCreate = [];
	const userAddressesMap = new Map<string, Address[]>();

	for (const user of users) {
		const numberOfAddresses = faker.number.int({ min: 10, max: 50 });
		for (let j = 0; j < numberOfAddresses; j++) {
			const randomPincode = faker.helpers.arrayElement(allPincodes);
			const pincodeDetails = getPincodeDetails(randomPincode);

			if (pincodeDetails) {
				addressesToCreate.push({
					user_id: user.user_id,
					zip_code: Number.parseInt(randomPincode),
					city: pincodeDetails.city,
					state: pincodeDetails.state,
					address_line: faker.location.streetAddress(),
					name: faker.person.fullName(),
					type: ADDRESS_TYPE.User,
				});
			}
		}
	}

	if (addressesToCreate.length > 0) {
		await prisma.address.createMany({ data: addressesToCreate });
		console.log(`Created ${addressesToCreate.length} new addresses.`);

		// Fetch all created addresses to populate the map with actual IDs
		const createdAddresses = await prisma.address.findMany({
			where: {
				user_id: { in: users.map((u) => u.user_id) },
			},
		});

		for (const user of users) {
			const userSpecificAddresses = createdAddresses.filter(
				(addr) => addr.user_id === user.user_id,
			);
			userAddressesMap.set(user.user_id, userSpecificAddresses);
		}
	}

	return userAddressesMap;
}

async function seedKYC(users: User[], adminUser: User, allPincodes: string[]) {
	console.log("\n--- Seeding KYC Records ---");
	const kycAddressesToCreate = [];
	const kycRecordsToCreate = [];

	for (const user of users) {
		const kycStatus = faker.helpers.arrayElement(Object.values(KYC_STATUS));
		const randomPincode = faker.helpers.arrayElement(allPincodes);
		const pincodeDetails = getPincodeDetails(randomPincode);

		if (pincodeDetails) {
			const tempAddressId = uuidv4(); // Temporary ID for linking before actual creation
			kycAddressesToCreate.push({
				address_id: tempAddressId,
				user_id: user.user_id,
				zip_code: Number.parseInt(randomPincode),
				city: pincodeDetails.city,
				state: pincodeDetails.state,
				address_line: faker.location.streetAddress(),
				name: "KYC Billing Address",
				type: ADDRESS_TYPE.Warehouse,
			});

			kycRecordsToCreate.push({
				user_id: user.user_id,
				entity_name: faker.company.name(),
				entity_type: faker.helpers.arrayElement(Object.values(ENTITY_TYPE)),
				website_url: faker.internet.url(),
				address_id: pincodeDetails ? tempAddressId : null, // Set to null if no pincode details
				aadhar_number: faker.string.numeric(12),
				aadhar_image_front: generateBase64Image().data,
				aadhar_image_back: generateBase64Image().data,
				pan_number: faker.string.alphanumeric(10).toUpperCase(),
				pan_image_front: generateBase64Image().data,
				gst: faker.datatype.boolean(),
				kyc_status: kycStatus,
				submission_date: faker.date.past(),
				verification_date:
					kycStatus === KYC_STATUS.Approved || kycStatus === KYC_STATUS.Rejected
						? faker.date.past()
						: null,
				verified_by_user_id:
					kycStatus === KYC_STATUS.Approved ? adminUser.user_id : null,
				rejection_reason:
					kycStatus === KYC_STATUS.Rejected ? faker.lorem.sentence() : null,
			});
		}
	}

	// Batch create addresses
	if (kycAddressesToCreate.length > 0) {
		await prisma.address.createMany({ data: kycAddressesToCreate });
		console.log(`Created ${kycAddressesToCreate.length} KYC addresses.`);
	}

	// Batch create KYC records
	if (kycRecordsToCreate.length > 0) {
		await prisma.kyc.createMany({ data: kycRecordsToCreate });
		console.log(`Created ${kycRecordsToCreate.length} KYC records.`);
	}
}

async function seedShipments(
	users: User[],
	allPincodes: string[],
	allCouriers: Courier[],
	userAddressesMap: Map<string, Address[]>,
) {
	console.log("\n--- Seeding Shipments ---");

	const shipmentsToCreate: Shipment[] = [];
	const transactionsToCreate: Transaction[] = [];
	const walletBalances: Map<string, Decimal> = new Map(); // Map<user_id, current_balance>

	// Pre-fetch all wallets and populate initial balances
	const wallets = await prisma.wallet.findMany({
		where: { user_id: { in: users.map((u) => u.user_id) } },
	});
	for (const w of wallets) {
		walletBalances.set(w.user_id, w.balance);
	}

	for (const user of users) {
		console.log(`  Seeding shipments for user: ${user.email}...`);
		const userAddresses = userAddressesMap.get(user.user_id) || [];
		if (userAddresses.length >= 2) {
			const numberOfShipments = faker.number.int({ min: 20, max: 100 });
			let currentBalance = walletBalances.get(user.user_id);

			if (currentBalance === undefined) {
				console.warn(
					`Wallet not found for user ${user.user_id}. Skipping shipment creation.`,
				);
				continue;
			}

			for (let k = 0; k < numberOfShipments; k++) {
				const originAddress = faker.helpers.arrayElement(userAddresses);
				const destinationAddress = faker.helpers.arrayElement(
					userAddresses.filter(
						(addr) => addr.address_id !== originAddress.address_id,
					),
				);

				if (!destinationAddress) continue;

				const originPincodeDetails = getPincodeDetails(
					String(originAddress.zip_code),
				);
				const destinationPincodeDetails = getPincodeDetails(
					String(destinationAddress.zip_code),
				);

				if (!originPincodeDetails || !destinationPincodeDetails) continue;

				const zone = getZone(originPincodeDetails, destinationPincodeDetails);
				const packageWeight = faker.finance.amount({ min: 1, max: 50, dec: 2 });
				const weightSlab = Math.ceil(Number(packageWeight) * 2) / 2;

				const shippingCost = await findRateSimulated({
					zoneFrom: "z",
					zoneTo: zone,
					weightSlab: weightSlab,
					packageWeight: Number(packageWeight),
				});

				const isInsuranceSelected = faker.datatype.boolean();
				const { insurancePremium, compensationAmount } =
					calculateInsurancePremiumSimulated(
						Number(shippingCost),
						isInsuranceSelected,
					);

				const totalCost = new Decimal(shippingCost).add(
					new Decimal(insurancePremium),
				);

				// Simulate wallet top-up if needed
				if (currentBalance.lessThan(totalCost)) {
					const topUpAmount = totalCost
						.minus(currentBalance)
						.add(
							new Decimal(faker.finance.amount({ min: 100, max: 500, dec: 2 })),
						);

					transactionsToCreate.push({
						transaction_id: generateUuid(),
						user_id: user.user_id,
						transaction_type: TRANSACTION_TYPE.Credit,
						amount: topUpAmount,
						payment_status: PAYMENT_STATUS.Completed,
						description: "Wallet top-up for shipment (simulated)",
						created_at: faker.date.past(),
						shipment_id: null, // Explicitly set to null for non-shipment transactions
					});
					currentBalance = currentBalance.add(topUpAmount);
				}

				// Simulate wallet debit
				const shipmentUuid = generateUuid(); // Generate UUID for shipment_id

				transactionsToCreate.push({
					transaction_id: generateUuid(), // Added transaction_id
					user_id: user.user_id,
					transaction_type: TRANSACTION_TYPE.Debit,
					amount: totalCost,
					payment_status: PAYMENT_STATUS.Completed,
					description: "Shipment cost debit (simulated)",
					created_at: faker.date.past(),
					shipment_id: shipmentUuid, // Use the generated UUID
				});
				currentBalance = currentBalance.minus(totalCost);

				// Update the balance in the map for the next iteration for this user
				walletBalances.set(user.user_id, currentBalance);

				const randomCourier = faker.helpers.arrayElement(allCouriers); // Moved declaration here

				shipmentsToCreate.push({
					shipment_id: shipmentUuid, // Use the generated UUID
					human_readable_shipment_id: generateShipmentId(user.user_id),
					user_id: user.user_id,
					courier_id: randomCourier.id, // Added courier_id
					awb_number: faker.string.numeric(12),
					current_status: faker.helpers.arrayElement(
						Object.values(SHIPMENT_STATUS),
					), // Added current_status
					payment_status: SHIPMENT_PAYMENT_STATUS.Paid,
					shipment_status: faker.helpers.arrayElement(
						Object.values(SHIPMENT_APPROVAL_STATUS),
					),
					rejection_reason:
						faker.datatype.boolean() && SHIPMENT_APPROVAL_STATUS.Rejected
							? faker.lorem.sentence()
							: null,
					origin_address_id: originAddress.address_id,
					destination_address_id: destinationAddress.address_id,
					recipient_name: faker.person.fullName(),
					recipient_mobile: faker.string.numeric(10),
					package_image_url: generateBase64Image().data,
					package_weight: new Decimal(packageWeight),
					package_dimensions: `${faker.number.int({
						min: 10,
						max: 100,
					})}x${faker.number.int({ min: 10, max: 100 })}x${faker.number.int({
						min: 10,
						max: 100,
					})}`,
					shipping_cost: new Decimal(shippingCost),
					label_url: faker.internet.url(),
					declared_value: new Decimal(
						faker.finance.amount({
							min: 100,
							max: 49999,
							dec: 2,
						}),
					),
					is_insurance_selected: isInsuranceSelected,
					insurance_premium: new Decimal(insurancePremium),
					compensation_amount: new Decimal(compensationAmount),
					invoiceUrl: isInsuranceSelected ? generateBase64File().data : null,
					created_at: faker.date.past(), // Added created_at
					updated_at: faker.date.past(), // Added updated_at
				});
			}
		} else {
			console.log(
				`Skipping shipment creation for user ${user.user_id} due to insufficient addresses.`,
			);
		}
	}

	// Prepare wallet update operations
	const walletUpdateOperations = Array.from(walletBalances.entries()).map(
		([userId, newBalance]) =>
			prisma.wallet.updateMany({
				where: { user_id: userId },
				data: { balance: newBalance },
			}),
	);

	// Execute all collected operations in a single transaction
	if (shipmentsToCreate.length > 0 || transactionsToCreate.length > 0) {
		await prisma.$transaction([
			prisma.shipment.createMany({ data: shipmentsToCreate }),
			prisma.transaction.createMany({ data: transactionsToCreate }),
			...walletUpdateOperations,
		]);
		console.log(
			`Created ${shipmentsToCreate.length} shipments and ${transactionsToCreate.length} transactions.`,
		);
	}

	// Fetch the created shipments to return them (createMany doesn't return records)
	// This might be inefficient if there are many shipments, but necessary if the return value is used.
	// For seeding, it might be acceptable.
	const createdShipments = await prisma.shipment.findMany({
		where: {
			human_readable_shipment_id: {
				in: shipmentsToCreate.map((s) => s.human_readable_shipment_id),
			},
		},
	});

	return createdShipments;
}

async function seedTracking(shipments: Shipment[], allCouriers: Courier[]) {
	console.log("\n--- Seeding Tracking Records ---");
	if (allCouriers.length === 0) {
		console.warn(
			"No couriers found to create tracking records. Skipping tracking seeding.",
		);
		return;
	}

	const trackingRecordsToCreate = [];
	for (const shipment of shipments) {
		const randomCourier = faker.helpers.arrayElement(allCouriers);
		const numberOfTrackingUpdates = faker.number.int({ min: 5, max: 15 });
		for (let l = 0; l < numberOfTrackingUpdates; l++) {
			trackingRecordsToCreate.push({
				shipment_id: shipment.shipment_id,
				courier_id: randomCourier.id,
				timestamp: faker.date.past(),
				location: faker.location.city() || "Unknown Location",
				status_description: faker.lorem.sentence(),
			});
		}
	}

	if (trackingRecordsToCreate.length > 0) {
		await prisma.tracking.createMany({ data: trackingRecordsToCreate });
		console.log(`Created ${trackingRecordsToCreate.length} tracking updates.`);
	}
}

async function seedSupportTickets(users: User[], employeeUser: User) {
	console.log("\n--- Seeding Support Tickets ---");
	const supportTicketsToCreate = [];
	for (const user of users) {
		const numberOfTickets = faker.number.int({ min: 0, max: 15 });
		for (let m = 0; m < numberOfTickets; m++) {
			supportTicketsToCreate.push({
				user_id: user.user_id,
				subject: faker.lorem.sentence(5),
				description: faker.lorem.paragraph(),
				status: faker.helpers.arrayElement(Object.values(SUPPORT_STATUS)),
				priority: faker.helpers.arrayElement(Object.values(SUPPORT_PRIORITY)),
				resolved_at:
					faker.helpers.arrayElement(Object.values(SUPPORT_STATUS)) ===
					SUPPORT_STATUS.Closed
						? faker.date.past()
						: null,
				created_at: faker.date.past(),
			});
		}
	}

	if (supportTicketsToCreate.length > 0) {
		await prisma.supportTicket.createMany({ data: supportTicketsToCreate });
		console.log(`Created ${supportTicketsToCreate.length} support tickets.`);
	}
}

// --- Main Seeding Function ---
type RateData = {
	rate: number;
	weight_slab: number;
};

type DefaultRatesMap = Map<string, Map<string, Map<number, RateData>>>; // zone_from -> zone_to -> weight_slab -> RateData

let defaultRatesCache: DefaultRatesMap;

async function loadRatesIntoCache() {
	console.log("Loading rates into cache...");

	const defaultRates = await prisma.defaultRate.findMany();
	defaultRatesCache = new Map();
	for (const rate of defaultRates) {
		let zoneToMap = defaultRatesCache.get(rate.zone_from);
		if (!zoneToMap) {
			zoneToMap = new Map();
			defaultRatesCache.set(rate.zone_from, zoneToMap);
		}
		let weightSlabMap = zoneToMap.get(rate.zone_to);
		if (!weightSlabMap) {
			weightSlabMap = new Map();
			zoneToMap.set(rate.zone_to, weightSlabMap);
		}
		weightSlabMap.set(rate.weight_slab, {
			rate: rate.rate,
			weight_slab: rate.weight_slab,
		});
	}
	console.log(`Loaded ${defaultRates.length} default rates.`);
}

async function main() {
	console.log("Starting comprehensive seeding...");

	await seedCouriers();
	await seedRates();

	// Load pincode map once
	await loadPincodeMap();
	const allPincodes = Array.from(pincodeMap.keys());

	// Load rates into cache
	await loadRatesIntoCache();

	const password = "Tarzan678$";
	const hashedPassword = await bcrypt.hash(password, 10);

	// Seed users
	const { adminUser, clientUser, employeeUser, randomUsers } = await seedUsers(
		hashedPassword,
		40,
	);
	const allUsers = [adminUser, clientUser, employeeUser, ...randomUsers];

	// Seed wallets and transactions
	await seedWalletsAndTransactions(allUsers);

	// Seed addresses
	const userAddressesMap = await seedAddresses(allUsers, allPincodes);

	// Seed KYC
	await seedKYC(allUsers, adminUser, allPincodes);

	// Fetch couriers (assuming seedCouriers.ts has been run or will be run as part of a combined script)
	const allCouriers = await prisma.courier.findMany();
	if (allCouriers.length === 0) {
		console.warn(
			"No couriers found. Please ensure prisma/seedCouriers.ts has been run or run it manually.",
		);
		// Optionally, you could call seedCouriers.ts logic here if it's meant to be fully self-contained
	}

	// Seed shipments
	const createdShipments = await seedShipments(
		allUsers,
		allPincodes,
		allCouriers,
		userAddressesMap,
	);

	// Seed tracking
	await seedTracking(createdShipments, allCouriers);

	// Seed support tickets
	await seedSupportTickets(allUsers, employeeUser);

	console.log("Comprehensive seeding finished.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
