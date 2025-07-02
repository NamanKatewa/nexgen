import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface PincodeData {
	pincode: string;
	city: string;
	state: string;
}

let pincodeData: PincodeData[] | null = null;

async function getPincodeData(): Promise<PincodeData[]> {
	if (pincodeData) {
		return pincodeData;
	}
	const filePath = path.join(process.cwd(), "data", "pincode_cleaned.json");
	const fileContent = await fs.readFile(filePath, "utf-8");
	pincodeData = JSON.parse(fileContent);
	if (!pincodeData) {
		throw new Error("Failed to parse pincode data");
	}
	return pincodeData;
}

async function getPincodeDetails(
	pincode: string,
): Promise<PincodeData | undefined> {
	const allPincodes = await getPincodeData();
	return allPincodes.find((p) => p.pincode === pincode);
}

function getZone(
	origin: PincodeData,
	destination: PincodeData,
): { zone_from: string; zone_to: string } {
	const metroCities = [
		"Mumbai",
		"Bengaluru",
		"Chennai",
		"Delhi",
		"Hyderabad",
		"Kolkata",
	];

	const isOriginMetro = metroCities.includes(origin.city);
	const isDestinationMetro = metroCities.includes(destination.city);

	if (isOriginMetro && isDestinationMetro) {
		return { zone_from: "Metro", zone_to: "Metro" };
	}

	if (origin.state === destination.state) {
		return { zone_from: "Within-State", zone_to: "Within-State" };
	}

	const north = [
		"Jammu and Kashmir",
		"Himachal Pradesh",
		"Punjab",
		"Chandigarh",
		"Uttarakhand",
		"Haryana",
		"Delhi",
		"Rajasthan",
		"Uttar Pradesh",
	];
	const east = [
		"Bihar",
		"Jharkhand",
		"Odisha",
		"West Bengal",
		"Sikkim",
		"Assam",
		"Arunachal Pradesh",
		"Manipur",
		"Mizoram",
		"Nagaland",
		"Tripura",
		"Meghalaya",
	];
	const west = [
		"Gujarat",
		"Maharashtra",
		"Goa",
		"Daman and Diu",
		"Dadra and Nagar Haveli",
	];
	const south = [
		"Andhra Pradesh",
		"Telangana",
		"Karnataka",
		"Kerala",
		"Tamil Nadu",
		"Puducherry",
		"Lakshadweep",
		"Andaman and Nicobar Islands",
	];

	const getRegion = (state: string) => {
		if (north.includes(state)) return "North";
		if (east.includes(state)) return "East";
		if (west.includes(state)) return "West";
		if (south.includes(state)) return "South";
		return "Other";
	};

	const originRegion = getRegion(origin.state);
	const destinationRegion = getRegion(destination.state);

	return { zone_from: originRegion, zone_to: destinationRegion };
}

export async function calculateRate(
	originPincode: string,
	destinationPincode: string,
	weight: number,
	userId: string,
): Promise<number | null> {
	const originDetails = await getPincodeDetails(originPincode);
	const destinationDetails = await getPincodeDetails(destinationPincode);

	if (!originDetails || !destinationDetails) {
		throw new Error("Invalid origin or destination pincode");
	}

	const { zone_from, zone_to } = getZone(originDetails, destinationDetails);
	const weightSlab = Math.ceil(weight * 2) / 2;

	const userRate = await prisma.userRate.findUnique({
		where: {
			user_id_zone_from_zone_to_weight_slab: {
				user_id: userId,
				zone_from,
				zone_to,
				weight_slab: weightSlab,
			},
		},
	});

	if (userRate) {
		return userRate.rate;
	}

	const defaultRate = await prisma.defaultRate.findUnique({
		where: {
			zone_from_zone_to_weight_slab: {
				zone_from,
				zone_to,
				weight_slab: weightSlab,
			},
		},
	});

	if (defaultRate) {
		return defaultRate.rate;
	}

	return null;
}
