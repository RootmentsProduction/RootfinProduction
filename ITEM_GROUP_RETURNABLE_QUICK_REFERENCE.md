# Item Group Returnable Status - Quick Reference

## What Changed?
Items in an item group now inherit the returnable/non-returnable status from their parent group.

## Where to See It
1. **Item Group Creation**: When creating an item group, check "Returnable Item" to make all items returnable
2. **Item Details Page**: View any item in a group → Overview tab → Status section shows "Returnable" or "Non-Returnable"
3. **Return Processing**: When processing returns, only returnable items can be returned

## How It Works

### Creating a Returnable Item Group
```
1. Go to Item Groups → Create New
2. Fill in group details
3. Check "Returnable Item" checkbox
4. Add items to the group
5. Save
→ All items in this group are now returnable
```

### Creating a Non-Returnable Item Group
```
1. Go to Item Groups → Create New
2. Fill in group details
3. Leave "Returnable Item" unchecked
4. Add items to the group
5. Save
→ All items in this group are non-returnable
```

### Viewing Item Status
```
1. Go to Item Groups
2. Click on a group
3. Click on an item
4. Look at Status section in Overview tab
5. See "Returnable" or "Non-Returnable" badge
```

## Technical Details

### Database
- Items have a `returnable` field that can be:
  - `null` (inherit from group) - default for new items
  - `true` (returnable)
  - `false` (non-returnable)

### Backend Logic
- When fetching an item group, the backend automatically applies inheritance
- Items with `returnable: null` get the group's returnable status
- This happens transparently - frontend always gets the final status

### Frontend Logic
- Item details page displays the inherited status
- Return processing checks if item is returnable before allowing returns
- Status badge shows clearly whether item can be returned

## Files Modified

1. **backend/model/ItemGroup.js**
   - Added `returnable` field to items schema

2. **backend/controllers/ItemGroupController.js**
   - Added inheritance logic in `getItemGroupById`

3. **frontend/src/pages/ShoeSalesItemDetailFromGroup.jsx**
   - Added returnable status display in Status section

4. **frontend/src/pages/ShoeSalesItemGroupCreate.jsx**
   - Set `returnable: null` for new items

## FAQ

**Q: Can I make individual items in a group non-returnable while the group is returnable?**
A: Currently no, all items inherit from the group. Future enhancement will allow per-item override.

**Q: What happens to existing items?**
A: Existing items will have `returnable: null` and will inherit from their group's status.

**Q: How does this affect returns?**
A: Only items with `returnable: true` (or inherited true) can be returned. Non-returnable items show an error.

**Q: Can I change the returnable status after creating the group?**
A: Yes, edit the group and toggle "Returnable Item". All items will automatically inherit the new status.

## Testing

To verify the feature works:

1. Create item group with "Returnable Item" checked
2. Add items to it
3. View an item → should show "Returnable" badge
4. Create sales invoice with this item
5. Try to return it → should work
6. Create item group with "Returnable Item" unchecked
7. Add items to it
8. View an item → should show "Non-Returnable" badge
9. Create sales invoice with this item
10. Try to return it → should show error message
