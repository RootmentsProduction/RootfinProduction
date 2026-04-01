# Category and Subcategory Mapping Fix

## Issue Description
When creating invoices, the category and subcategory selected during invoice creation were not showing correctly in the financial summary. The data was being mapped incorrectly between the invoice creation and financial transaction display.

## Root Cause
1. **Missing Field**: The Transaction model was missing the `subCategory` field
2. **Incorrect Mapping**: The frontend was mapping transaction fields incorrectly:
   - Category was showing `transaction.type` (e.g., "Income") instead of `transaction.category` (e.g., "Footwear")
   - SubCategory was showing `transaction.category` instead of `transaction.subCategory`

## Changes Made

### Backend Changes

1. **Added missing subCategory field to Transaction models**:
   - `backend/model/Transaction.js`: Added `subCategory: { type: String, default: "" }`
   - `backend/models/sequelize/Transaction.js`: Added `subCategory: { type: DataTypes.STRING, defaultValue: '' }`

2. **Fixed transaction creation in SalesInvoiceController.js**:
   - Ensured invoice category maps to transaction category
   - Ensured invoice subCategory maps to transaction subCategory

### Frontend Changes

1. **Fixed category mapping in financial summary displays**:
   - `frontend/src/pages/Datewisedaybook.jsx`: Fixed Category/SubCategory mapping
   - `frontend/src/pages/Revenuereport.jsx`: Fixed display mapping
   - `frontend/src/pages/BillWiseIncome.jsx`: Fixed display mapping

## Expected Behavior After Fix

1. **Invoice Creation**: Select "Footwear" as Category and "Men's Shoes" as SubCategory
2. **Financial Summary**: Should display:
   - Category: "Footwear" (not "Income")
   - SubCategory: "Men's Shoes" (not "Footwear")

## Testing Steps

1. Create a new invoice with specific category and subcategory
2. Check the financial summary to verify correct category display
3. Verify existing invoices show correct categories after the fix

## Database Migration Note

Since we added a new field (`subCategory`) to the Transaction model, existing transactions will have empty subCategory values. New invoices created after this fix will have the correct subCategory data.