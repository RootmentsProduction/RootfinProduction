# RootFin AWS Migration Briefing Document

## ⚠️ CRITICAL: System Impact Statement

**"If RootFin stops, the following business operations stop immediately:"**

- ❌ All 20+ stores cannot complete daily closing
- ❌ Financial reconciliation (cash/bank/UPI) halts
- ❌ Management cannot access financial reports
- ❌ Sales invoicing stops across all branches
- ❌ Inventory tracking and stock management fails
- ❌ Purchase order processing stops
- ❌ Vendor payment tracking fails
- ❌ Store-to-store transfer orders cannot be processed
- ❌ Admin cannot monitor branch performance

**This is operational infrastructure, not a website. Downtime = business paralysis.**

---

## A. SYSTEM OVERVIEW

### RootFin Core Functions

#### 1. **Financial Management**
- **Daily Closing & Reconciliation**
  - Cash, Bank, UPI, RBL payment tracking
  - Physical cash vs calculated cash verification
  - Opening balance calculation (previous day's closing → today's opening)
  - Multi-denomination cash counting
  - Bank reconciliation

- **Transaction Management**
  - Booking transactions
  - Rent-out processing
  - Return/refund handling
  - Cancellation processing
  - Income/expense tracking
  - Money transfers (cash to bank)

- **Financial Reports**
  - Date-wise day book
  - Bill-wise income reports
  - Sales reports (by invoice, by salesperson)
  - Inventory reports
  - Close reports (admin view of all stores)

#### 2. **Sales & Invoicing**
- Sales invoice creation with split payments
- Invoice returns with payment method tracking
- Return status tracking (Partial/Full)
- Credit note generation
- Sales by salesperson tracking

#### 3. **Inventory Management**
- Item creation and management (shoes, accessories)
- Item groups with returnable status
- Stock tracking across multiple warehouses
- Inventory adjustments
- Reorder point alerts with email notifications
- Inactive item management
- Size and SKU-based filtering

#### 4. **Purchase Management**
- Vendor management with credit tracking
- Purchase orders
- Purchase receives (partial/full status)
- Vendor credit notes
- Vendor payment history

#### 5. **Store Operations**
- Transfer orders between stores/warehouses
- Store orders
- Store-level access control
- Warehouse-specific stock visibility
- Barcode/QR code scanning for transfers

#### 6. **Multi-Store Management**
- 20+ store locations
- Role-based access (Super Admin, Admin, Store User)
- Store-specific data isolation
- Centralized admin dashboard

#### 7. **User Management**
- Authentication with bcrypt password hashing
- Role-based permissions
- Password reset functionality
- Store-level access restrictions

---

## B. ACTIVE INTEGRATIONS & EXTERNAL DEPENDENCIES

### ⚠️ CRITICAL: These must be configured post-migration or system will fail

#### 1. **Database Services**
- **MongoDB Atlas** (Primary Database)
  - Connection: `mongodb+srv://...`
  - Collections: transactions, closes, shoeitems, itemgroups, vendors, salesinvoices, purchaseorders, etc.
  - **Impact if fails:** Complete system failure

- **PostgreSQL** (Secondary Database - Render)
  - Used for: Vendors, Stores, Sales Persons, Transfer Orders, Store Orders, Sales Invoices
  - Connection: SSL required
  - **Impact if fails:** Vendor management, store operations, transfer orders fail

#### 2. **External APIs**
- **TWS Rental API** (`https://rentalapi.rootments.live/api/GetBooking`)
  - Used for: Booking, Rentout, Return, Delete data
  - Endpoints:
    - `/GetBookingList`
    - `/GetRentoutList`
    - `/GetReturnList`
    - `/GetDeleteList`
  - **Impact if fails:** Financial summary calculations incorrect, day book incomplete

#### 3. **Email Service (SMTP)**
- **Gmail SMTP** (for reorder alerts)
  - Host: `smtp.gmail.com`
  - Port: 587
  - Used for: Reorder point notifications
  - File: `backend/utils/emailService.js`
  - **Impact if fails:** Inventory alerts stop, managers miss reorder notifications

#### 4. **Environment Variables (MUST BE MIGRATED)**
```
MONGODB_URI_DEV / MONGODB_URI_PROD
POSTGRES_HOST / DB_HOST
POSTGRES_USER / DB_USER
POSTGRES_PASSWORD / DB_PASSWORD
POSTGRES_DB / DB_NAME
DB_SSL=true
EMAIL_USER
EMAIL_PASS
NODE_ENV (production/development)
DB_TYPE (mongodb/postgresql/both)
```

#### 5. **CORS Configuration**
Current allowed origins:
- `http://localhost:5173` (dev)
- `https://rootfin.vercel.app`
- `https://rootfin.rootments.live`
- `https://rootfin-testenv-clab.vercel.app`
- `https://api.rootments.live`

