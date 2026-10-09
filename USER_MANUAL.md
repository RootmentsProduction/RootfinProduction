# ROOTFIN ERP & RETAIL MANAGEMENT SYSTEM
## Comprehensive User Manual & Standard Operating Procedures (SOP)
**Document Version:** 2.4 | **System:** Rootfin (Brynex Retail & Financial Software) | **Environment:** Production

---

# Table of Contents
1. [Introduction & System Overview](#1-introduction--system-overview)
2. [User Roles, Permissions & Access Matrix](#2-user-roles-permissions--access-matrix)
3. [System Access, Navigation & Keyboard Shortcuts](#3-system-access-navigation--keyboard-shortcuts)
4. [Daybook Guard & Mandatory Daily Closures](#4-daybook-guard--mandatory-daily-closures)
5. [Daybook & Daily Cash Flow Management](#5-daybook--daily-cash-flow-management)
6. [Rental & Booking Management](#6-rental--booking-management)
7. [Point of Sale (POS) & Sales Invoicing](#7-point-of-sale-pos--sales-invoicing)
8. [Inventory, Stock & Warehouse Management](#8-inventory-stock--warehouse-management)
9. [Procurement & Vendor Management (Purchase)](#9-procurement--vendor-management-purchase)
10. [Income & Expense Accounting](#10-income--expense-accounting)
11. [Reports, Analytics & Financial Summaries](#11-reports-analytics--financial-summaries)
12. [Administration, Store Setup & User Management](#12-administration-store-setup--user-management)
13. [End-of-Day (EOD) SOP & Troubleshooting Guide](#13-end-of-day-eod-sop--troubleshooting-guide)

---

# 1. Introduction & System Overview

**Rootfin** is an enterprise-grade Retail, Rental, Inventory, and Financial Management System built specifically for multi-store retail environments (such as footwear, apparel, and formal wear rental/sales).

### Key System Capabilities:
* **Multi-Store Architecture:** Seamlessly manage central warehouses, head offices, and distributed branch stores.
* **POS & Invoicing:** Fast counter billing with barcode scanning, custom price lists, split payment handling (Cash, UPI, Card, Razorpay), and automated invoice return management.
* **Rental Lifecycle Management:** Complete tracking of bookings, advance payments, pick-up/rent-out balance collections, security deposits, and return/compensation deductions.
* **Double-Check Daybook Accounting:** Strict daily cash & bank ledger tracking with automated EOD reconciliation, admin closure approval, and system freezing guards for unclosed days.
* **Procurement & Stock Control:** End-to-end Purchase Orders (PO), Goods Received Notes (Purchase Receives), Vendor Bills, Inter-Store Transfer Orders (TO), and Store Requisitions.
* **Executive Analytics:** Instant visibility into store revenue, inventory valuation, item-group sales, reorder thresholds, and profit/loss statements.

---

# 2. User Roles, Permissions & Access Matrix

| Module / Feature | Super Admin | Admin | Cluster Manager | Warehouse Staff | Store Staff / Cashier |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Executive Dashboard** |  Yes |  Yes | ❌ (Redirects) | ❌ | ❌ (Redirects) |
| **Daybook (Live Entry)** |  Yes |  Yes | ❌ View Only | ❌ View Only |  Yes |
| **Financial Summary** |  Yes |  Yes |  Yes (All Stores) | ❌ |  Yes (Own Store) |
| **Rental & Bookings** |  Yes |  Yes | ❌ View Only | ❌ |  Yes |
| **POS Sales Invoices** |  Yes |  Yes | ❌ | ❌ |  Yes |
| **Invoice Returns** |  Yes |  Yes | ❌ | ❌ |  Yes |
| **Item Groups & Catalogs** |  Yes |  Yes | ❌ |  Yes | ❌ View Only |
| **Stock Adjustments** |  Yes |  Yes | ❌ |  Yes | ❌ |
| **Transfer Orders (Create/Ship)**|  Yes |  Yes | ❌ |  Yes |  Receive Only |
| **Store Requisition Orders** |  Yes |  Yes | ❌ |  Fulfill |  Create |
| **Purchase (PO, GRN, Bills)** |  Yes |  Yes | ❌ |  Yes | ❌ |
| **Vendor Credits / Returns** |  Yes |  Yes | ❌ |  Yes | ❌ |
| **Income / Expense Entry** |  Yes |  Yes | ❌ | ❌ |  Yes |
| **Daybook Close Approval** |  Yes |  Yes | ❌ | ❌ | ❌ |
| **Admin Force Close & Late Closures** |  Yes |  Yes | ❌ | ❌ | ❌ |
| **Store & User Management** |  Yes |  Yes (Limited) | ❌ | ❌ | ❌ |

---

# 3. System Access, Navigation & Keyboard Shortcuts

### 3.1 Logging In & Store Context
1. Open the Rootfin web application in Google Chrome or Microsoft Edge.
2. Enter your registered **Email / Username** and **Password**.
3. Upon login, your active store location code (e.g., `702 - G-Edappally`, `858 - Warehouse`, `759 - HEAD OFFICE`) will be loaded.
4. **Location Switcher (Admins & Cluster Managers only):** Click the store name in the profile bar to switch views between branch stores.

### 3.2 Navigation Structure
* **Dynamic Hover Sidebar:** Hover or tap on the left edge of your screen to slide out the navigation panel.
* **Profile Drawer:** Located at the bottom of the sidebar. Click your name/avatar to view account details or log out securely.

### 3.3 Power-User Keyboard Shortcuts
* **`C` followed by `R` (Sequential):** Press `C` and then `R` within 1 second anywhere outside a text field to instantly open **Create New Sales Invoice** (`/sales/invoices/new`).
* **`Enter` Key:** Form fields and dialog boxes support fast keyboard progression to accelerate checkout and entry speeds.

---

# 4. Daybook Guard & Mandatory Daily Closures

Rootfin enforces strict accounting compliance through the **Daybook Guard**:

> [!IMPORTANT]
> **Daily Closure Requirement:**
> Store staff must submit their Daybook Closing report at the end of every operating day.
> If yesterday's closing was not submitted or is currently rejected, the system enters **Protection Mode (Screen Freeze)** and locks all sales, rental, and expense features until the previous day's books are reconciled and approved.

### Status Indicators:
1. **Missing Yesterday's Closure:** You cannot start today's billing until yesterday's cash denominations and payment summary are submitted.
2. **Pending Approval:** The closure has been submitted to Head Office and is waiting for Administrator sign-off.
3. **Approved:** Store operations run normally.

---

# 5. Daybook & Daily Cash Flow Management

The **Daybook** (`/daybook`) is the real-time financial ledger of the store. Every rupee entering or leaving the counter must be accounted for here.

```
                    ┌─────────────────────────┐
                    │   TRANSACTION TYPES     │
                    └────────────┬────────────┘
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
   [ INFLOWS (+) ]        [ OUTFLOWS (-) ]       [ TRANSFERS (⇄) ]
   • Booking Advance       • Security Refund       • Cash to Bank
   • Rent-Out Balance      • Cancellation Refund   • Bulk Deposit
   • Shoe/Shirt Sales      • Spot Incentives
   • Other Incomes         • Store Expenses
```

### 5.1 Recording a Transaction
1. Navigate to **Daybook** (`/daybook`).
2. Fill out the transaction parameters:
   * **Invoice / Bill No:** Reference voucher or receipt number.
   * **Customer Name:** Name of the client or payee.
   * **Category:** Choose `Booking`, `RentOut`, `Refund`, `Return`, `Cancel`, `Income`, `Expense`, or `Cash to Bank`.
   * **Sub Category:** Select specific categorization (e.g., `Advance`, `Security`, `Office Expense`, `Dry Cleaning`, `Electricity`).
   * **Remarks:** Context notes (e.g., "Urgent alteration cost", "Customer #5422 security deposit").
   * **Split Payment Breakdown:** Enter amounts under **Cash**, **Razorpay (RBL)**, **Card/Bank**, and **UPI**.
3. Click **Add Transaction** or press `Enter`.

### 5.2 Closing the Daybook (EOD Procedure)
1. At closing time, navigate to **Daybook** -> **Close Daybook**.
2. Count physical counter cash and enter the currency note denominations (₹2000, ₹500, ₹200, ₹100, ₹50, ₹20, ₹10, Coins).
3. Verify that the **Total Physical Cash** matches the **Calculated Daybook Cash**.
4. Confirm terminal totals for Card POS, UPI QR collections, and Razorpay settlements.
5. Enter closing remarks if there is any cash shortage/excess, then click **Submit Closure for Approval**.

---

# 6. Rental & Booking Management

Rootfin features a dedicated rental workflow tailored for formal suits, bridal wear, costumes, and accessories.

### 6.1 The 4-Step Rental Lifecycle

```
[ Step 1: Booking ]  ──► [ Step 2: Rent Out ]  ──► [ Step 3: Usage ]  ──► [ Step 4: Return & Security ]
  • Customer selects       • Customer picks up       • Rental period       • Item inspected for damage
    outfit/dates.            outfit.                   active.             • Full deposit refunded OR
  • Advance paid.          • Balance collected.                            • Damage/delay deducted.
  • Voucher issued.        • Security deposit paid.
```

### 6.2 Managing Bookings (`/BookingReport`)
* Search upcoming events by date, customer phone, or outfit code.
* Filter by booking status: Active, Dispatched, Returned, or Cancelled.

### 6.3 Rent-Out & Handover (`/RentOutReport`)
* When the customer collects the garment:
  1. Open Daybook and record `Category: RentOut`.
  2. Record `SubCategory: Balance Payable` for the remaining rental fee.
  3. Record `SubCategory: Security` for the refundable caution deposit.
  4. Hand over the items with rental terms acknowledged.

### 6.4 Returns & Security Refund (`/securityReport` & `/Income&Expenses`)
* When the customer returns the garment:
  1. **Clean Return (No Damage/Delay):** Log `Category: Refund` -> `SubCategory: Security Refund` in Daybook. Return the cash or initiate UPI transfer.
  2. **Damaged / Delayed Return:**
     * Record the partial security refund under `Security Refund`.
     * Record the penalty deduction under `Category: Income` -> `SubCategory: Compensation`.

---

# 7. Point of Sale (POS) & Sales Invoicing

The Sales Invoicing module (`/sales/invoices`) handles direct retail sales of footwear, shirts, accessories, and packaged goods.

### 7.1 Creating a Retail Invoice (`/sales/invoices/new` or Shortcut: `C` + `R`)
1. **Customer Details:** Select an existing customer by typing their name/phone number, or click `+ Add Customer` to register a new one.
2. **Adding Items:**
   * **Barcode / SKU Scan:** Scan the item barcode directly into the search bar.
   * **Manual Lookup:** Search by item name, group, color, or size.
3. **Quantity & Pricing:**
   * Unit prices auto-populate from the default price list.
   * Enter discount percentage (%) or flat discount amount (₹) if authorized.
4. **Payment Mode Selection:**
   * Split payment across **Cash**, **UPI**, **Credit/Debit Card**, and **Razorpay**.
5. **Finalize & Print:**
   * Click **Save & Print** to generate an invoice receipt (supports Thermal Roll printers and A4 format).

### 7.2 Sales Invoice Returns (`/sales/invoices/returns`)
1. Select the original Invoice Number.
2. Choose the specific item(s) and quantities being returned.
3. Select the return condition (`Good Condition - Restock` vs `Damaged - Defective`).
4. Issue refund via original payment channel or Credit Note.
5. Inventory levels automatically adjust back into store stock.

---

# 8. Inventory, Stock & Warehouse Management

Rootfin provides real-time multi-location inventory synchronization.

### 8.1 Items vs. Item Groups
* **Item Groups (`/shoe-sales/item-groups`):** The parent product template (e.g., `Oxford Leather Shoes - Brown`, `Slim Fit Tuxedo Shirt`). Defines Brand, Category, Gender, Material, and Manufacturer.
* **Items / SKUs (`/shoe-sales/items`):** The specific sellable variant with unique Size (e.g., Size 7, Size 8, Size 9, Size 10), Color, Barcode, and MRP.

### 8.2 Inter-Store Transfer Orders (`/inventory/transfer-orders`)
Used to transfer inventory between Central Warehouse and Retail Stores or between two branches:
1. Click **+ New Transfer Order**.
2. Select **Source Store / Warehouse** and **Destination Store**.
3. Add item SKUs and transfer quantities.
4. Set status to `Dispatched`.
5. Upon arrival at the receiving store, store staff inspect the package and click **Mark as Received** to increment their local stock.

### 8.3 Store Requisitions / Orders (`/inventory/store-orders`)
Branch stores can raise stock demand orders to the central warehouse:
1. Store staff create a Store Order with requested quantities.
2. Warehouse staff review the requisition, approve/modify quantities, and convert it directly into a Transfer Order.

### 8.4 Inventory Adjustments (`/inventory/adjustments`)
Authorized Admins and Warehouse Managers can adjust stock counts to resolve discrepancies from physical audits:
* **Adjustment Type:** `Quantity Adjustment` or `Value Adjustment`.
* **Reason Codes:** `Stock Audit Discrepancy`, `Damaged Goods Write-off`, `Theft / Shrinkage`, `Sample Unit`.

### 8.5 Reorder Alerts (`/inventory/reorder-alerts`)
Automated monitors that alert managers when items drop below their safety threshold, preventing stockouts during peak retail seasons.

---

# 9. Procurement & Vendor Management (Purchase)

Full procurement lifecycle management for acquiring goods from manufacturers and suppliers.

```
┌────────────────────────┐
│  Purchase Order (PO)   │ ──► Send official order to Vendor with agreed rates.
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│  Purchase Receive (GRN)│ ──► Inspect delivered stock, scan barcodes, verify counts.
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│    Vendor Bill (AP)    │ ──► Convert GRN to payable bill with vendor tax invoice.
└───────────┬────────────┘
            ▼
┌────────────────────────┐
│     Payments Made      │ ──► Record bank transfer / cheque disbursements to supplier.
└────────────────────────┘
```

### 9.1 Purchase Workflow:
1. **Vendor Master (`/purchase/vendors`):** Maintain vendor details, GSTIN, payment terms, and contact information.
2. **Purchase Orders (`/purchase/orders`):** Create formal POs with delivery deadlines and unit cost rates.
3. **Purchase Receives (`/purchase/receives`):** On cargo arrival, create a Purchase Receive record. Stock is immediately updated in the Warehouse.
4. **Bills (`/purchase/bills`):** Enter supplier invoice number and match with the GRN.
5. **Vendor Credits (`/purchase/vendor-credits`):** Issue debit notes against defective shipments or price adjustments.

---

# 10. Income & Expense Accounting

Track operational overheads, store upkeep, and miscellaneous revenues.

### 10.1 Recording Store Expenses (`/expenses`)
1. Click **+ Add Expense**.
2. Select **Expense Category**:
   * *Store Upkeep:* AC Service, Interior Maintenance, Glass Cleaning, Electrical Work.
   * *Office & Supplies:* Books/Pens/Registers, Stationery, Printouts.
   * *Staff & Welfare:* Staff Room Rent/Electricity, Food Allowance on Special Occasions, Refreshments.
   * *Incentives:* Spot Incentive, Weekly Incentive.
   * *Operations:* Dry Cleaning, Alterations, Tailoring Material, Courier Charges, Travel & Fuel.
   * *Utilities:* Electricity Charges, Telephone & Internet.
3. Choose Payment Account (Cash Ledger or Bank Account).
4. Attach voucher receipt image and save.

### 10.2 Recording Miscellaneous Income (`/income`)
Record non-invoiced revenue streams such as alterations fees, garment rental late penalties, scrap packaging sales, or franchise royalties.

---

# 11. Reports, Analytics & Financial Summaries

| Report Name | Path | Purpose & Insights |
| :--- | :--- | :--- |
| **Financial Summary** | `/datewisedaybook` | Date-filtered audit of all cash/bank inflows, outflows, and net balances across all branches. |
| **Sales Report** | `/reports/sales` | High-level sales performance, gross margins, discounts given, and payment mode distributions. |
| **Sales by Invoice** | `/reports/sales-by-invoice` | Line-by-line breakdown of every invoice issued with cashier and item details. |
| **Sales by Group** | `/reports/sales-by-group` | Performance analysis across product families (e.g., Formal Shoes vs. Tuxedos). |
| **Inventory Report** | `/reports/inventory` | Complete stock valuation report, stock on hand (SOH) by location, and movement velocity. |
| **Income & Expense Report**| `/reports/income-expense` | Detailed profit and loss overview comparing operational expenses vs gross margin. |
| **Revenue Report** | `/Revenuereport` | Multi-store revenue comparison with month-over-month growth metrics. |
| **Daybook Close Report** | `/CloseReport` | Audit trail of daily store closures, physical cash discrepancies, and admin approvals. |

---

# 12. Administration, Store Setup & User Management

*(Restricted to Super Admin and Administrator accounts)*

### 12.1 Managing Stores (`/manage-users/add-store` & `/ManageStores`)
* Register new physical store outlets, warehouses, or pop-up locations.
* Assign unique 3-digit **Location Codes** (e.g., `702`, `705`, `858`).
* Set store operating hours, contact addresses, and tax identifiers.

### 12.2 Managing Users & Role Assignments (`/manage-users/*`)
1. **Add New User (`/manage-users/add-user`):**
   * Specify username, email, phone, and default store location.
   * Select User Role: `superadmin`, `admin`, `cluster_manager`, `warehouse`, or `user` (store staff).
2. **Existing Users (`/manage-users/existing-users`):** Activate, deactivate, or edit store permissions for staff.
3. **Reset Password (`/manage-users/reset-password`):** Securely reset staff passwords or unlock blocked accounts.

### 12.3 Admin Close & Late Closures (`/AdminClose` & `/PendingDaybookClosures`)
* Review submitted closures from all branch stores.
* Inspect denomination variances.
* Click **Approve Closure** to lock the day's books.
* In case of emergency (power outage, staff absence), perform an **Admin Force Close** to unfreeze the store's Daybook Guard for the next morning.

---

# 13. End-of-Day (EOD) SOP & Troubleshooting Guide

### 13.1 Daily Staff Checklist (EOD SOP)

```
┌────────────────────────────────────────────────────────────────────────┐
│                       DAILY STORE CLOSING SOP                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. [ ] Ensure all rental pickups & returns are entered in Daybook.     │
│ 2. [ ] Settle all outstanding POS billing carts.                       │
│ 3. [ ] Run Daybook Cash vs Terminal Reports (EDC Card Machine + UPI).  │
│ 4. [ ] Perform physical cash denomination count at the counter.        │
│ 5. [ ] Navigate to Daybook -> Submit EOD Closure with note counts.     │
│ 6. [ ] Confirm closure submission status shows "Pending Approval".    │
│ 7. [ ] Safely lock counter cash drawer and log out of Rootfin.         │
└────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Troubleshooting Common Issues

#### Q1: My screen is frozen with a "Daybook Access Restricted" message. What should I do?
* **Cause:** Yesterday's Daybook closure was not submitted or has not been approved by the Administrator.
* **Resolution:** 
  1. If yesterday's closing was missed, navigate to the closing screen and complete yesterday's denomination submission.
  2. If already submitted, contact your **Admin / Area Manager** to approve your pending closure in `/PendingDaybookClosures`.

#### Q2: The customer's UPI payment succeeded on their phone, but the Daybook or POS didn't record it.
* **Resolution:** Verify the transaction reference (UTR) in your store bank app/merchant soundbox. Once confirmed, manually record the transaction in the Daybook under `Category: Sales / Income` and `Payment Mode: UPI` with the UTR number noted in Remarks.

#### Q3: How do I correct a mistaken Daybook entry?
* **Resolution:** Regular staff can delete or edit open transactions within the current operating day before EOD closure. If the day is already closed, only an **Admin** can make an adjusting entry.

#### Q4: A product barcode is not scanning at the POS counter.
* **Resolution:** 
  1. Use the manual search bar to find the product by style name or SKU.
  2. Verify under `Inventory -> Items` that the barcode is mapped correctly to that size/color variant.

---

*Rootfin ERP System Documentation — Confidential & Proprietary to Brynex & Rootments Retail.*
