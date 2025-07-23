# Backend Data Structures for Dashboards

This document details the expected JSON data structures to be returned from the backend tRPC APIs for populating the User and Admin dashboards. Each dashboard will have a single tRPC query that returns all the necessary data.

## User Dashboard Data Structure

**tRPC Route:** `userDash.getDashboardData`
**Description:** Returns all data required for the User Dashboard, including KPIs and data for various charts.

```json
{
  "kpis": {
    "walletBalance": 1250.75,
    "totalShipments": 560,
    "avgShippingCost": 120.50,
    "deliveredRate": 92.5, // Percentage
    "openSupportTickets": 3
  },
  "shipmentStatusDistribution": [
    {
      "status": "DELIVERED",
      "count": 450
    },
    {
      "status": "IN_TRANSIT",
      "count": 80
    },
    {
      "status": "RTO",
      "count": 15
    },
    {
      "status": "CANCELLED",
      "count": 10
    },
    {
      "status": "SHIPMENT_BOOKED",
      "count": 5
    }
  ],
  "shipmentsOverTime": [
    {
      "date": "2025-06-23",
      "shipmentCount": 10
    },
    {
      "date": "2025-06-24",
      "shipmentCount": 15
    },
    {
      "date": "2025-07-23",
      "shipmentCount": 12
    }
  ],
  "shippingCostsDeclaredValue": [
    {
      "month": "Jan",
      "totalShippingCost": 5000.00,
      "totalDeclaredValue": 50000.00
    },
    {
      "month": "Feb",
      "totalShippingCost": 6200.50,
      "totalDeclaredValue": 65000.00
    }
  ],
  "topDestinationStates": [
    {
      "state": "Maharashtra",
      "shipmentCount": 150
    },
    {
      "state": "Delhi",
      "shipmentCount": 120
    },
    {
      "state": "Karnataka",
      "shipmentCount": 90
    },
    {
      "state": "Tamil Nadu",
      "shipmentCount": 70
    },
    {
      "state": "Gujarat",
      "shipmentCount": 50
    }
  ],
  "courierPerformance": [
    {
      "courierName": "Delhivery",
      "DELIVERED": 100,
      "IN_TRANSIT": 20,
      "RTO": 5,
      "CANCELLED": 2
    },
    {
      "courierName": "XpressBees",
      "DELIVERED": 80,
      "IN_TRANSIT": 15,
      "RTO": 3,
      "CANCELLED": 1
    }
  ],
  "averageDeliveryTime": [
    {
      "month": "Jan",
      "averageDeliveryTimeDays": 3.2
    },
    {
      "month": "Feb",
      "averageDeliveryTimeDays": 2.8
    }
  ]
}
```

## Admin Dashboard Data Structure

**tRPC Route:** `adminDash.getDashboardData`
**Description:** Returns all data required for the Admin Dashboard, including KPIs and data for various charts.

```json
{
  "kpis": {
    "totalUsers": 1500,
    "pendingKycApprovals": 45,
    "pendingShipments": 120,
    "totalRevenueLast30Days": 75000.00,
    "highPriorityTickets": 15
  },
  "platformHealthOverview": [
    {
      "metric": "Pending KYCs",
      "value": 45
    },
    {
      "metric": "Pending Shipments",
      "value": 120
    },
    {
      "metric": "Open High-Priority Tickets",
      "value": 15
    },
    {
      "metric": "New Users (30d)",
      "value": 150
    },
    {
      "metric": "Revenue (30d)",
      "value": 75000
    }
  ],
  "userGrowth": [
    {
      "month": "Jan 2025",
      "newUserCount": 100
    },
    {
      "month": "Feb 2025",
      "newUserCount": 120
    }
  ],
  "revenueRefunds": [
    {
      "month": "Jan",
      "totalRevenue": 50000.00,
      "totalRefunds": 2500.00
    },
    {
      "month": "Feb",
      "totalRevenue": 60000.00,
      "totalRefunds": 3000.00
    }
  ],
  "userDemographics": [
    {
      "businessType": "Retailer",
      "activeUsers": 300,
      "inactiveUsers": 50
    },
    {
      "businessType": "Ecommerce",
      "activeUsers": 700,
      "inactiveUsers": 100
    },
    {
      "businessType": "Franchise",
      "activeUsers": 200,
      "inactiveUsers": 30
    }
  ],
  "shipmentFunnel": [
    {
      "stage": "SHIPMENT_BOOKED",
      "count": 10000
    },
    {
      "stage": "PICKED_UP",
      "count": 9500
    },
    {
      "stage": "IN_TRANSIT",
      "count": 9000
    },
    {
      "stage": "OUT_FOR_DELIVERY",
      "count": 8500
    },
    {
      "stage": "DELIVERED",
      "count": 8000
    }
  ],
  "topUsersByShipmentVolume": [
    {
      "userName": "User A",
      "shipmentCount": 250
    },
    {
      "userName": "User B",
      "shipmentCount": 220
    }
  ],
  "courierUsageDistribution": [
    {
      "courierName": "Delhivery",
      "shipmentPercentage": 40.5
    },
    {
      "courierName": "XpressBees",
      "shipmentPercentage": 30.0
    },
    {
      "courierName": "Ecom Express",
      "shipmentPercentage": 15.0
    },
    {
      "courierName": "Shadowfax",
      "shipmentPercentage": 10.0
    },
    {
      "courierName": "Ekart",
      "shipmentPercentage": 4.5
    }
  ]
}
```
