# Booking & RentOut Data Flow Logic

## Overview
This document explains how Booking and RentOut data flows from external APIs to display in the Financial Summary (Day Book) page.

---

## 📊 Data Sources

### 1. External Rental API (Booking & RentOut)
```
Base URL: https://rentalapi.rootments.live/api/GetBooking/
```

### 2. Local MongoDB API (Transactions)
```
Base URL: http://localhost:7000/api/
```

---

## 🔄 Complete Data Flow

### Step 1: API Endpoints Setup

```javascript
// Get current user from localStorage
const currentusers = JSON.parse(localStorage.getItem("rootfinuser"));
const currentDate = new Date().toISOString().split("T")[0]; // "2025-12-19"

// External APIs
const apiUrl = `https://rentalapi.rootments.live/api/GetBooking/GetBookingList?LocCode=${currentusers?.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`;

const apiurl1 = `https://rentalapi.rootments.live/api/GetBooking/GetRentoutList?LocCode=${currentusers?.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`;

const apiUrl2 = `https://rentalapi.rootments.live/api/GetBooking/GetReturnList?LocCode=${currentusers?.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`;

const apiUrl3 = `https://rentalapi.rootments.live/api/GetBooking/GetDeleteList?LocCode=${currentusers.locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`;

// Local MongoDB API (includes invoice transactions)
const apiUrl4 = `${baseUrl.baseUrl}api/daybook?locCode=${currentusers.locCode}&date=${currentDate}`;
```

**Key Parameters:**
- `LocCode`: User's location code (e.g., "858" for Warehouse)
- `DateFrom` & `DateTo`: Date range (usually same day for daily report)

---

### Step 2: Fetch Data Using Custom Hook

```javascript
// Using custom useFetch hook for external APIs
const { data } = useFetch(apiUrl, fetchOptions);        // Booking data
const { data: data1 } = useFetch(apiurl1, fetchOptions); // RentOut data
const { data: data2 } = useFetch(apiUrl2, fetchOptions); // Return data
const { data: data3 } = useFetch(apiUrl3, fetchOptions); // Cancel data

// Using useEffect for local MongoDB API
const [dayBookData, setDayBookData] = useState(null);

