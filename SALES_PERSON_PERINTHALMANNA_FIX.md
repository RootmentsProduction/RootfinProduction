# Sales Person Not Adding in Perinthalmanna Branch - Fix

## Problems Fixed

### 1. Branch Name Mismatch
**Issue**: The branch was being stored as "GPerinthalmanna" (without dash or dot) but the mapping expected "G-Perinthalmanna" or "G.Perinthalmanna"

**Solution**: Added all username variations (without dash/dot) to the `branchToLocCodeMap`:
- "GPerinthalmanna" → "709"
- "GEdappally" → "702"
- "GKottayam" → "701"
- And all other branches with similar variations

### 2. Alert Function Not Available
**Issue**: `alert()` function calls were throwing `TypeError: alert is not a function` in React context

**Solution**: Replaced all `alert()` calls with `showStockAlert()` which uses React state for proper UI alerts:
- `alert("message")` → `showStockAlert("message", 'error')`
- All error messages now display in the UI alert component instead of browser alert

### 3. Missing Store for Location Code
**Issue**: When a user selected a branch, the system tried to fetch sales persons from a store that didn't exist in PostgreSQL

**Solution**: Modified the `useEffect` hook to automatically create a store when a branch is selected:
1. Check if store exists for the location code
2. If not (404), automatically create it
3. Then fetch sales persons

## Root Cause Analysis
The issue was a combination of three problems:
1. User's `storeName` was "GPerinthalmanna" (username format)
2. Branch mapping only had "G-Perinthalmanna" and "G.Perinthalmanna"
3. When trying to add a sales person, the code used `alert()` which isn't available in React
4. Store didn't exist for location code 709 yet

## Changes Made
**File: `frontend/src/pages/SalesInvoiceCreate.jsx`**

1. **Updated branchToLocCodeMap** (lines 742-800):
   - Added username variations for all branches (without dash/dot)
   - Now supports: "G-Perinthalmanna", "G.Perinthalmanna", and "GPerinthalmanna"

2. **Replaced all alert() calls** with `showStockAlert()`:
   - handleAddSalesPerson function
   - handleAddBulkItems function
   - handleSubmit function
   - handleBulkScan function
   - handleSaveNewTax function
   - And all other validation functions

3. **Added automatic store creation** in useEffect (lines 2056-2150):
   - Ensures store exists before fetching sales persons
   - Creates store if it doesn't exist (404)
   - Handles conflicts gracefully (409)

## Testing
To verify the fix works:
1. Log in as a user with `storeName: "GPerinthalmanna"` and `locCode: 709`
2. Navigate to SalesInvoiceCreate
3. Branch should automatically be set to "GPerinthalmanna"
4. Check browser console - should see:
   - `📦 Creating store for branch: GPerinthalmanna (locCode: 709)`
   - `✨ Store created successfully: GPerinthalmanna (ID: ...)`
   - `Found X sales persons for GPerinthalmanna`
5. Sales persons dropdown should show available sales persons
6. Try adding a new sales person - should work without alert errors

## Related Files
- `frontend/src/pages/SalesInvoiceCreate.jsx` - Main fix
- `backend/controllers/StoreController.js` - Store creation endpoint
- `backend/controllers/SalesPersonController.js` - Sales person fetching endpoint

## Notes
- The fix is backward compatible - all existing branch name formats still work
- Store creation is idempotent - creating a store that already exists returns 409 (conflict), which is handled gracefully
- All error messages now display in the UI instead of browser alerts
- The solution works for all branches, not just Perinthalmanna
