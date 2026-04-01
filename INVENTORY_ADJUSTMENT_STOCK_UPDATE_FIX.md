# Inventory Adjustment Stock Update Fix

## Problem
When creating an inventory adjustment, the stock was being updated in the database (warehouseStocks array), but the UI wasn't refreshing to show the updated stock values. This affected:
1. Item detail pages (Stock Locations table)
2. Stock Management modals (the popup where you edit warehouse stocks)

## Root Cause
The `InventoryAdjustmentCreate.jsx` component was not dispatching a `stockUpdated` event after successfully saving an adjustment with status "adjusted". This meant that:
- Open item detail pages wouldn't refresh
- Open stock management modals wouldn't refresh
- Users had to manually refresh the page to see updated stock values

## Solution
Added `stockUpdated` event dispatch and listeners in three places:

1. **InventoryAdjustmentCreate.jsx** - Dispatches the event after saving
2. **ItemStockManagement.jsx** - Listens for the event and refreshes (for items in groups)
3. **StandaloneItemStockManagement.jsx** - Listens for the event and refreshes (for standalone items)

### Changes Made

**File: `frontend/src/pages/InventoryAdjustmentCreate.jsx`**

Added event dispatch after successful save:

```javascript
const savedAdjustment = await response.json();

// Dispatch stock update event if status is "adjusted"
if (status === "adjusted") {
  const itemIds = items
    .filter(item => item.itemId)
    .map(item => item.itemId);
  
  const itemNames = items
    .filter(item => item.itemName)
    .map(item => item.itemName);
  
  console.log("📦 Dispatching stockUpdated event for inventory adjustment", {
    itemIds,
    itemNames,
    warehouse,
    adjustmentId: savedAdjustment.id || savedAdjustment._id
  });
  
  window.dispatchEvent(new CustomEvent("stockUpdated", {
    detail: {
      itemIds,
      items: itemNames,
      warehouse,
      source: "inventory-adjustment",
      adjustmentId: savedAdjustment.id || savedAdjustment._id
    }
  }));
}
```

**File: `frontend/src/pages/ItemStockManagement.jsx`**

Added event listener to refresh stock data:

```javascript
// Listen for stock update events (from inventory adjustments, purchase receives, etc.)
useEffect(() => {
  const handleStockUpdate = (event) => {
    console.log("📦 Stock update event received in ItemStockManagement", event.detail);
    
    // Check if this item was affected
    const itemIds = event.detail?.itemIds || [];
    const itemNames = event.detail?.items || [];
    
    const currentItemId = (item?._id || item?.id)?.toString();
    const currentItemName = item?.name;
    
    const isAffected = itemIds.some(id => id?.toString() === currentItemId) ||
                      itemNames.some(name => name === currentItemName);
    
    if (isAffected) {
      console.log("🔄 This item was affected, refreshing stock data...");
      // Refetch and update stock rows...
    }
  };

  window.addEventListener("stockUpdated", handleStockUpdate);
  return () => {
    window.removeEventListener("stockUpdated", handleStockUpdate);
  };
}, [id, itemId, item]);
```

**File: `frontend/src/pages/StandaloneItemStockManagement.jsx`**

Added the same event listener for standalone items (same logic as above).

## How It Works

1. When an inventory adjustment is saved with status "adjusted", the backend updates the stock in the database
2. The frontend dispatches a `stockUpdated` event with the affected item IDs
3. Three components listen for this event:
   - **ShoeSalesItemDetail.jsx** - Refreshes the item detail page (Stock Locations table and summary cards)
   - **ItemStockManagement.jsx** - Refreshes the stock management modal for items in groups
   - **StandaloneItemStockManagement.jsx** - Refreshes the stock management modal for standalone items
4. When the event is received, each component checks if it's displaying an affected item
5. If affected, it refetches the item data from the API
6. The UI automatically updates to show the new stock values

## Testing

### Test 1: Item Detail Page Refresh

1. Open an item detail page (e.g., "Test Last Item")
2. Note the current stock values in the Stock Locations table
3. Create a new inventory adjustment for that item
4. Set the adjustment type to "Quantity Adjustment"
5. Add a quantity adjustment (e.g., +10 or -5)
6. Save as "Adjusted"
7. Return to the item detail page
8. Verify that the stock values have updated automatically

### Test 2: Stock Management Modal Refresh (THE KEY TEST FOR YOUR ISSUE)

1. Open an item detail page (e.g., "Test Last Item")
2. Click "Stock Locations" to open the stock management modal
3. Note the current values (e.g., Warehouse: 115, Vadakara Branch: 20)
4. **Keep the modal open**
5. In a new browser tab, create an inventory adjustment for that item
6. Add a quantity adjustment (e.g., +10 to Warehouse)
7. Save as "Adjusted"
8. **Switch back to the tab with the open modal**
9. The modal should automatically refresh and show the updated values (e.g., Warehouse: 125, Vadakara Branch: 20)

### Expected Results:
✅ Stock management modal updates automatically when inventory adjustment is saved
✅ Item detail page updates automatically
✅ No manual page refresh needed
✅ Console shows: "📦 Stock update event received in ItemStockManagement"
✅ Console shows: "🔄 This item was affected, refreshing stock data..."
✅ Console shows: "✅ Stock rows updated with new data"

## Related Files

- `frontend/src/pages/InventoryAdjustmentCreate.jsx` - Added event dispatch
- `frontend/src/pages/ItemStockManagement.jsx` - Added event listener
- `frontend/src/pages/StandaloneItemStockManagement.jsx` - Added event listener
- `frontend/src/pages/ShoeSalesItemDetail.jsx` - Already has event listener (no changes needed)
- `backend/controllers/InventoryAdjustmentController.js` - Backend stock update logic (no changes needed)

## Notes

- The event is only dispatched when status is "adjusted" (not "draft")
- The event includes both `itemIds` and `items` (names) for maximum compatibility
- The event includes the warehouse and adjustment ID for debugging purposes
- All three UI components (item detail, stock management for groups, stock management for standalone) now listen for and respond to stock updates
- The stock management modals will refresh even if they're open when the adjustment is saved
