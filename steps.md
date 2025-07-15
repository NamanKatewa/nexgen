# Insurance Policy Implementation - Detailed Plan

This document provides an exhaustive, step-by-step guide for implementing the new insurance policy for shipments within the NexGen application. Each step includes precise file paths, code modifications, and explanations to ensure a smooth and accurate implementation.

## Current State Overview

Currently, the system lacks any explicit insurance handling. Shipment rates are calculated based on factors like weight and zones, but insurance premiums and compensation are not integrated into this calculation. There are no dedicated fields in the database to store declared values or insurance-related information for shipments.

## Modifications - Comprehensive Steps

### Step 1: Database Schema Update (`prisma/schema.prisma`)

This step involves modifying the Prisma schema to introduce new fields in the `Shipment` model to store insurance-related data.

**Objective:** To persist declared value, insurance selection status, and the calculated insurance premium for each shipment in the database.

**File to Modify:** `C:/Users/naman/Documents/GitHub/nexgen/prisma/schema.prisma`

**Current Snippet (within `model Shipment`):**

```prisma
model Shipment {
  shipment_id            String          @id @default(uuid())
  human_readable_shipment_id String          @unique
  order_id               String
  carrier_id             String?
  awb_lr_no              String?          @unique
  current_status         SHIPMENT_STATUS
  origin_address_id      String
  destination_address_id String
  recipient_name         String
  recipient_mobile       String
  package_image_url      String
  package_weight         Decimal         @db.Decimal(10, 2)
  package_dimensions     String
  shipping_cost          Decimal         @db.Decimal(10, 2)
  label_url              String?
  created_at             DateTime        @default(now())
  updated_at             DateTime        @updatedAt

  order               Order    @relation(fields: [order_id], references: [order_id], onDelete: Cascade)
  origin_address      Address  @relation("Origin", fields: [origin_address_id], references: [address_id])
  destination_address Address  @relation("Destination", fields: [destination_address_id], references: [address_id])
  tracking            Tracking[]
}
```

**Modification:** Add `declared_value`, `insurance_selected`, and `insurance_premium` fields.

**New Snippet (to replace the `shipping_cost` and `label_url` lines):**

```prisma
  shipping_cost          Decimal         @db.Decimal(10, 2)
  declared_value         Decimal?        @db.Decimal(10, 2)
  insurance_selected     Boolean         @default(false)
  insurance_premium      Decimal?        @db.Decimal(10, 2)
  label_url              String?
```

**Explanation:**
*   `declared_value`: Stores the value declared by the user for insurance. It's `Decimal?` because it's optional (not all shipments will have insurance) and uses `db.Decimal(10, 2)` for precise monetary values.
*   `insurance_selected`: A boolean flag indicating whether the user opted for insurance for this specific shipment. Defaults to `false`.
*   `insurance_premium`: Stores the calculated cost of the insurance for the shipment. It's `Decimal?` as it will only be present if insurance is selected.

**Action:** After this `steps.md` is written, the first action will be to apply this change using the `replace` tool.

### Step 2: Update Zod Schemas (`src/schemas/order.ts` and `src/schemas/rate.ts`)

This step involves updating the Zod schemas to reflect the new fields added to the `Shipment` model and to include them in the rate calculation input.

**Objective:** To ensure type safety and validation for `declared_value`, `insurance_selected`, and `insurance_premium` across the application.

#### 2.1: Modify `src/schemas/order.ts`

**File to Modify:** `C:/Users/naman/Documents/GitHub/nexgen/src/schemas/order.ts`

**2.1.1: Update `submitShipmentSchema`**

**Current Snippet (within `submitShipmentSchema`):**

```typescript
export const submitShipmentSchema = z.object({
	recipientName: z.string().min(1, "Name is Required"),
	recipientMobile: z.string().length(10, "Should be 10 Digits"),
	packageWeight: z
		.number({
			required_error: "Weight is required",
			invalid_type_error: "Weight must be a number",
		})
		.min(0, "Can't be lower than 0 Kg")
		.max(1000, "Can't be more than 1000 Kgs")
		.refine((val) => /^-?\d+(\.\d{1,2})?$/.test(val.toString()), {
			message: "Weight can have at most 2 decimal places",
		}),
	packageHeight: z
		.number({
			required_error: "Height is required",
			invalid_type_error: "Height must be an integer",
		})
		.int("Height must be an integer"),
	packageLength: z
		.number({
			required_error: "Length is required",
			invalid_type_error: "Length must be an integer",
		})
		.int("Length must be an integer"),
	packageBreadth: z
		.number({
			required_error: "Breadth is required",
			invalid_type_error: "Breadth must be an integer",
		})
		.int("Breadth must be an integer"),
	originAddressId: z.string({
		required_error: "Origin address is required",
	}),
	destinationAddressId: z.string({
		required_error: "Destination address is required",
	}),
	packageImage: base64ImageSchema.refine((data) => data.data.length > 0, {
		message: "Package image is required",
	}),
});
```

**Modification:** Add `declaredValue` and `insuranceSelected` to `submitShipmentSchema`.

**New Snippet (to be inserted before `packageImage`):**

```typescript
	declaredValue: z.number().optional().nullable(),
	insuranceSelected: z.boolean().default(false),
```

**Explanation:**
*   `declaredValue`: Optional number field for the declared value. It's optional because insurance might not always be selected.
*   `insuranceSelected`: Boolean field, defaulting to `false`, to indicate if insurance is chosen.

**2.1.2: Update `excelShipmentSchema`**

**Current Snippet (within `excelShipmentSchema`):**

```typescript
export const excelShipmentSchema = z.object({
	recipientName: z.string().min(1, "Name is Required"),
	recipientMobile: z.string().length(10, "Should be 10 Digits"),
	packageWeight: z
		.number({
			required_error: "Weight is required",
			invalid_type_error: "Weight must be a number",
		})
		.min(0, "Can't be lower than 0 Kg")
		.max(1000, "Can't be more than 1000 Kgs")
		.refine((val) => /^-?\d+(\.\d{1,2})?$/.test(val.toString()), {
			message: "Weight can have at most 2 decimal places",
		}),
	packageHeight: z
		.number({
			required_error: "Height is required",
			invalid_type_error: "Height must be an integer",
		})
		.int("Height must be an integer"),
	packageLength: z
		.number({
			required_error: "Length is required",
			invalid_type_error: "Length must be an integer",
		})
		.int("Length must be an integer"),
	packageBreadth: z
		.number({
			required_error: "Breadth is required",
			invalid_type_error: "Breadth must be an integer",
		})
		.int("Breadth must be an integer"),
	originAddressLine: z.string().min(1, "Origin Address Line is Required"),
	originZipCode: z.string().length(6, "Origin Zip Code must be 6 digits"),
	originCity: z.string().min(1, "Origin City is Required"),
	originState: z.string().min(1, "Origin State is Required"),
	destinationAddressLine: z
		.string()
		.min(1, "Destination Address Line is Required"),
	destinationZipCode: z
		.string()
		.length(6, "Destination Zip Code must be 6 digits"),
	destinationCity: z.string().min(1, "Destination City is Required"),
	destinationState: z.string().min(1, "Destination State is Required"),
	packageImage: base64ImageSchema.refine((data) => data.data.length > 0, {
		message: "Package image is required",
	}),
	calculatedRate: z.number().optional().nullable(),
});
```

**Modification:** Add `declaredValue` and `insuranceSelected` to `excelShipmentSchema`.

