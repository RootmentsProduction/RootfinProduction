# Test Script: Invoice Return Payment Method Selection

## Pre-requisites
- Backend server running
- Frontend application running
- At least one invoice with returnable items
- Access to Daybook and Financial Summary reports

## Test 1: Cash Return - Full Amount

### Setup
1. Navigate to Sales > Invoices
2. Find an invoice with returnable items (e.g., INV-001 for ₹1,050)
3. Note the invoice number and amount

### Steps
1. Click on the invoice to open details
2. Click the **"↩ Return"** button
3. Verify the return modal opens
4. In "Refund Payment Method" section:
   - Verify **Cash** is selected by default
   - Verify **RBL** option is also available
5. Enter return reason: "Test cash return"
6. Select all items with full quantities
7. Verify return summary shows correct amount
8. Click **"Create Return Invoice"**

### Expected Results
- ✅ Success message appears
- ✅ Return invoice number starts with "RTN-"
- ✅ Original invoice marked as "FULLY RETURNED"
- ✅ Navigate to Daybook
- ✅ Find return transaction (RTN-INV-001)
- ✅ **Cash column shows negative amount**: -₹1,050.00
- ✅ **RBL column shows**: ₹0.00
- ✅ Bank column shows: ₹0.00
- ✅ UPI column shows: ₹0.00
- ✅ Navigate to Financial Summary
- ✅ Same amounts displayed as Daybook

### Verification Query (MongoDB)
```javascript
db.transactions.findOne({ invoiceNo: "RTN-INV-001" })
// Expected:
{
  type: "Return",
  category: "Return",
  invoiceNo: "RTN-INV-001",
  paymentMethod: "cash",
  cash: "-1050.00",
  rbl: "0",
  bank: "0",
  upi: "0",
  amount: "-1050.00"
}
```

---

## Test 2: RBL Return - Full Amount

### Setup
1. Create a new invoice (INV-002 for ₹2,100)
2. Ensure items are returnable

### Steps
1. Open invoice INV-002
2. Click **"↩ Return"** button
3. In "Refund Payment Method" section:
   - Click **RBL** radio button
   - Verify it's selected (filled circle)
4. Enter return reason: "Test RBL return"
5. Select all items with full quantities
6. Verify return summary shows correct amount
7. Click **"Create Return Invoice"**

### Expected Results
- ✅ Success message appears
- ✅ Return invoice number: RTN-INV-002
- ✅ Original invoice marked as "FULLY RETURNED"
- ✅ Navigate to Daybook
- ✅ Find return transaction (RTN-INV-002)
- ✅ Cash column shows: ₹0.00
- ✅ **RBL column shows negative amount**: -₹2,100.00
- ✅ Bank column shows: ₹0.00
- ✅ UPI column shows: ₹0.00
- ✅ Navigate to Financial Summary
- ✅ Same amounts displayed as Daybook

### Verification Query (MongoDB)
```javascript
db.transactions.findOne({ invoiceNo: "RTN-INV-002" })
// Expected:
{
  type: "Return",
  category: "Return",
  invoiceNo: "RTN-INV-002",
  paymentMethod: "split",  // RBL uses "split"
  cash: "0",
  rbl: "-2100.00",
  bank: "0",
  upi: "0",
  amount: "-2100.00"
}
```

---

## Test 3: Partial Return - Cash

### Setup
1. Create invoice with 3 items (INV-003)
   - Item 1: ₹500
   - Item 2: ₹600
   - Item 3: ₹700
   - Total: ₹1,800 (before tax)

### Steps
1. Open invoice INV-003
2. Click **"↩ Return"** button
3. Select **Cash** payment method
4. Enter return reason: "Partial return - Item 1 only"
5. Select only Item 1 (₹500 + tax)
6. Set quantity to full amount
7. Verify return summary shows only Item 1 amount
8. Click **"Create Return Invoice"**

### Expected Results
- ✅ Success message appears
- ✅ Return invoice: RTN-INV-003
- ✅ Original invoice shows "PARTIALLY RETURNED" badge
- ✅ Original invoice updated to show only Item 2 and Item 3
- ✅ Navigate to Daybook
- ✅ Find return transaction (RTN-INV-003)
- ✅ **Cash column shows negative amount**: -₹525.00 (₹500 + 5% tax)
- ✅ **RBL column shows**: ₹0.00
- ✅ Navigate to Financial Summary
- ✅ Same amounts displayed

### Verification
- ✅ Open original invoice INV-003
- ✅ Verify only 2 items remain
- ✅ Verify total is reduced
- ✅ Verify "PARTIALLY RETURNED" status

---

## Test 4: Partial Return - RBL

### Setup
1. Use the same invoice from Test 3 (INV-003)
2. It should still have 2 items remaining

### Steps
1. Open invoice INV-003 again
2. Click **"↩ Return"** button
3. Select **RBL** payment method
4. Enter return reason: "Partial return - Item 2"
5. Select only Item 2 (₹600 + tax)
6. Set quantity to full amount
7. Click **"Create Return Invoice"**

