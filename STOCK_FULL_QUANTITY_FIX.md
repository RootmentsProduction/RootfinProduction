# Stock Full Quantity Reduction Fix

## Problem Description

When creating an invoice for ALL items in stock (e.g., 20 items), the stock was showing 20 instead of 0 after the sale. However, when creating an invoice for partial quantity (e.g., 5 items from 20), it correctly showed 15.

### Symptoms
- ✅ Partial quantity sales: Working correctly (20 → 15 when selling 5)
- ❌ Full quantity sales: Not working (20 → 20 when selling 20, should be 0)
- ✅ Frontend display: Showing correct stock (0) on item detail page
- ❌ Backend calculation: Not reducing stock to 0 when full quantity is sold

## Root Causes Found

### 1. Missing Variable Definition
**Location:** `backend/utils/stockManagement.js` (Line ~260)

**Issue:** The variable `warehouseLower` was used but never defined in the standalone item section.

```javascript
// ❌ BEFORE (Bug)
if (warehouseStockIndex === -1) {
  warehouseStockIndex = shoeItem.warehouseStocks.findIndex((ws) => {
    if (!ws.warehouse) return false;
    const wsLower = ws.warehouse.toLowerCase().trim();
    return wsLower.includes(warehouseLower) || warehouseLower.includes(wsLower); // warehouseLower not defined!
  });
}

// ✅ AFTER (Fixed)
if (warehouseStockIndex === -1) {
  const warehouseLower = warehouse.toLowerCase().trim(); // Now defined
  warehouseStockIndex = shoeItem.warehouseStocks.findIndex((ws) => {
    if (!ws.warehouse) return false;
    const wsLower = ws.warehouse.toLowerCase().trim();
    return wsLower.includes(warehouseLower) || warehouseLower.includes(wsLower);
  });
}
```

### 2. Improved Type Handling
**Location:** `backend/utils/stockManagement.js` (Multiple locations)

**Issue:** Stock calculations were not explicitly converting to numbers, which could cause issues with string concatenation instead of subtraction.

```javascript
// ❌ BEFORE (Potential Bug)
warehouseStock.stockOnHand = Math.max(0, (warehouseStock.stockOnHand || 0) - quantity);

// ✅ AFTER (Fixed)
const currentStock = parseFloat(warehouseStock.stockOnHand) || 0;
const quantityToReduce = parseFloat(quantity);
const newStock = Math.max(0, currentStock - quantityToReduce);
warehouseStock.stockOnHand = newStock;
warehouseStock.availableForSale = newStock;
```

### 3. Enhanced Logging
Added detailed logging to track stock updates:
- Current stock before update
- Quantity being reduced
- New stock after calculation
- Verification after save

### 4. Post-Save Verification
Added verification step to ensure the save operation worked correctly:

```javascript
// Verify the save worked
const verifyItem = await ShoeItem.findById(itemId);
const verifyWarehouseStock = verifyItem.warehouseStocks[warehouseStockIndex];
console.log(`✅ Stock updated: -${quantityToReduce} (New stock: ${verifyWarehouseStock.stockOnHand})`);

if (verifyWarehouseStock.stockOnHand !== newStock) {
  console.error(`❌ VERIFICATION FAILED! Expected ${newStock}, but got ${verifyWarehouseStock.stockOnHand}`);
}
```

## Changes Made

### Files Modified
1. **backend/utils/stockManagement.js**
   - Fixed undefined `warehouseLower` variable
   - Improved type conversion with explicit `parseFloat()`
   - Added detailed logging for debugging
   - Added post-save verification
   - Applied fixes to both `updateStockOnInvoiceCreate` and `reverseStockOnInvoiceDelete` functions
   - Applied fixes to both standalone items and group items

### Files Created
1. **backend/test-stock-full-quantity.js**
   - Test script to verify the fix
   - Tests selling full quantity of items
   - Includes verification and stock restoration

## Testing Instructions

### 1. Run the Test Script
```bash
cd backend
node test-stock-full-quantity.js
```

This will:
- Find an item with stock in Perinthalmanna Branch
- Sell the FULL quantity
- Verify stock is reduced to 0
- Restore the original stock

### 2. Manual Testing
1. Log in to Perinthalmanna Branch
2. Find an item with stock (e.g., 20 items)
3. Create an invoice for ALL 20 items
4. Check the item detail page - stock should show 0
5. Check the invoice creation page - stock should show 0

### 3. Check Backend Logs
When creating an invoice, you should see detailed logs like:

```
🔄 Starting stock update for warehouse: Perinthalmanna Branch
📦 Processing 1 items
Processing item: Shoe Formal 1003 - 7/Brown
  Item is from group: 507f1f77bcf86cd799439011
  Found item in group: Shoe Formal 1003 - 7/Brown
  Before: StockOnHand=20, Available=20, Committed=0
  Reducing by: 20
  After: StockOnHand=0, Available=0, Committed=0
✅ Stock updated for group item "Shoe Formal 1003 - 7/Brown": -20 (New stock: 0)
```

## Expected Behavior After Fix

### Scenario 1: Sell Full Quantity
- **Before:** 20 items in stock
- **Action:** Create invoice for 20 items
- **After:** 0 items in stock ✅

### Scenario 2: Sell Partial Quantity
- **Before:** 20 items in stock
- **Action:** Create invoice for 5 items
- **After:** 15 items in stock ✅

### Scenario 3: Return Full Quantity
- **Before:** 0 items in stock
- **Action:** Create return invoice for 20 items
- **After:** 20 items in stock ✅

## Technical Details

### Why This Bug Occurred

1. **Undefined Variable:** JavaScript doesn't throw errors for undefined variables in some contexts, leading to silent failures
2. **Type Coercion:** JavaScript's loose typing can cause `"20" - "20"` to work but `"20" - 20` might behave unexpectedly
3. **Mongoose Nested Arrays:** Changes to nested arrays need explicit `markModified()` calls

### How the Fix Works

1. **Explicit Type Conversion:** Using `parseFloat()` ensures we're always working with numbers
2. **Variable Definition:** Defining `warehouseLower` ensures the fallback warehouse matching works
3. **Verification:** Post-save verification catches any issues immediately
4. **Enhanced Logging:** Detailed logs help identify where the issue occurs

## Rollback Plan

If issues occur, you can revert the changes:

```bash
cd backend
git checkout HEAD -- utils/stockManagement.js
```

## Additional Notes

- The fix applies to both standalone items and items in groups
- The fix applies to both stock reduction (sales) and stock reversal (returns)
- Enhanced logging will help diagnose any future stock-related issues
- The test script can be run anytime to verify stock calculations

## Related Files

- `backend/utils/stockManagement.js` - Main stock management logic
- `backend/controllers/SalesInvoiceController.js` - Calls stock management functions
- `frontend/src/pages/ShoeSalesItemDetailFromGroup.jsx` - Displays stock on frontend
- `frontend/src/pages/SalesInvoiceCreate.jsx` - Invoice creation page

## Support

If you encounter any issues after applying this fix:

1. Check the backend console logs for detailed error messages
2. Run the test script to verify the fix is working
3. Check if the item is a standalone item or part of a group
4. Verify the warehouse name matches exactly (case-insensitive)