**New Snippet (to be inserted before `packageImage`):**

```typescript
	declaredValue: z.number().optional().nullable(),
	insuranceSelected: z.boolean().default(false),
```

**Explanation:** Similar to `submitShipmentSchema`, these fields are added to handle insurance data for bulk uploads.

#### 2.2: Modify `src/schemas/rate.ts`

**File to Modify:** `C:/Users/naman/Documents/GitHub/nexgen/src/schemas/rate.ts`

**2.2.1: Update `rateSchema`**

**Current Snippet (within `rateSchema`):**

```typescript
export const rateSchema = z.object({
	packageWeight: z
		.number({
			required_error: "Weight is required",
			invalid_type_error: "Height must be a number",
		})
		.min(0, "Can't be lower than 0 Kg")
		.max(1000, "Can't be more than 1000 Kgs"),
	originZipCode: z
		.string()
		.length(6, "Zip Code must be 6 digits")
		.refine((val) => !Number.isNaN(Number(val)), "Zip Code must be a number"),
	destinationZipCode: z
		.string()
		.length(6, "Zip Code must be 6 digits")
		.refine((val) => !Number.isNaN(Number(val)), "Zip Code must be a number"),
});
```

**Modification:** Add `declaredValue` and `insuranceSelected` to `rateSchema`.

**New Snippet (to be inserted before `originZipCode`):**

```typescript
	declaredValue: z.number().optional().nullable(),
	insuranceSelected: z.boolean().default(false),
```

**Explanation:** These fields are crucial for the rate calculation API to receive the necessary insurance information.

### Step 3: Backend Rate Calculation Logic Update (`src/lib/rate.ts` and `src/server/api/routers/rate.ts`)

This is a critical step where the core insurance logic will be implemented.

**Objective:** To calculate the insurance premium based on declared value and integrate it into the total shipping cost, along with implementing value limits.

#### 3.1: Modify `src/lib/rate.ts`

**File to Modify:** `C:/Users/naman/Documents/GitHub/nexgen/src/lib/rate.ts`

**3.1.1: Update `FindRateParams` Interface**

**Current Snippet (interface `FindRateParams`):**

```typescript
interface FindRateParams {
	userId?: string;
	zoneFrom: string;
	zoneTo: string;
	weightSlab: number;
	packageWeight: number;
	isUserRate: boolean;
}
```

**Modification:** Add `declaredValue` and `insuranceSelected` to `FindRateParams`.

**New Snippet:**

```typescript
interface FindRateParams {
	userId?: string;
	zoneFrom: string;
	zoneTo: string;
	weightSlab: number;
	packageWeight: number;
	isUserRate: boolean;
	declaredValue?: number | null; // New
	insuranceSelected?: boolean; // New
}
```

**Explanation:** These parameters are needed to pass insurance information to the `findRate` function.

**3.1.2: Update `findRate` Function Logic**

**Current Snippet (within `findRate` function, after `return rate;` for base rate calculation):**

```typescript
	if (rate === null) {
		return null;
	}

	// Calculate additional cost for every 0.5 kg above the weight slab
	const additionalWeight = packageWeight - weightSlab;
	if (additionalWeight > 0) {
		const additionalSlabs = Math.ceil(additionalWeight / 0.5);
		const additionalCostPerSlab = rate * 0.1; // 10% of the base rate for each additional 0.5 kg
		rate += additionalSlabs * additionalCostPerSlab;
	}

	return rate;
```

**Modification:** Implement the insurance calculation logic and value limits. This will be a significant addition.

**New Snippet (to replace the existing additional weight calculation and before the final `return rate;`):**

```typescript
	if (rate === null) {
		return null;
	}

	// Calculate additional cost for every 0.5 kg above the weight slab
	const additionalWeight = packageWeight - weightSlab;
	if (additionalWeight > 0) {
		const additionalSlabs = Math.ceil(additionalWeight / 0.5);
		const additionalCostPerSlab = rate * 0.1; // 10% of the base rate for each additional 0.5 kg
		rate += additionalSlabs * additionalCostPerSlab;
	}

	let insurancePremium = 0;
	let compensationPercentage = 0;

	// Apply shipment value limits
	if (declaredValue && declaredValue > 49999) {
		throw new Error("Shipments over ₹49,999 are not accepted.");
	}
	if (declaredValue && declaredValue > 25000 && !insuranceSelected) {
		throw new Error("Shipments above ₹25,000 must have mandatory protection (insurance).");
	}

	if (insuranceSelected && declaredValue !== undefined && declaredValue !== null) {
		if (declaredValue >= 1 && declaredValue <= 2499) {
			insurancePremium = 100;
			compensationPercentage = 100;
		} else if (declaredValue >= 2500 && declaredValue <= 5000) {
			insurancePremium = 100;
			compensationPercentage = 80;
		} else if (declaredValue >= 5001 && declaredValue <= 12999) {
			insurancePremium = declaredValue * 0.02; // 2% of actual rate
			compensationPercentage = 80;
		} else if (declaredValue >= 13000 && declaredValue <= 21999) {
			// This range requires further clarification on exact premium and coverage.
			// For now, using a placeholder. This needs to be refined based on business rules.
			insurancePremium = declaredValue * 0.025; // Example: 2.5%
			compensationPercentage = 68; // Example: 68%
		} else if (declaredValue >= 22000 && declaredValue <= 26999) {
			// This range requires further clarification on exact premium and coverage.
			// For now, using a placeholder. This needs to be refined based on business rules.
			insurancePremium = declaredValue * 0.03; // Example: 3%
			compensationPercentage = 53; // Example: 53%
		} else if (declaredValue >= 27000 && declaredValue <= 49999) {
			insurancePremium = declaredValue * 0.03; // 3% of actual rate
			compensationPercentage = 50;
		}
	} else if (declaredValue && declaredValue > 5000 && !insuranceSelected) {
		// This condition handles mandatory insurance for shipments > ₹5,000 if not selected
		throw new Error("For shipments above ₹5,000, insurance is mandatory.");
	}

	// Add insurance premium to the total rate
	rate += insurancePremium;

	return {
		rate,
		insurancePremium,
		compensationPercentage,
	};
```

**Explanation:**
*   The `declaredValue` and `insuranceSelected` parameters are used to determine if and how insurance should be applied.
*   Error handling is added for shipment value limits (over ₹49,999 not accepted, over ₹25,000 mandatory protection).
*   The `if (insuranceSelected && declaredValue !== undefined && declaredValue !== null)` block calculates the `insurancePremium` and `compensationPercentage` based on the provided rules.
*   A placeholder is used for the `₹13,000–₹21,999` and `₹22,000–₹26,999` ranges, as the exact premium and coverage percentages are not fully specified in the prompt ("2.1–2.9%" and "58–78%", "3%" and "51–55%"). **This needs to be clarified with the business/product owner.**
*   The `insurancePremium` is added to the `rate`.
*   The function now returns an object containing `rate`, `insurancePremium`, and `compensationPercentage`. This will require updating the calling functions.

#### 3.2: Modify `src/server/api/routers/rate.ts`

**File to Modify:** `C:/Users/naman/Documents/GitHub/nexgen/src/server/api/routers/rate.ts`

**3.2.1: Update `calculateRate` Procedure**

**Objective:** To pass the new insurance parameters to `findRate` and handle its updated return type.

**Current Snippet (within `calculateRate` procedure, `input` destructuring):**

```typescript
			const { originZipCode, destinationZipCode, packageWeight } = input;
```