useEffect(() => {
    const fetchDayBookData = async () => {
        try {
            const response = await fetch(apiUrl4);
            const result = await response.json();
            if (result.success) {
                setDayBookData(result.data.transactions);
            }
        } catch (error) {
            console.error('Error fetching day book data:', error);
            setDayBookData([]);
        }
    };
    
    if (apiUrl4) {
        fetchDayBookData();
    }
}, [apiUrl4]);
```

---

### Step 3: Transform Booking Data

```javascript
const bookingTransactions = (data?.dataSet?.data || []).map(transaction => {
    // Parse payment amounts
    const bookingCashAmount = parseInt(transaction?.bookingCashAmount || 0, 10);
    const bookingBankAmount = parseInt(transaction?.bookingBankAmount || 0, 10);
    const bookingUPIAmount = parseInt(transaction?.bookingUPIAmount || 0, 10);
    const rblAmount = parseInt(transaction?.rblRazorPay || 0, 10);
    const invoiceAmount = parseInt(transaction?.invoiceAmount || 0, 10);
    const discountAmount = parseInt(transaction?.discountAmount || 0, 10);

    // Calculate total
    const totalAmount = bookingCashAmount + bookingBankAmount + bookingUPIAmount + rblAmount;

    // Return standardized format
    return {
        ...transaction,                    // Keep all original fields
        date: transaction?.bookingDate || null,
        bookingCashAmount,
        bookingBankAmount,
        billValue: transaction.invoiceAmount,
        discountAmount: discountAmount,
        invoiceAmount,
        bookingBank1: bookingBankAmount,
        TotaltransactionBooking: totalAmount,
        Category: "Booking",               // ✅ Set category
        SubCategory: "Advance",            // ✅ Set sub-category
        totalTransaction: totalAmount,
        cash: bookingCashAmount,           // ✅ Standardized field
        rbl: rblAmount,                    // ✅ Standardized field
        bank: bookingBankAmount,           // ✅ Standardized field
        upi: bookingUPIAmount,             // ✅ Standardized field
        amount: totalAmount,
    };
});
```

**Key Transformations:**
1. Parse all payment amounts as integers
2. Calculate total from all payment methods
3. Standardize field names (cash, bank, upi, rbl)
4. Add Category and SubCategory
5. Keep original transaction data

---

### Step 4: Transform RentOut Data

```javascript
const rentOutTransactions = (data1?.dataSet?.data || []).map(transaction => {
    // Parse payment amounts
    const rentoutCashAmount = parseInt(transaction?.rentoutCashAmount ?? 0, 10);
    const rentoutBankAmount = parseInt(transaction?.rentoutBankAmount ?? 0, 10);
    const rentoutUPIAmount = parseInt(transaction?.rentoutUPIAmount ?? 0, 10);
    const rblAmount = parseInt(transaction?.rblRazorPay ?? 0, 10);
    
    // Parse invoice details
    const invoiceAmount = parseInt(transaction?.invoiceAmount ?? 0, 10);
    const advanceAmount = parseInt(transaction?.advanceAmount ?? 0, 10);
    const securityAmount = parseInt(transaction?.securityAmount ?? 0, 10);

    return {
        ...transaction,
        date: transaction?.rentOutDate ?? "",
        rentoutCashAmount,
        rentoutBankAmount,
        invoiceAmount,
        discountAmount: parseInt(transaction.discountAmount || 0),
        billValue: transaction.invoiceAmount,
        securityAmount,
        advanceAmount,
        Balance: invoiceAmount - advanceAmount,  // ✅ Calculate balance
        rentoutUPIAmount,
        Category: "RentOut",                     // ✅ Set category
        SubCategory: "Security",                 // ✅ Set sub-category
        SubCategory1: "Balance Payable",         // ✅ Additional sub-category
        totalTransaction: rentoutCashAmount + rentoutBankAmount + rentoutUPIAmount + rblAmount,
        cash: rentoutCashAmount,                 // ✅ Standardized field
        rbl: rblAmount,                          // ✅ Standardized field
        bank: rentoutBankAmount,                 // ✅ Standardized field
        upi: rentoutUPIAmount,                   // ✅ Standardized field
        amount: rentoutCashAmount + rentoutBankAmount + rentoutUPIAmount + rblAmount,
    };
});
```

**Key Transformations:**
1. Parse all payment amounts
2. Calculate balance (invoiceAmount - advanceAmount)
3. Set Category as "RentOut"
4. Set SubCategory as "Security"
5. Add SubCategory1 as "Balance Payable"

---

### Step 5: Transform Return Data

```javascript
const returnOutTransactions = (data2?.dataSet?.data || []).map(transaction => {
    // Make amounts NEGATIVE (refund)
    const returnCashAmount = -(parseInt(transaction?.returnCashAmount || 0, 10));
    const returnRblAmount = -(parseInt(transaction?.rblRazorPay || 0, 10));
    
    // Only process bank/UPI if no RBL value
    const returnBankAmount = returnRblAmount !== 0 ? 0 : -(parseInt(transaction?.returnBankAmount || 0, 10));
    const returnUPIAmount = returnRblAmount !== 0 ? 0 : -(parseInt(transaction?.returnUPIAmount || 0, 10));
    
    const invoiceAmount = parseInt(transaction?.invoiceAmount || 0, 10);
    const advanceAmount = parseInt(transaction?.advanceAmount || 0, 10);
    const RsecurityAmount = -(parseInt(transaction?.securityAmount || 0, 10));

    const totalAmount = returnCashAmount + returnRblAmount + returnBankAmount + returnUPIAmount;

    return {
        ...transaction,
        date: transaction?.returnedDate || null,
        returnBankAmount,
        returnCashAmount,
        returnUPIAmount,
        invoiceAmount,
        advanceAmount,
        discountAmount: parseInt(transaction.discountAmount || 0),
        billValue: invoiceAmount,
        amount: totalAmount,                     // ✅ Negative total
        totalTransaction: totalAmount,
        RsecurityAmount,
        Category: "Return",                      // ✅ Set category
        SubCategory: "Security Refund",          // ✅ Set sub-category
        cash: returnCashAmount,                  // ✅ Negative amount
        rbl: returnRblAmount,                    // ✅ Negative amount
        bank: returnBankAmount,                  // ✅ Negative amount
        upi: returnUPIAmount,                    // ✅ Negative amount
    };
});
```

**Key Transformations:**
1. Make all amounts NEGATIVE (refunds)
2. Handle RBL vs Bank/UPI logic
3. Set Category as "Return"
4. Set SubCategory as "Security Refund"

---

### Step 6: Transform Cancel Data

```javascript
const canCelTransactions = (data3?.dataSet?.data || []).map(transaction => {
    // Make amounts NEGATIVE (cancellation refund)
    const deleteCashAmount = -Math.abs(parseInt(transaction.deleteCashAmount || 0));
    const deleteRblAmount = -Math.abs(parseInt(transaction.rblRazorPay || 0));
    
    // Only process bank/UPI if no RBL value
    const originalRblAmount = parseInt(transaction.rblRazorPay || 0);
    const deleteBankAmount = originalRblAmount !== 0 ? 0 : -Math.abs(parseInt(transaction.deleteBankAmount || 0));
    const deleteUPIAmount = originalRblAmount !== 0 ? 0 : -Math.abs(parseInt(transaction.deleteUPIAmount || 0));

    const totalAmount = deleteCashAmount + deleteRblAmount + deleteBankAmount + deleteUPIAmount;

    return {
        ...transaction,
        date: transaction.cancelDate,
        Category: "Cancel",                      // ✅ Set category
        SubCategory: "cancellation Refund",      // ✅ Set sub-category
        discountAmount: parseInt(transaction.discountAmount || 0),
        billValue: transaction.invoiceAmount,
        amount: totalAmount,                     // ✅ Negative total
        totalTransaction: totalAmount,
        cash: deleteCashAmount,                  // ✅ Negative amount
        rbl: deleteRblAmount,                    // ✅ Negative amount
        bank: deleteBankAmount,                  // ✅ Negative amount
        upi: deleteUPIAmount,                    // ✅ Negative amount
    };
});
```

---

### Step 7: Transform MongoDB Transactions

```javascript
// Allowed categories from MongoDB
const allowedMongoCategories = [
    "petty expenses", "staff reimbursement", "maintenance expenses",
    "booking", "receivable", "sales", "income", "expense",
    "return", "refund", "cancel", "rentout", "rent out"
    // ... more categories
];

