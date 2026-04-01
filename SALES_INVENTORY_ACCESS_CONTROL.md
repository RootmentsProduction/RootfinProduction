# Sales & Inventory Access Control Implementation

## Summary
Implemented access control for Sales and Inventory sections to limit visibility to specific test stores during the rollout phase.

## What Was Done

### 1. Created Configuration File
**File**: `frontend/src/config/salesInventoryAccess.json`

Contains a list of allowed store emails:
- Suitorguymgroad@gmail.com (MG Road)
- suitorguy.trivandrum@gmail.com (Trivandrum)
- groomsweddinghubkannur@gmail.com (Kannur)
- groomsweddinghubperinthalmanna@gmail.com (Perinthalmanna)

### 2. Updated Navigation Component
**File**: `frontend/src/components/Nav.jsx`

Added logic to:
- Import the access configuration
- Check user's email against allowed list (case-insensitive)
- Conditionally render Sales and Inventory menu sections

### 3. Created Documentation
**File**: `frontend/src/config/README.md`

Comprehensive guide on how to:
- Add new stores to the allowed list
- Remove stores from the allowed list
- Enable for all stores after testing
- Test the implementation

## Access Control Logic

### Who Can See Sales & Inventory Sections:

1. **Admin Users** (`power: 'admin'`)
   - ✅ Always have access
   - ✅ No restrictions
   - ❌ Do NOT see BETA badge (they have full access anyway)

2. **Test Store Users** (in allowed list)
   - ✅ Have access during testing phase
   - ✅ See BETA badge in header
   - 📧 Must be in `salesInventoryAccess.json`

3. **Other Store Users** (not in allowed list)
   - ❌ Cannot see Sales & Inventory menu items
   - ❌ No access until testing is complete

### Code Logic:
```javascript
// In Nav.jsx
const isAdmin = currentuser?.power === 'admin';
const isInAllowedList = salesInventoryAccessConfig.allowedEmails
    .map(email => email.toLowerCase())
    .includes(userEmail);
const hasSalesInventoryAccess = isAdmin || isInAllowedList;

// In Header.jsx (for BETA badge)
const hasBetaAccess = !isAdmin && isInBetaList; // Only non-admin testers
```

## Testing the Implementation

### For Admin Users (Should Always See Sales & Inventory):
1. Login with admin account (any email with `power: 'admin'`)
2. Check sidebar navigation

**Expected**: 
- ✅ Sales menu visible
- ✅ Inventory menu visible
- ❌ NO BETA badge in header (admin has full access)

### For Allowed Test Stores (Should See Sales & Inventory with BETA):
1. Login with: `Suitorguymgroad@gmail.com`
2. Login with: `suitorguy.trivandrum@gmail.com`
3. Login with: `groomsweddinghubkannur@gmail.com`
4. Login with: `groomsweddinghubperinthalmanna@gmail.com`

**Expected**: 
- ✅ Sales menu visible
- ✅ Inventory menu visible
- ✅ BETA badge visible in header (animated)

### For Other Stores (Should NOT See Sales & Inventory):
1. Login with any other store email (not admin, not in allowed list)
2. Check sidebar navigation

**Expected**: 
- ❌ Sales menu hidden
- ❌ Inventory menu hidden
- ❌ NO BETA badge in header

## Easy Management

### To Add More Stores:
Edit `frontend/src/config/salesInventoryAccess.json`:
```json
{
  "allowedEmails": [
    "Suitorguymgroad@gmail.com",
    "suitorguy.trivandrum@gmail.com",
    "groomsweddinghubkannur@gmail.com",
    "groomsweddinghubperinthalmanna@gmail.com",
    "newstore@gmail.com"  // Add here
  ]
}
```

### To Remove Stores:
Simply delete the email from the array in the same file.

### To Enable for All Stores:
When testing is complete, you can either:
1. Add all store emails to the config, OR
2. Remove the `hasSalesInventoryAccess` condition from Nav.jsx

## Benefits

✅ **Easy to manage**: Single JSON file for all access control
✅ **No code changes needed**: Just edit the JSON file to add/remove stores
✅ **Safe rollout**: Test with 4 stores before full deployment
✅ **Case-insensitive**: Works regardless of email capitalization
✅ **Well documented**: Clear instructions for future updates

## Files Modified

1. ✅ `frontend/src/config/salesInventoryAccess.json` (NEW)
2. ✅ `frontend/src/components/Nav.jsx` (MODIFIED)
3. ✅ `frontend/src/config/README.md` (NEW)
4. ✅ `SALES_INVENTORY_ACCESS_CONTROL.md` (NEW - this file)

## Next Steps

1. Test with the 4 allowed stores
2. Gather feedback
3. Add more stores to the allowed list as needed
4. Once stable, enable for all stores
