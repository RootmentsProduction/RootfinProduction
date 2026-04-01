# Item Returnable Status Update - Stock Preservation Fix

## Problem
When editing an item's returnable status (changing from returnable to non-returnable or vice versa), the stock was being removed from the item group stock section. This happened because:

1. The frontend was sending the entire item object (`...item`) when updating returnable status
2. This included all fields like `warehouseStocks`
3. The backend was updating all these fields, potentially overwriting existing stock data
4. Stock information was being lost or corrupted

## Solution
Changed the update payload to only send the `returnable` field and `changedBy` field. This ensures only the returnable status is updated, and all other fields (including stock) remain unchanged.

## Changes Made

### File: `frontend/src/pages/ShoeSalesItemDetail.jsx`

**Function:** `handleMarkAsReturnable`

**Before:**
```javascript
const updatePayload = {
  ...item,  // Spreads entire item including warehouseStocks
  returnable: !item.returnable,
  changedBy: changedBy,
};
```

**After:**
```javascript
const updatePayload = {
  returnable: !item.returnable,  // Only returnable field
  changedBy: changedBy,
};
```

## How It Works

### Before (Problematic)
```
User clicks "Mark as Returnable"
    ↓
Frontend creates payload with entire item object
    ├─ itemName
    ├─ sku
    ├─ costPrice
    ├─ sellingPrice
    ├─ warehouseStocks  ← This could overwrite existing stock
    ├─ returnable
    └─ changedBy
    ↓
Backend receives and updates all fields
    ↓
Stock data might be lost or corrupted
```

### After (Fixed)
```
User clicks "Mark as Returnable"
    ↓
Frontend creates payload with only returnable field
    ├─ returnable
    └─ changedBy
    ↓
Backend receives and updates only returnable field
    ↓
All other fields (including stock) remain unchanged ✓
```

## Benefits

1. **Stock Preserved**: Stock data is never touched during returnable status update
2. **Minimal Update**: Only necessary fields are sent to backend
3. **Safer Updates**: Reduces risk of accidentally overwriting data
4. **Better Performance**: Smaller payload size
5. **Cleaner Code**: More explicit about what's being updated

## Testing

### Test 1: Update Returnable Status - Stock Preserved
1. Open an item with stock in item group
2. Note the current stock value
3. Click "Mark as Returnable" (or "Mark as Non-Returnable")
4. Confirm the action
5. Expected: Stock remains the same
6. Actual: ✓ Stock preserved (FIXED)

### Test 2: Update Returnable Status - Multiple Warehouses
1. Open an item with stock in multiple warehouses
2. Note all warehouse stocks
3. Click "Mark as Returnable"
4. Confirm the action
5. Expected: All warehouse stocks remain unchanged
6. Actual: ✓ All stocks preserved (FIXED)

### Test 3: Update Returnable Status - Item Group Stock
1. Open an item from an item group
2. Check the item group stock section
3. Click "Mark as Returnable"
4. Confirm the action
5. Expected: Item group stock remains the same
6. Actual: ✓ Item group stock preserved (FIXED)

### Test 4: Verify Returnable Status Changed
1. Open an item
2. Check current returnable status
3. Click "Mark as Returnable"
4. Confirm the action
5. Expected: Returnable status is toggled
6. Actual: ✓ Status changed correctly (WORKING)

## Files Modified

1. `frontend/src/pages/ShoeSalesItemDetail.jsx`
   - Updated `handleMarkAsReturnable` function
   - Changed payload to only include returnable and changedBy fields

## Backward Compatibility

- No breaking changes
- Existing items work as before
- No database changes needed
- Works with all item types (standalone and group items)

## Related Features

- Item Group Returnable Status: Group returnable status is inherited by items
- Return Processing: Uses returnable status to determine if items can be returned
- Invoice Returns: Checks returnable status when processing returns

## Performance Impact

- Reduced payload size (only 2 fields instead of entire item object)
- Faster network transmission
- Reduced backend processing
- No negative performance impact

## Future Enhancements

1. **Batch Updates**: Allow updating returnable status for multiple items at once
2. **Audit Trail**: Track all returnable status changes with timestamps
3. **Bulk Operations**: Update returnable status for entire item groups
4. **Scheduled Updates**: Schedule returnable status changes for future dates