const Transactionsall = (dayBookData || []).filter(transaction => {
    const cat = (transaction.category || transaction.Category || "").toLowerCase();
    return allowedMongoCategories.includes(cat);
}).map(transaction => ({
    ...transaction,
    locCode: currentusers.locCode,
    date: transaction.date ? transaction.date.split("T")[0] : transaction.date,
    Category: transaction.category || transaction.Category || transaction.type,
    SubCategory: transaction.subCategory || transaction.SubCategory,
    cash1: transaction.cash,
    bank1: transaction.bank,
    discountAmount: parseInt(transaction.discountAmount || 0),
    billValue: transaction.billValue || transaction.amount,
    Tupi: transaction.upi,
    rbl: transaction.rbl || transaction.rblRazorPay || 0
}));
```

---

### Step 8: Combine All Transactions

```javascript
const allTransactions = [
    ...bookingTransactions,      // From external API
    ...rentOutTransactions,      // From external API
    ...returnOutTransactions,    // From external API
    ...canCelTransactions,       // From external API
    ...Transactionsall          // From MongoDB (includes invoices)
];
```

---

### Step 9: Filter by Category/SubCategory

```javascript
const selectedCategoryValue = selectedCategory?.value?.toLowerCase() || "all";
const selectedSubCategoryValue = selectedSubCategory?.value?.toLowerCase() || "all";

const filteredTransactions = allTransactions.filter((t) =>
    (selectedCategoryValue === "all" || 
     t.category?.toLowerCase() === selectedCategoryValue || 
     t.Category?.toLowerCase() === selectedCategoryValue) &&
    (selectedSubCategoryValue === "all" || 
     t.subCategory?.toLowerCase() === selectedSubCategoryValue || 
     t.SubCategory?.toLowerCase() === selectedSubCategoryValue)
);
```

---

### Step 10: Calculate Totals

```javascript
const totalCash = filteredTransactions?.reduce((sum, item) =>
    sum + (parseInt(item.cash, 10) || 0),
    0
) + (parseInt(preOpen?.Closecash, 10) || 0);

const totalBankAmount = filteredTransactions?.reduce((sum, item) =>
    sum + (parseInt(item.bank, 10) || 0),
    0
);

const totalUPIAmount = filteredTransactions?.reduce((sum, item) =>
    sum + (parseInt(item.upi, 10) || 0),
    0
);

