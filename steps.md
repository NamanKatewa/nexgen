## Modify autofill for recipient name to be case-insensitive

### Current Flow
In `src/app/(user)/dashboard/create-shipment/page.tsx`, the autofill functionality for the recipient's address uses a case-sensitive comparison when matching the `recipientName` with existing user addresses. Specifically, the line `(address) => address.name === recipientName` performs an exact, case-sensitive match.

### Modification
To improve user experience and make the autofill more robust, the comparison will be changed to be case-insensitive. This will be achieved by converting both `address.name` and `recipientName` to lowercase before comparison.

### Why
This change ensures that the autofill feature works regardless of the casing used by the user when entering the recipient's name, making the application more user-friendly and forgiving of minor input variations.