**Modification:** Add `declaredValue` and `insuranceSelected` to the destructuring.

**New Snippet:**

```typescript
			const { originZipCode, destinationZipCode, packageWeight, declaredValue, insuranceSelected } = input;
```

**Current Snippet (within `calculateRate` procedure, `findRate` call for `userRate`):**

```typescript
					const userRate = await findRate({
						userId: user.user_id,
						zoneFrom: "z",
						zoneTo: zone,
						weightSlab,
						packageWeight,
						isUserRate: true,
					});
```

**Modification:** Pass `declaredValue` and `insuranceSelected` to `findRate`.

**New Snippet:**

```typescript
					const userRateResult = await findRate({
						userId: user.user_id,
						zoneFrom: "z",
						zoneTo: zone,
						weightSlab,
						packageWeight,
						isUserRate: true,
						declaredValue,
						insuranceSelected,
					});
```

**Current Snippet (within `calculateRate` procedure, handling `userRate` result):**

```typescript
					if (userRate !== null) {
						logger.info("Found user-specific rate", {
							...logData,
							rate: userRate,
							source: "user",
						});
						return {
							rate: userRate,
							origin: originDetails,
							destination: destinationDetails,
						};
					}
```

**Modification:** Update to use `userRateResult.rate` and include `insurancePremium` in the return.

**New Snippet:**

```typescript
					if (userRateResult !== null) {
						logger.info("Found user-specific rate", {
							...logData,
							rate: userRateResult.rate,
							insurancePremium: userRateResult.insurancePremium,
							source: "user",
						});
						return {
							rate: userRateResult.rate,
							insurancePremium: userRateResult.insurancePremium,
							compensationPercentage: userRateResult.compensationPercentage,
							origin: originDetails,
							destination: destinationDetails,
						};
					}
```

**Current Snippet (within `calculateRate` procedure, `findRate` call for `defaultRate`):**

```typescript
				const defaultRate = await findRate({
					zoneFrom: "z",
					zoneTo: zone,
					weightSlab,
					packageWeight,
					isUserRate: false,
				});
```

**Modification:** Pass `declaredValue` and `insuranceSelected` to `findRate`.

**New Snippet:**

```typescript
				const defaultRateResult = await findRate({
					zoneFrom: "z",
					zoneTo: zone,
					weightSlab,
					packageWeight,
					isUserRate: false,
					declaredValue,
					insuranceSelected,
				});
```

**Current Snippet (within `calculateRate` procedure, handling `defaultRate` result):**

```typescript
				if (defaultRate !== null) {
					logger.info("Found default rate", {
						...logData,
						rate: defaultRate,
						source: "default",
					});
					return {
						rate: defaultRate,
						origin: originDetails,
						destination: destinationDetails,
					};
				}
```

**Modification:** Update to use `defaultRateResult.rate` and include `insurancePremium` in the return.

**New Snippet:**

```typescript
				if (defaultRateResult !== null) {
					logger.info("Found default rate", {
						...logData,
						rate: defaultRateResult.rate,
						insurancePremium: defaultRateResult.insurancePremium,
						source: "default",
					});
					return {
						rate: defaultRateResult.rate,
						insurancePremium: defaultRateResult.insurancePremium,
						compensationPercentage: defaultRateResult.compensationPercentage,
						origin: originDetails,
						destination: destinationDetails,
					};
				}
```

**Explanation:** These changes ensure that the `calculateRate` API endpoint correctly receives and processes insurance-related parameters, and returns the calculated insurance premium along with the total rate.

**3.2.2: Update `calculateBulkRates` Procedure**

**Objective:** To pass the new insurance parameters to `findRate` for each shipment in a bulk request and handle its updated return type.

**Current Snippet (within `calculateBulkRates` procedure, `z.array` input schema):**

```typescript
	calculateBulkRates: publicProcedure
		.input(
			z.array(
				z.object({
					originZipCode: z.string(),
					destinationZipCode: z.string(),
					packageWeight: z.number(),
				}),
			),
		)
```

**Modification:** Add `declaredValue` and `insuranceSelected` to the bulk input schema.

**New Snippet:**

```typescript
	calculateBulkRates: publicProcedure
		.input(
			z.array(
				z.object({
					originZipCode: z.string(),
					destinationZipCode: z.string(),
					packageWeight: z.number(),
					declaredValue: z.number().optional().nullable(), // New
					insuranceSelected: z.boolean().default(false), // New
				}),
			),
		)
```

**Current Snippet (within `calculateBulkRates` procedure, `shipmentDetailsForRateCalculation` push):**

```typescript
					shipmentDetailsForRateCalculation.push({
						zoneFrom: "z", // Assuming 'z' is a placeholder or default for origin zone
						zoneTo: zone,
						weightSlab,
						packageWeight: shipment.packageWeight,
					});
```

**Modification:** Add `declaredValue` and `insuranceSelected` to the pushed object.

**New Snippet:**

```typescript
					shipmentDetailsForRateCalculation.push({
						zoneFrom: "z",
						zoneTo: zone,
						weightSlab,
						packageWeight: shipment.packageWeight,
						declaredValue: shipment.declaredValue, // New
						insuranceSelected: shipment.insuranceSelected, // New
					});
```

**Current Snippet (within `calculateBulkRates` procedure, `findRate` call within loop):**

```typescript
		const rate = await findRate({
			userId,
			zoneFrom: detail.zoneFrom,
			zoneTo: detail.zoneTo,
			weightSlab: detail.weightSlab,
			packageWeight: detail.packageWeight,
			isUserRate,
		});
		rates.push(rate);
```

**Modification:** Update to handle the new return type of `findRate` and push the total rate.

**New Snippet:**

```typescript
		const rateResult = await findRate({
			userId,
			zoneFrom: detail.zoneFrom,
			zoneTo: detail.zoneTo,
			weightSlab: detail.weightSlab,
			packageWeight: detail.packageWeight,
			isUserRate,
			declaredValue: detail.declaredValue, // New
			insuranceSelected: detail.insuranceSelected, // New
		});
		rates.push(rateResult?.rate ?? null); // Push only the total rate for bulk calculation display
```

**Explanation:** These changes ensure that bulk rate calculations correctly account for insurance parameters and that the `findBulkRates` function in `src/lib/rate.ts` receives the necessary information.

### Step 4: Frontend Changes

This section details the modifications required for the user-facing interfaces to allow input and display of insurance information.

#### 4.1 Individual Shipment Creation (`src/app/(user)/dashboard/create-shipment/page.tsx`)

**Objective:** To add input fields for declared value and insurance selection, implement client-side validation, and pass this data to the backend. Also, to add a link to the new insurance rates page.

**File to Modify:** `C:/Users/naman/Documents/GitHub/nexgen/src/app/(user)/dashboard/create-shipment/page.tsx`

**4.1.1: Add `declaredValue` and `insuranceSelected` to `watch` and `useState`**

**Current Snippet (within `CreateShipmentPage` component, `useState` and `watch` declarations):**

```typescript
export default function CreateShipmentPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [showOriginAddressModal, setShowOriginAddressModal] = useState(false);
	// ... other useState and watch declarations ...
	const [calculatedRate, setCalculatedRate] = useState<number | null>(null);
	const [origin, setOrigin] = useState<PincodeDetails | null>(null);
	const [destination, setDestination] = useState<PincodeDetails | null>(null);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
		getValues,
	} = useForm<TShipmentSchema>({
		resolver: zodResolver(submitShipmentSchema),
	});
```

