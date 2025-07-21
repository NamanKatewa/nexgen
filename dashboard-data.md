
# Dashboard Data Suggestions

This document outlines the data that can be displayed on the user and admin dashboards, with suggestions for chart types based on the `Comprehensive Shadcn_UI Charts Documentation.md`.

## User Dashboard

The user dashboard should provide a clear and concise overview of the user's shipping activity, wallet balance, and support tickets.

### Key Metrics (KPIs)

These should be displayed prominently at the top of the dashboard as individual stats.

*   **Wallet Balance:** Display the current wallet balance.
*   **Total Shipments:** Show the total number of shipments created by the user.
*   **Avg. Shipping Cost:** The average cost per shipment for the user.
*   **Delivered Rate:** The percentage of shipments that have been successfully delivered.
*   **Open Support Tickets:** Display the number of open support tickets.

### Charts and Visualizations

#### Shipments Overview

*   **Shipment Status Distribution (Donut Chart with Text):** A donut chart showing the distribution of shipments by their current status (e.g., `DELIVERED`, `IN_TRANSIT`, `RTO`, `CANCELLED`). The center of the donut can display the total number of shipments.
*   **Shipments Over Time (Area Chart with Gradient):** A gradient area chart showing the number of shipments created over the last 30 days. This provides a visually appealing way to track shipping volume.
*   **Shipping Costs vs. Declared Value (Mixed Bar/Line Chart):** A bar chart showing total shipping costs per month, with a line chart overlay showing the total declared value of shipments for the same period. This helps users see the relationship between what they spend and the value of goods they ship.

#### Performance and Trends

*   **Top 5 Destination States (Horizontal Bar Chart):** A horizontal bar chart displaying the top 5 states shipments are sent to, helping the user understand their key markets.
*   **Courier Performance (Stacked Bar Chart):** A bar chart where each bar represents a courier used by the user. The bar is stacked to show the proportion of shipments in different statuses (`DELIVERED`, `IN_TRANSIT`, `RTO`) for that courier. This helps in evaluating courier reliability.
*   **Average Delivery Time (Line Chart with Dots):** A line chart tracking the average time from a shipment's `PICKED_UP` status to its `DELIVERED` status over the last few months. This helps the user monitor delivery efficiency.

### Data Sources

*   `shipmentRouter.getUserShipments`
*   `walletRouter.getPassbook`
*   `authRouter.me` (for wallet balance)
*   `supportRouter.getUserTickets`
*   `trackingRouter.getTrackingData` (for status and delivery times)

## Admin Dashboard

The admin dashboard should provide a high-level overview of the entire platform, with a focus on pending approvals, user activity, and system health.

### Key Metrics (KPIs)

*   **Total Users:** Display the total number of registered users.
*   **Pending KYC Approvals:** Show the number of users with pending KYC verification.
*   **Pending Shipments:** Display the number of shipments waiting for admin approval.
*   **Total Revenue (Last 30 Days):** Show the total revenue generated from shipping costs in the last 30 days.
*   **High-Priority Tickets:** Display the total number of open support tickets with "High" priority.

### Charts and Visualizations

#### Platform Health & Growth

*   **Platform Health Overview (Radar Chart):** A radar chart providing a quick, multi-dimensional view of platform health. Axes could include: `Pending KYCs`, `Pending Shipments`, `Open High-Priority Tickets`, `New Users (30d)`, and `Revenue (30d)`. This offers a powerful at-a-glance summary.
*   **User Growth (Line Chart):** A line chart showing the number of new user sign-ups per month for the last 12 months.
*   **Revenue vs. Refunds (Mixed Bar/Line Chart):** A bar chart for monthly revenue (from debits) and a line chart for monthly refunds (from credits for rejected shipments). This provides a clear view of financial health.

#### User & Shipment Insights

*   **User Demographics (Stacked Bar Chart):** A bar chart showing user distribution by `business_type` (Retailer, Ecommerce, Franchise), with each bar stacked to show the proportion of `Active` vs. `Inactive` users in that category.
*   **Shipment Funnel (Bar Chart):** A horizontal bar chart that visualizes the shipment lifecycle funnel, showing counts for key stages like `SHIPMENT_BOOKED` -> `PICKED_UP` -> `IN_TRANSIT` -> `OUT_FOR_DELIVERY` -> `DELIVERED`. This helps identify potential bottlenecks in the shipping process.
*   **Top Users by Shipment Volume (Horizontal Bar Chart with Labels):** A bar chart displaying the top 10 users by the number of shipments they've created in the last 30 days, with the exact number labeled on each bar.
*   **Courier Usage Distribution (Pie Chart):** A pie chart showing the percentage of total shipments handled by each courier partner across the platform.

### Data Sources

*   `adminRouter.getAllUsers`
*   `adminRouter.pendingKyc`
*   `adminRouter.pendingShipments`
*   `adminRouter.getPassbook` (for revenue and refunds)
*   `supportRouter.getAllTickets`
*   `shipmentRouter.getAllShipments`
