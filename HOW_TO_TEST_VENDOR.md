# How to Test Vendor PostgreSQL Migration

## 🧪 Testing Methods

There are **3 ways** to test the Vendor migration:

---

## Method 1: Automated Test Script (Recommended) ⚡

### Step 1: Run the Test Script

```powershell
cd backend
node test-vendor-postgresql.js
```

### What It Tests

✅ **CREATE** - Creates a new vendor  
✅ **READ (by ID)** - Gets vendor by ID  
✅ **READ (all)** - Gets all vendors  
✅ **UPDATE** - Updates vendor data  
✅ **DELETE** - Deletes vendor  
✅ **JSON Fields** - Tests contacts and bankAccounts  
✅ **Complex Queries** - Tests filtering and searching  

### Expected Output

```
🧪 Testing Vendor PostgreSQL Operations
============================================================

1️⃣  Connecting to PostgreSQL...
   ✅ Connected!

2️⃣  Syncing Vendor model...
   ✅ Model synced!

3️⃣  Testing CREATE operation...
   ✅ Vendor created!
   📝 Vendor ID: 550e8400-e29b-41d4-a716-446655440000
   📝 Display Name: Test Vendor 1234567890
   ...

✨ All Tests Passed!
🎉 Vendor PostgreSQL migration is working perfectly!
```

---

## Method 2: Manual API Testing (Using Postman/Thunder Client) 🔧

### Step 1: Start Your Server

```powershell
cd backend
npm run dev
```

You should see:
```
📊 Connecting to MongoDB database...
✅ MongoDB connected [development]
📊 Connecting to PostgreSQL database...
✅ PostgreSQL connected [development]
💾 Connected databases: MongoDB + PostgreSQL
```

### Step 2: Test CREATE Vendor

**Request:**
```
POST http://localhost:7000/api/purchase/vendors
Content-Type: application/json
```

**Body:**
```json
{
  "displayName": "Test Vendor Company",
  "userId": "user123",
  "email": "vendor@example.com",
  "phone": "1234567890",
  "companyName": "Test Company",
  "firstName": "John",
  "lastName": "Doe",
  "locCode": "LOC001",
  "contacts": [
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "mobile": "9876543210"
    }
  ],
  "bankAccounts": [
    {
      "accountHolderName": "Test Vendor",
      "bankName": "Test Bank",
      "accountNumber": "123456789",
      "ifsc": "TEST0001234"
    }
  ]
}
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "Test Vendor Company",
  "email": "vendor@example.com",
  "phone": "1234567890",
  "createdAt": "2025-11-29T12:00:00.000Z",
  ...
}
```

### Step 3: Test GET All Vendors

**Request:**
```
GET http://localhost:7000/api/purchase/vendors?userId=user123
```

**Expected Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "displayName": "Test Vendor Company",
    "email": "vendor@example.com",
    ...
  }
]
```

### Step 4: Test GET Vendor by ID

**Request:**
```
GET http://localhost:7000/api/purchase/vendors/550e8400-e29b-41d4-a716-446655440000
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "Test Vendor Company",
  "email": "vendor@example.com",
  ...
}
```

### Step 5: Test UPDATE Vendor

**Request:**
```
PUT http://localhost:7000/api/purchase/vendors/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
```

**Body:**
```json
{
  "email": "updated@example.com",
  "phone": "9999999999",
  "companyName": "Updated Company"
}
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "Test Vendor Company",
  "email": "updated@example.com",
  "phone": "9999999999",
  "companyName": "Updated Company",
  ...
}
```

### Step 6: Test DELETE Vendor

**Request:**
```
DELETE http://localhost:7000/api/purchase/vendors/550e8400-e29b-41d4-a716-446655440000
```

**Expected Response:**
```json
{
  "message": "Vendor deleted successfully"
}
```

---

## Method 3: Test via Frontend (If Available) 🌐

### Step 1: Start Both Frontend and Backend

**Backend:**
```powershell
cd backend
npm run dev
```

**Frontend:**
```powershell
cd frontend
npm run dev
```

### Step 2: Test in Browser

1. Navigate to your vendor management page
2. Try creating a new vendor
3. Check if it appears in the list
4. Try editing a vendor
5. Try deleting a vendor

All operations should work the same as before!

---

## Method 4: Direct PostgreSQL Query 🔍

### Step 1: Connect to PostgreSQL

```powershell
cd "C:\Program Files\PostgreSQL\18\bin"
.\psql.exe -U postgres -d rootfin_dev
```

### Step 2: Check Vendors Table

```sql
-- List all vendors
SELECT id, "displayName", email, "userId", "createdAt" 
FROM vendors 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Count vendors
SELECT COUNT(*) FROM vendors;

-- Check table structure
\d vendors

-- View a specific vendor
SELECT * FROM vendors WHERE id = 'your-vendor-id';
```

---

## ✅ Quick Test Checklist

Run through these to verify everything works:

- [ ] **Server starts** without errors
- [ ] **PostgreSQL connects** (check server logs)
- [ ] **Create vendor** - POST request succeeds
- [ ] **Get all vendors** - GET request returns vendors
- [ ] **Get vendor by ID** - GET with ID returns vendor
- [ ] **Update vendor** - PUT request updates data
- [ ] **Delete vendor** - DELETE request removes vendor
- [ ] **JSON fields work** - contacts and bankAccounts save correctly
- [ ] **Filtering works** - Query by userId, locCode works

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'crypto'"

**Solution:** This shouldn't happen, but if it does:
```powershell
npm install
```

### Issue: "PostgreSQL connection error"

**Solution:** 
1. Check PostgreSQL is running
2. Verify `.env.development` has correct credentials
3. Run: `node test-postgresql-connection.js` (if you still have it)

### Issue: "Table 'vendors' does not exist"

**Solution:**
The table should be created automatically. If not:
```javascript
// In Node.js console or script
import { Vendor } from './models/sequelize/index.js';
await Vendor.sync({ alter: true });
```

### Issue: "Vendor not found" after creation

**Solution:**
- Check the ID format (should be UUID or MongoDB ObjectId string)
- Verify the vendor was actually created in PostgreSQL
- Check server logs for errors

---

## 📊 Expected Results

### ✅ Success Indicators

1. **Test script completes** without errors
2. **API requests return** 200/201 status codes
3. **Data appears** in PostgreSQL database
4. **All CRUD operations** work correctly
5. **JSON fields** (contacts, bankAccounts) save and retrieve properly

### ❌ Failure Indicators

1. **Connection errors** - PostgreSQL not connected
2. **404 errors** - Vendor not found
3. **500 errors** - Server errors (check logs)
4. **Data not saving** - Check PostgreSQL connection

---

## 🎯 Quick Start

**Fastest way to test:**

```powershell
# 1. Start server
cd backend
npm run dev

# 2. In another terminal, run test
node test-vendor-postgresql.js
```

If the test passes, your migration is working! ✅

---

## 📝 Test Results

After running tests, you should see:

```
✨ All Tests Passed!

✅ CREATE: Working
✅ READ (by ID): Working
✅ READ (all): Working
✅ UPDATE: Working
✅ DELETE: Working
✅ JSON Fields: Working
✅ Complex Queries: Working

🎉 Vendor PostgreSQL migration is working perfectly!
```

---

**Ready to test?** Run the test script or use the API endpoints! 🚀