**Modification:** Add `declaredValue` and `insuranceSelected` to `watch` and introduce new state variables for insurance premium and compensation percentage.

**New Snippet:**

```typescript
export default function CreateShipmentPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [showOriginAddressModal, setShowOriginAddressModal] = useState(false);
	// ... other useState and watch declarations ...
	const [calculatedRate, setCalculatedRate] = useState<number | null>(null);
	const [insurancePremium, setInsurancePremium] = useState<number | null>(null); // New
	const [compensationPercentage, setCompensationPercentage] = useState<number | null>(null); // New
	const [origin, setOrigin] = useState<PincodeDetails | null>(null);
	const [destination, setDestination] = useState<PincodeDetails | null>(null);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
		getValues,
	} = useForm<TShipmentSchema>({
		resolver: zodResolver(submitShipmentSchema),
		defaultValues: { // Add default values for new fields
			declaredValue: null,
			insuranceSelected: false,
		}
	});

	const declaredValue = watch("declaredValue"); // New
	const insuranceSelected = watch("insuranceSelected"); // New
```

**Explanation:** This sets up the form to track the new insurance fields and prepares for displaying the calculated insurance details.

**4.1.2: Update `handleCalculateRate` Function**

**Objective:** To pass `declaredValue` and `insuranceSelected` to the `calculateRate` API call.

**Current Snippet (within `handleCalculateRate` function, `setQueryInput` call):**

```typescript
		setQueryInput({
			originZipCode: String(originAddress.zip_code),
			destinationZipCode: destinationAddress.zipCode,
			packageWeight: data.packageWeight,
		});
```

**Modification:** Add `declaredValue` and `insuranceSelected` to the `setQueryInput` object.

**New Snippet:**

```typescript
		setQueryInput({
			originZipCode: String(originAddress.zip_code),
			destinationZipCode: destinationAddress.zipCode,
			packageWeight: data.packageWeight,
			declaredValue: data.declaredValue, // New
			insuranceSelected: data.insuranceSelected, // New
		});
```

**Explanation:** This ensures that the backend receives the necessary insurance information for rate calculation.

**4.1.3: Update `useEffect` for `rateData`**

**Objective:** To store the returned `insurancePremium` and `compensationPercentage` from the API.

**Current Snippet (within `useEffect` for `rateData`):**

```typescript
	useEffect(() => {
		if (rateData) {
			setCalculatedRate(rateData.rate);
			setOrigin(rateData.origin);
			setDestination(rateData.destination);
			setQueryInput(null);
			toast.success("Rate calculated successfully!");
		}
	}, [rateData]);
```

**Modification:** Store `insurancePremium` and `compensationPercentage`.

**New Snippet:**

```typescript
	useEffect(() => {
		if (rateData) {
			setCalculatedRate(rateData.rate);
			setInsurancePremium(rateData.insurancePremium); // New
			setCompensationPercentage(rateData.compensationPercentage); // New
			setOrigin(rateData.origin);
			setDestination(rateData.destination);
			setQueryInput(null);
			toast.success("Rate calculated successfully!");
		}
	}, [rateData]);
```

**Explanation:** This updates the frontend state with the calculated insurance premium and compensation details.

**4.1.4: Add Input Fields for Insurance**

**Objective:** To provide UI elements for users to input declared value and select insurance.

**Location:** Insert these fields within the `Package Details` section, after `Package Length` and before `Package Weight Image`.

**New Snippet:**

```typescript
								<div className="space-y-2">
									<Label>Declared Value (₹)</Label>
									<Input
										placeholder="Declared Value for Insurance"
										type="number"
										step="any"
										{...register("declaredValue", {
											valueAsNumber: true,
										})}
										disabled={isLoading}
									/>
									<FieldError message={errors.declaredValue?.message} />
								</div>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="insuranceSelected"
										{...register("insuranceSelected")}
										disabled={isLoading}
										className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									/>
									<Label htmlFor="insuranceSelected">Select Insurance</Label>
									<FieldError message={errors.insuranceSelected?.message} />
								</div>
```

**Explanation:** These are standard input and checkbox components for user interaction.

**4.1.5: Display Insurance Details in Rate Section**

**Objective:** To show the calculated insurance premium and compensation percentage to the user.

**Location:** Within the `Calculated Rate` display section.

**Current Snippet (within `Calculated Rate` display):**

```typescript
						{calculatedRate && (
							<div className="font-semibold text-lg">
								Calculated Rate: ₹{calculatedRate.toFixed(2)}
								{origin && destination && (
									<div className="font-normal text-sm">
										From: {origin.city}, {origin.state}
										<br />
										To: {destination.city}, {destination.state}
									</div>
								)}
							</div>
						)}
```

**Modification:** Add display for `insurancePremium` and `compensationPercentage`.

**New Snippet:**

```typescript
						{calculatedRate && (
							<div className="font-semibold text-lg">
								Calculated Rate: ₹{calculatedRate.toFixed(2)}
								{insurancePremium !== null && insurancePremium > 0 && (
									<div className="font-normal text-sm text-green-700">
										Insurance Premium: ₹{insurancePremium.toFixed(2)} (Compensation: {compensationPercentage}%)
									</div>
								)}
								{origin && destination && (
									<div className="font-normal text-sm">
										From: {origin.city}, {origin.state}
										<br />
										To: {destination.city}, {destination.state}
									</div>
								)}
							</div>
						)}
```

**Explanation:** This provides immediate feedback to the user about the insurance cost and coverage.

**4.1.6: Add Link to Insurance Rates Page**

**Objective:** To provide easy access to the detailed insurance rate structure.

**Location:** Within the `CardFooter`, near the "Contact Support" link.

**Current Snippet (within `CardFooter`):**

```typescript
				<CardFooter className="justify-center">
					<p className="text-muted-foreground text-sm">
						Need help?{" "}
						<Link
							href="/dashboard/support"
							className="text-primary hover:underline"
						>
							Contact Support
						</Link>
					</p>
				</CardFooter>
```

**Modification:** Add a new `Link` component for "Insurance Rates".

**New Snippet:**

```typescript
				<CardFooter className="justify-center">
					<p className="text-muted-foreground text-sm">
						Need help?{" "}
						<Link
							href="/dashboard/support"
							className="text-primary hover:underline"
						>
							Contact Support
						</Link>
						{" | "} {/* Separator */}
						<Link
							href="/insurance-rates" // This will be the path to the new page
							className="text-primary hover:underline"
						>
							View Insurance Rates
						</Link>
					</p>
				</CardFooter>
```

**Explanation:** This provides a direct navigation link for users interested in the insurance policy details.

#### 4.2 Bulk Shipment Upload (`src/app/(user)/dashboard/create-bulk-shipment/page.tsx`)

**Objective:** To update the bulk upload functionality to read `declared_value` and `insurance_selected` from the Excel template and pass them to the backend.

**File to Modify:** `C:/Users/naman/Documents/GitHub/nexgen/src/app/(user)/dashboard/create-bulk-shipment/page.tsx`

**4.2.1: Update `handleFileUpload` Function**

**Objective:** To parse the new columns from the Excel file.

**Current Snippet (within `handleFileUpload` function, `parsedShipments` mapping):**

