const { faker } = require("@faker-js/faker");
const fs = require("node:fs");
const path = require("node:path");

const NUM_SHIPMENTS = 5;

const headers = [
	"Recipient Name",
	"Recipient Mobile Number",
	"Package Weight (kg)",
	"Package Height (cm)",
	"Package Length (cm)",
	"Package Breadth (cm)",
	"Origin Address Line",
	"Origin Zip Code",
	"Origin City",
	"Origin State",
	"Destination Address Line",
	"Destination Zip Code",
	"Destination City",
	"Destination State",
];

const generateShipment = () => {
	return {
		"Recipient Name": faker.person.fullName(),
		"Recipient Mobile Number": faker.string.numeric(10),
		"Package Weight (kg)": faker.number.float({
			min: 0.5,
			max: 50,
			fractionDigits: 2,
		}),
		"Package Height (cm)": faker.number.float({
			min: 10,
			max: 100,
			fractionDigits: 2,
		}),
		"Package Length (cm)": faker.number.float({
			min: 10,
			max: 100,
			fractionDigits: 2,
		}),
		"Package Breadth (cm)": faker.number.float({
			min: 10,
			max: 100,
			fractionDigits: 2,
		}),
		"Origin Address Line": faker.location.streetAddress(),
		"Origin Zip Code": 110075,
		"Origin City": faker.location.city(),
		"Origin State": faker.location.state(),
		"Destination Address Line": faker.location.streetAddress(),
		"Destination Zip Code": 313001,
		"Destination City": faker.location.city(),
		"Destination State": faker.location.state(),
	};
};

const shipments = Array.from({ length: NUM_SHIPMENTS }, generateShipment);

let csvContent = `${headers.join(",")}\n`;

for (const shipment of shipments) {
	const row = headers
		.map((header) => {
			let value = shipment[header];
			if (typeof value === "string" && value.includes(",")) {
				value = `"${value}"`;
			}
			return value;
		})
		.join(",");
	csvContent += `${row}\n`;
}

const outputPath = path.join(
	__dirname,
	"public",
	"templates",
	"sample_bulk_shipments.csv",
);

fs.writeFileSync(outputPath, csvContent, "utf8");

console.log(`Generated ${NUM_SHIPMENTS} sample shipments to ${outputPath}`);
