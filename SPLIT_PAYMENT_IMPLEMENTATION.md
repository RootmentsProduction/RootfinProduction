# Split Payment Implementation

## Overview
Added split payment functionality to invoice creation that allows users to distribute payment amounts across Cash, Bank, UPI, and RBL methods.

## Features Implemented

### Frontend (SalesInvoiceCreate.jsx)
1. **Split Payment Checkbox**: "Split Payment (Cash + Bank + Upi + Rbl)"
2. **Dynamic UI**: When checked, shows four input fields for Cash, Bank, UPI, and RBL amounts
3. **State Management**: 
   - `isSplitPayment`: Boolean to track if split payment is enabled
   - `splitPaymentAmounts`: Object with cash, bank, upi, rbl amounts
4. **Conditional Display**: Regular payment method checkboxes hidden when split payment is active
5. **Form Submission**: Split payment data included in invoice creation/update

### Backend (SalesInvoiceController.js)
1. **Enhanced Payment Allocation**: Updated `allocatePaymentAmounts()` function to handle split payments
2. **Split Payment Logic**: When `isSplitPayment` is true, uses individual amounts from `splitPaymentAmounts`
3. **Backward Compatibility**: Existing single payment method logic preserved
4. **Return/Refund Support**: Split payments work with negative amounts for returns

### Database Models
1. **MongoDB (SalesInvoice.js)**:
   - `isSplitPayment`: Boolean field
   - `splitPaymentAmounts`: Object with cash, bank, upi, rbl string fields

2. **PostgreSQL (SalesInvoice.js)**:
   - `isSplitPayment`: Boolean field with default false
   - `splitPaymentAmounts`: JSON field with default structure

## How It Works

### Invoice Creation
1. User checks "Split Payment" checkbox
2. Four input fields appear for Cash, Bank, UPI, RBL amounts
3. User enters desired amounts for each payment method
4. On save, amounts are sent to backend with `isSplitPayment: true`
5. Backend allocates amounts to appropriate transaction columns

### Daybook & Financial Summary
- Split payment amounts appear in their respective columns (Cash, Bank, UPI, RBL)
- Existing logic for Daybook and Financial Summary reports unchanged
- Amounts flow through the same transaction creation process

### Edit Mode
- When editing an invoice with split payment, checkbox is pre-checked
- Split payment amounts are loaded into the input fields
- User can modify amounts or disable split payment

## UI Flow
```
┌─────────────────────────────────────────────────────────┐
│ Payment Method                                          │
├─────────────────────────────────────────────────────────┤
│ ☑ Split Payment (Cash + Bank + Upi + Rbl)             │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┬─────────────┬──────────┬─────────────┐ │
│ │Cash Amount  │Bank Amount  │UPI Amount│RBL Amount   │ │
│ │[    100    ]│[    200    ]│[   300  ]│[    400    ]│ │
│ └─────────────┴─────────────┴──────────┴─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Technical Details

### Payment Allocation Logic
```javascript
if (invoice.isSplitPayment && invoice.splitPaymentAmounts) {
  cash = splitAmounts.cash || "0";
  bank = splitAmounts.bank || "0"; 
  upi = splitAmounts.upi || "0";
  rbl = splitAmounts.rbl || "0";
  paymentMethodForTransaction = "split";
}
```

### Data Structure
```javascript
// Frontend State
{
  isSplitPayment: true,
  splitPaymentAmounts: {
    cash: "100",
    bank: "200", 
    upi: "300",
    rbl: "400"
  }
}

// Database Storage
{
  isSplitPayment: true,
  splitPaymentAmounts: {
    cash: "100",
    bank: "200",
    upi: "300",
    rbl: "400"
  }
}
```

## Benefits
1. **Flexible Payment Options**: Customers can pay using multiple methods including RBL
2. **Accurate Reporting**: Each payment method tracked separately in reports
3. **Backward Compatible**: Existing invoices and logic unaffected
4. **User Friendly**: Simple checkbox interface with clear input fields
5. **Consistent Data Flow**: Uses existing transaction creation pipeline

## Testing
- Create invoice with split payment enabled
- Verify amounts appear in correct columns in Daybook (Cash, Bank, UPI, RBL)
- Verify amounts appear in correct columns in Financial Summary
- Test edit mode with split payment data
- Test returns/refunds with split payment