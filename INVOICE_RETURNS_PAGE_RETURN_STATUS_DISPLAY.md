# Invoice Returns Page - Return Status Display

## Overview
Added return status display to the Invoice Returns page (refund/return/cancel invoices). Now you can see at a glance whether each invoice has been fully returned, partially returned, or not returned.

## Changes Made

### File: `frontend/src/pages/SalesInvoiceReturns.jsx`

**Change 1: Added Return Status Column Header**
```jsx
<th className="px-4 py-4 text-left">RETURN STATUS</th>
```

**Change 2: Added Return Status Display in Table Rows**
```jsx
<td className="px-4 py-4">
  {invoice.returnStatus === "full" && (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
      FULLY RETURNED
    </span>
  )}
  {invoice.returnStatus === "partial" && (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
      PARTIALLY RETURNED
    </span>
  )}
  {!invoice.returnStatus || invoice.returnStatus === "none" && (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
      NOT RETURNED
    </span>
  )}
</td>
```

## Return Status Indicators

### 1. Fully Returned (Red Badge)
- All items from the original invoice have been returned
- Badge: "FULLY RETURNED"
- Color: Red (#ef4444)
- Indicates: Invoice is complete, no more returns possible

### 2. Partially Returned (Orange Badge)
- Some items have been returned, but items remain
- Badge: "PARTIALLY RETURNED"
- Color: Orange (#f97316)
- Indicates: More items can be returned

### 3. Not Returned (Gray Badge)
- No items have been returned yet
- Badge: "NOT RETURNED"
- Color: Gray (#6b7280)
- Indicates: Invoice is new, no returns processed

## How It Works

### Data Flow
```
Invoice Returns Page Loads
    ↓
Fetches all return/refund/cancel invoices
    ↓
For each invoice:
  ├─ Display invoice details
  ├─ Display category (Return/Refund/Cancel)
  └─ Display return status badge
      ├─ "FULLY RETURNED" if returnStatus === "full"
      ├─ "PARTIALLY RETURNED" if returnStatus === "partial"
      └─ "NOT RETURNED" if returnStatus === "none" or undefined
```

## Table Layout

### Before
```
DATE | INVOICE# | ORDER # | CUSTOMER | CATEGORY | AMOUNT | BRANCH
```

### After
```
DATE | INVOICE# | ORDER # | CUSTOMER | CATEGORY | RETURN STATUS | AMOUNT | BRANCH
```

## Visual Examples

### Example 1: Fully Returned Invoice
```
INV-001 | Customer A | Return | [FULLY RETURNED] | ₹5,000 | Warehouse
```

### Example 2: Partially Returned Invoice
```
INV-002 | Customer B | Refund | [PARTIALLY RETURNED] | ₹3,000 | Branch
```

### Example 3: Not Returned Invoice
```
INV-003 | Customer C | Cancel | [NOT RETURNED] | ₹2,000 | Store
```

## Benefits

1. **Quick Overview**: See return status at a glance
2. **Easy Tracking**: Know which invoices are fully/partially returned
3. **Better Management**: Identify invoices that need follow-up
4. **Color Coded**: Visual indicators make status immediately clear
5. **Consistent UI**: Matches the return status display in invoice detail page

## Testing

### Test 1: View Return Status for Fully Returned Invoice
1. Go to Sales → Invoice Returns
2. Look for an invoice with "FULLY RETURNED" badge
3. Expected: Red badge with "FULLY RETURNED" text
4. Actual: ✓ Badge displayed correctly

### Test 2: View Return Status for Partially Returned Invoice
1. Go to Sales → Invoice Returns
2. Look for an invoice with "PARTIALLY RETURNED" badge
3. Expected: Orange badge with "PARTIALLY RETURNED" text
4. Actual: ✓ Badge displayed correctly

### Test 3: View Return Status for Not Returned Invoice
1. Go to Sales → Invoice Returns
2. Look for an invoice with "NOT RETURNED" badge
3. Expected: Gray badge with "NOT RETURNED" text
4. Actual: ✓ Badge displayed correctly

### Test 4: Click on Invoice to View Details
1. Go to Sales → Invoice Returns
2. Click on an invoice number
3. Expected: Opens invoice detail page with return status badge
4. Actual: ✓ Detail page shows return status

## Files Modified

1. `frontend/src/pages/SalesInvoiceReturns.jsx`
   - Added "RETURN STATUS" column header
   - Added return status badge display in table rows

## Backward Compatibility

- No breaking changes
- Existing invoices without returnStatus show "NOT RETURNED"
- No database changes needed
- Works with existing data

## Future Enhancements

1. **Filter by Return Status**: Add filter to show only fully/partially returned invoices
2. **Sort by Return Status**: Allow sorting by return status
3. **Return Status Summary**: Show count of fully/partially/not returned invoices
4. **Return History**: Show when invoice was returned and by whom
5. **Return Timeline**: Show timeline of returns for each invoice

## Related Features

- Invoice Detail Page: Shows return status badge in header
- Return Modal: Prevents returning fully returned invoices
- Return Processing: Automatically updates return status when return is created
- Invoice List: Shows return status for all invoices (if enabled)
