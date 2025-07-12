# Steps to Implement Admin Approval for Pickup Locations

This document outlines the steps taken to implement the new feature requiring admin approval for pickup locations and restricting them to specific states.

## 1. Prisma Schema Modification

**Goal:** Introduce a new `PendingAddress` model to store addresses awaiting admin approval.

- **Action:** Added the `PendingAddress` model to `prisma/schema.prisma`.

  ```prisma
  model PendingAddress {
    pending_address_id String   @id @default(uuid())
    zip_code           Int
    city               String
    state              String
    address_line       String
    name               String
    user_id            String
    is_approved        Boolean  @default(false)
    created_at         DateTime @default(now())

    user User @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  }
  ```

- **Action:** Added the inverse relation `pendingAddresses PendingAddress[]` to the `User` model in `prisma/schema.prisma`.

  ```prisma
  model User {
    // ... existing fields
    addresses        Address[]
    userRates        UserRate[]
    pendingAddresses PendingAddress[] // Added this line
  }
  ```

- **Verification:** Ran `npx prisma db push` to apply the schema changes to the database.

## 2. Address Validation Utility

**Goal:** Create a utility function to validate addresses based on pincode and allowed states.

- **Action:** Created a new file `src/lib/address-utils.ts`.

- **Content:** Implemented `isAllowedState` and `validateAddressForPickup` functions. The `validateAddressForPickup` function leverages the existing `getPincodeDetails` from `~/lib/rate-calculator` to ensure consistency and avoid code duplication.

  ```typescript
  import { getPincodeDetails } from "~/lib/rate-calculator";
  import logger from "~/lib/logger";

  const ALLOWED_STATES = [
  	"DELHI",
  	"UTTAR PRADESH",
  	"HARYANA",
  	"BIHAR",
  	"WEST BENGAL",
  ];

  export function isAllowedState(state: string): boolean {
  	return ALLOWED_STATES.includes(state.toUpperCase());
  }

  export async function validateAddressForPickup(pincode: string, state: string): Promise<boolean> {
  	const details = await getPincodeDetails(pincode);

  	if (!details) {
  		logger.warn("Pincode not found during address validation", { pincode, state });
  		return false; // Pincode not found
  	}

  	// Check if the state from the pincode matches the provided state and is in the allowed list
  	const isValid = details.state.toUpperCase() === state.toUpperCase() && isAllowedState(state);

  	if (!isValid) {
  		logger.warn("Address validation failed for pickup", { pincode, state, foundState: details.state });
  	}

  	return isValid;
  }
  ```

## 3. Modify Address Creation

**Goal:** Reroute new pickup address submissions to the `PendingAddress` table.

- **Action:** Modified the `createAddress` mutation in `src/server/api/routers/address.ts`.
- **Modification:** If the `type` of the address is `ADDRESS_TYPE.Warehouse`:
    - It now calls `validateAddressForPickup` to check if the state is allowed.
    - If valid, the address is created in the `PendingAddress` table.
    - If invalid, a `TRPCError` is thrown.
    - Other address types continue to be created directly in the `Address` table.

## 4. Admin Approval Flow

**Goal:** Implement the admin interface and logic for approving/rejecting pending addresses.

- **Action:** Added new mutations and queries to `src/server/api/routers/admin.ts`:
    - `pendingAddresses`: A query to fetch all pending addresses.
    - `approvePendingAddress`: A mutation to approve a pending address. It moves the address from `PendingAddress` to `Address` table within a transaction and then deletes it from `PendingAddress`.
    - `rejectPendingAddress`: A mutation to reject a pending address. It deletes the address from `PendingAddress` within a transaction.

- **Action:** Added new Zod schemas for `approvePendingAddress` and `rejectPendingAddress` in `src/schemas/address.ts`.

  ```typescript
  export const approvePendingAddressSchema = z.object({
    pendingAddressId: z.string(),
  });

  export const rejectPendingAddressSchema = z.object({
    pendingAddressId: z.string(),
  });
  ```

## 5. Update API Endpoints (Next Steps)

**Goal:** Ensure all relevant API endpoints correctly interact with the new `PendingAddress` model and validation logic.

- **Action:** Review any other parts of the application that create or manage addresses to ensure they adhere to the new workflow.

## 6. UI Implementation (Next Steps)

**Goal:** Develop an admin dashboard page to display pending addresses and provide approve/reject actions.

- **Action:** Create a new page (e.g., `src/app/(admin)/admin/pending-addresses/page.tsx`) to list pending addresses.
- **Action:** Implement UI elements to trigger the `approvePendingAddress` and `rejectPendingAddress` mutations.