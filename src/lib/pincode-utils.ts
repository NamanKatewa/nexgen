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

// In-memory cache for pincode data.
let pincodeMap: Map<string, PincodeDetails> | null = null;

/**
 * Loads the pincode map from the JSON file.
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
): Promise<PincodeDetails | undefined> {
	try {
		const map = pincodeMap ?? (await loadPincodeMap());
		const details = map.get(pincode);
		if (details) {
			return {
				city: capitalizeWords(details.city),
				state: capitalizeWords(details.state),
			};
		}
		logger.warn("Pincode not found", { pincode });
		return undefined;
	} catch (error) {
		logger.error("Error getting pincode details", { error, pincode });
		throw error;
	}
}
