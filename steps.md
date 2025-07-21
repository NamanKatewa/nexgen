## Add optional landmark field to addresses

### Current Flow
Addresses in the system currently do not have a dedicated field for landmarks. This means users cannot provide additional navigational information for their addresses, which can lead to delivery issues or confusion.

### Modifications
1.  **Modified `prisma/schema.prisma`**: Added an optional `landmark` field to the `Address` model.
    ```prisma
    model Address {
      address_id            String     @id @default(uuid())
      zip_code              Int
      city                  String
      state                 String
      address_line          String
      landmark              String? // Added this line
      name                  String
      type                  ADDRESS_TYPE
      user_id               String

      kyc                   Kyc?
      origin_shipments      Shipment[] @relation("Origin")
      destination_shipments Shipment[] @relation("Destination")
      user                  User       @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
    }
    ```
2.  **Generated new Prisma client**: Ran `npx prisma generate` to update the Prisma client to reflect the schema changes.
3.  **Modified `src/schemas/address.ts`**: Added an optional `landmark` field to the `addressSchema` Zod object.
    ```typescript
    export const addressSchema = z.object({
      // ... existing fields
      addressLine: z.string().min(1, "Address is required"),
      landmark: z.string().optional(), // Added this line
      name: z.string().min(1, "Name is required"),
    });
    ```
4.  **Modified `src/server/api/routers/address.ts`**: Updated the `createAddress` mutation to include the `landmark` field when creating new addresses (both regular and pending warehouse addresses).
    ```typescript
    // For pendingAddress creation
    const pendingAddress = await ctx.db.pendingAddress.create({
        data: {
            // ... existing fields
            address_line: input.addressLine,
            landmark: input.landmark || null, // Added this line
            name: input.name,
            // ...
        },
    });

    // For regular address creation
    const address = await ctx.db.address.create({
        data: {
            // ... existing fields
            address_line: input.addressLine,
            landmark: input.landmark || null, // Added this line
            name: input.name,
            // ...
        },
    });
    ```
5.  **Modified `src/components/AddAddressModal.tsx`**: Added an optional input field for `landmark` in the address creation modal.
    ```typescript
    <div className="space-y-2">
        <Label htmlFor="addressLine">Address Line</Label>
        <Input
            id="addressLine"
            {...register("addressLine")}
            disabled={isLoading}
        />
        <FieldError message={errors.addressLine?.message} />
    </div>
    <div className="space-y-2">
        <Label htmlFor="landmark">Landmark (Optional)</Label>
        <Input
            id="landmark"
            {...register("landmark")}
            disabled={isLoading}
        />
        <FieldError message={errors.landmark?.message} />
    </div>
    ```
6.  **Modified `src/server/api/routers/admin.ts`**: Updated the `approvePendingAddress` mutation to transfer the `landmark` field from `pendingAddress` to the newly created `address`.
    ```typescript
    await prisma.address.create({
        data: {
            // ... existing fields
            address_line: pendingAddress.address_line,
            landmark: pendingAddress.landmark, // Added this line
            name: pendingAddress.name,
            // ...
        },
    });
    ```
7.  **Modified `src/lib/label-template.ts`**: Included the `landmark` field in the shipping label template for both origin and destination addresses.
    ```typescript
    // For destination address
    <p>
        ${shipment.destination_address?.address_line},
        ${shipment.destination_address?.landmark ? `${shipment.destination_address.landmark},` : ''} // Added this line
        ${shipment.destination_address?.city},
        ${shipment.destination_address?.state}, PIN:
        ${shipment.destination_address?.zip_code}
    </p>

    // For origin address
    <p>
        ${shipment.origin_address?.address_line},
        ${shipment.origin_address?.landmark ? `${shipment.origin_address.landmark},` : ''} // Added this line
        ${shipment.origin_address?.city},${shipment.origin_address?.state},
        ${shipment.origin_address?.zip_code}
    </p>
    ```
8.  **Modified `src/server/api/routers/kyc.ts`**: Added the `landmark` field to the `address.create` call within the `kycSubmit` mutation.
    ```typescript
    const address = await db.address.create({
        data: {
            // ... existing fields
            address_line: input.billingAddress.addressLine,
            landmark: input.billingAddress.landmark || null, // Added this line
            user: { connect: { user_id: ctx.user.user_id } },
            name: "KYC",
        },
    });
    ```
9.  **Modified `src/server/api/routers/shipment.ts`**: Updated the `NewPendingAddress` and `NewDestinationAddress` interfaces to include the optional `landmark` field, and ensured it's passed when creating new pending and destination addresses in bulk shipment creation.
    ```typescript
    interface NewPendingAddress {
        // ... existing fields
        address_line: string;
        landmark?: string; // Added this line
        city: string;
        // ...
    }

    interface NewDestinationAddress {
        // ... existing fields
        address_line: string;
        landmark?: string; // Added this line
        city: string;
        // ...
    }

    // In newPendingToCreate.push
    newPendingToCreate.push({
        // ... existing fields
        address_line: shipment.originAddressLine,
        landmark: shipment.originLandmark || null, // Added this line
        city: shipment.originCity,
        // ...
    });

    // In newDestinationsToCreate.push
    newDestinationsToCreate.push({
        // ... existing fields
        address_line: shipment.destinationAddressLine,
        landmark: shipment.destinationLandmark || null, // Added this line
        city: shipment.destinationCity,
        // ...
    });
    ```

### Rationale
Adding the `landmark` field as an optional string provides more detailed address information, which can significantly improve the accuracy and efficiency of deliveries. By making it optional, existing addresses without this information will not be affected, ensuring backward compatibility. The changes were propagated through the database, API routes, and frontend components to ensure data consistency and proper display/handling of the new field across the application.