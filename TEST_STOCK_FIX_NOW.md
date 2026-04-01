# Quick Test Guide - Stock Display Fix

## What Was Fixed

The invoice creation page now **automatically refetches items** after you create an invoice, so the stock display is always up-to-date.

## Quick Test (2 minutes)

### Step 1: Clear Browser Cache
Press `Ctrl+Shift+Delete` and clear cached images and files

### Step 2: Refresh the Page
Press `F5` or `Ctrl+R` to reload

### Step 3: Test the Fix

1. **Login** to Perinthalmanna Branch
2. **Go to:** Sales → Create Invoice
3. **Find item:** "TAN LOAFER 4018 - 9" (has 24 items in stock)
4. **Add to invoice:** Quantity = 24 (ALL items)
5. **Fill in customer details** and save
6. **Go back:** Sales → Create Invoice (create new invoice)
7. **Search again:** "TAN LOAFER 4018 - 9"
8. **Check stock:** Should show **0 pcs** ✅

### Expected Result

**BEFORE FIX:**
- Stock shows: 24 pcs (wrong - stale data)

**AFTER FIX:**
- Stock shows: 0 pcs (correct - fresh data)

## What to Look For

### In Browser Console (F12)

After saving an invoice, you should see:
```
📦 Dispatching stock update event...
📦 Stock updated event received, refetching items...
📦 Fetched 150 items from API
```

### In the Dropdown

- Stock numbers should update immediately
- Out of stock items should show "0.00 pcs" in red
- Available items should show correct quantity in green

## Troubleshooting

### Issue: Still showing old stock

**Solution:**
1. Hard refresh: `Ctrl+Shift+R`
2. Clear all browser cache
3. Close and reopen the browser
4. Check if backend is running: `http://localhost:7000`

### Issue: Console shows errors

**Solution:**
1. Check backend logs for errors
2. Verify MongoDB connection
3. Check network tab (F12) for failed API calls

### Issue: Items not loading

**Solution:**
1. Check API endpoint: `http://localhost:7000/api/shoe-sales/items`
2. Verify user is logged in
3. Check warehouse is selected

## Verify Database (Optional)

Run this to check actual database values:
```bash
cd backend
node check-actual-stock.js
```

This will show you the real stock values in MongoDB.

## Summary

- ✅ Backend was already working correctly
- ✅ Frontend now refetches items after invoice creation
- ✅ Stock display is now always up-to-date
- ✅ No more stale/cached data in dropdowns

## Need Help?

If the fix doesn't work:
1. Share the browser console logs (F12)
2. Share the backend console logs
3. Run `node check-actual-stock.js` and share output
4. Describe what you're seeing vs. what you expect
