# Stock Not Reducing for Perinthalmanna Branch - Fix

## Problem
Stock was not being reduced when invoices were created for items in the Perinthalmanna branch (G.Perinthalmanna / GPerinthalmanna). The issue only affected Perinthalmanna, not other stores.

### Symptoms
- Invoice created successfully for Perinthalmanna items
- Stock displayed as 15 in item detail page
- After invoice creation, stock still shows 15 (not reduced)
- Other branches work correctly

## Root Cause
**Warehouse name normalization mismatch** between frontend and backend stock matching logic.

### The Flow
1. **Frontend**: User selects branch "G.Perinthalmanna" or "GPerinthalmanna"
2. **Frontend**: Branch is mapped to warehouse "Perinthalmanna Branch" via `mapLocNameToWarehouse()`
3. **Frontend**: Invoice is sent to backend with `warehouse: "Perinthalmanna Branch"`
4. **Backend**: `updateStockOnInvoiceCreate()` is called with warehouse "Perinthalmanna Branch"
5. **Backend**: `findWarehouseStockIndex()` tries to find matching warehouse in item's warehouseStocks
6. **PROBLEM**: Items in database have warehouse stored as "G.Perinthalmanna" or other variations
7. **PROBLEM**: `findWarehouseStockIndex()` didn't have special handling for Perinthalmanna variations
8. **Result**: Warehouse not found → Stock not updated ❌

## Solution
Updated `findWarehouseStockIndex()` in `backend/utils/stockManagement.js` to handle all warehouse name variations for all branches, not just MG Road and Trivandrum.

### Changes Made
**File: `backend/utils/stockManagement.js`**

Replaced the warehouse matching logic with a comprehensive variation mapping that includes:
- **Perinthalmanna**: "Perinthalmanna Branch", "G.Perinthalmanna", "G-Perinthalmanna", "GPerinthalmanna", "Z.Perinthalmanna", "Z-Perinthalmanna"
- **Palakkad**: "Palakkad Branch", "G.Palakkad", "G-Palakkad", "GPalakkad"
- **Calicut**: "Calicut", "G.Calicut", "G-Calicut", "GCalicut"
- **Manjeri**: "Manjery Branch", "G.Manjeri", "G.Manjery", "GManjeri", "GManjery"
- **Kannur**: "Kannur Branch", "G.Kannur", "GKannur"
- **Edappal**: "Edappal Branch", "G.Edappal", "G-Edappal", "GEdappal"
- **Edapally**: "Edapally Branch", "G.Edappally", "G-Edappally", "GEdappally"
- **Kalpetta**: "Kalpetta Branch", "G.Kalpetta", "GKalpetta"
- **Kottakkal**: "Kottakkal Branch", "G.Kottakkal", "GKottakkal", "Z.Kottakkal"
- **Chavakkad**: "Chavakkad Branch", "G.Chavakkad", "GChavakkad"
- **Thrissur**: "Thrissur Branch", "G.Thrissur", "GThrissur"
- **Perumbavoor**: "Perumbavoor Branch", "G.Perumbavoor", "GPerumbavoor"
- **Kottayam**: "Kottayam Branch", "G.Kottayam", "GKottayam"
- **Vadakara**: "Vadakara Branch", "G.Vadakara", "GVadakara"
- **MG Road**: "MG Road", "SuitorGuy MG Road", "G.MG Road", "G.Mg Road", "G-MG Road", "GMG Road", "GMg Road"
- **Trivandrum**: "Grooms Trivandrum", "Grooms Trivandum", "Trivandrum Branch", "SG-Trivandrum", "SG.Trivandrum"
- **Z-Edapally**: "Z-Edapally Branch", "Z-Edapally", "Z-Edapally1"
- **Z-Edappal**: "Z-Edappal Branch", "Z-Edappal", "Z- Edappal"

### How It Works
1. When stock update is called with warehouse "Perinthalmanna Branch"
2. Function checks which category it belongs to (Perinthalmanna)
3. Looks for ANY variation of that warehouse in the item's warehouseStocks
4. Finds match (e.g., "G.Perinthalmanna") and updates stock correctly ✓

## Testing
To verify the fix works:

1. **Log in as Perinthalmanna user** (GPerinthalmanna / G.Perinthalmanna)
2. **Navigate to item detail page** - note the stock (e.g., 15)
3. **Create an invoice** with that item (e.g., quantity 2)
4. **Save the invoice**
5. **Refresh the item detail page** - stock should now be reduced (e.g., 13)
6. **Check other branches** - they should continue to work as before

### Expected Results
- ✅ Stock reduces correctly after invoice creation
- ✅ Works for all branch variations (G.Perinthalmanna, GPerinthalmanna, etc.)
- ✅ Works for all other branches (Palakkad, Kannur, etc.)
- ✅ No errors in backend logs

## Related Files
- `backend/utils/stockManagement.js` - Stock update logic (FIXED)
- `frontend/src/utils/warehouseMapping.js` - Warehouse name mapping
- `frontend/src/pages/SalesInvoiceCreate.jsx` - Invoice creation
- `backend/controllers/SalesInvoiceController.js` - Invoice controller

## Technical Details

### Before Fix
```javascript
// Only handled MG Road and Trivandrum specifically
const isMgRoadWarehouse = mgRoadVariations.includes(warehouseLower);
const isTrivandrumWarehouse = trivandrumVariations.includes(warehouseLower);
// Perinthalmanna fell through to generic matching which failed
```

### After Fix
```javascript
// Comprehensive mapping for all branches
const warehouseVariations = {
  perinthalmanna: ["perinthalmanna branch", "g.perinthalmanna", ...],
  palakkad: ["palakkad branch", "g.palakkad", ...],
  // ... all other branches
};

// Find which category matches
let matchedCategory = null;
for (const [category, variations] of Object.entries(warehouseVariations)) {
  if (variations.includes(warehouseLower)) {
    matchedCategory = category;
    break;
  }
}

// Check against all variations in that category
if (matchedCategory) {
  return warehouseVariations[matchedCategory].includes(wsLower);
}
```

## Impact
- ✅ Fixes stock reduction for Perinthalmanna branch
- ✅ Fixes stock reduction for all other branches with naming variations
- ✅ No breaking changes to existing functionality
- ✅ Backward compatible with all existing data

## Notes
- The fix is case-insensitive (converts to lowercase for comparison)
- Handles all known warehouse name variations
- Falls back to generic matching if no category match found
- Stock reduction now works consistently across all branches
