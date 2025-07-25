import fs from "node:fs/promises";
import path from "node:path";
import logger from "~/lib/logger";

const capitalizeWords = (str: string) => {
	return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

interface PincodeDetails {
	city: string;
	state: string;
}

interface PincodeData {
	pincode: string;
	city: string;
	state: string;
}

// In-memory cache for pincode data. This is pre-loaded when the module is first imported.
let pincodeMap: Map<string, PincodeDetails> | null = null;

/**
 * Loads the pincode map from the JSON file. This function is called once
 * when the module is imported to pre-load the data into memory.
 */
async function loadPincodeMap(): Promise<Map<string, PincodeDetails>> {
	const filePath = path.join(process.cwd(), "data", "pincode_map.json");
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
		if (!pincodeMap) {
			logger.error("Failed to parse pincode data");
			throw new Error("Failed to parse pincode data");
		}
		logger.info("Pincode map loaded successfully");
		return pincodeMap;
	} catch (error) {
		logger.error("Error loading pincode map", { error });
		throw error;
	}
}

// Pre-load the pincode map when the module is imported
void loadPincodeMap();

export async function getPincodeDetails(
	pincode: string,
): Promise<PincodeData | undefined> {
	try {
		// If pincodeMap is not yet loaded (e.g., during initial startup),
		// wait for it to load. Otherwise, use the already loaded map.
		const map = pincodeMap ?? (await loadPincodeMap());
		const details = map.get(pincode);
		if (details) {
			const result = {
				pincode,
				city: capitalizeWords(details.city),
				state: capitalizeWords(details.state),
			};
			logger.info("Pincode details found", { pincode, result });
			return result;
		}
		logger.warn("Pincode not found", { pincode });
		return undefined;
	} catch (error) {
		logger.error("Error getting pincode details", { error, pincode });
		throw error;
	}
}

export function getZone(
	origin: PincodeData | undefined,
	destination: PincodeData | undefined,
): { zone: string } {
	const result = ((): { zone: string } => {
		if (!origin?.city || !destination?.city) {
			return { zone: "d" };
		}
		if (origin.city.toLowerCase() === destination.city.toLowerCase()) {
			return { zone: "a" };
		}

		if (!origin.state || !destination.state) {
			return { zone: "d" };
		}

		if (origin.state.toLowerCase() === destination.state.toLowerCase()) {
			return { zone: "b" };
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
			return { zone: "b" };
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
			return { zone: "c" };
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
			return { zone: "e" };
		}

		return { zone: "d" };
	})();

	logger.info("Zone calculated", { origin, destination, zone: result.zone });
	return result;
}