```typescript
				const parsedShipments: ShipmentWithStatus[] = json
					.filter(
						(r): r is Record<string, unknown> => r !== undefined && r !== null,
					)
					.map((row: Record<string, unknown>) => ({
						recipientName: String(row["Recipient Name"]) || "",
						recipientMobile: String(row["Recipient Mobile Number"] || ""),
						packageWeight: Number(row["Package Weight (kg)"]) || 0,
						packageHeight: Number(row["Package Height (cm)"]) || 0,
						packageLength: Number(row["Package Length (cm)"]) || 0,
						packageBreadth: Number(row["Package Breadth (cm)"]) || 0,
						originAddressLine: String(row["Origin Address Line"]) || "",
						originZipCode: String(row["Origin Zip Code"] || ""),
						originCity: String(row["Origin City"]) || "",
						originState: String(row["Origin State"]) || "",
						destinationAddressLine:
							String(row["Destination Address Line"]) || "",
						destinationZipCode: String(row["Destination Zip Code"] || ""),
						destinationCity: String(row["Destination City"]) || "",
						destinationState: String(row["Destination State"]) || "",
						packageImage: { data: "", name: "", type: "", size: 0 },
						status: undefined,
						message: undefined,
					}));
```

**Modification:** Add `Declared Value` and `Insurance Selected` to the parsing logic.

**New Snippet:**

```typescript
				const parsedShipments: ShipmentWithStatus[] = json
					.filter(
						(r): r is Record<string, unknown> => r !== undefined && r !== null,
					)
					.map((row: Record<string, unknown>) => ({
						recipientName: String(row["Recipient Name"]) || "",
						recipientMobile: String(row["Recipient Mobile Number"] || ""),
						packageWeight: Number(row["Package Weight (kg)"]) || 0,
						packageHeight: Number(row["Package Height (cm)"]) || 0,
						packageLength: Number(row["Package Length (cm)"]) || 0,
						packageBreadth: Number(row["Package Breadth (cm)"]) || 0,
						declaredValue: Number(row["Declared Value (₹)"]) || null, // New
						insuranceSelected: String(row["Insurance Selected"]).toLowerCase() === "yes", // New
						originAddressLine: String(row["Origin Address Line"]) || "",
						originZipCode: String(row["Origin Zip Code"] || ""),
						originCity: String(row["Origin City"]) || "",
						originState: String(row["Origin State"]) || "",
						destinationAddressLine:
							String(row["Destination Address Line"]) || "",
						destinationZipCode: String(row["Destination Zip Code"] || ""),
						destinationCity: String(row["Destination City"]) || "",
						destinationState: String(row["Destination State"]) || "",
						packageImage: { data: "", name: "", type: "", size: 0 },
						status: undefined,
						message: undefined,
					}));
```

**Explanation:** This ensures that the bulk upload process correctly extracts the new insurance-related data from the Excel file.

**4.2.2: Update `bulkRatesData` Query Input**

**Objective:** To pass the new insurance parameters to the `calculateBulkRates` API call.

**Current Snippet (within `bulkRatesData` query, `shipments.map`):**

```typescript
		data: bulkRatesData,
		error: bulkRatesError,
		isFetching: isCalculatingBulkRates,
		refetch: refetchBulkRates,
	} = api.rate.calculateBulkRates.useQuery(
		shipments.map((s) => ({
			originZipCode: s.originZipCode,
			destinationZipCode: s.destinationZipCode,
			packageWeight: s.packageWeight,
		})),
		{
			enabled: false, // Only fetch on demand
			refetchOnWindowFocus: false,
		},
	);
```

**Modification:** Add `declaredValue` and `insuranceSelected` to the mapped object.

**New Snippet:**

```typescript
		data: bulkRatesData,
		error: bulkRatesError,
		isFetching: isCalculatingBulkRates,
		refetch: refetchBulkRates,
	} = api.rate.calculateBulkRates.useQuery(
		shipments.map((s) => ({
			originZipCode: s.originZipCode,
			destinationZipCode: s.destinationZipCode,
			packageWeight: s.packageWeight,
			declaredValue: s.declaredValue, // New
			insuranceSelected: s.insuranceSelected, // New
		})),
		{
			enabled: false, // Only fetch on demand
			refetchOnWindowFocus: false,
		},
	);
```

**Explanation:** This ensures that the bulk rate calculation API receives the necessary insurance information for each shipment.

**4.2.3: Update Table Headers and Rows for Insurance Fields**

**Objective:** To display the `Declared Value` and `Insurance Selected` in the bulk shipment table.

**Location:** Within the `<thead>` and `<tbody>` sections of the table.

**Current Snippet (within `<thead>`):**

```typescript
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "100px" }}
												>
													Breadth (cm)
												</th>
												<th
													className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ width: "250px" }}
												>
													Origin Address
												</th>
```

**Modification:** Add new `<th>` for "Declared Value (₹)" and "Insurance Selected".

**New Snippet:**

```typescript
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "100px" }}
												>
													Breadth (cm)
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "120px" }}
												>
													Declared Value (₹)
												</th>
												<th
													className="whitespace-nowrap px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ minWidth: "120px" }}
												>
													Insurance Selected
												</th>
												<th
													className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider"
													style={{ width: "250px" }}
												>
													Origin Address
												</th>
```

**Current Snippet (within `<tbody>`, after `packageBreadth` `<td>`):**

```typescript
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "100px" }}
													>
														<Input
															type="number"
															step="any"
															value={shipment.packageBreadth}
															onChange={(e) => {
																const newValue = Number(e.target.value);
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].packageBreadth = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.packageBreadth`,
																		newValue,
																	);
																	trigger(`shipments.${index}.packageBreadth`);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.packageBreadth
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.packageBreadth
																	?.message
															}
														/>
													</td>
```

**Modification:** Add new `<td>` for "Declared Value (₹)" and "Insurance Selected".

**New Snippet:**

```typescript
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "100px" }}
													>
														<Input
															type="number"
															step="any"
															value={shipment.packageBreadth}
															onChange={(e) => {
																const newValue = Number(e.target.value);
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].packageBreadth = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.packageBreadth`,
																		newValue,
																	);
																	trigger(`shipments.${index}.packageBreadth`);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.packageBreadth
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.packageBreadth
																	?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "120px" }}
													>
														<Input
															type="number"
															step="any"
															value={shipment.declaredValue ?? ""}
															onChange={(e) => {
																const newValue = Number(e.target.value) || null;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].declaredValue = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.declaredValue`,
																		newValue,
																	);
																	trigger(`shipments.${index}.declaredValue`);
																}
															}}
															className={`w-full ${
																errors.shipments?.[index]?.declaredValue
																	?.message
																	? "border-red-500"
																	: ""
															}`}
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.declaredValue
																	?.message
															}
														/>
													</td>
													<td
														className="px-3 py-2 align-top text-gray-500 text-sm"
														style={{ minWidth: "120px" }}
													>
														<input
															type="checkbox"
															checked={shipment.insuranceSelected}
															onChange={(e) => {
																const newValue = e.target.checked;
																const newShipments = [...shipments];
																if (newShipments[index]) {
																	newShipments[index].insuranceSelected = newValue;
																	setShipments(newShipments);
																	setValue(
																		`shipments.${index}.insuranceSelected`,
																		newValue,
																	);
																	trigger(`shipments.${index}.insuranceSelected`);
																}
															}}
															className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
														/>
														<FieldError
															message={
																errors.shipments?.[index]?.insuranceSelected
																	?.message
															}
														/>
													</td>
