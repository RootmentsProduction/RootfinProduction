# Advanced Filtering Debug Guide

## ✅ CHANGES MADE

### 1. Frontend (SalesByInvoiceReport.jsx)
- ✅ Advanced filtering states restored
- ✅ Filter UI components added back
- ✅ API parameters include all filters
- ✅ Debug logging added to see what parameters are sent

### 2. Backend (SalesReportController.js)
- ✅ Fixed category filtering logic to properly combine with return exclusion
- ✅ Debug logging added to see received parameters
- ✅ SKU and size filtering working on line items
- ✅ Customer filtering with regex search

### 3. Advanced Filters Available
- **Category**: Dropdown with Shoes, Shirts, Accessories, Others
- **Item SKU**: Text search (partial match)
- **Size**: Dropdown with XS-XXL and 6-12
- **Customer**: Text search (partial match)

## 🔧 HOW TO TEST

1. **Open Browser Console** (F12) to see debug logs
2. **Navigate to Sales by Invoice** page
3. **Set filters** and click "Generate Report"
4. **Check console logs** for:
   - Frontend: "Frontend - Sending parameters"
   - Backend: "getSalesByInvoice - Received parameters"

## 🐛 DEBUGGING STEPS

### If filters not working:

1. **Check Console Logs**:
   - Are parameters being sent from frontend?
   - Are parameters being received by backend?

2. **Test Individual Filters**:
   - Try category filter alone
   - Try SKU search alone
   - Try size filter alone
   - Try customer search alone

3. **Check Data**:
   - Ensure you have invoices in the date range
   - Ensure invoices have the category/SKU/size you're filtering for

### Common Issues:
- **Empty Results**: Check if data exists for the filter criteria
- **Category Not Working**: Check if invoices have proper category field
- **SKU Not Working**: Check if line items have SKU field
- **Size Not Working**: Check if line items have size field

## 🚀 RESTART BACKEND

After making backend changes, restart the server:
```bash
cd backend
node server.js
```

## 📝 FILTER LOGIC

### Category Filter
- Searches invoice.category field
- Case-insensitive partial match
- Excludes returns automatically

### SKU Filter  
- Searches line items for matching SKU
- Case-insensitive partial match
- Invoice included if ANY line item matches

### Size Filter
- Searches line items for exact size match
- Case-insensitive exact match
- Invoice included if ANY line item matches

### Customer Filter
- Searches invoice.customer field
- Case-insensitive partial match

The advanced filtering should now be working properly!