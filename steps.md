## Dashboard Implementation

This document outlines the steps taken to implement the admin and user dashboards, including the installation of necessary components, creation of TRPC routers, and development of the UI.

### 1. Install Shadcn UI Chart Components

- **Action:** Executed `npx shadcn@latest add chart` to install the Shadcn UI chart components.
- **Reason:** To provide the necessary UI components for rendering various chart types as specified in the `Comprehensive Shadcn_UI Charts Documentation.md`.

### 2. Configure CSS Variables for Charts

- **Action:** Added chart color variables to `src/styles/globals.css`.
- **Reason:** To ensure consistent theming and color application across all charts, leveraging Shadcn UI's theming capabilities.

### 3. Create TRPC Routers for Dashboards

- **Action:** Created two new TRPC routers:
    - `src/server/api/routers/adminDashboard.ts`
    - `src/server/api/routers/userDashboard.ts`
- **Reason:** To provide dedicated API endpoints for fetching dashboard-specific data for both admin and regular users. These routers currently return placeholder data to allow the UI to render without actual data.

### 4. Integrate New TRPC Routers into Root Router

- **Action:** Imported and added `adminDashboardRouter` and `userDashboardRouter` to `src/server/api/root.ts`.
- **Reason:** To make the new dashboard TRPC procedures accessible throughout the application.

### 5. Implement Admin Dashboard UI

- **Action:** Created/updated `src/app/(admin)/admin/dashboard/page.tsx` with the admin dashboard UI.
- **Reason:** To display key performance indicators (KPIs) and various charts (Radar, Line, Mixed Bar/Line, Stacked Bar, Horizontal Bar, Pie) as outlined in `dashboard-data.md` for the admin view. The UI includes loading states with animated placeholders.

### 6. Implement User Dashboard UI

- **Action:** Created/updated `src/app/(user)/dashboard/page.tsx` with the user dashboard UI.
- **Reason:** To display key performance indicators (KPIs) and various charts (Donut, Area, Mixed Bar/Line, Horizontal Bar, Stacked Bar, Line with Dots) as outlined in `dashboard-data.md` for the user view. The UI includes loading states with animated placeholders.

### 7. Implement Admin Dashboard Data Fetching Logic

- **Action:** Updated `src/server/api/routers/adminDashboard.ts` to fetch real data for KPIs and charts.
- **Reason:** To populate the admin dashboard with dynamic data, including:
    - **KPIs:** Total Users, Pending KYC Approvals, Pending Shipments, Total Revenue (Last 30 Days), High-Priority Tickets.
    - **Charts:** User Growth (Line Chart), Revenue vs. Refunds (Bar Chart), User Demographics (Stacked Bar Chart), Shipment Funnel (Bar Chart), Top Users by Shipment Volume (Horizontal Bar Chart), Courier Usage Distribution (Pie Chart), Platform Health Overview (Radar Chart).

### 8. Implement User Dashboard Data Fetching Logic

- **Action:** Updated `src/server/api/routers/userDashboard.ts` to fetch real data for KPIs and charts.
- **Reason:** To populate the user dashboard with dynamic data, including:
    - **KPIs:** Wallet Balance, Total Shipments, Avg. Shipping Cost, Delivered Rate, Open Support Tickets.
    - **Charts:** Shipment Status Distribution (Donut Chart), Shipments Over Time (Area Chart), Shipping Costs vs. Declared Value (Mixed Bar/Line Chart), Top 5 Destination States (Horizontal Bar Chart), Courier Performance (Stacked Bar Chart), Average Delivery Time (Line Chart).