# SKU Filtering Debug Guide

## 🔍 DEBUGGING STEPS

I've added extensive debugging to help identify why SKU "LATE-BL54" isn't showing up in the report.

### 1. **Restart Backend Server**
```bash
cd backend
node server.js
```

### 2. **Open Browser Console**
- Press F12 to open Developer Tools
- Go to Console tab

### 3. **Test the SKU Filter**
1. Navigate to Reports → Sales by Invoice
2. Set date range to include your invoice date
3. Enter "LATE-BL54" in the Item SKU field
4. Click "Generate Report"
5. **Check console logs** for debugging information

### 4. **What to Look For in Console**

#### Frontend Logs:
```
Frontend - Sending parameters: {
  fromDate: "2025-01-01",
  toDate: "2025-01-23", 
  locCode: "all",
  skuSearch: "LATE-BL54"
}
URL params: dateFrom=2025-01-01&dateTo=2025-01-23&locCode=all&sku=LATE-BL54
```

#### Backend Logs:
```
MongoDB query: { ... }
Additional filters - SKU: LATE-BL54 Size: undefined
Found X invoices in date range
Sample invoice structure: { ... }
Filtering by SKU: "LATE-BL54" or Size: "undefined"
Total invoices before SKU/Size filter: X
Total invoices after SKU/Size filter: X
```

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: No Invoices Found in Date Range
**Symptoms**: "Found 0 invoices in date range"
**Solution**: 
- Check if invoice date is within the selected range
- Verify invoice exists in database
- Check if invoice category is "Return" (excluded from sales)

### Issue 2: Invoice Found but No Line Items
**Symptoms**: "Invoice XXX has no line items"
**Solution**:
- Check if invoice has `lineItems` array
- Verify line items were saved properly during invoice creation

### Issue 3: SKU Field Missing or Different
**Symptoms**: No SKU matches found
**Solutions**:
- Check if line items have `sku` field
- Verify SKU is stored as "LATE-BL54" (case-insensitive search)
- Check for extra spaces or different field names

### Issue 4: Store/Branch Filtering
**Symptoms**: Invoice exists but not in results
**Solution**:
- Check if invoice belongs to selected store
- Verify `warehouse`, `branch`, or `locCode` fields match

## 🔧 MANUAL DATABASE CHECK

If debugging shows issues, you can manually check the database:

### Check if Invoice Exists:
```javascript
// In MongoDB shell or backend console
db.salesinvoices.find({
  invoiceDate: { 
    $gte: new Date("2025-01-01"), 
    $lte: new Date("2025-01-23") 
  }
}).limit(5)
```

### Check Line Items Structure:
```javascript
db.salesinvoices.find({
  "lineItems.sku": /LATE-BL54/i
}).limit(1)
```

## 📝 EXPECTED INVOICE STRUCTURE

For SKU filtering to work, invoices should have this structure:
```json
{
  "invoiceNumber": "INV-001",
  "invoiceDate": "2025-01-23T00:00:00.000Z",
  "category": "Shoes", // Not "Return"
  "customer": "Customer Name",
  "warehouse": "718", // or branch/locCode
  "lineItems": [
    {
      "sku": "LATE-BL54",
      "name": "Item Name",
      "size": "10",
      "quantity": 1,
      "price": 100
    }
  ]
}
```

## 🚀 NEXT STEPS

1. **Run the test** with debugging enabled
2. **Share the console logs** if issue persists
3. **Check invoice structure** in database if needed
4. **Verify date range** includes your invoice

The debugging will show exactly where the filtering is failing!