# Item Group Stock Preservation Fix

## Problem
When editing an item group's returnable status (changing from returnable to non-returnable or vice versa), the warehouse stocks were being removed from all items in the group.

## Root Cause
The issue had two parts:

1. **Frontend**: When loading items from the database in edit mode, the `warehouseStocks` field was not being included in the loaded items state (`generatedItems` and `itemRows`).

2. **Backend**: The `updateItemGroup` function was not preserving existing `warehouseStocks` when they weren't included in the update request.

## Solution

### Frontend Changes (`frontend/src/pages/ShoeSalesItemGroupCreate.jsx`)

1. **Added `warehouseStocks` to generated items loading** (line ~350):
   ```javascript
   return {
     id: item._id || item.id || `item-${Date.now()}-${Math.random()}`,
     _id: item._id || item.id, // Preserve MongoDB ID
     name: itemName,
     sku: item.sku || "",
     // ... other fields ...
     warehouseStocks: item.warehouseStocks || [] // PRESERVE warehouse stocks
   };
   ```

2. **Added `warehouseStocks` to manual items loading** (line ~372):
   ```javascript
   const manualItems = data.items.map(item => ({
     id: item._id || item.id || `item-${Date.now()}-${Math.random()}`,
     _id: item._id || item.id, // Preserve MongoDB ID
     name: item.name || "",
     // ... other fields ...
     warehouseStocks: item.warehouseStocks || [] // PRESERVE warehouse stocks
   }));
   ```

3. **Already preserved in save mapping** (line ~787):
   ```javascript
   warehouseStocks: item.warehouseStocks || [], // PRESERVE warehouse stocks
   ```

### Backend Changes (`backend/controllers/ItemGroupController.js`)

**Enhanced warehouseStocks preservation logic** (line ~930):
```javascript
// Preserve warehouseStocks from existing items when updating
if (req.body.items && Array.isArray(req.body.items)) {
  req.body.items = req.body.items.map(item => {
    // Find the existing item in the database to preserve its warehouseStocks
    const existingItem = (oldItemGroup.items || []).find(oldItem => {
      const oldItemId = (oldItem._id?.toString() || oldItem.id || "").toString();
      const newItemId = (item._id?.toString() || item.id || "").toString();
      return oldItemId === newItemId;
    });

    // If warehouseStocks is not provided in the update, preserve from existing item
    if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks) || item.warehouseStocks.length === 0) {
      if (existingItem && existingItem.warehouseStocks && Array.isArray(existingItem.warehouseStocks) && existingItem.warehouseStocks.length > 0) {
        // Preserve existing warehouseStocks
        item.warehouseStocks = existingItem.warehouseStocks;
        console.log(`Preserved warehouseStocks for item ${item._id || item.id}:`, item.warehouseStocks.length, 'entries');
      } else {
        // Initialize new warehouseStocks if item doesn't have any
        // ... initialization logic ...
      }
    }
    return item;
  });
}
```

## How It Works

1. When the user loads an item group in edit mode, the frontend now includes `warehouseStocks` in the loaded items state.

2. When the user changes the returnable status and saves, the `warehouseStocks` are included in the save payload.

3. If for any reason `warehouseStocks` are missing from the payload, the backend now looks up the existing item in the database and preserves its `warehouseStocks`.

4. This ensures stock data is never lost during returnable status updates.

## Testing

To verify the fix:

1. Create an item group with items that have stock
2. Edit the item group and change the returnable status
3. Save the changes
4. Verify that the stock is still present in the items

## Files Modified

- `frontend/src/pages/ShoeSalesItemGroupCreate.jsx` (lines ~350, ~372, ~787)
- `backend/controllers/ItemGroupController.js` (lines ~930-970)
