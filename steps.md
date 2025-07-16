# Insurance Feature Implementation Steps

This document outlines the steps required to implement the new insurance feature for shipments.

## 1. Database Schema Update

*   **Modify `prisma/schema.prisma`**: Add new fields to the `Shipment` model to store `declared_value`, `is_insurance_selected`, `insurance_premium`, and `compensation_amount`.

    ```prisma
    // Example:
    model Shipment {
      // ... existing fields
      declared_value        Decimal? @db.Decimal(10, 2)
      is_insurance_selected Boolean  @default(false)
      insurance_premium     Decimal? @db.Decimal(10, 2)
      compensation_amount   Decimal? @db.Decimal(10, 2)
      // ...
    }
    ```

*   **Run Prisma Migrations**: After updating the schema, generate and apply a new migration to update the database.

    ```bash
    npx prisma migrate dev --name add_insurance_fields_to_shipment
    ```

## 2. Zod Schema Update (`src/schemas/order.ts`)

*   **Update `submitShipmentSchema`**: Add `declaredValue` (optional, `z.number().optional()`) and `isInsuranceSelected` (boolean, `z.boolean().optional()`) to this schema, as these will be sent from the individual shipment creation form.
*   **Update `excelShipmentSchema`**: Add `declaredValue` (optional, `z.number().optional()`) and `isInsuranceSelected` (boolean, `z.boolean().optional()`) to this schema, as these will be part of the bulk upload.

## 3. Backend Logic: Insurance Calculation (`src/lib/rate-calculator.ts` or new `src/lib/insurance.ts`)

*   **Create a new utility function**: It's best to create a dedicated function for insurance calculation. This could be in `src/lib/rate-calculator.ts` or a new `src/lib/insurance.ts` file. Let's call it `calculateInsurancePremium`.
*   **`calculateInsurancePremium` function**:
    *   **Inputs**: `actualRate: number` (the base shipping rate calculated by `findRate`), `declaredValue: number`, `isInsuranceSelected: boolean` (from user input).
    *   **Logic**:
        *   **Mandatory Insurance Check**: If `actualRate > 5000` and `isInsuranceSelected` is `false`, throw an error indicating insurance is mandatory.
        *   **Shipment Value Limit**: If `actualRate > 49999`, throw an error indicating shipments over this value are not accepted.
        *   **Mandatory Protection**: If `actualRate > 25000`, ensure `isInsuranceSelected` is `true`. If not, throw an error.
        *   **Premium and Compensation Structure**:
            *   **Declared Value Tiers (if `isInsuranceSelected` is true):**
                *   **₹1–₹2,499 (Declared Value)**: Flat premium of ₹100. Compensation: 100% of declared value.
                *   **₹2,500–₹5,000 (Declared Value)**: Flat premium of ₹100. Compensation: 80% of declared value.
            *   **Actual Rate Tiers (if `isInsuranceSelected` is true and `declaredValue` is above ₹5,000 or not provided):**
                *   **₹5,001–₹12,999 (Actual Rate)**: Premium: 2% of actual rate. Compensation: 80% of actual rate.
                *   **₹13,000–₹21,999 (Actual Rate)**: Premium: 2.1–2.9% (linearly increasing) with 58–78% coverage (linearly increasing).
                *   **₹22,000–₹26,999 (Actual Rate)**: Premium: 3% with 51–55% coverage (linearly increasing).
                *   **₹27,000–₹49,999 (Actual Rate)**: Premium: 3% of actual rate. Compensation: 50% of actual rate.
        *   Return the calculated `insurancePremium` and `compensationAmount`.
*   **Integrate into `src/server/api/routers/order.ts`**: For now, we will integrate the insurance calculation directly into the `createShipment` and `createBulkShipments` procedures in `src/server/api/routers/order.ts` after the base rate is obtained. If the logic becomes too complex, we can consider modifying `findRate` to return an object that includes the base rate and then pass that to the new insurance function.

## 4. Backend Logic: API Endpoints (`src/server/api/routers/order.ts`)

*   **Modify `createShipment` procedure**:\
    *   Update the input to accept `declaredValue` and `isInsuranceSelected`.
    *   After `findRate` returns the `rate` (base shipping cost), call the new `calculateInsurancePremium` function with `rate`, `input.declaredValue`, and `input.isInsuranceSelected`.
    *   Add the `insurancePremium` to the `shipping_cost` of the shipment.
    *   Store `input.declaredValue`, `input.isInsuranceSelected`, `insurancePremium`, and `compensationAmount` in the `Shipment` model when creating the order.
    *   Handle any errors thrown by `calculateInsurancePremium` (e.g., mandatory insurance not selected, value too high).
