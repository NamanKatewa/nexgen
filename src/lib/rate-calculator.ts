import fs from "node:fs/promises";
import path from "node:path";

interface PincodeDetails {
  city: string;
  state: string;
}

interface PincodeData {
  pincode: string;
  city: string;
  state: string;
}

let pincodeMap: Map<string, PincodeDetails> | null = null;

async function getPincodeMap(): Promise<Map<string, PincodeDetails>> {
  if (pincodeMap) {
    return pincodeMap;
  }
  const filePath = path.join(process.cwd(), "data", "pincode_map.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  const parsedData: { [key: string]: PincodeDetails } = JSON.parse(fileContent);
  pincodeMap = new Map(
    Object.entries(parsedData).map(([pincode, details]) => [
      pincode,
      {
        city:
          typeof details.city === "string" ? details.city.toLowerCase() : "",
        state:
          typeof details.state === "string" ? details.state.toLowerCase() : "",
      },
    ])
  );
  if (!pincodeMap) {
    throw new Error("Failed to parse pincode data");
  }
  return pincodeMap;
}

export async function getPincodeDetails(
  pincode: string
): Promise<PincodeData | undefined> {
  const map = await getPincodeMap();
  const details = map.get(pincode);
  if (details) {
    return { pincode, ...details };
  }
  return undefined;
}

export function getZone(
  origin: PincodeData | undefined,
  destination: PincodeData | undefined
): { zone: string } {
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
      destination.state.toLowerCase()
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
    destination.city.toLowerCase()
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
}
