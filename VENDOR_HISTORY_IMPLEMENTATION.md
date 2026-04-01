# Vendor History Timeline Implementation

## ✅ What Has Been Done

### 1. **PostgreSQL VendorHistory Model**
   - ✅ Created `backend/models/sequelize/VendorHistory.js`
   - ✅ Stores vendor activity history (bills, contact persons, vendor updates)
   - ✅ Uses PostgreSQL/Sequelize to match vendor storage
   - ✅ Table name: `vendor_histories`

### 2. **Backend Implementation**
   - ✅ Created `backend/utils/vendorHistoryLogger.js` - Helper to log activities
   - ✅ Created `backend/controllers/VendorHistoryController.js` - API endpoint
   - ✅ Updated `backend/route/VendorRoutes.js` - Added history route
   - ✅ Updated `backend/controllers/VendorController.js` - Logs vendor creation/updates
   - ✅ Updated `backend/controllers/BillController.js` - Logs bill creation/updates
   - ✅ Updated `backend/models/sequelize/index.js` - Exported VendorHistory
   - ✅ Updated `backend/db/postgresql.js` - Ensures models are loaded before sync

### 3. **Frontend Implementation**
   - ✅ Updated `frontend/src/pages/PurchaseVendorDetail.jsx`
   - ✅ Fetches vendor history from API
   - ✅ Displays timeline similar to Zoho Books style
   - ✅ Shows dates/times on left, event cards on right
   - ✅ Blue vertical timeline connecting events

## 📋 Activity Types Tracked

- `CONTACT_ADDED` - When vendor is created
- `CONTACT_PERSON_ADDED` - When contact person is added
- `BILL_ADDED` - When bill is created
- `BILL_UPDATED` - When bill status changes
- `VENDOR_UPDATED` - When vendor is updated

## 🚀 Setup Instructions

### 1. **Ensure PostgreSQL is Running**
   - Make sure PostgreSQL is installed and running
   - Database should be accessible

### 2. **Set Environment Variables**
   In your `.env.development` file, ensure:
   ```env
   DB_TYPE=both  # or 'postgresql'
   SYNC_DB=true  # This will auto-create tables
   ```

### 3. **Sync the VendorHistory Table**

   **Option A: Auto-sync (Recommended for development)**
   - Set `SYNC_DB=true` in `.env.development`
   - Restart your server
   - The table will be created automatically

   **Option B: Manual sync**
   ```bash
   cd backend
   node scripts/sync-vendor-history-table.js
   ```

### 4. **Restart Your Server**
   ```bash
   cd backend
   npm run dev
   ```

   You should see:
   ```
   ✅ PostgreSQL connected [development]
   🔄 Syncing database models...
   ✅ Database models synced
   ```

### 5. **Verify Table Creation**

   Connect to PostgreSQL and check:
   ```sql
   \c rootfin_dev  -- or your database name
   \dt
   ```

   You should see `vendor_histories` table listed.

## 🧪 Testing

### 1. **Create a New Vendor**
   - Go to Vendors section
   - Create a new vendor
   - Check the vendor detail page
   - Activity timeline should show "Contact added" event

### 2. **Add a Bill**
   - Create a bill for a vendor
   - Check vendor detail page
   - Activity timeline should show "Bill added" event

### 3. **Update Bill Status**
   - Update a bill status (e.g., mark as open)
   - Check vendor detail page
   - Activity timeline should show "Bill updated" event

## 📊 API Endpoints

### Get Vendor History
```
GET /api/purchase/vendors/:vendorId/history?limit=50
```

**Response:**
```json
[
  {
    "id": "uuid",
    "vendorId": "vendor-uuid",
    "eventType": "BILL_ADDED",
    "title": "Bill added",
    "description": "Bill 869-2025-26 of amount ₹11,812.50 created",
    "originator": "Warehouse Valayamkulam",
    "relatedEntityId": "bill-id",
    "relatedEntityType": "bill",
    "metadata": {},
    "changedBy": "user@email.com",
    "changedAt": "2025-11-14T17:31:00.000Z",
    "createdAt": "2025-11-14T17:31:00.000Z",
    "updatedAt": "2025-11-14T17:31:00.000Z"
  }
]
```

## 🔧 Troubleshooting

### Issue: No history showing in timeline

**Solutions:**
1. Check if `vendor_histories` table exists:
   ```sql
   SELECT * FROM vendor_histories LIMIT 1;
   ```

2. Check browser console for API errors

3. Verify vendor ID is correct:
   - Check Network tab in browser dev tools
   - Verify API endpoint is: `/api/purchase/vendors/{vendorId}/history`

4. Check backend logs for errors when creating vendors/bills

### Issue: Table not created

**Solutions:**
1. Set `SYNC_DB=true` in `.env.development`
2. Restart server
3. Or run manual sync script: `node scripts/sync-vendor-history-table.js`

### Issue: History not logging when vendor created

**Solutions:**
1. Check backend console for errors
2. Verify PostgreSQL connection is working
3. Check that vendor ID is being passed correctly

## 📝 Notes

- History is stored in PostgreSQL (not MongoDB)
- History logging does not break main operations (errors are logged but don't fail)
- Old vendors won't have history (only new activities are logged)
- Timeline shows most recent events first

## 🎯 Future Enhancements

- Add pagination for history
- Filter history by event type
- Export history to CSV
- Add history for vendor credits
- Add history for payments made










