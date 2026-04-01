# Sales Report Payment Breakdown Fix

## Problem
The Payment Breakdown in the Sales Report was showing incorrect amounts for Cash, Bank, UPI, and RBL payments.

## Root Cause
The code was treating `paymentMethod` as a single string value, but invoices can have:
1. **Single payment**: `paymentMethod: "Cash"`
2. **Split payment**: `paymentMethod: ["Cash", "Bank"]`

When an invoice had split payments (array), the code couldn't match it against "Cash" or "Bank" strings, so those amounts weren't being counted in the payment breakdown.

### Example of the Bug:
```javascript
// OLD CODE (BROKEN):
const cash = parseFloat(invoice.paymentMethod === "Cash" ? invoice.finalTotal : 0);

// If invoice has: paymentMethod: ["Cash", "Bank"]
// This comparison fails: ["Cash", "Bank"] === "Cash" → false
// Result: Cash amount not counted!
```

## Solution
Modified the `getSalesSummary` function to:
1. **Detect payment method type** - Check if it's a string or array
2. **Handle split payments** - Divide amount equally among payment methods
3. **Normalize method names** - Handle case-insensitive matching

### New Logic:
```javascript
// Convert to array (handles both single and split payments)
const paymentMethods = Array.isArray(invoice.paymentMethod) 
  ? invoice.paymentMethod 
  : [invoice.paymentMethod];

// For split payments, divide amount equally
const amountPerMethod = amount / paymentMethods.length;

// Count each payment method
paymentMethods.forEach(method => {
  if (method.toLowerCase() === "cash") {
    totalCash += amountPerMethod;
  } else if (method.toLowerCase() === "bank") {
    totalBank += amountPerMethod;
  }
  // ... etc
});
```

## Changes Made

### File: `backend/controllers/SalesReportController.js`

**Lines ~395-425**: Replaced payment breakdown calculation logic

**Before:**
```javascript
const cash = parseFloat(invoice.paymentMethod === "Cash" ? invoice.finalTotal : 0) || 0;
const bank = parseFloat(invoice.paymentMethod === "Bank" ? invoice.finalTotal : 0) || 0;
const upi = parseFloat(invoice.paymentMethod === "UPI" ? invoice.finalTotal : 0) || 0;
const rbl = parseFloat(invoice.paymentMethod === "RBL" ? invoice.finalTotal : 0) || 0;

totalCash += cash;
totalBank += bank;
totalUPI += upi;
totalRBL += rbl;
```

**After:**
```javascript
// Handle both single payment method (string) and split payments (array)
const paymentMethods = Array.isArray(invoice.paymentMethod) 
  ? invoice.paymentMethod 
  : [invoice.paymentMethod];

// For split payments, divide amount equally among payment methods
const amountPerMethod = amount / paymentMethods.length;

// Count each payment method
paymentMethods.forEach(method => {
  const normalizedMethod = (method || "Cash").toString().trim();
  
  if (normalizedMethod.toLowerCase() === "cash") {
    totalCash += amountPerMethod;
  } else if (normalizedMethod.toLowerCase() === "bank") {
    totalBank += amountPerMethod;
  } else if (normalizedMethod.toLowerCase() === "upi") {
    totalUPI += amountPerMethod;
  } else if (normalizedMethod.toLowerCase() === "rbl") {
    totalRBL += amountPerMethod;
  } else {
    // Default to cash for unknown payment methods
    totalCash += amountPerMethod;
  }
});
```

## How It Works Now

### Example 1: Single Payment
**Invoice**: ₹1,000 paid by Cash
```
paymentMethod: "Cash"
→ totalCash += ₹1,000
```

### Example 2: Split Payment (2 methods)
**Invoice**: ₹1,000 paid by Cash + Bank
```
paymentMethod: ["Cash", "Bank"]
→ totalCash += ₹500
→ totalBank += ₹500
```

### Example 3: Split Payment (3 methods)
**Invoice**: ₹1,200 paid by Cash + Bank + UPI
```
paymentMethod: ["Cash", "Bank", "UPI"]
→ totalCash += ₹400
→ totalBank += ₹400
→ totalUPI += ₹400
```

### Example 4: Case Insensitive
**Invoice**: ₹500 paid by "CASH" or "cash"
```
paymentMethod: "CASH"
→ Normalized to lowercase
→ totalCash += ₹500
```

## Testing

### Test Case 1: Single Payment Methods
1. Create invoices with single payment methods:
   - Invoice 1: ₹1,000 - Cash
   - Invoice 2: ₹500 - Bank
   - Invoice 3: ₹300 - UPI
2. View Sales Report
3. **Expected Payment Breakdown**:
   - Cash: ₹1,000
   - Bank: ₹500
   - UPI: ₹300
   - RBL: ₹0

### Test Case 2: Split Payments
1. Create invoices with split payments:
   - Invoice 1: ₹1,000 - Cash + Bank
   - Invoice 2: ₹600 - Cash + UPI
2. View Sales Report
3. **Expected Payment Breakdown**:
   - Cash: ₹500 + ₹300 = ₹800
   - Bank: ₹500
   - UPI: ₹300
   - RBL: ₹0

### Test Case 3: Mixed Single and Split
1. Create mixed invoices:
   - Invoice 1: ₹1,000 - Cash (single)
   - Invoice 2: ₹600 - Cash + Bank (split)
   - Invoice 3: ₹400 - Bank (single)
2. View Sales Report
3. **Expected Payment Breakdown**:
   - Cash: ₹1,000 + ₹300 = ₹1,300
   - Bank: ₹300 + ₹400 = ₹700
   - UPI: ₹0
   - RBL: ₹0

## How to Test

1. **Restart the backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Navigate to**: Reports → Sales Report

3. **Select date range** with existing invoices

4. **Click "Generate Report"**

5. **Verify Payment Breakdown**:
   - Check that Cash, Bank, UPI, RBL amounts are correct
   - Total of all payment methods should equal Total Sales
   - Split payment invoices should be divided correctly

## Impact
- ✅ Payment breakdown now shows correct amounts
- ✅ Split payments are handled correctly
- ✅ Case-insensitive payment method matching
- ✅ Unknown payment methods default to Cash
- ✅ Total of payment methods equals Total Sales

## Related Files
- `backend/controllers/SalesReportController.js` - Main fix
- `frontend/src/pages/SalesReport.jsx` - Frontend (no changes needed)

## Notes
- Split payments are divided **equally** among payment methods
- If you need weighted split payments (e.g., 70% Cash, 30% Bank), you'll need to store payment amounts separately in the invoice model
- Unknown payment methods are counted as Cash by default
