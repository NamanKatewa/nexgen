import fs from "node:fs/promises";
import path from "node:path";
import { faker } from "@faker-js/faker";
import {
	ADDRESS_TYPE,
	BUSINESS_TYPE,
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
	TRANSACTION_TYPE,
	USER_ROLE,
	USER_STATUS,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import * as bcrypt from "bcryptjs";

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
	const base64Data = `data:text/plain;base64,${Buffer.from(content).toString("base64")}`;

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
	userId,
	zoneFrom,
	zoneTo,
	weightSlab,
	packageWeight,
}: {
	userId?: string;
	zoneFrom: string;
	zoneTo: string;
	weightSlab: number;
	packageWeight: number;
}) {
	// Try to find user-specific rate first
	if (userId) {
		const exactUserRate = await prisma.userRate.findFirst({
			where: {
				user_id: userId,
				zone_from: zoneFrom,
				zone_to: zoneTo,
				weight_slab: weightSlab,
			},
		});
		if (exactUserRate) return exactUserRate.rate;

		const [lowerUser, upperUser] = await Promise.all([
			prisma.userRate.findFirst({
				where: {
					user_id: userId,
					zone_from: zoneFrom,
					zone_to: zoneTo,
					weight_slab: { lt: weightSlab },
				},
				orderBy: { weight_slab: "desc" },
			}),
			prisma.userRate.findFirst({
				where: {
					user_id: userId,
					zone_from: zoneFrom,
					zone_to: zoneTo,
					weight_slab: { gt: weightSlab },
				},
				orderBy: { weight_slab: "asc" },
			}),
		]);

		if (lowerUser && upperUser) {
			return interpolateRate(
				{ rate: lowerUser.rate, weight_slab: lowerUser.weight_slab },
				{ rate: upperUser.rate, weight_slab: upperUser.weight_slab },
				packageWeight,
			);
		}
		if (lowerUser) {
			return (lowerUser.rate / lowerUser.weight_slab) * packageWeight;
		}
	}

	// Fallback to default rates
	const exactDefaultRate = await prisma.defaultRate.findFirst({
		where: { zone_from: zoneFrom, zone_to: zoneTo, weight_slab: weightSlab },
	});
	if (exactDefaultRate) return exactDefaultRate.rate;

	const [lowerDefault, upperDefault] = await Promise.all([
		prisma.defaultRate.findFirst({
			where: {
				zone_from: zoneFrom,
				zone_to: zoneTo,
				weight_slab: { lt: weightSlab },
			},
			orderBy: { weight_slab: "desc" },
		}),
		prisma.defaultRate.findFirst({
			where: {
				zone_from: zoneFrom,
				zone_to: zoneTo,
				weight_slab: { gt: weightSlab },
			},
			orderBy: { weight_slab: "asc" },
		}),
	]);

	if (lowerDefault && upperDefault) {
		return interpolateRate(
			{ rate: lowerDefault.rate, weight_slab: lowerDefault.weight_slab },
			{ rate: upperDefault.rate, weight_slab: upperDefault.weight_slab },
			packageWeight,
		);
	}
	if (lowerDefault) {
		return (lowerDefault.rate / lowerDefault.weight_slab) * packageWeight;
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
	const timePart = Date.now().toString().slice(-4);
	const userPart = userId.slice(-2).toUpperCase();
	const randomPart = faker.string.alphanumeric(2).toUpperCase();
	return `${prefix}${timePart}${userPart}${randomPart}`;
}

// --- Main Seeding Function ---
async function main() {
	console.log("Start seeding...");

	await loadPincodeMap();
	const allPincodes = Array.from(pincodeMap.keys());

	const password = "Tarzan678$";
	const hashedPassword = await bcrypt.hash(password, 10);

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
		},
	});
	console.log(`Created/Upserted Admin user with id: ${adminUser.user_id}`);

	// Create default client user
	const clientUser = await prisma.user.upsert({
		where: { email: "namankatew2004@gmail.com" },
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
		},
	});
	console.log(`Created/Upserted Client user with id: ${clientUser.user_id}`);

	// Create an employee for support tickets
	const employeeUser = await prisma.user.create({
		data: {
			email: faker.internet.email(),
			mobile_number: faker.string.numeric(10),
			password_hash: hashedPassword,
			name: faker.person.fullName(),
			company_name: faker.company.name(),
			monthly_order: faker.string.numeric(3),
			business_type: faker.helpers.arrayElement(Object.values(BUSINESS_TYPE)),
			role: USER_ROLE.Employee,
			status: USER_STATUS.Active,
		},
	});

	const employee = await prisma.employee.create({
		data: {
			user_id: employeeUser.user_id,
			employee_code: faker.string.alphanumeric(10).toUpperCase(),
			designation: faker.person.jobTitle(),
			department: faker.commerce.department(),
			hire_date: faker.date.past(),
			status: EMPLOYEE_STATUS.Active,
		},
	});
	console.log(`Created Employee with id: ${employee.employee_id}`);

	const users = [adminUser, clientUser];

	// Generate additional random users
	const numberOfRandomUsers = 5;
	for (let i = 0; i < numberOfRandomUsers; i++) {
		const user = await prisma.user.create({
			data: {
				email: faker.internet.email(),
				mobile_number: faker.string.numeric(10),
				password_hash: hashedPassword,
				name: faker.person.fullName(),
				company_name: faker.company.name(),
				monthly_order: faker.string.numeric(4),
				business_type: faker.helpers.arrayElement(Object.values(BUSINESS_TYPE)),
				role: USER_ROLE.Client,
				status: faker.helpers.arrayElement(Object.values(USER_STATUS)),
			},
		});
		users.push(user);
		console.log(`Created random user with id: ${user.user_id}`);
	}

	for (const user of users) {
		// Create Wallet (if not already created by upsert)
		let wallet = await prisma.wallet.findUnique({
			where: { user_id: user.user_id },
		});
		if (!wallet) {
			wallet = await prisma.wallet.create({
				data: {
					user_id: user.user_id,
					balance: new Decimal(
						faker.finance.amount({ min: 0, max: 10000, dec: 2 }),
					),
				},
			});
			console.log(
				`Created wallet with id: ${wallet.wallet_id} for user ${user.user_id}`,
			);
		}

		// Create Transactions (Wallet Top-up simulation)
		const numberOfTransactions = faker.number.int({ min: 1, max: 5 });
		for (let j = 0; j < numberOfTransactions; j++) {
			await prisma.transaction.create({
				data: {
					user_id: user.user_id,
					transaction_type: faker.helpers.arrayElement(
						Object.values(TRANSACTION_TYPE),
					),
					amount: new Decimal(
						faker.finance.amount({ min: 10, max: 1000, dec: 2 }),
					),
					created_at: faker.date.past(),
					payment_status: faker.helpers.arrayElement(
						Object.values(PAYMENT_STATUS),
					),
					description: faker.lorem.sentence(),
				},
			});
		}
		console.log(
			`Created ${numberOfTransactions} transactions for wallet ${wallet.wallet_id}`,
		);

		// Create Addresses
		const numberOfAddresses = faker.number.int({ min: 2, max: 5 }); // Ensure at least 2 for shipments
		const userAddresses = [];
		for (let j = 0; j < numberOfAddresses; j++) {
			const randomPincode = faker.helpers.arrayElement(allPincodes);
			const pincodeDetails = getPincodeDetails(randomPincode);

			if (pincodeDetails) {
				const address = await prisma.address.create({
					data: {
						user_id: user.user_id,
						zip_code: Number.parseInt(randomPincode),
						city: pincodeDetails.city,
						state: pincodeDetails.state,
						address_line: faker.location.streetAddress(),
						name: faker.person.fullName(),
						type: ADDRESS_TYPE.User, // Directly create User type addresses for simplicity
					},
				});
				userAddresses.push(address);
				console.log(`Created address with id: ${address.address_id}`);
			}
		}

		// Create KYC
		let kyc = await prisma.kyc.findUnique({ where: { user_id: user.user_id } });
		if (!kyc) {
			const kycStatus = faker.helpers.arrayElement(Object.values(KYC_STATUS));
			const randomPincode = faker.helpers.arrayElement(allPincodes);
			const pincodeDetails = getPincodeDetails(randomPincode);

			if (pincodeDetails) {
				const kycAddress = await prisma.address.create({
					data: {
						user_id: user.user_id,
						zip_code: Number.parseInt(randomPincode),
						city: pincodeDetails.city,
						state: pincodeDetails.state,
						address_line: faker.location.streetAddress(),
						name: "KYC Billing Address",
						type: ADDRESS_TYPE.Warehouse,
					},
				});

				kyc = await prisma.kyc.create({
					data: {
						user_id: user.user_id,
						entity_name: faker.company.name(),
						entity_type: faker.helpers.arrayElement(Object.values(ENTITY_TYPE)),
						website_url: faker.internet.url(),
						address_id: kycAddress.address_id,
						aadhar_number: faker.string.numeric(12),
						aadhar_image_front: generateBase64Image().data,
						aadhar_image_back: generateBase64Image().data,
						pan_number: faker.string.alphanumeric(10).toUpperCase(),
						pan_image_front: generateBase64Image().data,
						pan_image_back: generateBase64Image().data,
						gst: faker.datatype.boolean(),
						kyc_status: kycStatus,
						submission_date: faker.date.past(),
						verification_date:
							kycStatus === KYC_STATUS.Approved ||
							kycStatus === KYC_STATUS.Rejected
								? faker.date.recent()
								: null,
						verified_by_user_id:
							kycStatus === KYC_STATUS.Approved ? adminUser.user_id : null,
						rejection_reason:
							kycStatus === KYC_STATUS.Rejected ? faker.lorem.sentence() : null,
					},
				});
				console.log(
					`Created KYC for user ${user.user_id} with status ${kycStatus}`,
				);
			}
		}

		// Create Shipments
		if (userAddresses.length >= 2) {
			const numberOfShipments = faker.number.int({ min: 1, max: 3 });
			for (let k = 0; k < numberOfShipments; k++) {
				const originAddress = faker.helpers.arrayElement(userAddresses);
				const destinationAddress = faker.helpers.arrayElement(
					userAddresses.filter(
						(addr) => addr.address_id !== originAddress.address_id,
					),
				);

				if (!destinationAddress) continue; // Skip if not enough distinct addresses

				const originPincodeDetails = getPincodeDetails(
					String(originAddress.zip_code),
				);
				const destinationPincodeDetails = getPincodeDetails(
					String(destinationAddress.zip_code),
				);

				if (!originPincodeDetails || !destinationPincodeDetails) continue; // Skip if pincode details not found

				const zone = getZone(originPincodeDetails, destinationPincodeDetails);
				const packageWeight = faker.finance.amount({ min: 1, max: 50, dec: 2 });
				const weightSlab = Math.ceil(Number(packageWeight) * 2) / 2;

				const shippingCost = await findRateSimulated({
					userId: user.user_id,
					zoneFrom: "z", // Assuming 'z' as a common origin zone for simplicity
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

				// Ensure wallet has enough balance
				if (wallet.balance.lessThan(totalCost)) {
					const topUpAmount = totalCost
						.minus(wallet.balance)
						.add(
							new Decimal(faker.finance.amount({ min: 100, max: 500, dec: 2 })),
						);
					await prisma.wallet.update({
						where: { wallet_id: wallet.wallet_id },
						data: { balance: { increment: topUpAmount } },
					});
					await prisma.transaction.create({
						data: {
							user_id: user.user_id,
							transaction_type: TRANSACTION_TYPE.Credit,
							amount: topUpAmount,
							payment_status: PAYMENT_STATUS.Completed,
							description: "Wallet top-up for shipment",
						},
					});
					wallet.balance = wallet.balance.add(topUpAmount);
					console.log(
						`Topped up wallet for user ${user.user_id} by ${topUpAmount}`,
					);
				}

				await prisma.wallet.update({
					where: { wallet_id: wallet.wallet_id },
					data: { balance: { decrement: totalCost } },
				});
				await prisma.transaction.create({
					data: {
						user_id: user.user_id,
						transaction_type: TRANSACTION_TYPE.Debit,
						amount: totalCost,
						payment_status: PAYMENT_STATUS.Completed,
						description: "Shipment cost debit",
					},
				});

				const packageImage = generateBase64Image();
				const invoiceFile = isInsuranceSelected
					? generateBase64File()
					: undefined;

				const shipment = await prisma.shipment.create({
					data: {
						human_readable_shipment_id: generateShipmentId(user.user_id),
						user_id: user.user_id,
						awb_number: faker.string.numeric(12),
						current_status: SHIPMENT_STATUS.Booked,
						payment_status: SHIPMENT_PAYMENT_STATUS.Paid,
						shipment_status: SHIPMENT_APPROVAL_STATUS.PendingApproval,
						origin_address_id: originAddress.address_id,
						destination_address_id: destinationAddress.address_id,
						recipient_name: faker.person.fullName(),
						recipient_mobile: faker.string.numeric(10),
						package_image_url: packageImage.data, // Storing base64 data directly for seeding
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
						invoiceUrl: invoiceFile?.data, // Storing base64 data directly for seeding
						rejection_reason:
							faker.datatype.boolean() &&
							SHIPMENT_APPROVAL_STATUS.Rejected ===
								SHIPMENT_APPROVAL_STATUS.Rejected
								? faker.lorem.sentence()
								: null,
					},
				});
				console.log(`Created shipment with id: ${shipment.shipment_id}`);

				// Create Tracking for Shipment
				const numberOfTrackingUpdates = faker.number.int({ min: 2, max: 5 });
				for (let l = 0; l < numberOfTrackingUpdates; l++) {
					await prisma.tracking.create({
						data: {
							shipment_id: shipment.shipment_id,
							timestamp: faker.date.recent(),
							location: faker.location.city(),
							status_description: faker.lorem.sentence(),
							carrier_update_code: faker.string.alphanumeric(5).toUpperCase(),
							event_details: faker.lorem.paragraph(),
						},
					});
				}
				console.log(
					`Created ${numberOfTrackingUpdates} tracking updates for shipment ${shipment.shipment_id}`,
				);
			}
		} else {
			console.log(
				`Skipping shipment creation for user ${user.user_id} due to insufficient addresses.`,
			);
		}

		// Create Support Tickets
		const numberOfTickets = faker.number.int({ min: 0, max: 2 });
		for (let m = 0; m < numberOfTickets; m++) {
			await prisma.supportTicket.create({
				data: {
					user_id: user.user_id,
					subject: faker.lorem.sentence(5),
					description: faker.lorem.paragraph(),
					status: faker.helpers.arrayElement(Object.values(SUPPORT_STATUS)),
					priority: faker.helpers.arrayElement(Object.values(SUPPORT_PRIORITY)),
					assigned_to_employee_id: employee.employee_id,
					resolved_at:
						faker.helpers.arrayElement(Object.values(SUPPORT_STATUS)) ===
						SUPPORT_STATUS.Closed
							? faker.date.recent()
							: null,
				},
			});
		}
		console.log(
			`Created ${numberOfTickets} support tickets for user ${user.user_id}`,
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