## Bulk Shipment UI Fix

### 1. Update `excelShipmentSchema` in `src/schemas/order.ts`

- **Change:** Modified the `excelShipmentSchema` to make the `declaredValue` and `isInsuranceSelected` fields required.
- **Reason:** To ensure that these fields are always provided when creating a bulk shipment.

### 2. Update `handleFileUpload` in `src/app/(user)/dashboard/create-bulk-shipment/page.tsx`

- **Change:** Updated the `handleFileUpload` function to parse the `declaredValue` and `isInsuranceSelected` fields from the uploaded Excel file.
- **Reason:** To correctly handle the new required fields.

### 3. Update UI in `src/app/(user)/dashboard/create-bulk-shipment/page.tsx`

- **Change:** Added "Declared Value" and "Insurance" headers and input fields to the UI.
- **Reason:** To allow users to see and edit the new fields.

### 4. Update `calculateBulkRates` in `src/server/api/routers/rate.ts`

- **Change:** Modified the `calculateBulkRates` endpoint to accept `declaredValue` and `isInsuranceSelected` and return the calculated insurance premium separately.
- **Reason:** To provide a more detailed breakdown of the shipping costs.

### 5. Update UI in `src/app/(user)/dashboard/create-bulk-shipment/page.tsx`

- **Change:** Updated the UI to display the insurance premium separately from the shipping rate.
- **Reason:** To provide a more detailed breakdown of the shipping costs.

### 6. Fix `validateAddressForPickup` in `src/lib/address-utils.ts`

- **Change:** Modified `validateAddressForPickup` to accept only `zipCode` and use `getPincodeDetails` to get the canonical state for validation.
- **Reason:** To ensure serviceability checks are based on the authoritative pincode data, not potentially incorrect user-provided state strings.

### 7. Update `createBulkShipments` in `src/server/api/routers/order.ts`

- **Change:** Updated the call to `validateAddressForPickup` to pass only the `zipCode`.
- **Reason:** To align with the changes in `validateAddressForPickup` and ensure correct validation flow.