### Expected Results
- ✅ Second return invoice created: RTN-INV-003-2 (or similar)
- ✅ Original invoice still shows "PARTIALLY RETURNED"
- ✅ Original invoice now shows only Item 3
- ✅ Navigate to Daybook
- ✅ Find second return transaction
- ✅ Cash column shows: ₹0.00
- ✅ **RBL column shows negative amount**: -₹630.00 (₹600 + 5% tax)

---

## Test 5: Validation Tests

### Test 5a: No Payment Method Selected (Should Not Happen)
1. Open invoice
2. Click Return
3. Try to submit without selecting payment method
4. **Expected**: Form validation prevents submission (radio button is required)

### Test 5b: No Return Reason
1. Open invoice
2. Click Return
3. Select payment method (Cash)
4. Select items
5. Leave return reason empty
6. Click submit
7. **Expected**: Alert "Please provide a reason for return"

### Test 5c: No Items Selected
1. Open invoice
2. Click Return
3. Select payment method (Cash)
4. Enter return reason
5. Don't select any items (all quantities = 0)
6. Click submit
7. **Expected**: Alert "Please select at least one item to return"

### Test 5d: Non-Returnable Items
1. Create invoice with non-returnable items
2. Try to return
3. **Expected**: Alert "This invoice has no returnable items..."

---

## Test 6: Report Totals Verification

### Setup
1. Create 3 invoices on the same day:
   - INV-A: ₹1,000 (Cash)
   - INV-B: ₹2,000 (RBL)
   - INV-C: ₹1,500 (Cash)
2. Return 2 invoices:
   - RTN-INV-A: ₹1,000 (Cash return)
   - RTN-INV-B: ₹2,000 (RBL return)

### Expected Daybook Totals
```
Opening Cash: ₹5,000
Opening RBL: ₹0

Transactions:
+ INV-A: Cash +₹1,000
+ INV-B: RBL +₹2,000
+ INV-C: Cash +₹1,500
- RTN-INV-A: Cash -₹1,000
- RTN-INV-B: RBL -₹2,000

Closing Cash: ₹5,000 + ₹1,000 + ₹1,500 - ₹1,000 = ₹6,500
Closing RBL: ₹0 + ₹2,000 - ₹2,000 = ₹0
```

### Verification Steps
1. Navigate to Daybook
2. Select today's date
3. Verify Cash column total: ₹6,500
4. Verify RBL column total: ₹0
5. Navigate to Financial Summary
6. Verify same totals

---

## Test 7: Edge Cases

### Test 7a: Return Already Returned Invoice
1. Open a fully returned invoice
2. Try to click Return button
3. **Expected**: Button is disabled OR alert "already been fully returned"

### Test 7b: Return with Taxes and Discounts
1. Create invoice with:
   - Subtotal: ₹1,000
   - Discount: 10% (-₹100)
   - Tax: 5% (₹45 on ₹900)
   - Final: ₹945
2. Return with Cash
3. **Expected**: Cash column shows -₹945.00 (exact final total)

### Test 7c: Return with TDS
1. Create invoice with TDS deduction
2. Return with RBL
3. **Expected**: Return amount includes proportional TDS calculation

---

## Test 8: Cross-Browser Testing

### Browsers to Test
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### For Each Browser
1. Open return modal
2. Verify radio buttons display correctly
3. Verify radio button selection works
4. Verify form submission works
5. Verify reports display correctly

---

## Test 9: Mobile Responsiveness

### Device Sizes to Test
- [ ] Mobile (375px)
- [ ] Tablet (768px)
- [ ] Desktop (1920px)

### For Each Size
1. Open return modal
2. Verify payment method section is readable
3. Verify radio buttons are clickable
4. Verify form is usable
5. Verify reports are readable

---

## Test 10: Performance Test

### Scenario
1. Create 100 invoices
2. Return 50 of them (25 Cash, 25 RBL)
3. Open Daybook
4. Verify page loads in < 3 seconds
5. Verify all transactions display correctly
6. Verify totals are accurate

---

## Regression Tests

### Ensure Existing Functionality Still Works
- [ ] Create regular invoice (non-return)
- [ ] Edit invoice
- [ ] Delete invoice (non-return)
- [ ] Print invoice
- [ ] Send invoice via WhatsApp
- [ ] View invoice list
- [ ] Search invoices
- [ ] Filter invoices by date
- [ ] Export Daybook to CSV
- [ ] Export Financial Summary to CSV

---

## Bug Report Template

If you find issues, report using this format:

```
**Test Case**: Test 2 - RBL Return
**Expected**: RBL column shows -₹2,100.00
**Actual**: RBL column shows ₹0.00
**Steps to Reproduce**:
1. Open invoice INV-002
2. Click Return
3. Select RBL
4. Submit return
5. Check Daybook

**Browser**: Chrome 120
**Date**: 2025-01-16
**Screenshots**: [attach]
```

---

## Success Criteria

All tests must pass with:
- ✅ No console errors
- ✅ Correct amounts in correct columns
- ✅ Negative amounts for returns
- ✅ Proper invoice status updates
- ✅ Accurate report totals
- ✅ Smooth user experience
- ✅ No data loss
- ✅ Proper validation messages

---

## Sign-Off

**Tester Name**: _______________
**Date**: _______________
**Result**: PASS / FAIL
**Notes**: _______________
