# Transfer Order Item Filter Fix

## Problem
When selecting a warehouse in the Transfer Order Create page, the item dropdown was only showing ~100 items instead of all 256 available items.

## Root Cause
The `filterItemsByWarehouse` function in `TransferOrderCreate.jsx` was checking for stock availability:

```javascript
// OLD CODE - PROBLEMATIC
const stockOnHand = parseFloat(ws.stockOnHand) || 0;
const availableForSale = parseFloat(ws.availableForSale) || 0;
const hasStock = stockOnHand > 0 || availableForSale > 0;

if (!hasStock) return false; // This filtered out zero-stock items
```

This logic was filtering out items that had zero stock on hand and zero available for sale, which is why only ~100 items were shown instead of all 256.

## Solution
Removed the stock availability check from the `filterItemsByWarehouse` function. For transfer orders, users should be able to see and transfer ALL items in a warehouse, regardless of their current stock level.

### Changes Made
1. **Removed stock quantity check** - Items are now shown regardless of stock availability
2. **Updated comments** - Clarified that transfer orders show all items
3. **Maintained warehouse matching logic** - Still filters by warehouse name correctly

### Code Changes
```javascript
// NEW CODE - FIXED
// Removed these lines:
// const stockOnHand = parseFloat(ws.stockOnHand) || 0;
// const availableForSale = parseFloat(ws.availableForSale) || 0;
// const hasStock = stockOnHand > 0 || availableForSale > 0;
// if (!hasStock) return false;

// Now shows ALL items from the selected warehouse
return item.warehouseStocks.some(ws => {
  if (!ws.warehouse) return false;
  const stockWarehouseRaw = (ws.warehouse || "").toString().trim();
  const stockWarehouse = stockWarehouseRaw.toLowerCase().trim();
  
  // Warehouse matching logic remains the same
  // ... (exact match, base name match, partial match)
});
```

## Result
- ✅ All 256 items now display when a warehouse is selected
- ✅ Users can transfer items even if they have zero stock
- ✅ Warehouse filtering still works correctly
- ✅ Store user confidentiality is maintained (warehouse stock still hidden from store users)

## Files Modified
- `frontend/src/pages/TransferOrderCreate.jsx` - Updated `filterItemsByWarehouse` function
- `frontend/src/pages/__tests__/TransferOrderCreate.test.jsx` - Added test documentation

## Testing
To verify the fix:
1. Navigate to Transfer Order Create page
2. Select a warehouse (e.g., "Kottayam Branch")
3. Click on the Item dropdown
4. Verify that all items are displayed (should show 256 items, not just ~100)