```

**Explanation:** These additions provide visual representation and allow for manual editing of insurance fields within the bulk upload table.

#### 4.3 Update Excel Template (`public/templates/sample_bulk_shipments.xlsx`)

**Objective:** To include the new columns for `Declared Value` and `Insurance Selected` in the sample Excel template.

**File to Modify:** `C:/Users/naman/Documents/GitHub/nexgen/public/templates/sample_bulk_shipments.xlsx`

**Modification:** Add two new columns:
*   `Declared Value (₹)`
*   `Insurance Selected` (Expected values: "Yes" or "No")

**Explanation:** This ensures that users have a clear template for providing insurance information when performing bulk uploads. This is a manual update to the Excel file itself.

### Step 5: Admin Display (`src/app/(admin)/admin/order-approve/page.tsx` and `src/components/OrderDetailsModal.tsx`)

This step enhances the admin interface to display the new insurance-related information for each shipment.

#### 5.1: Modify `src/app/(admin)/admin/order-approve/page.tsx`

**Objective:** To ensure the `OrderDetailsModal` receives the necessary shipment data, including the new insurance fields.

**File to Modify:** `C:/Users/naman/Documents/GitHub/nexgen/src/app/(admin)/admin/order-approve/page.tsx`

**No direct code changes are needed in this file.** The `OrderDetailsModal` already receives the `orderItem` prop, which contains the `shipments` array. Once the `Shipment` model in Prisma is updated (Step 1), the `orderItem.shipments` will automatically include `declared_value`, `insurance_selected`, and `insurance_premium`. The changes will primarily be within `OrderDetailsModal.tsx`.

#### 5.2: Modify `src/components/OrderDetailsModal.tsx`

**Objective:** To display the `declared_value`, `insurance_selected` status, and the calculated `insurance_premium` for each shipment within the order details modal.

**File to Modify:** `C:/Users/naman/Documents/GitHub/nexgen/src/components/OrderDetailsModal.tsx`

**5.2.1: Update `ShipmentItemType`**

**Current Snippet (type definitions):**

```typescript
type OrderItemType = RouterOutputs["admin"]["pendingOrders"][number];
type ShipmentItemType = OrderItemType["shipments"][number];
```

**Modification:** No direct modification needed here. As `RouterOutputs` is derived from the TRPC router, and the TRPC router will eventually fetch the updated `Shipment` model from Prisma, `ShipmentItemType` will automatically include the new fields.

**5.2.2: Display Insurance Details for Each Shipment**

**Location:** Within the `orderItem.shipments.map` loop, where each shipment is rendered.

**Current Snippet (within `orderItem.shipments.map`):**

```typescript
	return (
		<>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="sm:max-w-[800px]">
					<DialogHeader>
						<DialogTitle>Order Details</DialogTitle>
						<DialogDescription>
							Details of the selected order.
						</DialogDescription>
					</DialogHeader>
					{orderItem && (
						<div className="grid gap-4 py-4">
							<p>{orderItem.user.name}</p>
							<p>{orderItem.user.email}</p>
							<div className="mt-4">
								<h3 className="font-medium text-lg">Shipments</h3>
								<ul className="mt-2 divide-y divide-gray-200">
									{orderItem.shipments.map((shipment) => (
										<li
											key={shipment.shipment_id}
											className="flex items-center justify-between py-2"
										>
											<p>{shipment.recipient_name}</p>
											<Button
												variant="link"
												onClick={() => handleViewShipment(shipment)}
											>
												View Shipment
											</Button>
										</li>
									))}
								</ul>
							</div>
							{/* ... rest of the modal content ... */}
						</div>
					)}
				</DialogContent>
			</Dialog>
			<ShipmentDetailsModal
				isOpen={showShipmentModal}
				onClose={() => setShowShipmentModal(false)}
				shipment={selectedShipment}
			/>
		</>
	);
};
```

**Modification:** Add display elements for `declared_value`, `insurance_selected`, and `insurance_premium` within each `<li>` element.

**New Snippet (to replace the `<p>{shipment.recipient_name}</p>` line and add new lines):**

```typescript
										<li
											key={shipment.shipment_id}
											className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2"
										>
											<div>
												<p className="font-medium">{shipment.recipient_name}</p>
												{shipment.declared_value !== null && shipment.declared_value !== undefined && (
													<p className="text-sm text-gray-600">Declared Value: ₹{shipment.declared_value.toFixed(2)}</p>
												)}
												{shipment.insurance_selected && shipment.insurance_premium !== null && shipment.insurance_premium !== undefined && (
													<p className="text-sm text-green-700">Insurance Premium: ₹{shipment.insurance_premium.toFixed(2)}</p>
												)}
												{shipment.insurance_selected && (
													<p className="text-sm text-blue-600">Insurance Selected: Yes</p>
												)}
												{!shipment.insurance_selected && shipment.declared_value !== null && shipment.declared_value !== undefined && (
													<p className="text-sm text-red-600">Insurance Selected: No</p>
												)}
											</div>
											<Button
												variant="link"
												onClick={() => handleViewShipment(shipment)}
											>
												View Shipment
											</Button>
										</li>
```

**Explanation:** This provides administrators with a clear overview of the insurance status and costs for each shipment directly within the order details modal.

### Step 6: Create Insurance Rates Page (`src/app/(public)/insurance-rates/page.tsx`)

This step involves creating a new public-facing page to display the detailed insurance rate structure.

**Objective:** To provide users with a clear and accessible reference for insurance premiums and compensation.

**File to Create:** `C:/Users/naman/Documents/GitHub/nexgen/src/app/(public)/insurance-rates/page.tsx`

**Content for the new file:**

```typescript
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

const InsuranceRatesPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Insurance Rates & Policy</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>General Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">
            For shipments with a declared value above ₹5,000, insurance becomes mandatory and must be included in the rate calculation if selected.
          </p>
          <p className="mb-2">
            Shipments with a declared value above ₹25,000 must have mandatory protection (insurance).
          </p>
          <p className="font-bold text-red-600">
            Shipments with a declared value over ₹49,999 are not accepted.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Premium and Compensation Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Declared Value Range</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compensation Coverage</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">₹1 – ₹2,499</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹100 (Flat)</td>
                  <td className="px-6 py-4 whitespace-nowrap">100% of Actual Rate</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">₹2,500 – ₹5,000</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹100 (Flat)</td>
                  <td className="px-6 py-4 whitespace-nowrap">80% of Actual Rate</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">₹5,001 – ₹12,999</td>
                  <td className="px-6 py-4 whitespace-nowrap">2% of Actual Rate</td>
                  <td className="px-6 py-4 whitespace-nowrap">80% of Actual Rate</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">₹13,000 – ₹21,999</td>
                  <td className="px-6 py-4 whitespace-nowrap">2.1% – 2.9% of Actual Rate*</td>
                  <td className="px-6 py-4 whitespace-nowrap">58% – 78% Coverage*</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">₹22,000 – ₹26,999</td>
                  <td className="px-6 py-4 whitespace-nowrap">3% of Actual Rate*</td>
                  <td className="px-6 py-4 whitespace-nowrap">51% – 55% Coverage*</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">₹27,000 – ₹49,999</td>
                  <td className="px-6 py-4 whitespace-nowrap">3% of Actual Rate</td>
                  <td className="px-6 py-4 whitespace-nowrap">50% Coverage</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            *Note: For the ranges ₹13,000 – ₹21,999 and ₹22,000 – ₹26,999, the exact premium percentage and compensation coverage may vary based on specific internal risk assessments. Please contact support for precise details for these ranges.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Declared Value</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Declared values are required for each shipment primarily for display to the admin. Insurance will be calculated on the actual rate based on the declared value.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsuranceRatesPage;
