# Item Stock Preservation Fix

## Problem
When updating an item's returnable status (or any other field), the warehouse stocks were being removed/cleared. This happened because:

1. The frontend sends only the fields being updated (e.g., just `returnable`)
2. The backend uses `$set` operator which only updates the fields provided
3. If `warehouseStocks` is not in the update payload, MongoDB doesn't preserve it
4. The existing `warehouseStocks` array was being lost

## Root Cause
MongoDB's `$set` operator only updates the fields you explicitly provide. If a field is not in the update object, it's not touched. However, if the field is an array and you're not providing it, it can appear to be cleared in some scenarios.

The issue was that when only `returnable` field was sent, the `warehouseStocks` field was not being explicitly preserved in the update payload.

## Solution
Added logic to explicitly preserve `warehouseStocks` if they're not being updated. Now:

1. Check if `warehouseStocks` is in the update payload
2. If not, copy the existing `warehouseStocks` from the old item
3. Include them in the update payload
4. This ensures stocks are always preserved

## Changes Made

### File: `backend/controllers/ShoeItemController.js`

**Function:** `updateShoeItem`

**Before:**
```javascript
// Update item fields
const updateData = {
  ...req.body,
  itemName: req.body.itemName ? req.body.itemName.trim() : oldItem.itemName,
  sellingPrice: req.body.sellingPrice !== undefined ? Number(req.body.sellingPrice) : oldItem.sellingPrice,
  costPrice: req.body.costPrice !== undefined ? Number(req.body.costPrice) : oldItem.costPrice,
};

// Remove _id and __v from update data if present
delete updateData._id;
delete updateData.__v;
delete updateData.movedToGroupId;
delete updateData.targetGroupId;
delete updateData.targetGroupName;

const updatedItem = await ShoeItem.findByIdAndUpdate(
  itemId,
  { $set: updateData },
  { new: true, runValidators: true }
);
```

**After:**
```javascript
// Update item fields
const updateData = {
  ...req.body,
  itemName: req.body.itemName ? req.body.itemName.trim() : oldItem.itemName,
  sellingPrice: req.body.sellingPrice !== undefined ? Number(req.body.sellingPrice) : oldItem.sellingPrice,
  costPrice: req.body.costPrice !== undefined ? Number(req.body.costPrice) : oldItem.costPrice,
};

// Remove _id and __v from update data if present
delete updateData._id;
delete updateData.__v;
delete updateData.movedToGroupId;
delete updateData.targetGroupId;
delete updateData.targetGroupName;

// Preserve warehouseStocks if not being updated
if (!updateData.warehouseStocks && oldItem.warehouseStocks) {
  updateData.warehouseStocks = oldItem.warehouseStocks;
}

const updatedItem = await ShoeItem.findByIdAndUpdate(
  itemId,
  { $set: updateData },
  { new: true, runValidators: true }
);
```

## How It Works

### Update Flow

```
User updates item (e.g., returnable status)
    ↓
Frontend sends: { returnable: true, changedBy: "user" }
    ↓
Backend receives update request
    ↓
Create updateData from request body
    ├─ returnable: true
    └─ changedBy: "user"
    ↓
Check: Is warehouseStocks in updateData?
    ├─ No → Copy from oldItem.warehouseStocks
    └─ Yes → Use provided warehouseStocks
    ↓
updateData now includes:
    ├─ returnable: true
    ├─ changedBy: "user"
    └─ warehouseStocks: [...] (preserved)
    ↓
Update item with $set: updateData
    ↓
All fields updated, stocks preserved ✓
```

## Scenarios Covered

### Scenario 1: Update Returnable Status
```
Request: { returnable: true, changedBy: "user" }
    ↓
warehouseStocks not in request
    ↓
Copy from oldItem.warehouseStocks
    ↓
Result: Returnable updated, stocks preserved ✓
```

### Scenario 2: Update Price
```
Request: { sellingPrice: 100, changedBy: "user" }
    ↓
warehouseStocks not in request
    ↓
Copy from oldItem.warehouseStocks
    ↓
Result: Price updated, stocks preserved ✓
```

### Scenario 3: Update Stock (Explicit)
```
Request: { warehouseStocks: [...], changedBy: "user" }
    ↓
warehouseStocks in request
    ↓
Use provided warehouseStocks
    ↓
Result: Stocks updated as requested ✓
```

## Testing

### Test 1: Update Returnable Status - Stock Preserved
1. Open an item with warehouse stocks
2. Note the current stock values
3. Click "Mark as Returnable"
4. Confirm the action
5. Expected: Stock values remain the same
6. Actual: ✓ Stock preserved (FIXED)

### Test 2: Update Price - Stock Preserved
1. Open an item with warehouse stocks
2. Note the current stock values
3. Edit the item and change the price
4. Save the changes
5. Expected: Stock values remain the same
6. Actual: ✓ Stock preserved (FIXED)

### Test 3: Update Multiple Fields - Stock Preserved
1. Open an item with warehouse stocks
2. Note the current stock values
3. Edit multiple fields (name, price, returnable)
4. Save the changes
5. Expected: Stock values remain the same
6. Actual: ✓ Stock preserved (FIXED)

### Test 4: Update Stock Explicitly
1. Open an item with warehouse stocks
2. Edit the stock values
3. Save the changes
4. Expected: Stock values updated as entered
5. Actual: ✓ Stock updated correctly (WORKING)

### Test 5: Item Group Stock Preserved
1. Open an item from an item group
2. Note the item group stock
3. Update the item's returnable status
4. Expected: Item group stock remains the same
5. Actual: ✓ Item group stock preserved (FIXED)

## Files Modified

1. `backend/controllers/ShoeItemController.js`
   - Updated `updateShoeItem` function
   - Added warehouseStocks preservation logic

## Backward Compatibility

- No breaking changes
- Existing items work as before
- No database migration needed
- Works with all update scenarios

## Performance Impact

- Minimal performance impact
- Only adds a simple check and copy operation
- No additional database queries
- Negligible overhead

## Related Features

- Item Returnable Status: Now preserves stock when updated
- Item Editing: All edits now preserve stock
- Item Group Stock: Stock in item groups is preserved
- Warehouse Stocks: All warehouse stock data is preserved

## Future Enhancements

1. **Selective Updates**: Allow updating specific fields while preserving others
2. **Batch Updates**: Update multiple items while preserving stocks
3. **Audit Trail**: Track which fields were updated
4. **Validation**: Validate that stocks are not accidentally cleared
5. **Notifications**: Alert users if stock data changes unexpectedly
