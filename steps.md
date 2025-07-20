## Implement User ID Pre-fill in Admin Listing Pages

### Current Flow

The admin user detail page (`src/app/(admin)/admin/user/[userId]/page.tsx`) contains buttons that link to various listing pages (e.g., shipments, passbook, pending addresses). These links include the `userId` as a URL search parameter. However, the listing pages do not currently utilize this `userId` to pre-fill their search inputs or filter their initial data.

### Modifications

I have modified the following files to address this:

1.  **`src/app/(admin)/admin/shipments/page.tsx`**
    *   **Change:** Imported `useEffect` and `useSearchParams` from `next/navigation`.
    *   **Change:** Initialized the `userIdSearchText` state using the `userId` query parameter from the URL. If no `userId` is present in the URL, it defaults to an empty string.
    *   **Reason:** This ensures that when navigating from a user's detail page to the shipments listing, the shipment list is automatically filtered by that user's ID.

2.  **`src/app/(admin)/admin/passbook/page.tsx`**
    *   **Change:** Imported `useEffect` and `useSearchParams` from `next/navigation`.
    *   **Change:** Initialized the `searchText` state (which is used for the user ID search) using the `userId` query parameter from the URL. If no `userId` is present, it defaults to an empty string.
    *   **Reason:** This ensures that when navigating from a user's detail page to the passbook listing, the transactions list is automatically filtered by that user's ID.

3.  **`src/app/(admin)/admin/pending-addresses/page.tsx`**
    *   **Change:** Imported `useEffect` and `useSearchParams` from `next/navigation`.
    *   **Change:** Initialized the `searchText` state (which is used for the user ID search) using the `userId` query parameter from the URL. If no `userId` is present, it defaults to an empty string.
    *   **Reason:** This ensures that when navigating from a user's detail page to the pending addresses listing, the list is automatically filtered by that user's ID.

These changes provide a more seamless user experience by pre-populating the search filters on the listing pages when a `userId` is provided in the URL, leading to immediate display of relevant data.