```

**Explanation:** This page provides a user-friendly table summarizing the insurance policy, premiums, and compensation. It also includes a note about the ranges that require further clarification, as identified in Step 3.1.2.

### Step 7: Update Footer (`src/components/Footer.tsx`)

This step adds a link to the newly created insurance rates page in the application's footer.

**Objective:** To make the insurance policy easily discoverable from any page.

**File to Modify:** `C:/Users/naman/Documents/GitHub/nexgen/src/components/Footer.tsx`

**Current Snippet (within `Footer` component, example link structure):**

```typescript
            <Link href="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms-conditions" className="hover:underline">
              Terms & Conditions
            </Link>
```

**Modification:** Add a new `Link` for "Insurance Rates". The exact placement might vary based on existing footer structure, but it should be logically grouped with other policy links.

**New Snippet (example placement, adjust as needed):**

```typescript
            <Link href="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms-conditions" className="hover:underline">
              Terms & Conditions
            </Link>
            <Link href="/insurance-rates" className="hover:underline">
              Insurance Rates
            </Link>
```

**Explanation:** This ensures that users can easily navigate to the insurance policy details from the footer of the application.

### Step 8: Order Creation and Wallet Deduction (`src/server/api/routers/order.ts`)

This crucial step ensures that the total cost of the order, including insurance, is correctly calculated and deducted from the user's wallet.

**Objective:** To update the `createShipment` and `createBulkShipments` mutations to handle the total cost (shipping + insurance) and manage wallet transactions.

**File to Modify:** `C:/Users/naman/Documents/GitHub/nexgen/src/server/api/routers/order.ts`

**Note:** This file is not provided in the initial context, but based on the file structure, it's the logical place for order creation mutations. I will assume the existence of `createShipment` and `createBulkShipments` mutations within this file.

#### 8.1: Modify `createShipment` Mutation

**Objective:** Calculate total cost, deduct from wallet, and record transaction.

**Assumed Current Structure (within `createShipment` mutation):**

```typescript
// ... imports and procedure definition ...
createShipment: protectedProcedure
  .input(submitShipmentSchema)
  .mutation(async ({ input, ctx }) => {
    const { user, prisma } = ctx;
    // ... existing logic to create shipment ...
    // Assume shipping_cost is already calculated and available in input or derived
    const shippingCost = input.shippingCost; // Placeholder, adjust based on actual implementation

    // ... create shipment in DB ...
    const newShipment = await prisma.shipment.create({
      data: {
        // ... shipment data ...
        shipping_cost: shippingCost,
        // ... other fields ...
      },
    });

    // ... return success ...
  });
```

**Modification:**
1.  Fetch the user's wallet.
2.  Calculate the `total_amount` for the order, including `shipping_cost` and `insurance_premium`.
3.  Check if the user has sufficient balance.
4.  Deduct the amount from the wallet.
5.  Create a `Transaction` record.
6.  Update the `Order` and `Shipment` records with the final amounts and insurance details.

**New Snippet (conceptual, adjust based on actual `createShipment` implementation):**

```typescript
// ... imports and procedure definition ...
import { TRPCError } from "@trpc/server"; // Add this import if not present
import { TRANSACTION_TYPE, PAYMENT_STATUS, ORDER_PAYMENT_STATUS, ORDER_STATUS } from "@prisma/client"; // Add this import if not present

createShipment: protectedProcedure
  .input(submitShipmentSchema) // This schema will now include declaredValue and insuranceSelected
  .mutation(async ({ input, ctx }) => {
    const { user, prisma } = ctx;

    if (!user?.user_id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated." });
    }

    // 1. Calculate the total shipping cost including insurance premium
    // This will require calling the rate calculation logic again or ensuring it's passed from frontend
    // For simplicity, let's assume we re-calculate or get it from a trusted source.
    // In a real scenario, you'd likely call findRate here with all parameters.
    // For now, we'll assume input.shipping_cost and input.insurance_premium are available
    // or can be derived from input.packageWeight, input.declaredValue, etc.
    // This part needs careful integration with the rate calculation logic.

    // Placeholder for actual rate calculation result
    // In a real implementation, you'd call findRate here with all necessary parameters
    // to get the final rate and insurance premium.
    const { rate: totalShippingCost, insurancePremium: calculatedInsurancePremium } = await findRate({
        userId: user.user_id,
        zoneFrom: "z", // Assuming 'z' as placeholder
        zoneTo: "z", // Assuming 'z' as placeholder
        weightSlab: Math.ceil(input.packageWeight * 2) / 2,
        packageWeight: input.packageWeight,
        isUserRate: true, // Or false, depending on user-specific rates
        declaredValue: input.declaredValue,
        insuranceSelected: input.insuranceSelected,
    });

    if (totalShippingCost === null) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to calculate shipping rate." });
    }

    const totalOrderAmount = totalShippingCost; // totalShippingCost already includes insurancePremium

    // 2. Fetch user's wallet
    const userWallet = await prisma.wallet.findUnique({
      where: { user_id: user.user_id },
    });

    if (!userWallet) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User wallet not found." });
    }

    // 3. Check if user has sufficient balance
    if (userWallet.balance.lessThan(totalOrderAmount)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient wallet balance." });
    }

    // Use a Prisma transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 4. Deduct the amount from the wallet
      const updatedWallet = await tx.wallet.update({
        where: { wallet_id: userWallet.wallet_id },
        data: {
          balance: {
            decrement: totalOrderAmount,
          },
        },
      });

      // 5. Create an Order record
      const newOrder = await tx.order.create({
        data: {
          user_id: user.user_id,
          total_amount: totalOrderAmount,
          payment_status: PAYMENT_STATUS.Completed, // Assuming immediate payment via wallet
          order_status: ORDER_STATUS.PendingApproval, // Or whatever initial status is appropriate
        },
      });

      // 6. Create a Transaction record
      await tx.transaction.create({
        data: {
          user_id: user.user_id,
          transaction_type: TRANSACTION_TYPE.Debit,
          amount: totalOrderAmount,
          payment_status: PAYMENT_STATUS.Completed,
          order_id: newOrder.order_id,
          description: `Shipment order ${newOrder.order_id}`,
        },
      });

      // 7. Create Shipment record
      const newShipment = await tx.shipment.create({
        data: {
          human_readable_shipment_id: generateShipmentId(user.user_id), // Assuming generateShipmentId exists
          order_id: newOrder.order_id,
          current_status: SHIPMENT_STATUS.Booked, // Or appropriate initial status
          origin_address_id: input.originAddressId,
          destination_address_id: input.destinationAddressId,
          recipient_name: input.recipientName,
          recipient_mobile: input.recipientMobile,
          package_image_url: input.packageImage.data, // Assuming base64 data is stored directly or uploaded to S3
          package_weight: input.packageWeight,
          package_dimensions: `${input.packageLength}x${input.packageBreadth}x${input.packageHeight}`,
          shipping_cost: totalShippingCost, // This now includes insurance
          declared_value: input.declaredValue, // New
          insurance_selected: input.insuranceSelected, // New
          insurance_premium: calculatedInsurancePremium, // New
          // label_url: ... (if generated here)
        },
      });

      return newShipment; // Or newOrder, depending on what needs to be returned
    });

    return result;
  });
