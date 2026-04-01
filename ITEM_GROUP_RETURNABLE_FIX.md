# Item Group Returnable Status - Bug Fix

## Issue
Items in a non-returnable item group were still being allowed to be returned, even though the group was created with "Returnable Item" unchecked.

## Root Cause
The return eligibility check was using `returnable !== false`, which treats `null` and `undefined` as returnable. Since items inherit from the group with `returnable: null`, the logic was incorrectly allowing returns for non-returnable groups.

## Solution
Changed all return eligibility checks to use `returnable === true` instead of `returnable !== false`. This ensures:
- Only items explicitly marked as returnable (`returnable: true`) can be returned
- Items with `returnable: false` cannot be returned
- Items with `returnable: null` (inherited) will have the inherited value from the group

## Files Changed

### 1. frontend/src/pages/SalesInvoiceDetail.jsx

**Change 1: Check for returnable items**
```javascript
// Before
const hasReturnableItems = invoice?.lineItems?.some(
  (item) => item.itemData?.returnable !== false
) || false;

// After
const hasReturnableItems = invoice?.lineItems?.some(
  (item) => item.itemData?.returnable === true
) || false;
```

**Change 2: Initialize return items**
```javascript
// Before
isReturnable: item.itemData?.returnable !== false, // Default to true if not specified

// After
isReturnable: item.itemData?.returnable === true, // Only true if explicitly returnable
```

**Change 3: Prevent non-returnable item changes**
```javascript
// Before
if (item.itemData?.returnable === false) {

// After
if (item.itemData?.returnable !== true) {
```

**Change 4: Filter non-returnable items**
```javascript
// Before
const nonReturnableItems = itemsToReturn.filter((item) => item.itemData?.returnable === false);

// After
const nonReturnableItems = itemsToReturn.filter((item) => item.itemData?.returnable !== true);
```

**Change 5: Display returnable status in return modal**
```javascript
// Before
const isReturnable = item.itemData?.returnable !== false; // Default to true if not specified

// After
const isReturnable = item.itemData?.returnable === true; // Only true if explicitly returnable
```

### 2. frontend/src/pages/ShoeSalesItemDetailFromGroup.jsx

**Change: Display returnable status badge**
```jsx
// Before
<span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${item.returnable !== false ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
  <span className={`w-2 h-2 rounded-full ${item.returnable !== false ? 'bg-purple-500' : 'bg-gray-400'}`}></span>
  {item.returnable !== false ? 'Returnable' : 'Non-Returnable'}
</span>

// After
<span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${item.returnable === true ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
  <span className={`w-2 h-2 rounded-full ${item.returnable === true ? 'bg-purple-500' : 'bg-gray-400'}`}></span>
  {item.returnable === true ? 'Returnable' : 'Non-Returnable'}
</span>
```

## How It Works Now

### Returnable Item Group
1. Create item group with "Returnable Item" checked
2. Items are saved with `returnable: null`
3. Backend applies inheritance: `item.returnable = group.returnable` (true)
4. Frontend receives items with `returnable: true`
5. Return check: `returnable === true` → ✓ Can return

### Non-Returnable Item Group
1. Create item group with "Returnable Item" unchecked
2. Items are saved with `returnable: null`
3. Backend applies inheritance: `item.returnable = group.returnable` (false)
4. Frontend receives items with `returnable: false`
5. Return check: `returnable === true` → ✗ Cannot return (shows error)

## Testing

### Test Case 1: Non-Returnable Group
1. Create item group with "Returnable Item" unchecked
2. Add items to the group
3. Create sales invoice with these items
4. Try to return items
5. Expected: Error message "Items are not marked as returnable"
6. Actual: ✓ Error shown (FIXED)

### Test Case 2: Returnable Group
1. Create item group with "Returnable Item" checked
2. Add items to the group
3. Create sales invoice with these items
4. Try to return items
5. Expected: Return modal opens, items can be returned
6. Actual: ✓ Return works (WORKING)

### Test Case 3: Item Details Display
1. View item in non-returnable group
2. Look at Status section
3. Expected: "Non-Returnable" badge shown
4. Actual: ✓ Correct status shown (FIXED)

## Backward Compatibility

- Standalone items with `returnable: true` still work as before
- Standalone items with `returnable: false` still work as before
- Standalone items with `returnable: undefined` will now be treated as non-returnable (changed behavior)
  - This is correct because undefined should not default to returnable

## Summary

The fix ensures that the returnable status is properly enforced:
- Items in non-returnable groups cannot be returned
- Items in returnable groups can be returned
- The status is clearly displayed in the item details page
- Return processing respects the returnable status
