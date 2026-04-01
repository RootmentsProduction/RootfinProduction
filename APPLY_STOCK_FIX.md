# How to Apply the Stock Full Quantity Fix

## Quick Steps

### 1. Restart the Backend Server

**Option A: If backend is running in a terminal**
1. Press `Ctrl+C` to stop the server
2. Run: `npm start` or `node server.js`

**Option B: If using PM2 or similar**
```bash
cd backend
pm2 restart all
```

**Option C: Manual restart**
```bash
cd backend
npm start
```

### 2. Test the Fix

**Option 1: Run the automated test**
```bash
cd backend
node test-stock-full-quantity.js
```

**Option 2: Manual test in the application**
1. Log in to Perinthalmanna Branch
2. Go to Inventory → Items
3. Find "Shoe Formal 1003 - 7/Brown" (or any item with stock)
4. Note the current stock (e.g., 20 items)
5. Go to Sales → Create Invoice
6. Add the item and set quantity to the FULL stock amount (20)
7. Save the invoice
8. Go back to the item detail page
9. **Expected:** Stock should now show 0
10. **Before fix:** Stock would still show 20

### 3. Verify the Logs

After creating an invoice, check the backend console. You should see:

```
🔄 Starting stock update for warehouse: Perinthalmanna Branch
📦 Processing 1 items
  Before: StockOnHand=20, Available=20, Committed=0
  Reducing by: 20
  After: StockOnHand=0, Available=0, Committed=0
✅ Stock updated for group item: -20 (New stock: 0)
```

If you see `VERIFICATION FAILED`, there's still an issue.

## What Was Fixed

1. **Undefined variable bug** - `warehouseLower` was used but not defined
2. **Type conversion** - Explicit `parseFloat()` to ensure numeric calculations
3. **Better logging** - Detailed logs to track stock changes
4. **Verification** - Post-save check to ensure changes were saved

## Files Changed

- ✅ `backend/utils/stockManagement.js` - Main fix
- ✅ `backend/test-stock-full-quantity.js` - Test script (new)
- ✅ `STOCK_FULL_QUANTITY_FIX.md` - Detailed documentation (new)

## Troubleshooting

### Issue: Stock still shows wrong value
**Solution:** 
1. Check if backend restarted successfully
2. Clear browser cache and refresh
3. Check backend logs for errors
4. Run the test script to verify

### Issue: Test script fails
**Solution:**
1. Make sure MongoDB connection is working
2. Check if there are items with stock in Perinthalmanna Branch
3. Check the error message in the console

### Issue: Backend won't start
**Solution:**
1. Check for syntax errors: `npm run lint` (if available)
2. Check the error message
3. Verify all dependencies are installed: `npm install`

## Need Help?

If the fix doesn't work:
1. Share the backend console logs
2. Share the test script output
3. Share any error messages
4. Describe what you're seeing vs. what you expect

## Rollback

If you need to undo the changes:
```bash
cd backend
git checkout HEAD -- utils/stockManagement.js
npm start
```
