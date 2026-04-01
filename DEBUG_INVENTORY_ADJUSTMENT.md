# Debug Inventory Adjustment Stock Update

## Problem
Stock is not increasing/decreasing when creating an inventory adjustment.

## Added Detailed Logging

I've added comprehensive logging to the backend to help diagnose the issue. The logs will show:
- When an adjustment is being applied
- Which items are being processed
- Whether the stock update succeeded or failed
- The new stock quantity after adjustment

## How to Debug

### Step 1: Start Backend with Logs Visible
1. Open a terminal
2. Navigate to the `backend` folder
3. Run: `npm start` or `node server.js`
4. Keep this terminal open and visible

### Step 2: Create an Inventory Adjustment
1. Open the application in your browser
2. Navigate to Inventory > Inventory Adjustments
3. Click "New Adjustment"
4. Fill in the form:
   - Mode: **Quantity Adjustment**
   - Date: Today
   - Warehouse: Select a warehouse (e.g., "Warehouse")
   - Account: Select an account
   - Reason: "Testing stock update"
5. Add an item:
   - Search for "Test Last Item" (or any item)
   - Enter a quantity adjustment (e.g., **+10**)
6. Click **"Save as Adjusted"** (NOT "Save as Draft")

### Step 3: Check Backend Logs

Look for these log messages in the backend terminal:

```
=== APPLYING STOCK ADJUSTMENTS ===
Adjustment ID: 123
Warehouse: Warehouse
Items to adjust: 1

📦 Adjusting item: Test Last Item
   Item ID: 697c6b1958d660d3bf654a43c
   Item Group ID: null
   SKU: TLI-0
   Quantity Adjustment: 10
   Warehouse: Warehouse

🔧 adjustItemStock called:
   itemIdValue: 697c6b1958d660d3bf654a43c
   quantityAdjustment: 10
   targetWarehouse: Warehouse
   itemName: Test Last Item
   itemGroupId: null
   itemSku: TLI-0

   📊 Inventory adjustment: 130 +10 = 140
   ✅ Stock adjusted successfully
   New quantity: 140
   Type: group

=== STOCK ADJUSTMENTS COMPLETE ===
```

### Step 4: Interpret the Logs

#### ✅ Success Case
If you see:
- `✅ Stock adjusted successfully`
- `New quantity: [number]`
- The stock IS being updated in the database
- The issue is with the frontend not refreshing

#### ❌ Failure Cases

**Case 1: Item Not Found**
```
❌ Failed to adjust stock: Item "Test Last Item" not found
```
**Solution**: The item doesn't exist or the name/ID is wrong

**Case 2: No Item ID or Group ID**
```
⏭️  Skipping item: Test Last Item (no quantity adjustment or value adjustment type)
```
**Solution**: The item data is incomplete

**Case 3: Status is Draft**
```
⏭️  Stock adjustments skipped - status is "draft" (not "adjusted")
```
**Solution**: You saved as "Draft" instead of "Adjusted"

**Case 4: Error During Update**
```
❌ Error adjusting stock: [error message]
Stack: [stack trace]
```
**Solution**: There's a database error - check the error message

### Step 5: Verify in Database

After creating the adjustment, check if the stock actually changed:

1. Go to the item detail page
2. Refresh the page (F5)
3. Check the Stock Locations table
4. The stock should show the new value

If the stock shows the new value after refresh but not automatically:
- ✅ Backend is working correctly
- ❌ Frontend event system needs fixing (already fixed in previous changes)

If the stock does NOT show the new value even after refresh:
- ❌ Backend is not updating the database
- Check the backend logs for errors

## Common Issues

### Issue 1: No Logs Appear
**Problem**: You don't see any logs when creating an adjustment
**Solution**: 
- Make sure the backend server is running
- Check if you're looking at the correct terminal window
- Try restarting the backend server

### Issue 2: "Status is draft" Message
**Problem**: Logs show status is "draft"
**Solution**: Click "Save as Adjusted" instead of "Save as Draft"

### Issue 3: "Item not found" Message
**Problem**: The item can't be found in the database
**Solution**: 
- Verify the item exists
- Check if it's a standalone item or in an item group
- Make sure the item ID is correct

### Issue 4: Stock Updates in Logs but Not in UI
**Problem**: Logs show success but UI doesn't update
**Solution**: 
- The backend is working
- The frontend event system needs to be active
- Make sure you applied the frontend fixes (stockUpdated event)
- Try manually refreshing the page (F5)

## Next Steps

1. Run the test and share the backend logs
2. Based on the logs, we can identify the exact issue
3. If logs show success, the problem is frontend refresh
4. If logs show failure, the problem is backend stock update logic