```

**Explanation:** This comprehensive update ensures that the `createShipment` mutation is robust, handles financial transactions, and correctly stores all insurance-related data.

#### 8.2: Modify `createBulkShipments` Mutation

**Objective:** Iterate through bulk shipments, calculate total cost for each, deduct from wallet, and record transactions.

**Assumed Current Structure (within `createBulkShipments` mutation):**

```typescript
// ... imports and procedure definition ...
createBulkShipments: protectedProcedure
  .input(bulkShipmentsSchema) // This schema will now include declaredValue and insuranceSelected
  .mutation(async ({ input, ctx }) => {
    const { user, prisma } = ctx;
    const results: { recipientName: string; status: "success" | "error"; message: string; shipmentId?: string }[] = [];

    for (const shipmentInput of input.shipments) {
      try {
        // ... existing logic to create single shipment from bulk ...
        // Assume shipping_cost is already calculated or derived
        const shippingCost = shipmentInput.shippingCost; // Placeholder

        // ... create shipment in DB ...
        const newShipment = await prisma.shipment.create({
          data: {
            // ... shipment data ...
            shipping_cost: shippingCost,
            // ... other fields ...
          },
        });
        results.push({ recipientName: shipmentInput.recipientName, status: "success", message: "Shipment created.", shipmentId: newShipment.shipment_id });
      } catch (error) {
        results.push({ recipientName: shipmentInput.recipientName, status: "error", message: (error as Error).message });
      }
    }
    return results;
  });
```

**Modification:**
1.  For each shipment in the bulk input, perform the same rate calculation and wallet deduction logic as in `createShipment`.
2.  Handle potential errors for individual shipments gracefully, allowing other shipments in the bulk request to proceed.
3.  Aggregate results for each shipment.

**New Snippet (conceptual, adjust based on actual `createBulkShipments` implementation):**

```typescript
// ... imports and procedure definition ...
import { TRPCError } from "@trpc/server"; // Add this import if not present
import { TRANSACTION_TYPE, PAYMENT_STATUS, ORDER_PAYMENT_STATUS, ORDER_STATUS } from "@prisma/client"; // Add this import if not present

createBulkShipments: protectedProcedure
  .input(bulkShipmentsSchema) // This schema will now include declaredValue and insuranceSelected
  .mutation(async ({ input, ctx }) => {
    const { user, prisma } = ctx;
    const results: { recipientName: string; status: "success" | "pending" | "error"; message: string; shipmentId?: string }[] = [];

    if (!user?.user_id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated." });
    }

    // Fetch user's wallet once for the bulk operation
    const userWallet = await prisma.wallet.findUnique({
      where: { user_id: user.user_id },
    });

    if (!userWallet) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User wallet not found." });
    }

    let currentWalletBalance = userWallet.balance;

    for (const shipmentInput of input.shipments) {
      try {
        // 1. Calculate the total shipping cost including insurance premium for this shipment
        const { rate: totalShippingCost, insurancePremium: calculatedInsurancePremium } = await findRate({
            userId: user.user_id,
            zoneFrom: "z", // Assuming 'z' as placeholder
            zoneTo: "z", // Assuming 'z' as placeholder
            weightSlab: Math.ceil(shipmentInput.packageWeight * 2) / 2,
            packageWeight: shipmentInput.packageWeight,
            isUserRate: true, // Or false
            declaredValue: shipmentInput.declaredValue,
            insuranceSelected: shipmentInput.insuranceSelected,
        });

        if (totalShippingCost === null) {
            throw new Error("Failed to calculate shipping rate for this shipment.");
        }

        const totalShipmentAmount = totalShippingCost; // totalShippingCost already includes insurancePremium

        // Check balance before processing each shipment
        if (currentWalletBalance.lessThan(totalShipmentAmount)) {
          results.push({ recipientName: shipmentInput.recipientName, status: "error", message: "Insufficient wallet balance for this shipment." });
          continue; // Skip to the next shipment
        }

        // Use a Prisma transaction for each individual shipment to ensure atomicity
        const shipmentResult = await prisma.$transaction(async (tx) => {
          // Deduct the amount from the wallet
          const updatedWallet = await tx.wallet.update({
            where: { wallet_id: userWallet.wallet_id },
            data: {
              balance: {
                decrement: totalShipmentAmount,
              },
            },
          });
          currentWalletBalance = updatedWallet.balance; // Update local balance for subsequent checks

          // Create an Order record (one order per shipment for bulk, or a single order for all shipments?)
          // Assuming one order per shipment for simplicity in this bulk context.
          // If a single order for all bulk shipments is desired, this logic needs to be adjusted.
          const newOrder = await tx.order.create({
            data: {
              user_id: user.user_id,
              total_amount: totalShipmentAmount,
              payment_status: PAYMENT_STATUS.Completed,
              order_status: ORDER_STATUS.PendingApproval,
            },
          });

          // Create a Transaction record
          await tx.transaction.create({
            data: {
              user_id: user.user_id,
              transaction_type: TRANSACTION_TYPE.Debit,
              amount: totalShipmentAmount,
              payment_status: PAYMENT_STATUS.Completed,
              order_id: newOrder.order_id,
              description: `Bulk shipment order ${newOrder.order_id} for ${shipmentInput.recipientName}`,
            },
          });

          // Create Shipment record
          const newShipment = await tx.shipment.create({
            data: {
              human_readable_shipment_id: generateShipmentId(user.user_id),
              order_id: newOrder.order_id,
              current_status: SHIPMENT_STATUS.Booked,
              origin_address_id: "placeholder_origin_id", // This needs to be resolved from address line/zip code
              destination_address_id: "placeholder_destination_id", // This needs to be resolved
              recipient_name: shipmentInput.recipientName,
              recipient_mobile: shipmentInput.recipientMobile,
              package_image_url: shipmentInput.packageImage.data,
              package_weight: shipmentInput.packageWeight,
              package_dimensions: `${shipmentInput.packageLength}x${shipmentInput.packageBreadth}x${shipmentInput.packageHeight}`,
              shipping_cost: totalShippingCost,
              declared_value: shipmentInput.declaredValue,
              insurance_selected: shipmentInput.insuranceSelected,
              insurance_premium: calculatedInsurancePremium,
              // label_url: ...
            },
          });
          return newShipment;
        });
        results.push({ recipientName: shipmentInput.recipientName, status: "success", message: "Shipment created.", shipmentId: shipmentResult.shipment_id });
      } catch (error) {
        results.push({ recipientName: shipmentInput.recipientName, status: "error", message: (error as Error).message });
      }
    }
    return results;
  });
```

**Explanation:** This bulk mutation processes each shipment individually within a transaction, ensuring that wallet deductions and record creations are atomic. It also handles insufficient balance for individual shipments and aggregates results.

**Important Considerations for Bulk Shipments:**
*   **Address Resolution:** For bulk shipments, the `originAddressLine`, `originZipCode`, etc., from the Excel file need to be resolved into actual `address_id`s in the database. This might involve:
    *   Searching existing addresses.
    *   Creating new addresses if they don't exist.
    *   This logic is currently simplified with "placeholder_origin_id" and "placeholder_destination_id" and needs to be fully implemented.
*   **Single Order vs. Multiple Orders:** The current conceptual snippet creates a new `Order` for each `Shipment` in a bulk upload. If the requirement is to create a *single* `Order` that encompasses *all* shipments in a bulk upload, the logic for `Order` creation and `total_amount` calculation needs to be significantly refactored to happen once before the shipment loop.

## Next Steps

After reviewing these comprehensive and detailed steps, please confirm if you would like to proceed with the implementation. If any further clarifications or modifications are required, please let me know.