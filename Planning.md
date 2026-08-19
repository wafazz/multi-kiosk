# Multi-Kiosk — Master System Architecture & Planning Specification

> **Document Version:** 1.0.0  
> **Status:** `WAITING FOR EXPLICIT APPROVAL` (Planning Phase Only — No Execution)  
> **Author:** Iris (Senior Software Architect & Planning Agent — CoreSentinel Governance)  
> **Target System:** Multi-Kiosk Centralized Management & Distributed Terminal Platform  
> **Workspace Path:** `C:\Users\fakrul.hakim\Downloads\MK`  
> **Date:** August 18, 2026  

---

## Fact Classification & Anti-Hallucination Legend

Throughout this specification, all statements, data, tables, and architectural choices are strictly classified according to the CoreSentinel Evidence Hierarchy:

* `[VERIFIED]`: Confirmed directly by environment inspection or source inspection.
* `[USER REQUIREMENT]`: Explicitly stated requirement provided by the project owner.
* `[APPROVED DECISION]`: A recommendation or decision explicitly approved by the owner.
* `[RECOMMENDATION]`: Proposed engineering design or pattern formulated for review.
* `[ASSUMPTION]`: Temporary working assumption required for architectural completeness.
* `[UNKNOWN]`: Information currently unavailable or unverified; requires clarification.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Goals](#3-goals)
4. [Non-Goals](#4-non-goals)
5. [Confirmed Requirements](#5-confirmed-requirements)
6. [Proposed Features](#6-proposed-features)
7. [User Roles](#7-user-roles)
8. [System Architecture](#8-system-architecture)
9. [Kiosk Architecture](#9-kiosk-architecture)
10. [Product Architecture](#10-product-architecture)
11. [Sales Architecture](#11-sales-architecture)
12. [Raw Material Architecture](#12-raw-material-architecture)
13. [Recipe / BOM Architecture](#13-recipe--bom-architecture)
14. [Inventory Architecture](#14-inventory-architecture)
15. [Staff Architecture](#15-staff-architecture)
16. [Attendance Architecture](#16-attendance-architecture)
17. [Hourly Salary Architecture](#17-hourly-salary-architecture)
18. [Reporting Architecture](#18-reporting-architecture)
19. [Security Architecture](#19-security-architecture)
20. [Offline Strategy](#20-offline-strategy)
21. [Synchronization Strategy](#21-synchronization-strategy)
22. [API Planning](#22-api-planning)
23. [Database Architecture](#23-database-architecture)
24. [Permission Matrix](#24-permission-matrix)
25. [Business Rules](#25-business-rules)
26. [Edge Cases & Failure Modes](#26-edge-cases--failure-modes)
27. [Scalability & Growth Model](#27-scalability--growth-model)
28. [Future Integrations](#28-future-integrations)
29. [Technology Stack Analysis](#29-technology-stack-analysis)
30. [MVP Scope Definition](#30-mvp-scope-definition)
31. [Implementation Roadmap](#31-implementation-roadmap)
32. [Testing Strategy](#32-testing-strategy)
33. [Risk Management](#33-risk-management)
34. [Information Not Yet Verified](#34-information-not-yet-verified)
35. [Open Questions](#35-open-questions)
36. [Architectural Decisions Requiring Approval](#36-architectural-decisions-requiring-approval)
37. [Final Architecture Recommendation](#37-final-architecture-recommendation)
38. [Approval Gate](#38-approval-gate)

---

## 1. Executive Summary

`[RECOMMENDATION]`  
**Multi-Kiosk** is a modern, distributed retail/F&B point-of-sale, inventory control, and workforce management platform designed for multi-branch, multi-kiosk business operations. The system bridges centralized headquarters (HQ) administrative oversight with distributed physical kiosk endpoints.

The platform provides end-to-end management across five critical operational pillars:
1. **Multi-Kiosk & Branch Governance:** Granular control, identification, and configuration of distributed hardware kiosks grouped by branches.
2. **Location-Aware Raw Material & Recipe (BOM) Inventory:** Real-time inventory tracking spanning central warehouses down to individual kiosk stockrooms with dynamic recipe-based consumption and wastage tracking.
3. **Point of Sale (POS) & Order Processing:** Rapid, kiosk-traceable transaction capture, receipt generation, and sales auditing.
4. **Workforce Attendance & Optional Hourly Payroll:** Kiosk-based staff clock-in/out with support for roaming personnel and optional, automated hourly wage calculation.
5. **Centralized Business Intelligence:** Comprehensive sales, wastage, inventory valuation, and gross contribution reporting (Sales minus Raw Material Cost minus Labour Cost).

---

## 2. Product Vision

`[RECOMMENDATION]`  
To deliver a high-reliability, low-latency, and audit-proof multi-kiosk operations engine that empowers enterprise and growing F&B/retail operators to scale from 1 branch with 2 kiosks to 500+ kiosks seamlessly, eliminating stock shrinkage, attendance discrepancies, and disconnected sales data.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CENTRAL HQ PLATFORM                             │
│  [Catalog] [Raw Materials] [Recipes] [Transfers] [Staff] [Analytics]   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
┌───────────────────────┐                       ┌───────────────────────┐
│   BRANCH / LOCATION   │                       │   BRANCH / LOCATION   │
│   Central Stockroom   │                       │   Central Stockroom   │
└───────────┬───────────┘                       └───────────┬───────────┘
            │                                               │
     ┌──────┴──────┐                                 ┌──────┴──────┐
     ▼             ▼                                 ▼             ▼
┌─────────┐   ┌─────────┐                       ┌─────────┐   ┌─────────┐
│ KIOSK A │   │ KIOSK B │                       │ KIOSK C │   │ KIOSK D │
│ (POS /  │   │ (POS /  │                       │ (POS /  │   │ (POS /  │
│ Clock)  │   │ Clock)  │                       │ Clock)  │   │ Clock)  │
└─────────┘   └─────────┘                       └─────────┘   └─────────┘
```

---

## 3. Goals

`[RECOMMENDATION]`
- **Unambiguous Kiosk Traceability:** Every sale, attendance record, stock consumption, transfer receipt, and wastage event must be deterministically linked to a specific kiosk and authenticated staff/device.
- **Recipe-Driven Stock Precision:** Accurate tracking of raw materials down to fractional base units (grams, milliliters, pieces) tied to product sales via Bills of Materials (BOM).
- **Flexible Multi-Location Attendance & Wages:** Frictionless staff clock-in/out across kiosks with flexible hourly rate calculation that supports daily, monthly, and hourly workers.
- **Centralized Command & Dispatched Inventory:** A rigid, auditable stock transfer workflow (Request -> Approval -> Dispatch -> Receive) preventing inventory discrepancies.
- **Extensible Architecture:** Designed with clear API boundaries, multi-tenant ready schema, and strict idempotency for future offline sync and third-party integrations.

---

## 4. Non-Goals

`[RECOMMENDATION]`
- **Full Enterprise Statutory HRMS / Tax Engine:** Multi-Kiosk will compute gross hourly wages and hours worked; it will NOT calculate statutory deductions (EPF, SOCSO, EIS, PCB, income tax withholding) in V1.
- **Custom Hardware Manufacturing & Firmware:** The software will run on standard computing platforms (Web, PWA, Android, Windows) and interact via standard web protocols.
- **Autonomous Global Route Logistics:** Warehouse-to-kiosk logistics optimization (GPS fleet routing) is excluded from the core system.
- **Complex Financial Double-Entry General Ledger:** Multi-Kiosk will provide operational financial contribution reports (Sales minus Material Cost minus Labour), not full balance sheets.

---

## 5. Confirmed Requirements

`[USER REQUIREMENT]` The following functional requirements are explicitly confirmed:

1. **Multi-Kiosk Management:** Support centralized management of multiple physical kiosks organized under branches/locations with distinct codes, status, operating modes, device identities, and assigned staff.
2. **Staff Attendance at Kiosks:** Staff can clock in and clock out directly at physical kiosks. Records must capture kiosk ID, timestamps, total hours worked, late/early indicators, and source device metadata.
3. **Optional Hourly Salary:** Support for staff with hourly rates (`Working Hours × Hourly Rate = Gross Earnings`). Support other staff types (Monthly, Daily, None) without mandatory wage calculation.
4. **Raw Material Management:** Master catalog of raw materials with categories, SKUs, base units (e.g., g, ml, unit), purchase units (e.g., kg, liter, box), conversion multipliers, purchase costs, and stock levels.
5. **Recipe / Bill of Materials (BOM):** Products linked to recipes containing specific raw material quantities and units, enabling ingredient calculation on sales.
6. **Location-Aware Inventory per Kiosk:** Inventory balances tracked distinctly per location (Central Warehouse, Branch Stock, Individual Kiosks).
7. **Auditable Stock Transfer:** Multi-step workflow for moving raw materials and products between central locations and kiosks (Request -> Approval -> Dispatch -> Receive).
8. **Wastage Tracking:** Dedicated logging of damaged, expired, spilled, or discarded raw materials/products with reasons, kiosk ID, staff ID, and cost impact.
9. **Product Catalog Management:** Products, categories, SKUs, pricing, costs, availability per kiosk, and variations.
10. **Sales & Ordering:** Comprehensive order lifecycle at kiosks, recording line items, discounts, refunds, payment status, and kiosk association.
11. **Staff Roaming:** Staff can be scheduled and assigned to work at different kiosks on different days (e.g., Ali at Kiosk A on Monday, Kiosk B on Tuesday).
12. **Centralized Dashboard & Reporting:** Real-time visibility into sales, inventory levels, low-stock alerts, attendance, labour costs, and Gross Contribution (`Sales - Raw Material Cost - Labour Cost`).
13. **Role-Based Access Control (RBAC):** Access restriction across administrative, managerial, and kiosk operational tiers.
14. **Audit Trail:** Immutable logging of critical operations (price changes, adjustments, transfers, wastage, clock events, refunds).
15. **Single Monolithic Application Architecture:** The entire Multi-Kiosk platform (HQ administration, Kiosk terminals, REST APIs, and background queues) must be architected and implemented within a single, unified codebase using **Laravel 12 + React + TypeScript + Inertia.js + MySQL + Redis + Bootstrap 5 + Responsive Admin Template with Left Sidebar**.
16. **Branding & Logo Management:** Company/system logo upload capability manageable by **Super Admin** or designated approved managerial roles, dynamically rendering across the HQ sidebar header, kiosk login/terminal displays, and printed receipts.

---

## 6. Proposed Features

`[RECOMMENDATION]`  
The following features are proposed to satisfy the confirmed requirements with optimal usability and reliability:

| Category | Feature Name | Priority | Rationale / Value |
| :--- | :--- | :--- | :--- |
| **Kiosk UX** | Fast PIN / QR Staff Mode Switching | MUST HAVE | Allows kiosk terminal to switch instantly between customer POS and staff clock-in without disrupting order flow. |
| **Kiosk Security**| Kiosk Hardware Pairing Token | MUST HAVE | Prevents unauthorized browsers/devices from submitting kiosk transactions or spoofing kiosk identities. |
| **Inventory** | Automated BOM Stock Deduction on Sale | SHOULD HAVE | Deducts raw materials automatically upon order completion in an asynchronous transaction queue. |
| **Inventory** | Low-Stock Threshold Notifications | SHOULD HAVE | Flags kiosks and warehouse managers before raw materials run out during peak hours. |
| **Inventory** | Blind Stock Count / Variance Reconciliation | SHOULD HAVE | Enables kiosk managers to enter physical stock counts without seeing system expected counts to prevent bias. |
| **Workforce** | Grace Period & Rounding Engine | SHOULD HAVE | Configurable clock-in rounding rules (e.g., 5-min grace period, nearest 15-min rounding). |
| **Workforce** | Shift / Roster Schedule Planner | SHOULD HAVE | Allows HQ/Branch managers to assign staff to specific kiosks by calendar date. |
| **Operations** | Receipt Printing & Digital Kitchen Display (KDS) | OPTIONAL | Local network ESC/POS thermal printer support or KDS screen. |
| **Resilience** | Offline Transaction Queue (IndexedDB / SQLite) | SHOULD HAVE | Allows ordering and clock-ins during intermittent network dropouts with idempotent replay on reconnect. |

---

## 7. User Roles

`[RECOMMENDATION]`  
A practical, 6-tier Role-Based Access Control (RBAC) model:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Super Admin / Owner (Full System Access & SaaS Config)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│ 2. HQ Administrator (All Branches, Catalogs, Payroll & BI)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│ 3. Branch / Inventory Manager │   │ 4. Finance & Audit Officer    │
│ (Branch Stock, Transfers)     │   │ (Payroll, Sales, Wastage BI)  │
└───────────────┬───────────────┘   └───────────────────────────────┘
                │
     ┌──────────┴──────────┐
     ▼                     ▼
┌───────────────────┐ ┌───────────────────┐
│ 5. Kiosk Manager  │ │ 6. Kiosk Operator │
│ (Daily Ops, Shift)│ │ (Cashier / Staff) │
└───────────────────┘ └───────────────────┘
```

1. **Super Admin / System Owner:** Full system configuration, tenant management, billing, global system settings.
2. **HQ Administrator:** Multi-branch oversight, master product catalog, raw material master, master recipes, company-wide pricing, global reports.
3. **Branch / Inventory Manager:** Central warehouse management, stock dispatch/approval, branch-level stock counts, branch staff scheduling.
4. **Finance & Audit Officer:** Payroll review, wage rate adjustments, sales audit, wastage cost analysis, gross contribution reporting.
5. **Kiosk Manager:** Kiosk opening/closing, stock receiving, daily wastage logging, kiosk staff attendance override, cash reconciliation.
6. **Kiosk Operator / Staff:** Kiosk POS sales, order management, personal clock-in / clock-out.

---

## 8. System Architecture

`[RECOMMENDATION]`  
Multi-Kiosk adopts a **Decoupled Centralized Core & Edge Terminal** architectural model.

```
                       ┌────────────────────────────────────────┐
                       │           CLIENT APPLICATIONS          │
                       │  - HQ Web Portal (Responsive Desktop)  │
                       │  - Kiosk Terminal App (Web / PWA)      │
                       │  - Warehouse / Mobile Inventory App    │
                       └───────────────────┬────────────────────┘
                                           │ HTTPS / WSS / JSON
                                           ▼
                       ┌────────────────────────────────────────┐
                       │            API GATEWAY LAYER           │
                       │  - JWT / Sanctum Authentication        │
                       │  - Kiosk Device Fingerprint Validator  │
                       │  - Rate Limiting & Throttling          │
                       │  - Tenant / Company Context Resolver   │
                       └───────────────────┬────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│  HQ & CATALOG    │             │   INVENTORY &    │             │   WORKFORCE &    │
│     SERVICE      │             │   BOM SERVICE    │             │    ATTENDANCE    │
│ - Products/BOM   │             │ - Stock Ledger   │             │ - Clock In/Out   │
│ - Multi-Kiosk    │             │ - Transfers      │             │ - Hourly Payroll │
│ - Pricing/Branch │             │ - Wastage Log    │             │ - Roaming Roster │
└────────┬─────────┘             └────────┬─────────┘             └────────┬─────────┘
         │                                │                                │
         └────────────────────────────────┼────────────────────────────────┘
                                          │
                                          ▼
                       ┌────────────────────────────────────────┐
                       │             DATA LAYER                 │
                       │  - Primary Relational DB (Postgres/MySQL)│
                       │  - Redis (Cache, Sessions, Queues)     │
                       │  - Object Storage (Product Media)      │
                       └────────────────────────────────────────┘
```

---

## 9. Kiosk Architecture

### 9.1 Kiosk Device Profiles & Operation Modes
`[RECOMMENDATION]`  
A kiosk can operate in one of three profiles:
1. **Staff-Operated Counter POS:** Cashier signs in, takes orders, processes cash/card, and manages shift.
2. **Customer Self-Service Kiosk:** High-touch, customer-facing self-ordering kiosk with restricted UI (no staff management screens visible).
3. **Dual-Mode Hybrid:** Normal customer-facing catalog that provides a discreet "Staff Portal" gesture (e.g., PIN pad trigger) for clock-in/out and inventory tasks.

### 9.2 Device Identification & Security
`[RECOMMENDATION]`  
- **Hardware Binding:** Each kiosk is provisioned via an ephemeral activation code generated at HQ.
- **Kiosk Token:** The terminal exchanges the activation code for a cryptographically signed Kiosk Device Token (`KIOSK_TOKEN`) stored in secure storage.
- **Heartbeat & Telemetry:** Kiosks send periodic heartbeats (every 60s) reporting online status, app version, battery/power, and queue size.

### 9.3 Staff Authentication Options at Kiosk
`[RECOMMENDATION]` Evaluation of kiosk authentication methods:

| Method | Speed | Hardware Cost | Security Level | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **4-6 Digit Staff PIN** | Very Fast (< 3s) | Zero (Screen only) | Medium (Should not be shared) | **PRIMARY (MVP)** |
| **Staff QR Badge Scan** | Instant (< 1s) | Low (Kiosk Camera / Scanner) | High (Physical badge required) | **RECOMMENDED V1.1** |
| **Staff ID + Password** | Slow (> 10s) | Zero | High | **FALLBACK ONLY** |
| **NFC / RFID Card** | Instant (< 1s) | Moderate (Requires USB Reader) | High | **FUTURE HARDWARE OPTION**|

---

## 10. Product Architecture

### 10.1 Product Master Model
`[RECOMMENDATION]`  
Products represent sellable items on the kiosk menu.
- **Structure:** `Category -> Product -> Variants (Size, Temp) -> Modifiers/Add-ons`.
- **Classification:**
  - `MUST HAVE`: Name, SKU, Category, Base Price, Cost Price, Tax Status, Is Active.
  - `SHOULD HAVE`: Kiosk Availability Matrix (enable/disable specific products at Kiosk A vs Kiosk B), Image URL.
  - `OPTIONAL`: Product Variants (e.g., Regular, Large), Modifier Groups (e.g., Extra Shot, Less Sweet).
  - `FUTURE`: Dynamic Time-of-Day Menus (Breakfast vs Lunch menus).

---

## 11. Sales Architecture

### 11.1 Sales Transaction Lifecycle
`[RECOMMENDATION]`  

```
[1. Order Initiated] ──► [2. Items Configured] ──► [3. Total Calculated]
                                                           │
┌──────────────────────────────────────────────────────────┘
▼
[4. Payment Handled] ──► [5. Order Completed & Stored]
                                   │
                ┌──────────────────┴──────────────────┐
                ▼                                     ▼
     [6. Kiosk Receipt Emitted]            [7. Async Event Dispatched]
                                                      │
                                                      ▼
                                           [8. BOM Recipe Deducted
                                            from Kiosk Stockroom]
```

### 11.2 Traceability & Audit
`[USER REQUIREMENT]`  
Every sales record must store:
- `kiosk_id`: The originating physical kiosk.
- `branch_id`: The parent branch/location.
- `staff_id`: The cashier or authenticated staff member (nullable for customer self-service).
- `order_number`: Human-readable sequential daily order code (e.g., `ORD-K01-20260818-0042`).
- `order_uuid`: Idempotent UUID generated at client to prevent duplicate submission.
- `payment_method`: Cash, Credit/Debit, E-Wallet, Voucher, Unpaid.
- `payment_status`: `PENDING`, `PAID`, `REFUNDED`, `VOID`.

---

## 12. Raw Material Architecture

### 12.1 Raw Material Definition
`[USER REQUIREMENT]`  
Raw materials are non-sellable or sub-assembly inventory items tracked by weight, volume, or count.

Examples:
- *Coffee Beans* (Base Unit: `gram`, Purchase Unit: `kg`, Multiplier: `1000`)
- *Fresh Whole Milk* (Base Unit: `ml`, Purchase Unit: `liter`, Multiplier: `1000`)
- *Syrup Flavoring* (Base Unit: `ml`, Purchase Unit: `bottle-750ml`, Multiplier: `750`)
- *16oz Paper Cups* (Base Unit: `piece`, Purchase Unit: `sleeve-50`, Multiplier: `50`)
- *Paper Straws* (Base Unit: `piece`, Purchase Unit: `box-500`, Multiplier: `500`)

### 12.2 Unit of Measurement (UOM) Engine
`[RECOMMENDATION]`  
- **Base Unit (`base_uom`):** The smallest atomic unit used for recipe calculations and internal stock balances (`g`, `ml`, `unit`).
- **Purchase Unit (`purchase_uom`):** The standard commercial packaging purchased from suppliers (`kg`, `liter`, `box`, `pack`).
- **Conversion Multiplier (`conversion_rate`):** `1 Purchase Unit = X Base Units`.
  - Formula: `Total Base Stock = Purchase Quantity * conversion_rate`.

---

## 13. Recipe / BOM Management

### 13.1 Bill of Materials (BOM) Structure
`[USER REQUIREMENT]`  
A Recipe (BOM) maps `1 Sellable Product (or Variant)` to `N Raw Material Line Items`.

*Example Recipe: 1x Iced Latte (16oz)*
- Raw Material 1: Espresso Coffee Beans — `18.0 g`
- Raw Material 2: Fresh Whole Milk — `180.0 ml`
- Raw Material 3: Ice Cubes — `120.0 g`
- Raw Material 4: 16oz Cold Cup — `1.0 unit`
- Raw Material 5: Flat Cold Lid — `1.0 unit`
- Raw Material 6: Paper Straw — `1.0 unit`

### 13.2 Recipe Versioning & Deductions
`[RECOMMENDATION]`  
- Recipes are versioned. When a recipe is updated, past historical sales keep their original cost snapshot.
- Stock consumption occurs on `order.completed` event.
- If an order includes modifiers (e.g., "Extra Espresso Shot +18g"), the modifier BOM is appended to the base BOM deduction.

---

## 14. Inventory Architecture

### 14.1 Location Hierarchy
`[USER REQUIREMENT]`  

```
[Company / Tenant]
       │
       ├── Central Warehouse (Primary Supply Depot)
       │
       └── [Branch / Location: Downtown]
                 │
                 ├── Branch Buffer Stockroom (Optional)
                 ├── Kiosk 01 Stockroom (Point of Consumption)
                 └── Kiosk 02 Stockroom (Point of Consumption)
```

### 14.2 Inventory Movement Ledger
`[RECOMMENDATION]`  
Stock balances are never modified by arbitrary overwrite. Every change is recorded in an immutable `inventory_transactions` ledger with types:
1. `PURCHASE_RECEIPT`: Inward stock from supplier to Warehouse.
2. `TRANSFER_DISPATCH`: Stock leaving Warehouse for a Kiosk.
3. `TRANSFER_RECEIPT`: Stock arrived and accepted at Kiosk.
4. `SALE_CONSUMPTION`: Automatic recipe deduction from Kiosk stock.
5. `WASTAGE`: Damaged, spoiled, spilled, or expired raw material.
6. `ADJUSTMENT`: Manual stock reconciliation adjustment following audit.
7. `RETURN`: Stock sent back from Kiosk to Warehouse.

### 14.3 Stock Transfer Workflow
`[USER REQUIREMENT]`  

```
[1. Kiosk / Branch Requests Stock]
               │
               ▼
[2. Warehouse / HQ Approves Transfer] ──► (Status: APPROVED)
               │
               ▼
[3. Warehouse Dispatches & Ships Items] ──► (Status: DISPATCHED / IN_TRANSIT)
               │                             (Warehouse Stock Deducted)
               ▼
[4. Kiosk Receives & Counts Physical Stock]
               │
       ┌───────┴───────┐
       ▼               ▼
[Full Acceptance]  [Partial / Damaged]
       │               │
       ▼               ▼
 (Kiosk Stock    (Kiosk Stock Credited +
   Credited)      Discrepancy Logged)
```

### 14.4 Wastage Tracking
`[USER REQUIREMENT]`  
Every wastage entry requires:
- `raw_material_id` / `product_id`
- `location_id` (Specific Kiosk or Warehouse)
- `quantity` & `uom`
- `reason_code`: `EXPIRED`, `DAMAGED_TRANSIT`, `SPILLAGE_PREP`, `DEFECTIVE_BATCH`, `WRONG_ORDER_REMAKE`, `SAMPLE`.
- `reported_by_staff_id`
- `cost_impact`: `quantity * current_unit_cost`
- `notes` & `created_at` timestamp.

---

## 15. Staff Architecture

### 15.1 Staff Profiles & Cross-Kiosk Roaming
`[USER REQUIREMENT]`  
Staff members are centralized company entities capable of working across multiple kiosks.
- **Attributes:** Staff Code, Full Name, Contact, Assigned Base Branch, Status (`ACTIVE`, `INACTIVE`, `SUSPENDED`), Salary Type.
- **Multi-Kiosk Roaming Support:** A staff member is not hardcoded to a single kiosk. They can authenticate and clock in at any authorized kiosk within their branch/company.

---

## 16. Attendance Architecture

### 16.1 Clock In / Clock Out Workflow
`[USER REQUIREMENT]`  

```
┌──────────────────────────────────────────────────────────┐
│ Kiosk Terminal Screen                                    │
│ 1. Staff enters PIN or scans QR Badge                    │
│ 2. System validates Staff Active status                  │
│ 3. System checks last attendance event:                  │
│    - If No Open Shift -> Prompts [ CLOCK IN ]            │
│    - If Open Shift Exists -> Prompts [ CLOCK OUT ]       │
│ 4. Optional: Break Start / Break End                     │
│ 5. Capture Kiosk ID, Device UUID, Server Timestamp       │
│ 6. Emits Visual Confirmation + Slip / Notification       │
└──────────────────────────────────────────────────────────┘
```

### 16.2 Attendance Data Capture
`[RECOMMENDATION]`  
- `clock_in_at`: Exact timestamp.
- `clock_out_at`: Exact timestamp (nullable until clocked out).
- `kiosk_id_in`: Kiosk where shift started.
- `kiosk_id_out`: Kiosk where shift ended (supports starting at Kiosk A, ending at Kiosk B).
- `raw_duration_minutes`: Total elapsed minutes.
- `payable_duration_minutes`: Net minutes after break deduction and rounding.
- `status`: `OPEN`, `COMPLETED`, `AUTO_CLOSED` (system cutoff if forgotten), `ADJUSTED`.

---

## 17. Hourly Salary Architecture

### 17.1 Salary Calculation Model
`[USER REQUIREMENT]`  
Hourly salary is **optional**. Multi-Kiosk supports 4 employee compensation types:
1. `HOURLY`: Working Hours × Hourly Rate = Gross Earnings.
2. `DAILY`: Fixed daily wage per valid shift.
3. `MONTHLY`: Fixed monthly base wage (attendance used for discipline/tracking, not hourly math).
4. `NONE / EXEMPT`: No payroll calculation (e.g., owners, volunteers, contract partners).

### 17.2 Hourly Calculation Specification
`[RECOMMENDATION]`  

$$\text{Gross Hourly Pay} = \left( \frac{\text{Payable Minutes}}{60} \right) \times \text{Hourly Rate (RM)}$$

- **Rounding Rules (Configurable per Tenant/Branch):**
  - Option A: Exact minute calculation (e.g., 512 mins = 8.533 hrs).
  - Option B (Recommended): 15-minute standard rounding (e.g., 8 hrs 7 mins -> 8.00 hrs; 8 hrs 8 mins -> 8.25 hrs).
- **Grace Period:** Configurable 5 to 10-minute arrival window before marking as late.
- **Manual Adjustment & Approval:** Attendance entries can be adjusted by Branch Managers (with required audit reasons) and approved by Finance.

---

## 18. Reporting Architecture

### 18.1 Central Intelligence Views
`[USER REQUIREMENT]`  

#### 1. Sales Intelligence
- Revenue & Order Volume by Kiosk, by Branch, by Category, by Hourly Time-Slot.
- Average Order Value (AOV), top-selling items and modifiers.

#### 2. Inventory & Wastage Intelligence
- Current stock valuation per kiosk and central warehouse.
- Ingredient consumption rates vs sales volume.
- Wastage loss summary by reason code and kiosk.
- Low stock and restock recommendation reports.

#### 3. Workforce & Attendance Intelligence
- Total hours worked per staff, per kiosk, per shift.
- Punctuality & attendance exceptions (Late, Early departure, Missing clock-outs).
- Gross hourly payroll summary per pay period.

#### 4. Gross Contribution Metric
`[USER REQUIREMENT]`  

$$\text{Gross Contribution} = \text{Gross Revenue} - \text{Raw Material BOM Cost} - \text{Direct Hourly Labour Cost}$$

> *Note:* Stated clearly as "Gross Contribution" (Operating Gross Margin), explicitly excluding fixed overheads (rent, depreciation, utilities) unless separately configured.

---

## 19. Security Architecture

`[RECOMMENDATION]`  
- **Zero Trust Terminal Design:** Kiosks are treated as edge devices outside the trusted HQ perimeter.
- **Device Cryptographic Token:** Kiosks authenticate via mTLS or SHA-256 HMAC signed headers with rotation policies.
- **Staff PIN Encryption:** PINs hashed using bcrypt/argon2id with per-kiosk rate limiting (lockout after 5 failed attempts).
- **Role-Based Scoping:** API routes enforce middleware guards (`kiosk.auth`, `role:admin`, `role:branch_manager`, `permission:inventory.transfer`).
- **Immutable Audit Logging:** Every administrative override, price change, and stock write generates an audit record with user, IP, timestamp, old state, and new state.

---

## 20. Offline Strategy

`[RECOMMENDATION]`  
- **Analysis:** Retail and F&B kiosks frequently face unstable Wi-Fi or LTE failovers. Halting all kiosk sales during a 2-minute network blink causes customer abandonment and lost revenue.
- **Recommended Offline Capability:** `OFFLINE-RESILIENT POS & TIMEKEEPING`
  - Kiosk runs a client-side database (IndexedDB for PWA/Web or SQLite for native wrappers).
  - Local catalog cache allows menu browsing and cash/offline payments.
  - Offline transactions receive a client-generated UUID (`offline_queue_id`).
  - Upon network restoration, an asynchronous sync worker flushes pending orders and clock events.
- **Trade-offs & Constraints:**
  - *Payment Constraint:* Online card/e-wallet terminals require live network; offline mode supports Cash or Deferred Authorization only.
  - *Stock Sync:* Real-time stock decrement is queued; HQ resolves race conditions via timestamped ledger replay.

---

## 21. Synchronization Strategy

`[RECOMMENDATION]`  

```
   ┌────────────────────────────────────────────────────────┐
   │                   CENTRAL SERVER (HQ)                  │
   └───────────────▲────────────────────────┬───────────────┘
                   │                        │
       Push Up:    │                        │ Push Down:
       - Orders    │                        │ - Menu & Prices
       - Clock-ins │                        │ - BOM Updates
       - Wastage   │                        │ - Staff PIN Hashes
                   │                        │ - Transfer Dispatches
   ┌───────────────┴────────────────────────▼───────────────┐
   │                 LOCAL KIOSK TERMINAL                   │
   │  - Client Sync Worker (Interval: 30s / Event-Driven)   │
   │  - Conflict Resolution Engine (Server-Wins on Catalog, │
   │    Append-Only on Transactions & Clock-ins)            │
   └────────────────────────────────────────────────────────┘
```

- **Idempotency Keys:** Every sync payload includes a UUID to prevent double-charging or double-counting on network retries.
- **Catalog Versioning:** Kiosks check `catalog_version_hash` on heartbeat; only fetch menu diffs when changed.

---

## 22. API Planning

`[RECOMMENDATION]`  
RESTful JSON API grouped by operational domains:

### 22.1 Kiosk Device & Auth APIs
- `POST /api/v1/kiosk/pair` — Activate device with pairing code.
- `POST /api/v1/kiosk/heartbeat` — Send telemetry & check catalog version.
- `POST /api/v1/kiosk/staff/verify-pin` — Quick staff authentication for shift or clock-in.

### 22.2 Attendance APIs
- `POST /api/v1/kiosk/attendance/clock-in` — Clock in staff at kiosk.
- `POST /api/v1/kiosk/attendance/clock-out` — Clock out staff at kiosk.
- `GET  /api/v1/kiosk/attendance/status?staff_id={id}` — Check current open shift.
- `GET  /api/v1/admin/attendance/summary` — HQ attendance and hours report.
- `PUT  /api/v1/admin/attendance/{id}/adjust` — Manager manual punch adjustment.

### 22.3 Catalog & Sales APIs
- `GET  /api/v1/kiosk/catalog` — Download active menu, variants, and pricing.
- `POST /api/v1/kiosk/orders` — Submit completed order (idempotent with `order_uuid`).
- `POST /api/v1/kiosk/orders/sync-batch` — Flush offline order queue.
- `GET  /api/v1/admin/orders` — HQ sales order search and filter.

### 22.4 Inventory & Recipe APIs
- `GET  /api/v1/inventory/stock-levels?location_id={id}` — Current stock at kiosk/warehouse.
- `POST /api/v1/inventory/transfers` — Create stock transfer request.
- `PUT  /api/v1/inventory/transfers/{id}/status` — Advance transfer (Approve/Dispatch/Receive).
- `POST /api/v1/inventory/wastage` — Log raw material wastage event.
- `GET  /api/v1/catalog/recipes/{productId}` — View BOM definition.

---

## 23. Database Architecture

### 23.1 Verified Existing Database
`[VERIFIED]`
```text
Existing Database:
NONE (Empty workspace / Clean initialization)
```

### 23.2 Proposed Multi-Kiosk Database Schema
`[RECOMMENDATION]`  
Relational Schema designed for PostgreSQL / MySQL 8 with strict foreign key integrity, UUIDs for distributed entity references, and indexing on frequent lookup paths.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   companies     │──────<│    branches     │──────<│     kiosks      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                         │                         │
         │                         │                         ├──────< orders
         │                         │                         ├──────< attendances
         │                         │                         └──────< kiosk_stocks
         ▼                         ▼                                     │
┌─────────────────┐       ┌─────────────────┐                            │
│  raw_materials  │       │   inventories   │<───────────────────────────┘
└─────────────────┘       └─────────────────┘
         │                         ▲
         ▼                         │
┌─────────────────┐       ┌─────────────────┐
│  recipe_items   │──────>│inventory_trans. │
└─────────────────┘       └─────────────────┘
```

#### Core Entities Specification

```sql
-- 1. TENANT / COMPANY (Multi-tenant Foundation & Branding)
CREATE TABLE companies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    logo_path VARCHAR(255) NULL,              -- Uploaded by Super Admin / Approved roles
    brand_primary_color VARCHAR(50) DEFAULT '#0d6efd',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. BRANCHES / PHYSICAL LOCATIONS
CREATE TABLE branches (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY uq_company_branch_code (company_id, code)
);

-- 3. KIOSKS (Physical Terminals)
CREATE TABLE kiosks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    branch_id BIGINT NOT NULL,
    kiosk_code VARCHAR(50) NOT NULL,
    kiosk_name VARCHAR(255) NOT NULL,
    custom_logo_path VARCHAR(255) NULL,        -- Optional kiosk-level logo override
    device_uid VARCHAR(255) UNIQUE,
    api_token_hash VARCHAR(255),
    kiosk_type ENUM('COUNTER_POS', 'CUSTOMER_SELF_SERVICE', 'HYBRID') DEFAULT 'COUNTER_POS',
    status ENUM('ONLINE', 'OFFLINE', 'MAINTENANCE', 'INACTIVE') DEFAULT 'INACTIVE',
    last_heartbeat_at TIMESTAMP NULL,
    app_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    UNIQUE KEY uq_branch_kiosk_code (branch_id, kiosk_code)
);

-- 4. USERS & STAFF
CREATE TABLE staff (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    primary_branch_id BIGINT NULL,
    staff_code VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    pin_hash VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'HQ_ADMIN', 'BRANCH_MANAGER', 'KIOSK_MANAGER', 'STAFF', 'FINANCE') NOT NULL,
    salary_type ENUM('HOURLY', 'DAILY', 'MONTHLY', 'NONE') DEFAULT 'NONE',
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    daily_rate DECIMAL(10,2) DEFAULT 0.00,
    monthly_rate DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (primary_branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    UNIQUE KEY uq_company_staff_code (company_id, staff_code)
);

-- 5. ATTENDANCE & SHIFTS
CREATE TABLE attendances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,
    kiosk_id_in BIGINT NOT NULL,
    kiosk_id_out BIGINT NULL,
    clock_in_at TIMESTAMP NOT NULL,
    clock_out_at TIMESTAMP NULL,
    raw_duration_minutes INT DEFAULT 0,
    payable_duration_minutes INT DEFAULT 0,
    hourly_rate_snapshot DECIMAL(10,2) DEFAULT 0.00,
    gross_earnings DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('OPEN', 'COMPLETED', 'AUTO_CLOSED', 'ADJUSTED') DEFAULT 'OPEN',
    adjusted_by BIGINT NULL,
    adjustment_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (kiosk_id_in) REFERENCES kiosks(id),
    FOREIGN KEY (kiosk_id_out) REFERENCES kiosks(id),
    FOREIGN KEY (adjusted_by) REFERENCES staff(id) ON DELETE SET NULL,
    INDEX idx_staff_clock (staff_id, clock_in_at)
);

-- 6. RAW MATERIALS MASTER
CREATE TABLE raw_materials (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    base_uom VARCHAR(20) NOT NULL,            -- e.g. 'g', 'ml', 'unit'
    purchase_uom VARCHAR(20) NOT NULL,        -- e.g. 'kg', 'liter', 'pack'
    conversion_rate DECIMAL(12,4) NOT NULL,   -- e.g. 1000 for kg to g
    standard_cost_per_base_unit DECIMAL(12,4) DEFAULT 0.0000,
    min_stock_alert_level DECIMAL(12,4) DEFAULT 0.0000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY uq_company_material_sku (company_id, sku)
);

-- 7. STOCK LOCATIONS (Warehouses and Kiosks)
CREATE TABLE stock_locations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    branch_id BIGINT NULL,
    kiosk_id BIGINT NULL,
    location_name VARCHAR(255) NOT NULL,
    location_type ENUM('CENTRAL_WAREHOUSE', 'BRANCH_STORE', 'KIOSK') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (kiosk_id) REFERENCES kiosks(id) ON DELETE SET NULL
);

-- 8. LOCATION STOCK BALANCES
CREATE TABLE inventory_balances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    location_id BIGINT NOT NULL,
    raw_material_id BIGINT NOT NULL,
    quantity_on_hand DECIMAL(14,4) DEFAULT 0.0000, -- Stored in base_uom
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES stock_locations(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
    UNIQUE KEY uq_location_material (location_id, raw_material_id)
);

-- 9. PRODUCTS & RECIPES (BOM)
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    image_url TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY uq_company_product_sku (company_id, sku)
);

CREATE TABLE recipe_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    raw_material_id BIGINT NOT NULL,
    quantity_required DECIMAL(12,4) NOT NULL, -- in raw material base_uom
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE,
    UNIQUE KEY uq_product_material (product_id, raw_material_id)
);

-- 10. ORDERS & SALES
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    company_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    kiosk_id BIGINT NOT NULL,
    staff_id BIGINT NULL,
    order_number VARCHAR(100) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL,
    total_material_cost DECIMAL(10,2) DEFAULT 0.00,
    payment_method ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'E_WALLET', 'QR_PAY', 'OTHER') NOT NULL,
    payment_status ENUM('PENDING', 'PAID', 'REFUNDED', 'VOID') DEFAULT 'PAID',
    order_status ENUM('COMPLETED', 'CANCELLED') DEFAULT 'COMPLETED',
    ordered_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (kiosk_id) REFERENCES kiosks(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
    INDEX idx_order_date_kiosk (kiosk_id, ordered_at)
);

CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    unit_cost_snapshot DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 11. STOCK TRANSFERS & WASTAGE
CREATE TABLE stock_transfers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transfer_number VARCHAR(100) UNIQUE NOT NULL,
    company_id BIGINT NOT NULL,
    source_location_id BIGINT NOT NULL,
    dest_location_id BIGINT NOT NULL,
    requested_by BIGINT NOT NULL,
    approved_by BIGINT NULL,
    dispatched_by BIGINT NULL,
    received_by BIGINT NULL,
    status ENUM('REQUESTED', 'APPROVED', 'DISPATCHED', 'RECEIVED', 'CANCELLED') DEFAULT 'REQUESTED',
    dispatched_at TIMESTAMP NULL,
    received_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (source_location_id) REFERENCES stock_locations(id),
    FOREIGN KEY (dest_location_id) REFERENCES stock_locations(id)
);

CREATE TABLE stock_transfer_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transfer_id BIGINT NOT NULL,
    raw_material_id BIGINT NOT NULL,
    quantity_requested DECIMAL(14,4) NOT NULL,
    quantity_dispatched DECIMAL(14,4) NULL,
    quantity_received DECIMAL(14,4) NULL,
    FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id)
);

CREATE TABLE wastages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,
    raw_material_id BIGINT NOT NULL,
    quantity DECIMAL(14,4) NOT NULL,
    cost_impact DECIMAL(10,2) NOT NULL,
    reason ENUM('EXPIRED', 'DAMAGED_TRANSIT', 'SPILLAGE_PREP', 'DEFECTIVE_BATCH', 'WRONG_ORDER_REMAKE', 'OTHER') NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES stock_locations(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id),
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id)
);

-- 12. IMMUTABLE AUDIT TRAIL
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_lookup (company_id, entity_type, entity_id)
);
```

---

## 24. Permission Matrix

`[RECOMMENDATION]`  

| Permission / Action | Super Admin | HQ Admin | Branch Mgr | Kiosk Mgr | Kiosk Staff | Finance |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Manage Companies & Branches** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Upload Logo & Brand Identity**| ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Manage Kiosk Devices** | ✅ | ✅ | Branch Only| View Only | ❌ | ❌ |
| **Product & Price Editing** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Raw Materials & BOM Editor**| ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Initiate Stock Transfer** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Approve & Dispatch Transfer**| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Receive Stock at Kiosk** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Log Wastage** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Perform Kiosk POS Sales** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Staff Clock In / Out** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Adjust Staff Attendance** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **View Gross Contribution BI** | ✅ | ✅ | Branch Only| ❌ | ❌ | ✅ |
| **View Audit Trail** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 25. Business Rules

### 25.1 Confirmed Business Rules
`[USER REQUIREMENT]`
1. Each kiosk has an independent identity and belongs to a specific branch.
2. Staff must be able to clock in and clock out at any authorized kiosk.
3. Hourly salary calculation is optional per staff member.
4. Raw materials have distinct base and purchase units with mathematical conversion multipliers.
5. Every completed sale must be deterministically linked to a kiosk.
6. Inventory balances must be isolated by stock location (Central Warehouse vs Individual Kiosks).

### 25.2 Proposed Business Rules
`[RECOMMENDATION]`
1. **Zero-Stock Policy:** When raw material stock drops below zero due to delayed stock receipts, sales are NOT blocked (to prevent customer disruption), but an urgent `NEGATIVE_INVENTORY_WARNING` alert is generated.
2. **Shift Auto-Close:** If a staff member fails to clock out after 14 continuous hours, the system automatically flags the shift as `AUTO_CLOSED` and marks it for manager review.
3. **Price Integrity:** Historical completed orders cannot have their line prices modified under any circumstance.
4. **Idempotent Order Submission:** Orders submitted with duplicate `order_uuid` are recognized and returned without creating duplicate database records or stock deductions.

---

## 26. Edge Cases & Failure Modes

`[RECOMMENDATION]`  

| Edge Case / Problem | Business / Technical Impact | Recommended System Handling | Approval Needed? |
| :--- | :--- | :--- | :--- |
| **Staff forgets to clock out** | Duration calculation would run infinitely, skewing payroll. | Auto-close shift at threshold (e.g. 14 hrs). Send notification to Branch Manager to insert manual punch time with audit reason. | YES |
| **Double clock-in at same or different kiosk** | Duplicate open shifts, corrupting hours. | Reject 2nd clock-in if an active `OPEN` shift exists for that staff; prompt "Open shift exists at Kiosk X. Clock out first?". | YES |
| **Kiosk loses Internet during peak sales** | POS screen hangs; customer transactions fail. | Kiosk switches seamlessly to Offline Queue Mode (local IndexedDB); saves signed order UUIDs; flushes on reconnection. | YES |
| **Payment succeeds at payment terminal but POS app crashes** | Customer paid, but order not stored in DB. | Kiosk boot recovery checks pending payment gateway transaction ID and completes the draft order automatically. | YES |
| **Recipe updated while Kiosk is offline** | Discrepancy between old ingredient ratio and new ratio. | Server records recipe version ID on order item creation; stock deduction calculates based on the recipe active at sale time. | NO (Standard) |
| **Negative Stock Condition** | Inventory hits 0 or negative during high-volume rush. | Order proceeds; back-office logs negative variance flag; inventory adjustment workflow triggered upon restock. | YES |
| **Broken/Spoiled raw material received during transfer** | Kiosk received less stock than warehouse shipped. | Kiosk receiver enters physical received quantity; system automatically routes difference to `TRANSIT_LOSS` wastage. | YES |

---

## 27. Scalability & Growth Model

`[RECOMMENDATION]`  

```
Phase 1: 1-10 Kiosks        Phase 2: 10-100 Kiosks       Phase 3: 500+ Kiosks
 Single Server + MySQL       App Nodes + Read Replica     Distributed Services
 Synchronous DB Writes       Redis Cache + Async Queue    Tenant Sharding + Edge CDN
```

- **Database Indexing:** Compound indexes on `(company_id, branch_id)`, `(kiosk_id, ordered_at)`, and `(staff_id, clock_in_at)`.
- **Asynchronous Event Bus:** Stock deduction, push notifications, and daily payroll aggregations are dispatched to background queue workers (Redis / Celery / Laravel Queue).
- **Read/Write Splitting:** Heavy BI queries and dashboard aggregations routed to dedicated read replicas.

---

## 28. Future Integrations

`[RECOMMENDATION]`  

| Integration Type | Target Ecosystem | Scope Phase | Purpose |
| :--- | :--- | :--- | :--- |
| **E-Wallets / QR Payment** | DuitNow QR, Touch 'n Go, GrabPay | V1.1 | Direct on-screen dynamic QR payment for kiosk self-ordering. |
| **Hardware Thermal Printers** | ESC/POS (USB / Network / Bluetooth) | MVP / V1.1 | Automated receipt and kitchen order token printing. |
| **Digital E-Invoice** | LHDN MyInvois (Malaysia) | V1.2 | Automated e-invoice validation and submission per regulatory mandate. |
| **External Accounting** | Xero, QuickBooks, SQL Account | Future | Automated journal sync for daily sales, COGS, and wages. |
| **Barcode / QR Scanner** | USB / Serial 2D Scanners | V1.1 | Rapid stock receiving at warehouse and staff badge scanning. |

---

## 29. Technology Stack Analysis

### 29.1 Confirmed Technology Stack Architecture
`[USER REQUIREMENT]` `[APPROVED DECISION]`  
The platform will be constructed as a **Single Unified Monolith Application** containing both HQ management and Kiosk frontend interfaces, REST endpoints, and asynchronous queue workers.

| Layer / Component | Technology Selected | Version / Spec | Justification & Architecture Role |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | **Laravel** | **12.x** (PHP 8.2+) | Robust enterprise foundation, Eloquent ORM, built-in transaction safety, asynchronous job queues, and Sanctum API token security. |
| **Client SPA Bridge** | **Inertia.js** | **v2.x** | Seamless full-stack routing and state synchronization without building boilerplate REST endpoints for internal admin pages. |
| **Frontend UI Library**| **React + TypeScript** | **React 19 + TS 5** | Strict type safety, high-performance UI rendering for real-time POS carts, interactive BOM builders, and dashboard analytics. |
| **Styling & Theme** | **Bootstrap 5** | **v5.3+** | Enterprise-grade, clean, responsive UI component system with custom theme tokens. |
| **Admin Layout** | **Responsive Admin Template**| **Left Sidebar Layout**| Collapsible, mobile-responsive left sidebar navigation for all HQ and Branch administrative modules; dedicated full-viewport layout for Kiosk terminals. |
| **Primary Database** | **MySQL** | **8.0+** | Strict relational integrity, ACID compliance, composite indexing, and JSON document columns for audit snapshots. |
| **Cache & Queue Bus** | **Redis** | **7.x** | In-memory session store, API rate-limiting cache, and high-throughput background queue for automated recipe BOM stock deductions. |
| **Branding Engine** | **Laravel File Storage** | **Public / S3 Driver** | Super Admin and approved managerial roles upload and crop company/kiosk logos dynamically reflected across sidebar and receipt templates. |

---

## 30. MVP Scope Definition

`[RECOMMENDATION]`  

```
┌────────────────────────────────────────────────────────────────────────┐
│                              MVP (V1.0)                                │
│ - HQ Admin Portal: Company, Branches, Kiosks registration              │
│ - Product Catalog & Categories                                         │
│ - Raw Material Master & Unit Conversions (g, kg, ml, l, units)         │
│ - Recipe (BOM) creation for products                                   │
│ - Location-Aware Inventory (Warehouse & Kiosk Stockrooms)              │
│ - Stock Transfer (Request -> Dispatch -> Receive)                      │
│ - Wastage Logging with Reasons & Cost impact                           │
│ - Kiosk POS Terminal (Order capture, line items, Cash/Basic payment)   │
│ - Automated Recipe Stock Deduction on Sale                             │
│ - Staff Management & Cross-Kiosk PIN Clock In / Clock Out              │
│ - Optional Hourly Salary calculation & Hours report                    │
│ - Dashboard: Daily Sales, Stock Levels, Attendance, Gross Contribution │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              V1.1 / V1.2                               │
│ - Dynamic QR Payment Integration (DuitNow, TNG)                        │
│ - Thermal Printer (ESC/POS) direct driver support                      │
│ - Offline IndexedDB Queue & Sync Worker for Kiosks                     │
│ - Staff Shift Scheduling & Roster Planner                              │
│ - Blind Physical Stock Count & Reconciliation                          │
│ - Low Stock Automated Email/Telegram Alerts                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           FUTURE ROADMAP                               │
│ - LHDN MyInvois E-Invoicing API                                        │
│ - Customer Loyalty & Membership Points at Kiosk                        │
│ - External Accounting Sync (Xero, SQL Account)                         │
│ - Customer Self-Service Facial Recognition / NFC Badge Check-in        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 31. Implementation Roadmap

`[RECOMMENDATION]`  

```
Phase 1: Foundation & Core Tenant Architecture
   │
Phase 2: Multi-Kiosk & Device Management
   │
Phase 3: Product Master & Recipe (BOM) Engine
   │
Phase 4: Raw Material & Location Inventory Ledger
   │
Phase 5: Stock Transfer & Wastage Workflow
   │
Phase 6: Kiosk POS & Order Processing Engine
   │
Phase 7: Staff Management & Kiosk Clock In / Out
   │
Phase 8: Optional Hourly Salary & Payroll Reporting
   │
Phase 9: Executive Dashboard & Gross Contribution BI
   │
Phase 10: Security Hardening, Verification & QA Suite
```

### Detailed Phase Deliverables:
- **Phase 1 (Foundation):** Base database schemas, RBAC, tenant isolation, audit log engine.
- **Phase 2 (Kiosk Management):** Branch and kiosk registration, pairing tokens, heartbeat telemetry.
- **Phase 3 (Catalog & BOM):** Products, categories, raw material master, unit conversion calculator, recipe builder.
- **Phase 4 (Inventory Engine):** Location balances, immutable inventory transaction ledger, purchase receiving.
- **Phase 5 (Transfers & Wastage):** Transfer lifecycle (Request/Approve/Dispatch/Receive), wastage entry with cost math.
- **Phase 6 (Kiosk POS):** POS UI, cart, receipt calculation, order persistence, automated async BOM deduction.
- **Phase 7 (Attendance):** Kiosk staff clock-in/out UI, PIN verification, shift tracker, late/early flags.
- **Phase 8 (Hourly Wages):** Payable hours calculation, rounding engine, gross wage aggregation, manager adjustments.
- **Phase 9 (Analytics):** Dashboard charts, sales by kiosk/branch, stock valuation, gross contribution ledger.
- **Phase 10 (Verification):** Sentinel 6-point verification (Unit tests, static analysis, security audit, diff review).

---

## 32. Testing Strategy

`[RECOMMENDATION]`  
- **Unit Testing:**
  - Unit conversion mathematical engine (`kg -> g`, `box -> units`).
  - Recipe BOM consumption calculations across multi-item orders.
  - Hourly wage calculations including 15-minute rounding and break deductions.
- **Feature & API Testing:**
  - Kiosk authentication and device pairing handshake.
  - Order submission idempotency (replay protection with duplicate UUID).
  - Stock transfer state transitions (cannot receive an un-dispatched transfer).
  - Attendance clock-in followed by clock-out state transitions.
- **Concurrency & Race Condition Testing:**
  - Simultaneous sales at Kiosk A and Kiosk B consuming the same shared buffer stock.
  - Concurrent clock-in requests with the same staff PIN.
- **Security Testing:**
  - RBAC privilege escalation tests.
  - SQL injection and parameter tampering tests.

---

## 33. Risk Management

`[RECOMMENDATION]`  

| Risk Description | Probability | Impact | Mitigation Strategy |
| :--- | :---: | :---: | :--- |
| **Network outage at physical kiosk location** | High | High | Implement offline-resilient local storage (IndexedDB) with queued background synchronization. |
| **Staff sharing PIN numbers for clock-in buddy punching** | Medium | Medium | Require kiosk camera snapshot or introduce QR badge / biometric scanning in V1.1. |
| **Inventory discrepancy between system BOM and physical usage** | High | Medium | Implement regular physical stock reconciliation counts and log variances as wastage/prep loss. |
| **Incorrect unit conversion entries by admin** | Low | High | Restrict unit creation to pre-validated metric/imperial types with UI conversion preview calculators. |

---

## 34. Information Not Yet Verified

`[UNKNOWN]` The following items remain unverified and require stakeholder input:
1. Specific physical kiosk hardware model and OS (e.g., Windows Touch PC, Android Tablet, iPad, custom kiosk enclosure).
2. Existing POS hardware peripheral specifications (e.g., specific thermal receipt printer models, USB cash drawers).
3. Primary payment methods intended for day-1 launch (e.g., Cash only vs External Card Terminal vs Dynamic QR).
4. Preferred production hosting infrastructure (e.g., Cloud VPS, AWS, local on-premise server).

---

## 35. Open Questions

`[RECOMMENDATION]`  
The following architectural questions affect scope and implementation:

1. **Kiosk UI Primary Audience:** Will the kiosk terminal be operated exclusively by staff (Cashier POS), by customers (Self-Ordering), or both?
2. **Payment Terminal Integration:** Should MVP record manual payment selections (e.g., Cash, Manual Credit Card Terminal), or is direct API payment gateway integration required immediately?
3. **Hardware Thermal Receipt Printing:** Is thermal ESC/POS receipt printing required in the MVP, or is digital receipt/order screen sufficient for Phase 1?

---

## 36. Architectural Decisions

### Decision 1: Tech Stack & Architecture Pattern
- **Status:** `[APPROVED DECISION]` by Project Owner
- **Selected Stack:** **Single Monolithic Application** with **Laravel 12 + React 19 + TypeScript + Inertia.js v2 + MySQL 8 + Redis + Bootstrap 5 (Responsive Admin Template with Left Sidebar)**.
- **Rationale:** Minimizes API boilerplate for HQ while preserving instant React responsiveness, built-in queue workers, atomic DB transactions, and enterprise authentication.

### Decision 2: Inventory Consumption Timing
- **Status:** `[RECOMMENDATION — PENDING APPROVAL]`
- **Option 1 (Recommended):** Asynchronous BOM deduction immediately upon order completion event via Redis background queue.
- **Option 2:** End-of-day batch inventory deduction.
- **Trade-off:** Option 1 provides real-time stock balances and immediate low-stock warnings.

### Decision 3: Offline Capability Tier for MVP
- **Status:** `[RECOMMENDATION — PENDING APPROVAL]`
- **Option 1 (Recommended):** Online-First with Graceful Reconnect for MVP, expanding to full IndexedDB Offline Queue in V1.1.
- **Option 2:** Full Offline-First Architecture from Day 1.
- **Trade-off:** Option 1 shortens time-to-MVP while maintaining clean data consistency.

---

## 37. Final Architecture Recommendation

`[RECOMMENDATION]`  
Proceed with **Phase 1 Foundation & Scaffolding** using the approved **Single Monolith (Laravel 12 + React + TS + Inertia + MySQL + Redis + Bootstrap 5 Admin Template with Left Sidebar)** architecture, delivering the unified HQ administrative system (with logo upload & branding), location-aware inventory/BOM engine, and responsive Kiosk POS & Staff Attendance terminals.

---

## 38. Approval Gate

```text
================================================================================
                              APPROVAL GATE
================================================================================

Status: WAITING FOR EXPLICIT APPROVAL

Planning completed.
No implementation code has been written.
No database migrations have been created or executed.
No npm/composer packages have been installed.
No server configuration has been modified.
No git commits or external changes have been made.

--------------------------------------------------------------------------------
Decisions Requiring Approval:
1. Master Planning Specification & Architecture
2. MVP Functional Scope (Section 30)
3. Proposed Database Schema (Section 23)
4. Technology Stack Selection (Laravel + React vs Node + Next.js)
5. 10-Phase Implementation Roadmap (Section 31)
--------------------------------------------------------------------------------

Approved By: ___________________________________

Approval Date: _________________________________

Approval Status: [ NOT APPROVED — PLANNING PHASE ONLY ]
================================================================================
```