const totalRblAmount = filteredTransactions?.reduce((sum, item) =>
    sum + (parseInt(item.rbl, 10) || 0),
    0
);
```

---

## 📋 Standardized Transaction Format

Every transaction (Booking, RentOut, Return, Cancel, MongoDB) is transformed to this format:

```javascript
{
    // Original fields
    ...transaction,
    
    // Standardized fields
    date: "2025-12-19",
    Category: "Booking" | "RentOut" | "Return" | "Cancel" | "Income" | "Expense",
    SubCategory: "Advance" | "Security" | "Security Refund" | "cancellation Refund",
    
    // Payment breakdown
    cash: 1000,              // Cash amount
    bank: 500,               // Bank amount
    upi: 300,                // UPI amount
    rbl: 200,                // RBL/RazorPay amount
    
    // Totals
    amount: 2000,            // Total amount
    totalTransaction: 2000,  // Total transaction
    billValue: 2000,         // Invoice amount
    discountAmount: 0,       // Discount
    
    // Additional fields
    invoiceNo: "INV-001",
    customerName: "John Doe",
    remark: "Payment received"
}
```

---

## 🎯 Key Logic Points

### 1. Payment Method Priority
```javascript
// If RBL payment exists, ignore Bank/UPI
const originalRblAmount = parseInt(transaction.rblRazorPay || 0);
const bankAmount = originalRblAmount !== 0 ? 0 : parseInt(transaction.bankAmount || 0);
const upiAmount = originalRblAmount !== 0 ? 0 : parseInt(transaction.upiAmount || 0);
```

### 2. Negative Amounts for Refunds
```javascript
// Returns and Cancels use negative amounts
const returnCashAmount = -(parseInt(transaction?.returnCashAmount || 0, 10));
const deleteCashAmount = -Math.abs(parseInt(transaction.deleteCashAmount || 0));
```

### 3. Balance Calculation
```javascript
// For RentOut: Balance = Invoice - Advance
Balance: invoiceAmount - advanceAmount
```

### 4. Date Formatting
```javascript
// External API: Use specific date field
date: transaction?.bookingDate || transaction?.rentOutDate

// MongoDB: Split ISO date
date: transaction.date ? transaction.date.split("T")[0] : transaction.date
```

---

## 🔧 Implementation Steps for Another Website

### Step 1: Setup API Endpoints
```javascript
const BASE_URL = "https://your-api.com/api/";
const locCode = getCurrentUser().locCode;
const currentDate = new Date().toISOString().split("T")[0];

const bookingAPI = `${BASE_URL}GetBooking/GetBookingList?LocCode=${locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`;
const rentoutAPI = `${BASE_URL}GetBooking/GetRentoutList?LocCode=${locCode}&DateFrom=${currentDate}&DateTo=${currentDate}`;
```

### Step 2: Fetch Data
```javascript
const fetchBookingData = async () => {
    const response = await fetch(bookingAPI);
    const result = await response.json();
    return result.dataSet.data || [];
};
```

### Step 3: Transform Data
```javascript
const transformBooking = (data) => {
    return data.map(transaction => ({
        ...transaction,
        date: transaction.bookingDate,
        Category: "Booking",
        SubCategory: "Advance",
        cash: parseInt(transaction.bookingCashAmount || 0),
        bank: parseInt(transaction.bookingBankAmount || 0),
        upi: parseInt(transaction.bookingUPIAmount || 0),
        rbl: parseInt(transaction.rblRazorPay || 0),
        amount: parseInt(transaction.bookingCashAmount || 0) + 
                parseInt(transaction.bookingBankAmount || 0) + 
                parseInt(transaction.bookingUPIAmount || 0) + 
                parseInt(transaction.rblRazorPay || 0)
    }));
};
```

### Step 4: Combine and Display
```javascript
const allTransactions = [
    ...transformBooking(bookingData),
    ...transformRentout(rentoutData),
    ...transformReturn(returnData),
    ...transformCancel(cancelData)
];

// Display in table
allTransactions.map(transaction => (
    <tr key={transaction.invoiceNo}>
        <td>{transaction.date}</td>
        <td>{transaction.invoiceNo}</td>
        <td>{transaction.customerName}</td>
        <td>{transaction.Category}</td>
        <td>{transaction.cash}</td>
        <td>{transaction.bank}</td>
        <td>{transaction.upi}</td>
        <td>{transaction.rbl}</td>
        <td>{transaction.amount}</td>
    </tr>
))
```

---

## 📊 Summary

**Data Flow:**
1. Fetch from multiple APIs (Booking, RentOut, Return, Cancel, MongoDB)
2. Transform each to standardized format
3. Combine all transactions
4. Filter by category/subcategory
5. Calculate totals
6. Display in table

**Key Transformations:**
- Parse amounts as integers
- Standardize field names (cash, bank, upi, rbl)
- Add Category and SubCategory
- Make refunds negative
- Calculate totals

**Display Logic:**
- Show all transactions in single table
- Filter by category dropdown
- Calculate running totals
- Export to CSV