*   **Modify `createBulkShipments` procedure**:\
    *   Update the input to accept `declaredValue` and `isInsuranceSelected` for each shipment item.
    *   In the `db.$transaction` block, after `findBulkRates` returns the `calculatedRates`, iterate through each shipment.
    *   For each shipment, call `calculateInsurancePremium` with its base rate, `declaredValue`, and `isInsuranceSelected`.
    *   Add the `insurancePremium` to the `shipping_cost` for each shipment.
    *   Ensure `declared_value`, `is_insurance_selected`, `insurance_premium`, and `compensation_amount` are stored for each shipment created in bulk.
    *   Handle errors for individual shipments in the bulk process.

## 5. Frontend: Individual Shipments (`src/app/(user)/dashboard/create-shipment/page.tsx`)

*   **Add `declaredValue` input field**:\
    *   Include a numeric input field for `declaredValue` in the shipment creation form.
    *   Bind it to `react-hook-form` using `register`.
*   **Add Insurance Checkbox**:\
    *   Add a checkbox or toggle for `isInsuranceSelected`.
    *   Bind it to `react-hook-form` using `register`.
    *   Add a link next to the insurance checkbox that directs to the new insurance rates page (e.g., `/insurance-rates`).
*   **Update `handleCalculateRate`**:\
    *   Retrieve the values of `declaredValue` and `isInsuranceSelected` from the form.
    *   Pass these values to the `api.rate.calculateRate.useQuery` call (you'll need to update the `calculateRate` tRPC procedure to accept these, or create a new tRPC procedure specifically for rate + insurance calculation).
*   **Update `onSubmit`**:\
    *   Ensure `declaredValue` and `isInsuranceSelected` are included in the data sent to `createShipmentMutation.mutate`.
*   **Display Rate**:\
    *   Adjust the display of `calculatedRate` to clearly show the base rate and the added insurance premium.

## 6. Frontend: Bulk Shipments (Excel Upload)

*   **Update Excel Template (`public/templates/sample_bulk_shipments.xlsx`)**:\
    *   Add a new column named "Declared Value".
    *   Add a new column named "Insurance" (e.g., expecting "Yes" or "No", or "True" or "False").
*   **Update Bulk Upload Processing Logic**:\
    *   The `generate_sample_shipments.cjs` script is for generating samples. The actual bulk upload processing logic will be in the backend (likely a tRPC endpoint that receives the parsed Excel data).
    *   Modify the backend logic that reads and processes the uploaded Excel file (e.g., using `xlsx` library, as seen in `package.json`).
    *   Ensure it correctly parses the "Declared Value" and "Insurance" columns.
    *   Map these values to the `declaredValue` and `isInsuranceSelected` fields in the `excelShipmentSchema` before sending them to the `createBulkShipments` API.

## 7. Frontend: Admin Interface

*   **Display `declared_value`**:\
    *   Locate the relevant admin page for viewing order/shipment details (e.g., `src/app/(admin)/admin/order-approve/page.tsx` or similar).
    *   Update the UI to display the `declared_value` from the `Shipment` model.

## 8. Frontend: Insurance Rates Page

*   **Create New Page**: Create a new page (e.g., `src/app/(public)/insurance-rates/page.tsx`) to display the insurance rates and compensation structure.
*   **Add to Footer**: Add a link to this new page in the `src/components/Footer.tsx` component. Adhere to the existing styling and structure of the footer.

## 9. Testing

*   **Unit Tests**:\
    *   Write comprehensive unit tests for the new `calculateInsurancePremium` function, covering all premium slabs, compensation percentages, mandatory insurance conditions, and value limits (e.g., > ₹25,000, > ₹49,999).
*   **Integration Tests**:\
    *   Test the `createShipment` and `createBulkShipments` tRPC procedures with various combinations of `actualRate`, `declaredValue`, and `isInsuranceSelected` to ensure correct rate calculation, wallet deductions, and error handling.
*   **Frontend E2E Tests**:\
    *   Test the individual shipment creation form: verify `declaredValue` input, `isInsuranceSelected` checkbox, dynamic rate updates, and client-side/server-side validation messages.
    *   Test the bulk shipment upload process: upload Excel files with and without insurance, and with different declared values, to ensure correct processing and error handling.
*   **Manual Testing**:\
    *   Thoroughly test the entire user flow for both individual and bulk shipments, covering all scenarios outlined in the requirements.
    *   Verify the display of `declared_value` in the admin interface.
    *   Verify the new insurance rates page and its link in the footer.