**⚠️ Must update CORS after AWS deployment or frontend will be blocked**

#### 6. **No Cron Jobs Currently**
- Reorder alerts are triggered on-demand (not scheduled)
- Daily closing is manual (store managers)

---

## C. USER LOAD & USAGE PATTERN

| Detail | Value |
|--------|-------|
| **Total Stores** | 20+ locations |
| **Store Types** | Zorucci (Z-), Gedapally (G-), Warehouse, Head Office |
| **Active Daily Users** | ~60-120 (store managers + admin) |
| **Peak Usage Times** | 10:30 AM – 2:00 PM & 6:00 PM – 9:00 PM |
| **Critical Operations** | Daily closing (end of day), Month-end closing |
| **Transaction Volume** | 15,000+ transactions in database |
| **Concurrent Requests** | 4-6 simultaneous store operations |

### Store Locations (locCodes):
- Z-Edapally1 (144)
- G-Kottayam (701)
- G-Edappally (702)
- G-Perumbavoor (703)
- G-Thrissur (704)
- G-Palakkad (705)
- G-Chavakkad (706)
- G-Edappal (707)
- G-Vadakara (708)
- G-Perinthalmanna (709)
- G-Manjeri (710)
- G-Kottakkal (711)
- G-Calicut (712)
- G-Kannur (716)
- G-Kalpetta (717)
- G-MG Road (718)
- Z-Perinthalmanna (133)
- Z-Kottakkal (122)
- Z-Edappal (100)
- Warehouse (858)
- HEAD OFFICE01 (759)
- SG-Trivandrum (700)

### Usage Patterns:
- **Morning (10:30 AM - 2:00 PM):** Sales invoicing, bookings, inventory checks
- **Evening (6:00 PM - 9:00 PM):** Peak sales, daily closing preparation
- **End of Day:** Daily closing (cash reconciliation, bank entries)
- **Month End:** Critical closing period, report generation

### ⚠️ MIGRATION TIMING CONSTRAINT:
**DO NOT migrate during:**
- Business hours (10 AM - 9 PM)
- Month-end closing (last 3 days of month)
- Weekends (high sales volume)

**Recommended migration window:** 
- **2:00 AM - 6:00 AM on a weekday (Tuesday-Thursday)**
- **Mid-month (10th-20th)**

---

## D. DATA SENSITIVITY

### ⚠️ CRITICAL: Financial Data Classification

RootFin contains **HIGHLY SENSITIVE** financial and operational data:

#### 1. **Financial Data**
- Daily cash transactions (all stores)
- Bank account reconciliation data
- UPI/RBL payment details
- Vendor payment history
- Credit note information
- Invoice amounts and payment methods

#### 2. **Business Intelligence**
- Store performance metrics
- Sales by salesperson
- Inventory valuation
- Profit margins (cost price vs selling price)
- Stock levels across warehouses

#### 3. **Employee Data**
- User credentials (bcrypt hashed)
- Store manager access levels
- Salesperson performance data

#### 4. **Customer Data**
- Customer names (in transactions)
- Booking history
- Return/refund records

### Data Integrity Requirements:
- **Database corruption = Accounting damage**
- **Lost transactions = Financial audit failure**
- **Incorrect opening balance = Cascading calculation errors**

### Backup Requirements:
✅ **MANDATORY before migration:**
1. Full MongoDB Atlas backup (all collections)
2. PostgreSQL database dump
3. Environment variables backup
4. Test restore procedure before migration

---

## E. CURRENT HOSTING SETUP

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                     │
│  - React + Vite                                          │
│  - Domain: rootfin.rootments.live / rootfin.vercel.app  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS API Calls
                     ↓
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Render - Node.js)                  │
│  - Express.js server                                     │
│  - Port: 7000 (dev) / 10000 (prod)                      │
│  - Memory: 2GB heap size                                 │
│  - API Base: https://rootfin-testenv-ebb5.onrender.com  │
└────────┬────────────────────────────┬───────────────────┘
         │                            │
         ↓                            ↓
