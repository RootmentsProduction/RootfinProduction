# Invoice Return Status - Quick Guide

## What Changed?
Invoices now track whether they've been returned and prevent fully returned invoices from being returned again.

## Return Status Types

### 1. No Return (Default)
- Invoice has never been returned
- Return button is active and clickable
- User can return items

### 2. Partially Returned
- Some items have been returned
- Some items still remain on the invoice
- Return button is still active
- User can return more items

### 3. Fully Returned
- All items have been returned
- No items remain on the invoice
- Return button is disabled (grayed out)
- User cannot return the invoice again

## Visual Indicators

### Invoice Header
```
Invoice #INV-001                          (No return)
Invoice #INV-001 [PARTIALLY RETURNED]     (Partial return)
Invoice #INV-001 [FULLY RETURNED]         (Full return)
```

### Return Button
```
[↩ Return]                    (Active - can return)
[↩ Return] (grayed out)       (Disabled - cannot return)
```

## How to Return an Invoice

### Step 1: Open Invoice
1. Go to Sales → Invoices
2. Click on an invoice to open it

### Step 2: Check Return Status
- Look at the invoice header
- If it says "FULLY RETURNED", you cannot return it again
- If no status badge, or shows "PARTIALLY RETURNED", you can return

### Step 3: Click Return Button
- Click the red "↩ Return" button
- If disabled, hover over it to see why

### Step 4: Select Items to Return
- Check the items you want to return
- Enter return quantity for each item
- Provide a reason for return

### Step 5: Create Return Invoice
- Click "Create Return Invoice"
- System creates a return invoice with negative amounts
- Original invoice is updated with remaining quantities

### Step 6: Check Status
- If all items returned → Status shows "FULLY RETURNED"
- If some items remain → Status shows "PARTIALLY RETURNED"
- Return button becomes disabled if fully returned

## Examples

### Example 1: Partial Return
```
Original Invoice: INV-001
Items: Shoes (5), Socks (10)

Return 2 Shoes
↓
Return Invoice: RTN-INV-001 (2 Shoes)
Original Invoice: INV-001 [PARTIALLY RETURNED] (3 Shoes, 10 Socks)
Return Button: Still Active ✓
```

### Example 2: Full Return
```
Original Invoice: INV-001
Items: Shoes (5), Socks (10)

Return 5 Shoes + 10 Socks
↓
Return Invoice: RTN-INV-001 (5 Shoes, 10 Socks)
Original Invoice: INV-001 [FULLY RETURNED] (0 items)
Return Button: Disabled ✗
```

### Example 3: Multiple Partial Returns
```
Original Invoice: INV-001
Items: Shoes (5), Socks (10)

First Return: 2 Shoes
↓
Original Invoice: INV-001 [PARTIALLY RETURNED] (3 Shoes, 10 Socks)
Return Button: Still Active ✓

Second Return: 3 Shoes + 5 Socks
↓
Original Invoice: INV-001 [PARTIALLY RETURNED] (0 Shoes, 5 Socks)
Return Button: Still Active ✓

Third Return: 5 Socks
↓
Original Invoice: INV-001 [FULLY RETURNED] (0 items)
Return Button: Disabled ✗
```

## Preventing Accidental Returns

### Protection 1: Visual Badge
- "FULLY RETURNED" badge clearly shows invoice status
- Easy to see at a glance

### Protection 2: Disabled Button
- Return button is grayed out
- Cannot be clicked
- Prevents accidental clicks

### Protection 3: Tooltip
- Hover over disabled button
- Shows message: "This invoice has been fully returned and cannot be returned again"

### Protection 4: Alert Message
- If user tries to return fully returned invoice
- Alert shows: "This invoice has already been fully returned and cannot be returned again."

## FAQ

**Q: Can I return a partially returned invoice?**
A: Yes, you can return more items from a partially returned invoice. The return button remains active.

**Q: What if I made a mistake and returned too much?**
A: You would need to create a separate "Return Reversal" invoice (future feature). For now, contact support.

**Q: Can I see which items were returned?**
A: Yes, check the return invoice (RTN-INV-001). It shows all returned items with negative amounts.

**Q: What happens to the original invoice after return?**
A: The original invoice is updated to show only remaining items. If all items are returned, it shows as empty with "FULLY RETURNED" status.

**Q: Can I return items from a fully returned invoice?**
A: No, the return button is disabled. You cannot return a fully returned invoice.

**Q: How do I know if an invoice has been returned?**
A: Look for the status badge in the invoice header:
- "FULLY RETURNED" = All items returned
- "PARTIALLY RETURNED" = Some items returned
- No badge = Not returned

## Status Flow

```
Invoice Created
    ↓
[No Status Badge]
Return Button: Active ✓
    ↓
User Returns Some Items
    ↓
[PARTIALLY RETURNED]
Return Button: Active ✓
    ↓
User Returns More Items
    ↓
[PARTIALLY RETURNED]
Return Button: Active ✓
    ↓
User Returns All Remaining Items
    ↓
[FULLY RETURNED]
Return Button: Disabled ✗
```

## Technical Details

### Database Field
- Field: `returnStatus`
- Type: String
- Values: "none", "partial", "full"
- Default: "none"

### Status Update Logic
- When return is processed:
  - If `updatedLineItems.length > 0` → `returnStatus = "partial"`
  - If `updatedLineItems.length === 0` → `returnStatus = "full"`

### Return Prevention
- Check: `if (invoice?.returnStatus === "full")`
- Action: Disable return button and show alert
