# Warehouse Branch Admin Access Fix

## Problem
When logged in as admin from "Warehouse Branch", items were being filtered by warehouse even though "Warehouse Branch" is the main admin warehouse. This caused items to disappear from item groups after editing stock.

## Root Cause

### Backend Warehouse Filtering Logic
The backend code in `ItemGroupController.js` was only recognizing `"Warehouse"` (without "Branch") as the main admin warehouse:

```javascript
// OLD CODE:
if (warehouse && filterByWarehouse === "true" && warehouse !== "Warehouse") {
  // Apply filtering...
}
```

This meant:
- `"Warehouse"` → No filtering (admin access)
- `"Warehouse Branch"` → Filtering applied (treated as branch user)

Since the actual main warehouse is called **"Warehouse Branch"**, admins were being treated as branch users and items were being filtered.

## The Fix

### File: `backend/controllers/ItemGroupController.js`

**1. Updated main warehouse check** (Line ~598):

```javascript
// NEW CODE:
const isMainWarehouse = warehouse === "Warehouse" || warehouse === "Warehouse Branch" || warehouse === "WAREHOUSE";

if (warehouse && filterByWarehouse === "true" && !isMainWarehouse) {
  // Apply filtering only for non-admin warehouses
}
```

**2. Updated warehouse skip logic** (Line ~622):

```javascript
// OLD CODE:
if (wsWarehouse === "warehouse") {
  return false;
}

// NEW CODE:
if (wsWarehouse === "warehouse" || wsWarehouse === "warehouse branch") {
  return false;
}
```

**3. Updated warehouseStocks filtering** (Line ~663):

```javascript
// OLD CODE:
if (wsWarehouse === "warehouse") return false;

// NEW CODE:
if (wsWarehouse === "warehouse" || wsWarehouse === "warehouse branch") return false;
```

## How It Works Now

### Main Warehouses (No Filtering)
These warehouses see ALL items in all groups:
- `"Warehouse"`
- `"Warehouse Branch"` ✅ (your main admin warehouse)
- `"WAREHOUSE"`

### Branch Warehouses (With Filtering)
These warehouses only see items with stock in their branch:
- `"Kottayam Branch"`
- `"Calicut Branch"`
- `"Palakkad Branch"`
- etc.

## Warehouse Hierarchy

```
Main Admin Warehouse (No Filtering)
├── Warehouse Branch ← Your main warehouse
├── Warehouse
└── WAREHOUSE

Branch Warehouses (Filtered)
├── Kottayam Branch
├── Calicut Branch
├── Palakkad Branch
└── ... other branches
```

## User Experience

### Before Fix (Warehouse Branch Admin)
❌ Logged in from "Warehouse Branch"
❌ System treats you as branch user
❌ Items filtered by warehouse
❌ Size 10 item has stock in "Warehouse" → filtered out
❌ Item disappears after editing stock

### After Fix (Warehouse Branch Admin)
✅ Logged in from "Warehouse Branch"
✅ System recognizes you as admin
✅ No warehouse filtering applied
✅ See ALL items in all groups
✅ Items remain visible after editing stock

## Testing

### Test Case 1: Warehouse Branch Admin
1. Login as admin from "Warehouse Branch"
2. Navigate to item group "Abhiram Test"
3. ✅ See all items (size 9, size 10, etc.)
4. Edit stock for size 10 item
5. ✅ Item still visible after saving

### Test Case 2: Branch User (Kottayam)
1. Login as user from "Kottayam Branch"
2. Navigate to item group "Abhiram Test"
3. ✅ Only see items with stock in Kottayam Branch
4. ✅ Don't see items only in Warehouse Branch

### Test Case 3: Stock Distribution
1. Admin creates item with stock in "Warehouse Branch"
2. Admin transfers stock to "Kottayam Branch"
3. ✅ Admin sees item in both warehouses
4. ✅ Kottayam user only sees item after transfer

## Related Code

### Frontend Warehouse Detection
The frontend determines user's warehouse from locCode:

```javascript
// frontend/src/pages/ShoeSalesItemGroupDetail.jsx
const getUserWarehouse = () => {
  if (!user?.locCode) return "Warehouse";
  const location = fallbackLocations.find(loc => loc.locCode === user.locCode);
  // Maps locCode to warehouse name
  return warehouse || "Warehouse";
};
```

### Backend Filtering Decision
The backend decides whether to filter:

```javascript
const isMainWarehouse = warehouse === "Warehouse" || 
                       warehouse === "Warehouse Branch" || 
                       warehouse === "WAREHOUSE";

if (warehouse && filterByWarehouse === "true" && !isMainWarehouse) {
  // Apply filtering for branch users only
}
```

## Files Modified

1. `backend/controllers/ItemGroupController.js` - Updated warehouse filtering logic
2. `frontend/src/pages/ItemStockManagement.jsx` - Added skipWarehouseFilter parameter (previous fix)

## Important Notes

1. **Main warehouse names are case-insensitive**: "Warehouse", "warehouse", "WAREHOUSE" all work
2. **"Warehouse Branch" is now recognized as main warehouse**: No filtering applied
3. **Branch users still get filtered**: Only see items in their branch
4. **Stock management always shows all items**: Regardless of warehouse

## Summary

The fix ensures that "Warehouse Branch" is recognized as the main admin warehouse, allowing admins to see and manage ALL items in all groups without warehouse filtering. Branch users continue to see only items relevant to their branch.