┌────────────────────┐    ┌──────────────────────────┐
│  MongoDB Atlas     │    │  PostgreSQL (Render)     │
│  - Primary DB      │    │  - Secondary DB          │
│  - Collections:    │    │  - Tables:               │
│    transactions    │    │    vendors               │
│    closes          │    │    stores                │
│    shoeitems       │    │    salespersons          │
│    itemgroups      │    │    transferorders        │
│    vendors         │    │    storeorders           │
│    salesinvoices   │    │    salesinvoices         │
│    purchaseorders  │    │    inventoryadjustments  │
│    etc.            │    │    vendorcredits         │
└────────────────────┘    └──────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────┐
│           External API (TWS Rental System)             │
│  - https://rentalapi.rootments.live                    │
│  - Provides: Booking, Rentout, Return, Delete data    │
└────────────────────────────────────────────────────────┘
```

### Current Stack:
- **Frontend:** React 18, Vite, TailwindCSS, React Router
- **Backend:** Node.js 18+, Express.js, Mongoose, Sequelize
- **Databases:** MongoDB Atlas (primary), PostgreSQL (secondary)
- **Authentication:** bcrypt password hashing
- **File Upload:** Base64 encoding (attachments in transactions)
- **API Documentation:** Swagger UI

### Current Endpoints:
- `/user/*` - Authentication, transactions, closing
- `/api/*` - Items, inventory, vendors, purchases
- `/api/tws/*` - TWS integration endpoints
- `/api/reports/sales/*` - Sales reports
- `/api/reports/inventory/*` - Inventory reports

---

## F. MIGRATION CHECKLIST

### Pre-Migration (MUST DO)

- [ ] **Backup all databases**
  - [ ] MongoDB Atlas full export
  - [ ] PostgreSQL dump
  - [ ] Verify backup restoration works

- [ ] **Document all environment variables**
  - [ ] MongoDB connection strings
  - [ ] PostgreSQL credentials
  - [ ] Email SMTP credentials
  - [ ] API keys (if any)

- [ ] **Test in staging environment**
  - [ ] Deploy to AWS test instance
  - [ ] Verify database connections
  - [ ] Test all critical flows
  - [ ] Verify external API connectivity

- [ ] **Notify stakeholders**
  - [ ] Inform all store managers
  - [ ] Schedule maintenance window
  - [ ] Prepare rollback plan

### During Migration

- [ ] **Deploy backend to AWS**
  - [ ] EC2 or Elastic Beanstalk
  - [ ] Configure security groups
  - [ ] Set environment variables
  - [ ] Install Node.js dependencies
  - [ ] Start server with memory limit

- [ ] **Update DNS/CORS**
  - [ ] Update frontend API base URL
  - [ ] Add new AWS URL to CORS whitelist
  - [ ] Update domain DNS if needed

- [ ] **Verify connections**
  - [ ] MongoDB Atlas connection
  - [ ] PostgreSQL connection
  - [ ] TWS API connectivity
  - [ ] Email SMTP working

### Post-Migration Verification

- [ ] **Test critical flows**
  - [ ] User login
  - [ ] Create sales invoice
  - [ ] Daily closing
  - [ ] Financial reports
  - [ ] Inventory operations
  - [ ] Transfer orders

- [ ] **Monitor for 24 hours**
  - [ ] Check error logs
  - [ ] Monitor memory usage
  - [ ] Verify all stores can access
  - [ ] Check report accuracy

- [ ] **Rollback plan ready**
  - [ ] Keep old Render instance running for 48 hours
  - [ ] Document rollback procedure
  - [ ] Have database restore ready

---

## G. KNOWN ISSUES & FIXES APPLIED

### Recent Fixes (Include in Migration):

1. **Memory Crash Fix**
   - Issue: Server crashed with "heap out of memory"
   - Fix: Removed verbose JSON.stringify logging, increased heap to 2GB
   - File: `backend/controllers/TransactionController.js`, `backend/package.json`

2. **Opening Balance Query Fix**
   - Issue: Opening balance not showing due to locCode type mismatch
   - Fix: Added $or operator to handle both string and number locCode
   - File: `backend/controllers/CloseController.js`

3. **Cash Field Clarification**
   - `cash` field = Calculated closing (opening + day's transactions)
   - `Closecash` field = Physical cash counted
   - Opening balance uses `cash` field from previous day

---

## H. CONTACT & SUPPORT

### Technical Contacts:
- **Developer:** [Your contact]
- **Database Admin:** [Contact]
- **Business Owner:** [Contact]

### Emergency Rollback Contact:
- **24/7 Support:** [Phone number]

---

## I. SUCCESS CRITERIA

Migration is successful when:

✅ All 20+ stores can log in  
✅ Sales invoices can be created  
✅ Daily closing works correctly  
✅ Opening balance displays from previous day  
✅ Financial reports generate accurately  
✅ Inventory operations function  
✅ Transfer orders process  
✅ Admin dashboard shows all stores  
✅ No memory crashes for 24 hours  
✅ Response times < 2 seconds  

---

## J. RISK ASSESSMENT

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database connection failure | CRITICAL | Medium | Test connections pre-migration, have rollback ready |
| CORS blocking frontend | HIGH | High | Update CORS before switching DNS |
| Memory crashes | HIGH | Low | Applied memory fixes, monitor closely |
| Opening balance calculation errors | HIGH | Medium | Verify closes collection data integrity |
| TWS API connectivity loss | MEDIUM | Low | Test external API from AWS IP |
| Email notifications stop | LOW | Medium | Test SMTP from AWS, may need IP whitelist |

---

**Document Version:** 1.0  
**Last Updated:** February 10, 2026  
**Prepared for:** AWS Migration Team  
**System:** RootFin Financial Management System
