# Stock Management Modal Real-Time Refresh Fix

## Issue
When you had the Stock Management modal open (the popup showing "Opening Stock (Accounting)" fields for different warehouses) and created an inventory adjustment in another tab, the modal would not refresh to show the updated stock values. You had to close and reopen the modal to see the changes.

## Example Scenario
1. Open item "Test Last Item" detail page
2. Click "Stock Locations" button to open the stock management modal
3. Modal shows: Warehouse = 115, Vadakara Branch = 20
4. Keep modal open, switch to another tab
5. Create inventory adjustment: +10 to Warehouse
6. Switch back to modal
7. **BEFORE FIX**: Modal still shows Warehouse = 115 (old value)
8. **AFTER FIX**: Modal automatically updates to show Warehouse = 125 (new value)

## Root Cause
The stock management modals (`ItemStockManagement.jsx` and `StandaloneItemStockManagement.jsx`) were not listening for the `stockUpdated` event that gets dispatched when inventory adjustments are saved.

## Solution
Added `stockUpdated` event listeners to both stock management modal components:
- `ItemStockManagement.jsx` (for items in groups)
- `StandaloneItemStockManagement.jsx` (for standalone items)

When the event is received, the modals:
1. Check if the currently displayed item was affected
2. Refetch the item data from the API
3. Update the stock rows in the modal with the new values
4. User sees the updated values without closing/reopening the modal

## Files Changed
1. `frontend/src/pages/InventoryAdjustmentCreate.jsx` - Dispatches `stockUpdated` event
2. `frontend/src/pages/ItemStockManagement.jsx` - Listens for event and refreshes
3. `frontend/src/pages/StandaloneItemStockManagement.jsx` - Listens for event and refreshes

## How to Test
1. Open an item detail page
2. Click "Stock Locations" to open the modal
3. Note the current stock values
4. **Keep the modal open**
5. In a new browser tab, create an inventory adjustment for that item
6. Save as "Adjusted"
7. Switch back to the tab with the open modal
8. The values should automatically update (no need to close/reopen)

## Console Logs to Look For
When it's working correctly, you should see:
```
📦 Dispatching stockUpdated event for inventory adjustment
📦 Stock update event received in ItemStockManagement
🔄 This item was affected, refreshing stock data...
✅ Stock rows updated with new data
```

## Benefits
- ✅ Real-time updates - no manual refresh needed
- ✅ Better user experience - see changes immediately
- ✅ Consistent with other parts of the app (item detail pages already had this)
- ✅ Works for both items in groups and standalone items
- ✅ Works across browser tabs
