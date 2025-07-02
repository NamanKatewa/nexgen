# 📦 Shipping Rate Card

This document defines the shipping rate structure based on zones and weight slabs.

> **Note:** Rates are intentionally left empty; please fill in actual values as per business.

---

## 📝 Rate Table

| Weight (KG) | z-a | z-b | z-c | z-d | z-e | RTO Charges |
| ----------: | --: | --: | --: | --: | --: | ----------: |
|         0.5 |     |     |     |     |     |             |
|           1 |     |     |     |     |     |             |
|           2 |     |     |     |     |     |             |
|           3 |     |     |     |     |     |             |
|           5 |     |     |     |     |     |             |
|           7 |     |     |     |     |     |             |
|          10 |     |     |     |     |     |             |
|          15 |     |     |     |     |     |             |
|          20 |     |     |     |     |     |             |
|          25 |     |     |     |     |     |             |
|          30 |     |     |     |     |     |             |
|          35 |     |     |     |     |     |             |
|          40 |     |     |     |     |     |             |
|          45 |     |     |     |     |     |             |
|          50 |     |     |     |     |     |             |
|          55 |     |     |     |     |     |             |
|          60 |     |     |     |     |     |             |
|          65 |     |     |     |     |     |             |
|          70 |     |     |     |     |     |             |
|          75 |     |     |     |     |     |             |
|          80 |     |     |     |     |     |             |
|          85 |     |     |     |     |     |             |
|          90 |     |     |     |     |     |             |
|          95 |     |     |     |     |     |             |
|         100 |     |     |     |     |     |             |
|         105 |     |     |     |     |     |             |
|         110 |     |     |     |     |     |             |
|         115 |     |     |     |     |     |             |
|         120 |     |     |     |     |     |             |
|         125 |     |     |     |     |     |             |
|         130 |     |     |     |     |     |             |
|         135 |     |     |     |     |     |             |
|         140 |     |     |     |     |     |             |
|         145 |     |     |     |     |     |             |

---

## 📦 Zone Definitions & Logic

| Zone |                     Label |                                                                           Description |
| ---: | ------------------------: | ------------------------------------------------------------------------------------: |
|  z-a |                Local Zone |                                             Within the same city or metropolitan area |
|  z-b |             Regional Zone |                                                Within the same state or nearby states |
|  z-c |                Metro Zone | Between major metro cities like Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata |
|  z-d |       Rest of India (ROI) |                                                   Other cities and towns across India |
|  z-e | Northeast & Jammu-Kashmir |                                     Includes the northeastern states, Jammu & Kashmir |

---

## 🧠 How to Determine Zone (Business Logic)

Given two PIN codes (**fromPIN** and **toPIN**):

1. If both PIN codes belong to the **same city/metropolitan area** → `z-a`
2. Else if both are in the **same state** or are in **nearby states** → `z-b`
3. Else if both cities are part of the **major metro list** → `z-c`
4. Else if destination PIN is in **Northeast states or Jammu & Kashmir** → `z-e`
5. Else → `z-d` (Rest of India)

---

## ⚙️ Weight Slab & Rate Calculation Logic

- **Base slabs** are defined explicitly up to 10 kg and then every 5 kg thereafter up to 145 kg.
- For any shipment weight **between two defined slabs**:
  - Find the nearest **previous slab** (the last defined lower or equal weight).
  - Calculate the **per kg rate** from that previous slab.
  - Multiply the extra kg by this per kg rate and add to the slab rate.

> **Example:**
>
> - Defined slabs: 10 kg → ₹500; 15 kg → ₹700
> - Per kg rate from 10 kg slab: (₹700 - ₹500) / (15 kg - 10 kg) = ₹40 per kg
> - For weight 12 kg: use 10 kg slab rate + (2 × ₹40) → ₹500 + ₹80 = ₹580

- Repeat this logic until the next defined slab (in this case, 15 kg).

**This continues up to the maximum weight (145 kg). And then above calculates bases on the last 145kg rate per kg**

---
