# Multi-Kiosk — Centralized Management & Distributed Terminal Platform

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 12">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Inertia.js-v2.x-9553E9?style=for-the-badge&logo=inertia&logoColor=white" alt="Inertia.js">
  <img src="https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white" alt="Bootstrap 5">
  <img src="https://img.shields.io/badge/Tests-Passing-10B981?style=for-the-badge&logo=githubactions&logoColor=white" alt="Tests Passing">
</p>

---

## 📖 Table of Contents
1. [Overview & Product Vision](#-overview--product-vision)
2. [Key Core Pillars](#-key-core-pillars)
3. [Architecture & Technology Stack](#-architecture--technology-stack)
4. [System Modules & UI Walkthrough](#-system-modules--ui-walkthrough)
5. [Core Business Logic & Mathematical Formulas](#-core-business-logic--mathematical-formulas)
6. [Database Schema & Entity Model](#-database-schema--entity-model)
7. [Installation & Setup Guide](#-installation--setup-guide)
8. [Demo Credentials & Seeded Data](#-demo-credentials--seeded-data)
9. [Automated Verification & Testing](#-automated-verification--testing)
10. [License](#-license)

---

## 🌟 Overview & Product Vision

**Multi-Kiosk** is a modern retail & F&B point-of-sale, inventory control, and workforce management platform designed for multi-branch, multi-kiosk business operations. The platform bridges centralized headquarters (HQ) administrative oversight with distributed physical edge kiosk endpoints.

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
│   (Pavilion KL Store) │                       │ (Mid Valley Megamall) │
└───────────┬───────────┘                       └───────────┬───────────┘
            │                                               │
     ┌──────┴──────┐                                 ┌──────┴──────┐
     ▼             ▼                                 ▼             ▼
┌─────────┐   ┌─────────┐                       ┌─────────┐   ┌─────────┐
│ KIOSK 1 │   │ KIOSK 2 │                       │ KIOSK 1 │   │ KIOSK 2 │
│ (POS /  │   │ (Self-  │                       │ (POS /  │   │(Express │
│  Clock) │   │  Order) │                       │  Clock) │   │ Hybrid) │
└─────────┘   └─────────┘                       └─────────┘   └─────────┘
```

---

## 🚀 Key Core Pillars

### 1. 🏪 Multi-Kiosk & Branch Governance
- Centralized management of multiple physical branches and distributed hardware kiosks.
- Hardware binding with unique device UIDs, tokens, and live heartbeat telemetry.
- Flexible kiosk operating profiles:
  - **Counter POS:** Cashier-operated checkout terminal.
  - **Customer Self-Service:** Touchscreen ordering interface.
  - **Hybrid Dual-Mode:** Customer catalog with discreet staff PIN pad trigger.

### 2. 🌾 Raw Material & Recipe (BOM) Engine
- Atomic Unit of Measurement (UOM) conversion engine (`kg -> g`, `liter -> ml`, `box -> units`).
- Interactive Bill of Materials (BOM) builder linking products to raw ingredients.
- Dynamic recipe cost calculation with live projected gross margins.

### 3. ☕ Dynamic Product Modifiers & Add-on Recipe BOM Deductions
- Full support for drink & food customizations:
  - **Extra Shots & Boosters:** e.g. Extra Espresso Shot (+RM 3.00) $\rightarrow$ automatically deducts an extra $+18\text{g}$ coffee beans.
  - **Milk Alternatives:** e.g. Oat Milk Swap (+RM 2.50) $\rightarrow$ automatically deducts $+180\text{ml}$ Oat Milk.
  - **Syrups & Flavors:** e.g. Vanilla Syrup Pump (+RM 1.50) $\rightarrow$ deducts $+15\text{ml}$ Vanilla Syrup.
  - **Sweetness & Temperature:** Single/Multiple choice rules with custom constraints (`min_selections`, `max_selections`, `is_required`).
- Dynamic live cost impact & gross margin calculation directly in the HQ Modifier Builder.

### 4. 🛒 Location-Aware Inventory & Automated BOM Deduction
- Independent stock ledger across Central Warehouses, Branch Stores, and Kiosk Stockrooms.
- **Automated BOM Recipe Stock Deduction:** Completing a sale automatically decrements raw ingredient quantities (both base product recipe AND selected modifier add-ons) from the specific physical kiosk's stockroom.
- Multi-step Stock Transfer state machine (`REQUESTED` $\rightarrow$ `APPROVED` $\rightarrow$ `DISPATCHED` $\rightarrow$ `RECEIVED`).
- Dedicated Wastage & Spoilage logger with financial cost impact audit.

### 5. 👥 Workforce Attendance & Optional Hourly Payroll
- Cross-kiosk staff roaming (clock in at Kiosk A, clock out at Kiosk B).
- Fast 4–6 digit numeric PIN authentication directly at kiosk terminals.
- **15-Minute Standard Rounding Engine:** Converts raw work time into standardized payable hours.
- Support for multiple compensation models: `HOURLY`, `DAILY`, `MONTHLY`, `NONE`.

### 6. 📊 Executive Gross Contribution Financial BI
- Real-time financial contribution tracking:
  $$\text{Gross Contribution} = \text{Gross Revenue} - \text{BOM Raw Material Cost} - \text{Direct Hourly Labour Wages}$$
- Dynamic margin percentage breakdown and low-stock alert monitoring.

### 7. 🎨 Branding & Custom Identity
- Super Admin company logo upload with live preview.
- Dynamic brand primary color theming reflected across the HQ sidebar and printed receipts.

### 8. 🖨️ Direct Hardware ESC/POS Thermal Printing & Cash Drawer Kick
- Native **WebSerial API driver** for high-speed direct binary communication with 58mm (32 cols) and 80mm (42/48 cols) thermal printers (Epson, Sunmi, Star Micronics, Xprinter).
- **Automated RJ11 Cash Drawer Kick:** Sends hardware electrical pulses (`ESC p 0 25 250`) to pop open the physical cash till automatically upon cash checkout.
- Configurable baud rates (9600 to 115200), auto-print toggles, and hardware test diagnostics stored in kiosk device local storage.

### 9. 💵 Shift Management & Cash Float Reconciliation (X & Z-Reports)
- **Opening Cash Till Float:** Staff unlock the POS terminal by entering the starting till float (e.g. `RM 200.00`) verified via PIN.
- **Mid-Shift X-Reports:** On-demand live sales telemetry by tender without closing the drawer.
- **Blind End-of-Shift Cash Count (Z-Report):** Cashiers count physical notes/coins without seeing system totals. The system automatically computes and logs cash variances (*Over / Short / Match*), freezes the shift financial ledger, and prints an official thermal **Z-Report** with verification signature lines.

---

## 🛠️ Architecture & Technology Stack

| Layer | Technology | Specification / Version |
| :--- | :--- | :--- |
| **Backend Framework** | **Laravel** | **12.x** (PHP 8.2+) |
| **Client Bridge** | **Inertia.js** | **v2.x** (Seamless full-stack state routing) |
| **Frontend UI** | **React + TypeScript** | **React 19 + TS 5** |
| **Styling & Icons** | **Bootstrap 5 + Lucide** | **Bootstrap 5.3 + Lucide Icons + Bootstrap Icons** |
| **Admin Layout** | **Responsive Layout** | **Collapsible Left Sidebar Admin Shell** |
| **Database** | **SQLite / MySQL** | **ACID-Compliant Relational Storage** |
| **Assets Bundler** | **Vite** | **Vite 7.x** |

---

## 🖥️ System Modules & UI Walkthrough

### 1. HQ Administrative Portal (`/dashboard`)
- **Left Sidebar Navigation:** Collapsible left-hand navigation featuring company branding, live online kiosk counters, module links, user profile pill, and a fast *"Launch Kiosk POS"* action button.
- **Executive Dashboard:** Live KPI cards for Gross Revenue, BOM Material Cost, Direct Labour Cost, and Gross Contribution with visual margin bars.
- **Branches & Kiosks (`/branches`):** Register branches, provision kiosks, toggle status (`ONLINE`, `MAINTENANCE`, `INACTIVE`), and view device UIDs.
- **Products & Recipe BOM (`/products`):** Catalog management and interactive recipe builder calculating unit BOM costs.
- **Modifiers & Add-ons (`/modifiers`):** Manage customizable add-on groups (shots, milk alternatives, syrups, sweetness) with attached raw material BOM deductions and live profit margin analysis.
- **Raw Materials Master (`/raw-materials`):** UOM conversion multipliers, standard costs, threshold alert levels, and stock reconciliations.
- **Stock Transfers & Wastage (`/inventory/transfers`):** Multi-step transfer workflow with stage progression badges and wastage logging.
- **Staff Directory (`/staff`):** Staff profiles, PIN credentials, roles, and hourly rate configurations.
- **Attendance Logs (`/attendance`):** Shift history, origin & exit kiosks, payable duration, and manager manual adjustments with audit reason logs.
- **Hourly Payroll (`/payroll`):** Consolidated payable hours and gross wage reports across date ranges.
- **Branding & Settings (`/settings/branding`):** Organization logo upload with live sidebar and receipt previews.

### 2. Dedicated Touch Kiosk POS Terminal (`/kiosk/terminal`)
- **Full Viewport Touch UI:** Optimized for touch PC / tablet screens.
- **Kiosk Switcher:** Seamlessly switch and emulate any physical kiosk in the network.
- **Product Catalog Grid:** Instant search and category filter pills.
- **Interactive Cart Drawer:** Line items, quantity steppers, 6% SST tax calculation, and discount management.
- **Multi-Payment Modal:** Cash (with quick tender buttons & change calculation), Credit Card, and DuitNow Dynamic QR.
- **Thermal Receipt Modal:** Clean receipt breakdown with automated ingredient deduction notifications.
- **Staff PIN Keypad:** Numeric touchscreen keypad allowing staff to clock in / out at any kiosk with instant shift feedback.

---

## 📐 Core Business Logic & Mathematical Formulas

### 1. Unit of Measurement (UOM) Formula
$$\text{Total Base Quantity} = \text{Purchase Packaging Quantity} \times \text{conversion\_rate}$$
*Example:* 5 kg Coffee Beans $\times$ 1,000 multiplier = 5,000 g base stock.

### 2. Product BOM Cost Formula
$$\text{Product Unit BOM Cost} = \sum_{i=1}^{N} \left( \text{quantity\_required}_i \times \text{standard\_cost\_per\_base\_unit}_i \right)$$

### 3. Workforce 15-Minute Payable Rounding Engine
$$\text{Payable Minutes} = \text{round}\left( \frac{\text{Raw Clock Minutes}}{15} \right) \times 15$$
*Example:* 512 raw minutes $\rightarrow$ 510 payable minutes (8.50 hours).

### 4. Hourly Gross Earnings Formula
$$\text{Gross Earnings} = \left( \frac{\text{Payable Minutes}}{60} \right) \times \text{Hourly Wage Rate (RM)}$$

### 5. Gross Contribution Metric
$$\text{Gross Contribution} = \text{Gross Sales Revenue} - \text{Raw Material (BOM) Cost} - \text{Direct Hourly Labour Cost}$$

---

## 🗄️ Database Schema & Entity Model

The relational schema consists of 16 structured tables:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   companies     │──────<│    branches     │──────<│     kiosks      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                         │                         │
         │                         │                         ├──────< orders ──< order_items
         │                         │                         ├──────< attendances
         │                         │                         └──────< stock_locations
         ▼                         ▼                                     │
┌─────────────────┐       ┌─────────────────┐                            ▼
│  raw_materials  │       │   stock_trans.  │                   ┌─────────────────┐
└─────────────────┘       └─────────────────┘                   │inventory_balance│
         │                         │                            └─────────────────┘
         ▼                         ▼                                     ▲
┌─────────────────┐       ┌─────────────────┐                            │
│  recipe_items   │       │ stock_trf_items │────────────────────────────┘
└─────────────────┘       └─────────────────┘
         ▲
         │
┌─────────────────┐
│    products     │
└─────────────────┘
```

1. `companies` — Tenant identity, custom logo path, brand theme color.
2. `branches` — Physical business branches, contact details.
3. `kiosks` — Physical hardware terminals, device UIDs, tokens, status.
4. `staff` — Staff members, PIN hashes, roles, compensation types (`HOURLY`, `DAILY`, `MONTHLY`, `NONE`), hourly rates.
5. `attendances` — Punch records, kiosk in/out, raw minutes, 15-min payable minutes, gross earnings snapshots.
6. `raw_materials` — Ingredient catalog, base UOM, purchase UOM, conversion multipliers, standard unit costs, alert thresholds.
7. `stock_locations` — Warehouses, branch stores, kiosk stockrooms.
8. `inventory_balances` — Real-time atomic stock quantities per location.
9. `products` — Sellable catalog items, selling price, frozen cost price.
10. `recipe_items` — BOM formulas mapping products to raw materials.
11. `orders` — POS sales transactions, payment method, material cost snapshots, kiosk linkage.
12. `order_items` — Order line items, quantity, unit price, unit cost snapshots.
13. `stock_transfers` — Stock transfer workflow header (`REQUESTED`, `APPROVED`, `DISPATCHED`, `RECEIVED`, `CANCELLED`).
14. `stock_transfer_items` — Transfer line items with requested, dispatched, and received quantities.
15. `wastages` — Log of damaged, spoiled, or spilled raw materials with cost impact.
16. `audit_logs` — Immutable audit trail of state changes.

---

## 💻 Installation & Setup Guide

### Prerequisites
- **PHP** $\ge$ 8.2 with PDO SQLite/MySQL, OpenSSL, Mbstring extensions
- **Composer** $\ge$ 2.0
- **Node.js** $\ge$ 18.x & **NPM**

### Step-by-Step Installation

```bash
# 1. Navigate to the project directory
cd MK

# 2. Install PHP Composer dependencies
composer install

# 3. Install NPM dependencies
npm install

# 4. Configure Environment
cp .env.example .env
php artisan key:generate

# 5. Run Database Migrations and Demo Seeder
php artisan migrate:fresh --seed

# 6. Build Frontend Assets
npm run build

# 7. Start the Laravel Development Server
php artisan serve
```

---

## 🔑 Demo Credentials & Seeded Data

The seeder automatically provisions **Artisan Coffee & Bakery Co.** with 2 branches, 4 kiosks, 10 raw materials, 6 BOM products, and initial stock balances:

| Role | Staff Code | Email | PIN | Access Rights |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `ADM-001` | `fakrul@example.com` | `1234` | Full System, Branding, RBAC & BI |
| **Branch Manager** | `MGR-001` | `ali@example.com` | `1234` | Pavilion KL Branch, Stock Transfers |
| **Barista / Staff** | `STF-001` | `huda@example.com` | `1234` | Kiosk POS & Clock In (RM 12.00/hr) |
| **Barista / Staff** | `STF-002` | `jason@example.com` | `1234` | Kiosk POS & Clock In (RM 14.00/hr) |
| **Barista / Staff** | `STF-003` | `faris@example.com` | `1234` | Kiosk POS & Clock In (RM 12.50/hr) |

### Key URLs:
- **HQ Admin Portal:** [http://localhost:8000/dashboard](http://localhost:8000/dashboard)
- **Kiosk POS Terminal:** [http://localhost:8000/kiosk/terminal](http://localhost:8000/kiosk/terminal)
- **Staff Portal Login:** [http://localhost:8000/login](http://localhost:8000/login)

---

## 🧪 Automated Verification & Testing

The system includes a PHPUnit test suite covering critical financial, workforce, and inventory invariants:

```bash
php artisan test
```

### Test Suite Summary:
```text
   PASS  Tests\Unit\BOMCalculationTest
  ✓ bom dynamic cost calculation ................................. 0.71s  

   PASS  Tests\Unit\EscPosGeneratorTest
  ✓ escpos standard command definitions .......................... 0.05s  

   PASS  Tests\Unit\ExampleTest
  ✓ that true is true

   PASS  Tests\Unit\HourlyWageCalculationTest
  ✓ 15 minute rounding and hourly wage calculation ................ 0.05s  

   PASS  Tests\Feature\ExampleTest
  ✓ the application redirects root to dashboard .................. 0.11s  

   PASS  Tests\Feature\KioskOrderAndInventoryTest
  ✓ kiosk order processes and deducts bom stock ................... 0.12s  

   PASS  Tests\Feature\ModifierAndBOMDeductionTest
  ✓ kiosk order with modifiers deducts base and modifier boms ..... 0.07s  

   PASS  Tests\Feature\ShiftManagementAndZReportTest
  ✓ shift lifecycle with opening float and z report variance ..... 0.03s  

   PASS  Tests\Feature\StaffAttendanceAndClockingTest
  ✓ staff can clock in and clock out at kiosk with pin ............ 0.06s  

   PASS  Tests\Feature\StockTransferLifecycleTest
  ✓ stock transfer lifecycle moves inventory atomically .......... 0.03s  

  Tests:    10 passed (46 assertions)
  Duration: 1.13s
```

---

## 📄 License
This project is open-source software licensed under the **MIT License**.
