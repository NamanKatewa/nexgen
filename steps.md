# Insurance Logic Modification

## Current Flow:
The current insurance logic, primarily defined in `src/lib/insurance.ts`, mandates insurance for shipments with an `actualRate` above ₹5,000. The `calculateInsurancePremium` function determines the premium and compensation based on the `actualRate` and whether insurance is selected. This function is utilized in the order and rate calculation routers on the backend.

## Proposed Changes:

### Step 1: Update `src/lib/insurance.ts`
*   **Modification:** Change the mandatory insurance threshold from `actualRate > 5000` to `actualRate > 25000`.
*   **Reasoning:** To align with the new business requirement for mandatory insurance on orders above ₹25,000.
*   **Impact:** This will directly affect when insurance becomes compulsory for users.

### Step 2: Update `src/lib/insurance.test.ts`
*   **Modification:** Adjust existing test cases and add new ones to validate the updated mandatory insurance threshold and any related changes in premium/compensation calculations within `calculateInsurancePremium`.
*   **Reasoning:** To ensure the insurance calculation logic functions correctly after the threshold change and to maintain test coverage.
*   **Impact:** Ensures the reliability and correctness of the insurance logic.

### Step 3: Database Schema Changes (`prisma/schema.prisma`)
*   **Modification:**
    *   Add a new field, `invoiceUrl` (type `String?`), to the `Shipment` model to store the URL/path of the user-uploaded invoice.
*   **Reasoning:** To persist the uploaded user invoice associated with each shipment, aligning with the per-shipment nature of insurance.
*   **Impact:** Requires a database migration.

### Step 4: Backend API Changes (`src/server/api/routers/order.ts`, `src/server/api/routers/rate.ts`)
*   **Modification (Existing Routers):**
    *   Update the logic in `src/server/api/routers/order.ts` and `src/server/api/routers/rate.ts` where `calculateInsurancePremium` is called, ensuring the new ₹25,000 threshold is correctly applied for mandatory insurance checks.
    *   Integrate the invoice file upload logic directly into the order/shipment creation or update process. This will involve handling the file upload (likely using `src/lib/s3.ts` for S3 upload) and storing the returned S3 URL in the `invoiceUrl` field of the corresponding `Shipment` in the database.
*   **Reasoning:** To enforce the new mandatory insurance threshold and enable invoice uploads within the existing order creation workflow.
*   **Impact:** Affects order/shipment creation/update flows and introduces new file handling capabilities.

### Step 5: Frontend Changes (UI Components and Pages)
*   **Modification:**
    *   Update any UI components or pages (e.g., `src/app/(user)/dashboard/create-shipment/page.tsx`, `src/components/ShipmentDetailsModal.tsx`) that display or interact with insurance selection to reflect the new ₹25,000 mandatory threshold.
    *   Add a file input component (e.g., using `input` type `file` and integrating with existing UI library components like `ui/input.tsx`) to allow users to upload their invoice during the shipment creation process.
    *   For bulk shipment creation (`src/app/(user)/dashboard/create-bulk-shipment/page.tsx`), ensure there's a mechanism to upload an invoice for each individual shipment where insurance is selected.
    *   Implement client-side logic to send the uploaded file as part of the shipment creation/update request.
    *   Display the uploaded invoice URL on relevant shipment detail pages in both the user and **admin** interfaces.
*   **Reasoning:** To provide a seamless user experience that reflects the updated insurance policy and allows for invoice management, and to ensure administrators can view the uploaded invoices.
*   **Impact:** Changes to user-facing forms and shipment display in both user and admin dashboards.

This detailed plan ensures all aspects of the change are covered, from backend logic and database schema to frontend user experience, while adhering to existing project standards.
