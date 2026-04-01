# Warehouse Name Regex Bug Fix

## Problem
The warehouse name "Warehouse" was being corrupted to "arehouse Branch" due to an overly broad regex pattern that was removing the first letter.

## Root Cause

### File: `frontend/src/pages/ShoeSalesItemGroupDetail.jsx`

The `getUserWarehouse()` function had a regex to remove location prefixes like "G.", "Z.", "SG-":

```javascript
// OLD REGEX (WRONG):
let warehouse = locName.replace(/^[A-Z]\.?\s*/i, "").replace(/^[A-Z]-/i, "").trim();
```

**Problem**: The pattern `/^[A-Z]\.?\s*/i` matches:
- `^[A-Z]` - Any capital letter at the start
- `\.?` - Optionally followed by a dot
- `\s*` - Optionally followed by spaces

This meant:
- `"G.Kottayam"` → `"Kottayam"` ✅ (correct)
- `"Warehouse"` → `"arehouse"` ❌ (W removed!)
- Then adds "Branch" → `"arehouse Branch"` ❌

## The Fix

Changed the regex to only match prefixes that have a dot or dash:

```javascript
// NEW REGEX (CORRECT):
let warehouse = locName.replace(/^[A-Z]{1,2}[.\-]\s*/i, "").trim();
```

**New pattern** `/^[A-Z]{1,2}[.\-]\s*/i` matches:
- `^[A-Z]{1,2}` - 1 or 2 capital letters at the start
- `[.\-]` - **MUST be followed by** a dot or dash
- `\s*` - Optionally followed by spaces

This means:
- `"G.Kottayam"` → `"Kottayam"` ✅
- `"SG-Trivandrum"` → `"Trivandrum"` ✅
- `"Z.Perinthalmanna"` → `"Perinthalmanna"` ✅
- `"Warehouse"` → `"Warehouse"` ✅ (no prefix, stays unchanged)

## Examples

### Before Fix
| Input Location Name | Output Warehouse | Expected | Status |
|---------------------|------------------|----------|--------|
| `"Warehouse"` | `"arehouse Branch"` | `"Warehouse"` | ❌ Wrong |
| `"G.Kottayam"` | `"Kottayam Branch"` | `"Kottayam Branch"` | ✅ Correct |
| `"SG-Trivandrum"` | `"G-Trivandrum Branch"` | `"Trivandrum Branch"` | ❌ Wrong |

### After Fix
| Input Location Name | Output Warehouse | Expected | Status |
|---------------------|------------------|----------|--------|
| `"Warehouse"` | `"Warehouse"` | `"Warehouse"` | ✅ Correct |
| `"G.Kottayam"` | `"Kottayam Branch"` | `"Kottayam Branch"` | ✅ Correct |
| `"SG-Trivandrum"` | `"Trivandrum Branch"` | `"Trivandrum Branch"` | ✅ Correct |
| `"Z.Perinthalmanna"` | `"Perinthalmanna Branch"` | `"Perinthalmanna Branch"` | ✅ Correct |

## Impact

### Before Fix
- Warehouse name corrupted: `"arehouse Branch"`
- Backend couldn't match warehouse properly
- Items filtered incorrectly
- Admin couldn't see all items

### After Fix
- Warehouse name correct: `"Warehouse"`
- Backend recognizes as main admin warehouse
- No filtering applied for admin
- Admin can see all items

## Related Fixes

This fix works together with the previous backend fix:

```javascript
// backend/controllers/ItemGroupController.js
const isMainWarehouse = warehouse === "Warehouse" || 
                       warehouse === "Warehouse Branch" || 
                       warehouse === "WAREHOUSE";
```

Now:
1. Frontend correctly generates `"Warehouse"` (not `"arehouse Branch"`)
2. Backend recognizes `"Warehouse"` as main admin warehouse
3. No filtering applied
4. All items visible

## Files Modified

1. `frontend/src/pages/ShoeSalesItemGroupDetail.jsx` - Fixed regex pattern

## Testing

### Test Case 1: Warehouse Admin
1. Login with locCode 858 (Warehouse)
2. ✅ Warehouse name: "Warehouse" (not "arehouse Branch")
3. ✅ See all items in all groups
4. ✅ No warehouse filtering applied

### Test Case 2: Branch with Prefix
1. Login from "G.Kottayam" (locCode 701)
2. ✅ Warehouse name: "Kottayam Branch"
3. ✅ See only items with stock in Kottayam Branch
4. ✅ Filtering works correctly

### Test Case 3: Branch with Dash Prefix
1. Login from "SG-Trivandrum" (locCode 700)
2. ✅ Warehouse name: "Trivandrum Branch"
3. ✅ Prefix removed correctly
4. ✅ Filtering works correctly

## Summary

The bug was caused by an overly broad regex that removed the first letter from any location name. The fix makes the regex more specific to only remove actual prefixes (letters followed by dot or dash), preserving warehouse names like "Warehouse" intact.
