# Test Guide: Inventory Adjustment Stock Refresh

## Overview
This guide helps you test that inventory adjustments properly update stock values in real-time on the item detail page.

## Prerequisites
- Backend server running
- Frontend server running
- At least one item with stock in the system (e.g., "Test Last Item")

## Test Scenario 1: Create New Adjustment

### Steps:
1. **Open Item Detail Page**
   - Navigate to Inventory > Items
   - Click on an item (e.g., "Test Last Item")
   - Note the current stock values:
     - Stock on Hand (top card)
     - Stock Locations table (Warehouse, Vadakara Branch, etc.)
   - Take a screenshot or write down the values

2. **Keep Item Detail Page Open**
   - Open a new browser tab (keep the item detail page open in the first tab)

3. **Create Inventory Adjustment**
   - In the new tab, navigate to Inventory > Inventory Adjustments
   - Click "New Adjustment"
   - Fill in the form:
     - Mode: Quantity Adjustment
     - Date: Today
     - Warehouse: Select the warehouse you want to adjust (e.g., "Warehouse")
     - Account: Select an account
     - Reason: "Testing stock refresh"
   - Add the item:
     - Search and select the item you're testing
     - Enter a quantity adjustment (e.g., +10 or -5)
   - Click "Save as Adjusted" (NOT "Save as Draft")

4. **Verify Stock Update**
   - Switch back to the first tab with the item detail page
   - The page should automatically refresh
   - Verify that the stock values have updated:
     - Stock on Hand card should show the new total
     - Stock Locations table should show the updated warehouse stock
   - The changes should match your adjustment (e.g., if you added +10, the stock should increase by 10)

### Expected Results:
✅ Stock on Hand card updates automatically
✅ Stock Locations table updates automatically
✅ No page refresh needed
✅ Console shows: "📦 Dispatching stockUpdated event for inventory adjustment"
✅ Console shows: "Stock updated for this item, refreshing..."

## Test Scenario 2: Edit Existing Adjustment

### Steps:
1. **Open Item Detail Page**
   - Navigate to the same item from Test Scenario 1
   - Note the current stock values

2. **Keep Item Detail Page Open**
   - Open a new browser tab

3. **Edit Inventory Adjustment**
   - Navigate to Inventory > Inventory Adjustments
   - Find the adjustment you just created
   - Click to view/edit it
   - Change the quantity adjustment (e.g., from +10 to +15)
   - Click "Save as Adjusted"

4. **Verify Stock Update**
   - Switch back to the item detail page
   - The page should automatically refresh
   - Verify that the stock values reflect the new adjustment

### Expected Results:
✅ Stock updates to reflect the edited adjustment
✅ The difference should be the change in adjustment (e.g., +5 more if you changed from +10 to +15)

## Test Scenario 3: Draft Adjustment (Should NOT Update Stock)

### Steps:
1. **Create Draft Adjustment**
   - Create a new inventory adjustment
   - Fill in all fields
   - Click "Save as Draft" (NOT "Save as Adjusted")

2. **Verify No Stock Update**
   - Check the item detail page
   - Stock values should NOT change
   - This is correct behavior - drafts don't affect stock

### Expected Results:
✅ Stock values remain unchanged
✅ No stockUpdated event dispatched
✅ Draft is saved but doesn't affect inventory

## Test Scenario 4: Multiple Items

### Steps:
1. **Open Multiple Item Detail Pages**
   - Open 2-3 different items in separate tabs

2. **Create Adjustment with Multiple Items**
   - Create an inventory adjustment
   - Add all the items you have open
   - Adjust quantities for each
   - Save as Adjusted

3. **Verify All Pages Update**
   - Check each item detail tab
   - All should refresh automatically
   - Each should show its respective stock change

### Expected Results:
✅ All affected item pages refresh
✅ Each shows correct stock adjustment
✅ Unaffected items don't refresh

## Troubleshooting

### Stock Not Updating?

1. **Check Console Logs**
   - Open browser DevTools (F12)
   - Look for these messages:
     - "📦 Dispatching stockUpdated event for inventory adjustment"
     - "Stock updated for this item, refreshing..."
   - If you don't see these, the event isn't being dispatched

2. **Check Adjustment Status**
   - Make sure you saved as "Adjusted" not "Draft"
   - Only "Adjusted" status triggers stock updates

3. **Check Item ID**
   - Verify the item ID in the adjustment matches the item detail page
   - Check console logs for ID comparison

4. **Manual Refresh**
   - If automatic refresh fails, manually refresh the page (F5)
   - Stock should show updated values after manual refresh

### Event Not Firing?

1. **Check Browser Console**
   - Look for JavaScript errors
   - Check if CustomEvent is supported

2. **Check Network Tab**
   - Verify the adjustment save request succeeded (200 OK)
   - Check the response includes the saved adjustment data

## Success Criteria

The fix is working correctly if:
- ✅ Creating an adjustment with status "adjusted" updates stock in real-time
- ✅ Editing an adjustment with status "adjusted" updates stock in real-time
- ✅ Draft adjustments do NOT update stock
- ✅ Multiple item pages update simultaneously when affected
- ✅ No manual page refresh is needed
- ✅ Console logs show event dispatch and refresh messages

## Notes

- The stock update is triggered by a `stockUpdated` CustomEvent
- The event includes `itemIds` array for affected items
- The item detail page listens for this event and refreshes when its item is affected
- This is the same mechanism used by Purchase Receives, Transfer Orders, and Sales Invoices
