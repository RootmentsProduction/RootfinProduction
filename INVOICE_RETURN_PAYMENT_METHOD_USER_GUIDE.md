# Invoice Return Payment Method - User Guide

## How to Return an Invoice with Payment Method Selection

### Step 1: Open the Invoice
1. Navigate to **Sales > Invoices**
2. Click on the invoice you want to return
3. Click the **"↩ Return"** button in the top right

### Step 2: Return Modal Opens
You will see a modal with the following sections:

#### Original Invoice Information
- Shows the invoice number and customer name

#### Return Reason (Required)
- Enter the reason for the return
- Examples: "Damaged product", "Wrong size", "Customer request"

#### **NEW: Refund Payment Method (Required)**
Select how you want to refund the customer:
- **○ Cash** - Refund will be given in cash
- **○ RBL** - Refund will be processed through RBL/online payment

**Default**: Cash is selected by default

**Important**: This selection determines which column the refund amount appears in the Daybook and Financial Summary reports.

#### Select Items to Return
- Choose which items to return
- Enter the quantity for each item
- Only returnable items can be selected
- See the refund amount for each item

#### Return Summary
- Shows total items being returned
- Shows total refund amount (with taxes included)

### Step 3: Submit the Return
1. Ensure you have:
   - ✓ Entered a return reason
   - ✓ Selected a payment method (Cash or RBL)
   - ✓ Selected at least one item with quantity > 0
2. Click **"Create Return Invoice"**

### Step 4: Confirmation
You will see a success message showing:
- Return invoice number (starts with RTN-)
- Whether the original invoice was updated or fully returned
- Where to view the return invoice

## Where to See the Return

### Invoice Returns Page
- Go to **Sales > Invoice Returns**
- Find your return invoice (RTN-XXX)
- View full details

### Daybook Report
- Go to **Home** (Daybook)
- Select the date range
- Look for the return transaction
- **Cash Return**: Amount appears in the **Cash** column (negative)
- **RBL Return**: Amount appears in the **RBL** column (negative)

### Financial Summary Report
- Go to **Financial Summary**
- Select the date range
- Look for the return transaction
- **Cash Return**: Amount appears in the **Cash** column (negative)
- **RBL Return**: Amount appears in the **RBL** column (negative)

## Example Scenarios

### Scenario 1: Customer Returns Item for Cash Refund
1. Customer returns a shoe worth ₹1,050 (including tax)
2. You select **Cash** as payment method
3. Return invoice created: RTN-INV-001
4. In Daybook:
   - Cash column shows: **-₹1,050.00**
   - RBL column shows: ₹0.00

### Scenario 2: Customer Returns Item for RBL Refund
1. Customer returns a shoe worth ₹1,050 (including tax)
2. You select **RBL** as payment method
3. Return invoice created: RTN-INV-001
4. In Daybook:
   - Cash column shows: ₹0.00
   - RBL column shows: **-₹1,050.00**

### Scenario 3: Partial Return
1. Original invoice has 3 items
2. Customer returns 1 item worth ₹1,050
3. You select **Cash** as payment method
4. Results:
   - Original invoice updated to show 2 remaining items
   - Return invoice created for 1 item
   - Cash column in Daybook shows: **-₹1,050.00**

## Important Notes

### Payment Method Selection
- **Required**: You must select a payment method before submitting
- **Cannot be changed**: Once the return is created, the payment method cannot be changed
- **Choose carefully**: Make sure to select the correct method based on how you're actually refunding the customer

### Negative Amounts
- Returns always show as **negative amounts** in reports
- This is correct - it represents money going out (refund)
- Example: -₹1,050.00 means you refunded ₹1,050

### RBL vs Cash
- **Cash**: Physical cash refund to customer
- **RBL**: Online/digital refund through RBL payment gateway
- Choose based on your actual refund method

### Financial Reports
- Both Daybook and Financial Summary will show the return
- The amount appears in the column matching your selected payment method
- Negative amounts reduce your daily totals (as expected for refunds)

## Troubleshooting

### "This invoice has no returnable items"
- The items in the invoice are not marked as returnable
- Go to product settings and enable "Returnable Item" option
- Then try returning the invoice again

### "This invoice has already been fully returned"
- The invoice has already been returned completely
- You cannot return it again
- Check Invoice Returns page to see the existing return

### Payment method not showing in reports
- Verify you selected the correct payment method in the return modal
- Check the return invoice details to confirm the payment method
- Refresh the Daybook/Financial Summary page

## Questions?

If you have questions about:
- Which payment method to select
- How returns affect your financial reports
- Troubleshooting return issues

Contact your system administrator or refer to the complete documentation.
