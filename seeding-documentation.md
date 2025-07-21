
# Seeding Documentation

## Introduction

This document provides a comprehensive overview of the database seeding process for the NexGen application. The primary goal of the seeding script is to populate the database with a rich, realistic, and interconnected dataset that accurately reflects how the application will be used in a real-world scenario. This is crucial for development, testing, and demonstration purposes, ensuring that all features can be tested against a representative data landscape.

## How to Run the Seeding Script

To seed the database, run the following command from the root of the project:

```bash
pnpm db:seed
```

This command will execute the `prisma/seed.ts` script, which in turn orchestrates the entire seeding process, including the seeding of default rates.

## Detailed Seeding Strategy

The seeding process is designed to create a complex and realistic dataset by generating interconnected data across all major models. Here is a model-by-model breakdown of the seeding strategy:

### 1. Foundational Data: Couriers & Rates

Before any user-specific data is created, the script establishes a foundation for shipping calculations.

*   **Couriers:** The `Courier` table is populated from the `data/couriers.json` file. This file contains a list of real-world courier companies, their Shipway IDs, and image URLs, ensuring that all shipments are associated with a valid courier.
*   **Pincode Map:** The `data/pincode_map.json` file is loaded into memory. This extensive map provides city and state information for a vast number of Indian pincodes, which is essential for determining shipping zones.
*   **Default Rates:** The `prisma/seedRates.ts` script is executed to programmatically generate a comprehensive set of default shipping rates. It creates rates for various weight slabs across different zones (`a`, `b`, `c`, `d`, `e`), providing a baseline for shipping cost calculations.

### 2. User Seeding

The script creates a diverse set of users to simulate a real user base.

*   **Default Users:** Two default users are created:
    *   An **Admin User** (`namankatewa@gmail.com`) with the `Admin` role.
    *   A **Client User** (`namankatew2004@gmail.com`) with the `Client` role.
*   **Random Users:** A set of additional random users are generated using the `@faker-js/faker` library. These users have a mix of `business_type` (Retailer, Ecommerce, Franchise) and `status` (Active, Inactive) to ensure the dataset represents a variety of user profiles.
*   **Employee User:** A dedicated user with the `Employee` role is created to handle support ticket assignments, simulating a real support structure.

### 3. Wallet and Transactions

Each user is given a wallet with a history of financial activity.

*   **Wallet Creation:** Every user is assigned a `Wallet` with a random starting balance.
*   **Transaction History:** A series of `Transaction` records are created for each user, including:
    *   **Credit Transactions:** Simulating wallet top-ups with a `Completed` payment status.
    *   **Debit Transactions:** These are created in conjunction with shipments to represent the cost of shipping. The script ensures that a user's wallet is topped up if the balance is insufficient to cover a shipment, realistically simulating user behavior.

### 4. Addresses and KYC

The script generates addresses and KYC records to simulate the user onboarding and verification process.

*   **Address Seeding:** Each user is given multiple `Address` records of type `User` and `Warehouse`. These addresses are generated using real pincodes from the `pincodeMap`, ensuring that they have valid city and state information.
*   **KYC Simulation:** A `Kyc` record is created for each user with a varied `kyc_status` (`Pending`, `Submitted`, `Approved`, `Rejected`). This simulates the entire KYC lifecycle:
    *   **Submitted KYC:** Includes dummy Aadhar and PAN card images (as base64 SVG) and a billing address.
    *   **Approved/Rejected KYC:** These records include a `verification_date` and are linked to the admin user who notionally verified them. Rejected KYCs also include a `rejection_reason`.

### 5. Shipments

Shipment seeding is the most intricate part of the process, designed to create a realistic shipping history for each user.

*   **Shipment Creation:** Multiple `Shipment` records are created for each user, with a variety of statuses (`PendingApproval`, `Approved`, `Rejected`) and payment statuses.
*   **Realistic Cost Calculation:** The `shipping_cost` for each shipment is calculated by:
    1.  Determining the `zone` based on the origin and destination pincodes.
    2.  Calculating the `weight_slab`.
    3.  Finding the appropriate rate from the `DefaultRate` or `UserRate` tables.
*   **Insurance Simulation:** The script randomly decides whether a shipment has `is_insurance_selected`. If so, it calculates the `insurance_premium` and `compensation_amount` based on the declared value, adding it to the total shipping cost.
*   **Interconnected Data:** Each shipment is linked to a user, an origin address, a destination address, and a courier.

### 6. Tracking

To simulate the journey of a package, each shipment is given a series of tracking updates.

*   **Tracking Updates:** For each shipment, multiple `Tracking` records are created. These records include a timestamp, a random location, and a status description, providing a realistic tracking history.

### 7. Support Tickets

To simulate user support interactions, the script generates support tickets for users.

*   **Ticket Creation:** `SupportTicket` records are created with varying `priority` levels (`High`, `Medium`, `Low`) and `status` (`Open`, `Closed`).
*   **Assignment:** Each ticket is assigned to the default `Employee` user, simulating a real support workflow where tickets are routed to support staff.
*   **Messages:** Each ticket includes an initial message from the user, providing a starting point for the support conversation.
