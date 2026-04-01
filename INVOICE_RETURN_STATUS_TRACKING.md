# Invoice Return Status Tracking

## Overview
Invoices now track their return status to prevent fully returned invoices from being returned again. When an invoice is returned, it's marked as either "Partially Returned" or "Fully Returned" and displays this status prominently.

## Features

### 1. Return Status Tracking
- **none**: Invoice has not been returned (default)
- **partial**: Some items have been returned, but items remain on the invoice
- **full**: All items have been returned, invoice is completely returned

### 2. Visual Status Indicators
- **Fully Returned**: Red badge with "FULLY RETURNED" label
- **Partially Returned**: Orange badge with "PARTIALLY RETURNED" label
- **No Return**: No badge displayed

### 3. Return Prevention
- Fully returned invoices cannot be returned again
- Return button is disabled and grayed out for fully returned invoices
- Tooltip explains why the button is disabled
- Alert message prevents accidental return attempts

## Changes Made

### Backend

#### 1. SalesInvoice Model (`backend/model/SalesInvoice.js`)
Added `returnStatus` field to track return state:
```javascript
returnStatus: {
  type: String,
  enum: ["none", "partial", "full"],
  default: "none",
}
```

### Frontend

#### 1. SalesInvoiceDetail Component (`frontend/src/pages/SalesInvoiceDetail.jsx`)

**Change 1: Prevent return of fully returned invoices**
```javascript
const handleOpenReturnModal = () => {
  // Check if invoice is already fully returned
  if (invoice?.returnStatus === "full") {
    alert("This invoice has already been fully returned and cannot be returned again.");
    return;
  }
  // ... rest of logic
}
```

**Change 2: Update return status when processing returns**
```javascript
// If items remain after return
returnStatus: "partial"

// If all items are returned
returnStatus: "full"
```

**Change 3: Disable return button for fully returned invoices**
```jsx
<button
  onClick={handleOpenReturnModal}
  disabled={invoice?.returnStatus === "full"}
  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white border rounded-md ${
    invoice?.returnStatus === "full"
      ? "bg-gray-400 border-gray-400 cursor-not-allowed opacity-60"
      : "bg-[#ef4444] border-[#ef4444] hover:bg-[#dc2626]"
  }`}
  title={invoice?.returnStatus === "full" ? "This invoice has been fully returned and cannot be returned again" : ""}
>
  ↩ Return
</button>
```

**Change 4: Display return status badge in header**
```jsx
{invoice?.returnStatus === "full" && (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
    FULLY RETURNED
  </span>
)}
{invoice?.returnStatus === "partial" && (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
    PARTIALLY RETURNED
  </span>
)}
```

## How It Works

### Return Flow

1. **User initiates return**
   - Clicks "Return" button on invoice
   - System checks if invoice is fully returned
   - If fully returned, shows error and prevents return

2. **User selects items to return**
   - Selects quantities for each returnable item
   - Provides return reason
   - Clicks "Create Return Invoice"

3. **Return is processed**
   - Return invoice is created with negative amounts
   - Original invoice is updated:
     - If items remain: `returnStatus = "partial"`
     - If all items returned: `returnStatus = "full"`
   - Stock is reversed for returned items

4. **Invoice displays return status**
   - Badge shows "FULLY RETURNED" or "PARTIALLY RETURNED"
   - Return button is disabled if fully returned
   - User cannot return the invoice again

### Status Determination

**Partial Return:**
- Some items are returned
- Some items remain on the invoice
- `updatedLineItems.length > 0`
- Status: `"partial"`

**Full Return:**
- All items are returned
- No items remain on the invoice
- `updatedLineItems.length === 0`
- Status: `"full"`

## User Experience

### Before Return
```
Invoice #INV-001
[Return Button - Active]
```

### After Partial Return
```
Invoice #INV-001 [PARTIALLY RETURNED]
[Return Button - Active]
```

### After Full Return
```
Invoice #INV-001 [FULLY RETURNED]
[Return Button - Disabled]
```

## Testing Checklist

- [ ] Create invoice with returnable items
- [ ] Return some items → invoice shows "PARTIALLY RETURNED"
- [ ] Try to return more items → return button still works
- [ ] Return remaining items → invoice shows "FULLY RETURNED"
- [ ] Try to return fully returned invoice → error message shown
- [ ] Return button is disabled and grayed out
- [ ] Tooltip explains why button is disabled
- [ ] Refresh page → status persists
- [ ] Check invoice list → status visible in list view

## Database Migration

For existing invoices without `returnStatus`:
- Default value is `"none"`
- No migration needed
- Existing invoices can be returned normally
- Status will be set when return is processed

## Future Enhancements

1. **Return History**
   - Show all returns for an invoice
   - Display return dates and amounts
   - Track return reasons

2. **Partial Return Tracking**
   - Show which items were returned
   - Display return quantities per item
   - Calculate remaining quantities

3. **Return Reversal**
   - Allow reversing a return (if needed)
   - Create reverse return invoice
   - Update status back to "none" or "partial"

4. **Return Reports**
   - Report on fully returned invoices
   - Track return reasons
   - Analyze return patterns

## Files Modified

1. `backend/model/SalesInvoice.js` - Added returnStatus field
2. `frontend/src/pages/SalesInvoiceDetail.jsx` - Added return status logic and UI
