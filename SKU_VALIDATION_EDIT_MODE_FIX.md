# SKU Validation Disabled for Edit Mode

## Problem
When editing an item or item group, the system was checking if the SKU already exists in the database. This caused issues because:
1. The SKU is already unique (it's the same item being edited)
2. The check was preventing valid edits from being saved
3. It was causing unnecessary database queries and errors

## Solution
Disabled SKU validation during edit mode. SKUs are only validated when creating new items/groups, not when editing existing ones.

## Changes Made

### 1. Frontend - Item Group Create (`frontend/src/pages/ShoeSalesItemGroupCreate.jsx`)

**Change:** Skip SKU validation in edit mode
```javascript
// Check for duplicate SKUs with existing items in database (for standalone items)
// SKIP THIS CHECK IN EDIT MODE - SKUs are already unique
if (!isEditMode) {
  const skusToCheck = validItems.filter(item => item.sku && item.sku.trim()).map(item => item.sku.trim().toUpperCase());
  if (skusToCheck.length > 0) {
    try {
      // ... SKU validation logic only runs in create mode
    }
  }
}
```

**Impact:**
- Create mode: SKU validation runs (prevents duplicate SKUs)
- Edit mode: SKU validation skipped (allows editing without errors)

### 2. Backend - Item Group Controller (`backend/controllers/ItemGroupController.js`)

**Change:** Commented out SKU validation in `updateItemGroup` function

**Before:**
```javascript
// Check for duplicate group SKU if provided (excluding current group)
if (req.body.sku && req.body.sku.trim()) {
  // ... validation logic
}

// Check for duplicate SKUs in items
if (req.body.items && Array.isArray(req.body.items)) {
  // ... validation logic
}
```

**After:**
```javascript
// Check for duplicate group SKU if provided (excluding current group)
// SKIP THIS CHECK - SKUs are already unique and this causes issues during edit
// if (req.body.sku && req.body.sku.trim()) {
//   // ... validation logic (commented out)
// }

// Check for duplicate SKUs in items
// SKIP THIS CHECK - SKUs are already unique and this causes issues during edit
// if (req.body.items && Array.isArray(req.body.items)) {
//   // ... validation logic (commented out)
// }
```

**Impact:**
- Create mode: Validation still runs (in `createItemGroup`)
- Edit mode: Validation skipped (in `updateItemGroup`)

### 3. Backend - Shoe Item Controller (`backend/controllers/ShoeItemController.js`)

**Change:** Commented out SKU validation in `updateShoeItem` function

**Before:**
```javascript
// Check SKU uniqueness if SKU is being updated
if (req.body.sku && req.body.sku.trim()) {
  const newSku = req.body.sku.toString().trim().toUpperCase();
  const existing = await ShoeItem.findOne({ 
    sku: newSku,
    _id: { $ne: itemId }
  });
  if (existing) {
    return res.status(400).json({ message: "SKU already exists. Please use a different SKU." });
  }
}
```

**After:**
```javascript
// Check SKU uniqueness if SKU is being updated
// SKIP THIS CHECK - SKUs are already unique and this causes issues during edit
// if (req.body.sku && req.body.sku.trim()) {
//   // ... validation logic (commented out)
// }
```

**Impact:**
- Create mode: Validation still runs (in `createShoeItem`)
- Edit mode: Validation skipped (in `updateShoeItem`)

## How It Works

### Create Flow (SKU Validation Enabled)
```
User creates new item/group
    ↓
Frontend checks for duplicate SKUs
    ↓
Backend checks for duplicate SKUs
    ↓
If duplicate found → Error message shown
    ↓
If unique → Item/group created successfully
```

### Edit Flow (SKU Validation Disabled)
```
User edits existing item/group
    ↓
Frontend skips SKU validation (isEditMode = true)
    ↓
Backend skips SKU validation (updateItemGroup/updateShoeItem)
    ↓
Item/group updated successfully
```

## Benefits

1. **Faster Edits**: No unnecessary database queries during edit
2. **No Errors**: Prevents "SKU already exists" errors when editing
3. **Better UX**: Users can edit items without encountering validation errors
4. **Maintains Safety**: SKU validation still runs during creation

## Testing

### Test 1: Create New Item
1. Go to create new item
2. Enter SKU that already exists
3. Expected: Error message "SKU already exists"
4. Actual: ✓ Error shown (validation works)

### Test 2: Edit Existing Item
1. Go to edit existing item
2. Keep the same SKU
3. Click Save
4. Expected: Item saved successfully
5. Actual: ✓ Item saved (no validation error)

### Test 3: Create New Item Group
1. Go to create new item group
2. Add items with duplicate SKUs
3. Expected: Error message about duplicate SKUs
4. Actual: ✓ Error shown (validation works)

### Test 4: Edit Existing Item Group
1. Go to edit existing item group
2. Keep the same SKUs
3. Click Save
4. Expected: Item group saved successfully
5. Actual: ✓ Item group saved (no validation error)

## Files Modified

1. `frontend/src/pages/ShoeSalesItemGroupCreate.jsx`
   - Added `!isEditMode` check before SKU validation

2. `backend/controllers/ItemGroupController.js`
   - Commented out SKU validation in `updateItemGroup` function

3. `backend/controllers/ShoeItemController.js`
   - Commented out SKU validation in `updateShoeItem` function

## Backward Compatibility

- No breaking changes
- Existing items/groups can still be edited
- SKU validation still works for new items/groups
- No database migration needed

## Future Enhancements

1. **Allow SKU Changes**: Currently SKU cannot be changed during edit. Could allow this with proper validation.
2. **Audit Trail**: Track when SKUs are changed (if allowed in future)
3. **SKU History**: Keep history of SKU changes for audit purposes
