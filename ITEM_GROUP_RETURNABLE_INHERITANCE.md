# Item Group Returnable Status Inheritance

## Overview
Items within an item group now automatically inherit the returnable/non-returnable status from their parent item group. When an item group is created with a returnable or non-returnable option, all items in that group will have that same status displayed in their item details page.

## Changes Made

### 1. Backend Model Update (`backend/model/ItemGroup.js`)
- Added `returnable` field to the items schema within ItemGroup
- Field type: `Boolean` with default value `null`
- `null` means the item inherits from the group's returnable status
- This allows for future per-item override capability if needed

```javascript
returnable: {
  type: Boolean,
  default: null, // null means inherit from group
}
```

### 2. Backend Controller Update (`backend/controllers/ItemGroupController.js`)
- Updated `getItemGroupById` function to apply returnable inheritance
- Before returning the item group, the controller now:
  - Checks each item's returnable status
  - If an item's returnable is `null` or `undefined`, it inherits from the group's returnable status
  - This ensures items always have a definitive returnable value when returned to frontend

```javascript
// Apply returnable inheritance: items inherit from group if not explicitly set
if (groupObj.items && Array.isArray(groupObj.items)) {
  groupObj.items = groupObj.items.map(item => {
    // If item's returnable is null/undefined, inherit from group
    if (item.returnable === null || item.returnable === undefined) {
      item.returnable = groupObj.returnable;
    }
    return item;
  });
}
```

### 3. Frontend Item Detail Update (`frontend/src/pages/ShoeSalesItemDetailFromGroup.jsx`)
- Added returnable status display in the Status section of the Overview tab
- Shows a badge indicating whether the item is "Returnable" or "Non-Returnable"
- Uses purple color scheme to distinguish from other status indicators
- The status is inherited from the item group and displayed prominently

```jsx
<span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${item.returnable !== false ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
  <span className={`w-2 h-2 rounded-full ${item.returnable !== false ? 'bg-purple-500' : 'bg-gray-400'}`}></span>
  {item.returnable !== false ? 'Returnable' : 'Non-Returnable'}
</span>
```

### 4. Frontend Item Group Create Update (`frontend/src/pages/ShoeSalesItemGroupCreate.jsx`)
- Updated item mapping to explicitly set `returnable: null` for new items
- This ensures new items created in a group will inherit the group's returnable status
- When items are saved, they don't have their own returnable value, so they inherit from the group

```javascript
returnable: null, // Items inherit returnable status from group
```

## How It Works

### Item Creation Flow
1. User creates an item group with returnable status set (e.g., "Returnable Item" checkbox)
2. Items are added to the group (either generated from attributes or manually)
3. Each item is saved with `returnable: null` in the database
4. When the item group is fetched, the backend applies inheritance logic
5. Each item's returnable status is set to the group's returnable status
6. Frontend displays the inherited status in the item details page

### Item Display Flow
1. User views an item in an item group
2. Frontend fetches the item group with all items
3. Backend has already applied inheritance logic
4. Item displays with the inherited returnable status
5. In the Status section, user sees "Returnable" or "Non-Returnable" badge

### Return Eligibility
- When processing returns in SalesInvoiceDetail, the logic checks `item.itemData?.returnable !== false`
- This means:
  - `returnable: true` → Item is returnable ✓
  - `returnable: false` → Item is NOT returnable ✗
  - `returnable: null` → Item is returnable (inherited) ✓
  - `returnable: undefined` → Item is returnable (inherited) ✓

## Benefits

1. **Consistency**: All items in a group have the same returnable status
2. **Simplicity**: No need to set returnable status for each item individually
3. **Flexibility**: Future enhancement allows per-item override if needed
4. **Clarity**: Users can see the returnable status in item details
5. **Automatic**: Inheritance happens automatically without user intervention

## Testing Checklist

- [ ] Create an item group with "Returnable Item" checked
- [ ] Verify items in the group show "Returnable" status in details page
- [ ] Create an item group with "Returnable Item" unchecked
- [ ] Verify items in the group show "Non-Returnable" status in details page
- [ ] Edit an item group and change returnable status
- [ ] Verify items reflect the new status
- [ ] Test return functionality with returnable items
- [ ] Test return functionality with non-returnable items (should show error)
- [ ] Verify standalone items still work as before

## Future Enhancements

- Allow per-item override of returnable status (set individual item's returnable to true/false)
- Add UI to override returnable status for specific items in a group
- Add audit trail for returnable status changes
