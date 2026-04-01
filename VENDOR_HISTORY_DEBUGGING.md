# Vendor History Debugging Guide

## Issue: Data Not Showing in Timeline

If vendor history is not showing in the timeline, follow these steps:

### 1. **Check if Table Exists**

Connect to PostgreSQL and check:
```sql
\c rootfin_dev  -- or your database name
\dt
```

You should see `vendor_histories` table. If not, run:
```bash
cd backend
node scripts/sync-vendor-history-table.js
```

### 2. **Check if Data is Being Saved**

Check the database directly:
```sql
SELECT * FROM vendor_histories ORDER BY "changedAt" DESC LIMIT 10;
```

If this returns empty, history is not being logged when vendors/bills are created.

### 3. **Check Backend Logs**

When creating a vendor or bill, you should see:
```
✅ Logged vendor activity: CONTACT_ADDED for vendor [vendor-id]
✅ Logged vendor activity: BILL_ADDED for vendor [vendor-id]
```

If you don't see these logs, check:
- Is PostgreSQL connected? (Check server startup logs)
- Are there any errors in the console?

### 4. **Check API Endpoint**

Test the API endpoint directly:
```bash
# Replace [vendor-id] with actual vendor ID
curl http://localhost:7000/api/purchase/vendors/[vendor-id]/history
```

Or check in browser Network tab:
```
GET /api/purchase/vendors/{vendorId}/history?limit=50
```

### 5. **Check Frontend Console**

Open browser DevTools (F12) and check:
- Console tab for errors
- Network tab to see if API call is made and what response is received

### 6. **Common Issues**

#### Issue: "Table doesn't exist"
**Solution:**
```bash
cd backend
node scripts/sync-vendor-history-table.js
```

#### Issue: "No history when creating vendor"
**Check:**
1. Is PostgreSQL connected? (Check `DB_TYPE` in `.env.development`)
2. Set `SYNC_DB=true` in `.env.development`
3. Check backend console for errors

#### Issue: "History API returns 404"
**Check:**
1. Vendor ID is correct
2. Route is registered in `backend/route/VendorRoutes.js`
3. Server is restarted after changes

#### Issue: "Originator shows as 'Warehouse' instead of actual name"
**Check:**
1. Bill has `warehouse` or `branch` field set
2. Vendor has `locCode` set
3. User has `locName` in localStorage

### 7. **Test Steps**

1. **Create a new vendor:**
   - Go to Vendors → New
   - Fill in details
   - Save
   - Check backend console: Should see "Logged vendor activity: CONTACT_ADDED"
   - Check vendor detail page: Should see "Contact added" in timeline

2. **Create a bill:**
   - Go to Bills → New
   - Select a vendor
   - Fill in bill details
   - Make sure `warehouse` or `branch` is set
   - Save
   - Check backend console: Should see "Logged vendor activity: BILL_ADDED"
   - Check vendor detail page: Should see "Bill added" in timeline

3. **Update bill status:**
   - Open a bill
   - Change status to "open" (if draft)
   - Save
   - Check backend console: Should see "Logged vendor activity: BILL_UPDATED"
   - Check vendor detail page: Should see "Bill updated" in timeline

### 8. **Verify Data Format**

The timeline should show:
- Date on left: "14/11/2025"
- Time on left: "06:13 PM"
- Title: "Bill added" or "Bill updated"
- Description: "Bill 869-2025-26 of amount ₹11,812.50 created by Warehouse Valayamkulam"
- View Details link for bills

### 9. **Manual Database Check**

If you want to manually check what's in the database:

```sql
-- Check all vendor history
SELECT 
  id,
  "vendorId",
  "eventType",
  title,
  description,
  originator,
  "changedAt"
FROM vendor_histories
ORDER BY "changedAt" DESC
LIMIT 20;

-- Check history for specific vendor
SELECT *
FROM vendor_histories
WHERE "vendorId" = '[vendor-id]'
ORDER BY "changedAt" DESC;
```

### 10. **Reset/Re-sync Table**

If table exists but seems broken:
```sql
-- Drop and recreate (WARNING: This deletes all history!)
DROP TABLE IF EXISTS vendor_histories CASCADE;

-- Then run sync script
cd backend
node scripts/sync-vendor-history-table.js
```

### 11. **Check Environment Variables**

Make sure your `.env.development` has:
```env
DB_TYPE=both  # or 'postgresql'
SYNC_DB=true
```

And PostgreSQL connection details are correct.










