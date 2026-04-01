# Stock On Hand Report - User Guide

## Overview
The Stock On Hand Report shows the available stock for items based on all transactions up to a selected date. This report calculates the actual stock by considering:

- Opening stock
- Purchase receives
- Transfer orders (both received and sent)
- Sales invoices
- Inventory adjustments

## How It Works

### Example Scenario
Let's say you have a product "Product X" and you want to see stock movements from Feb 10 to Feb 27:

**Stock as of Feb 9 (day before start date):**
- Opening Stock: 25 units (calculated from all transactions up to Feb 9)

**Transactions during Feb 10-27:**
- Feb 12: 15 units purchased (Stock In)
- Feb 15: 8 units sold (Stock Out)
- Feb 20: 5 units transferred in (Stock In)
- Feb 25: 12 units sold (Stock Out)

**Report Results:**
- **Opening Stock**: 25 units (stock as of Feb 9)
- **Stock In**: 20 units (15 + 5 added during Feb 10-27)
- **Stock Out**: 20 units (8 + 12 sold during Feb 10-27)
- **Closing Stock**: 25 units (25 + 20 - 20)

This shows the complete stock movement picture for the selected period.

## How to Use

### 1. Access the Report
- Go to **Inventory Report** page
- Select **"Stock On Hand Report"** from the Report Type dropdown

### 2. Set Date Range
- **Start Date (Optional)**: Leave empty to calculate from the beginning of time
- **End Date**: Select the date up to which you want to calculate stock
  - Click "Today" button to quickly set to current date
  - Stock will be calculated as of this date

### 3. Select Store/Warehouse
- **Admin users**: Can select "All Stores" or a specific store
- **Store users**: Will automatically show their assigned store only

### 4. Generate Report
- Click **"Generate Report"** button
- The system will calculate stock movements for all items up to the selected date

## Report Sections

### Summary Cards
- **Total Opening Stock**: Sum of all opening stock (stock at start of period)
- **Total Stock In**: Total quantity added during the selected period
- **Total Stock Out**: Total quantity sold/removed during the selected period
- **Total Closing Stock**: Sum of all closing stock (stock at end of period)
- **Total Stock Value**: Total value of all closing stock (quantity × cost price)
- **Period**: Shows the date range selected

### Item Details Table
Shows detailed breakdown for each item in the correct order:
- Item Name & SKU
- Category
- Warehouse location
- **Opening Stock** (stock at start of period - calculated as stock on day before start date)
- **Stock In** (quantity added during the selected period)
- **Stock Out** (quantity sold/removed during the selected period)
- **Closing Stock** (final stock at end of period)
- Cost Price per unit
- Total Stock Value

### Warehouse Summary
Shows stock totals grouped by warehouse:
- Total Stock per warehouse
- Total Value per warehouse
- Item Count per warehouse

## Features

### Date-Based Calculation
- Calculates stock as of the selected end date
- Considers all transactions up to that date
- Ignores any transactions after the end date

### Multi-Store Support
- View stock for all stores or filter by specific store
- Store users see only their assigned store data
- Admin users can view any store or all stores combined

### Export to CSV
- Export the complete report data to CSV format
- Includes all item details with stock calculations
- Useful for further analysis in Excel or other tools

### Pagination
- Large reports are paginated for better performance
- Choose items per page (10, 20, 50, 100, or All)
- Navigate through pages easily

## Use Cases

### 1. Month-End Stock Valuation
- Set end date to last day of month
- Get accurate stock values for financial reporting

### 2. Historical Stock Analysis
- Compare stock levels between different dates
- Analyze stock movement trends over time

### 3. Store Performance Comparison
- View stock levels across different stores
- Identify stores with high/low inventory

### 4. Audit and Reconciliation
- Verify calculated stock against physical counts
- Identify discrepancies in stock movements

## Technical Notes

### Stock Calculation Logic
```
Opening Stock = Stock on Hand as of (Start Date - 1 day)
Stock In = Purchases + Transfers In + Positive Adjustments (during period)
Stock Out = Sales + Transfers Out + Negative Adjustments (during period)
Closing Stock = Opening Stock + Stock In - Stock Out
```

### Performance
- Report may take longer for large date ranges
- Consider using specific date ranges for better performance
- Use store filtering to reduce calculation time

### Data Sources
The report pulls data from:
- ShoeItem collection (opening stock)
- ItemGroup collection (grouped items)
- SalesInvoice collection (sales transactions)
- TransferOrder collection (stock transfers)
- PurchaseReceive collection (purchase receipts)
- InventoryAdjustment collection (manual adjustments)

## Troubleshooting

### No Stock Found
- Check if items have opening stock or transactions in the selected period
- Verify store selection matches where items are located
- Ensure end date is after item creation dates

### Slow Performance
- Use specific date ranges instead of "all time"
- Filter by specific store instead of "All Stores"
- Consider running report during off-peak hours

### Incorrect Stock Values
- Verify all transactions are properly recorded
- Check if inventory adjustments are needed
- Ensure transfer orders are marked as completed

## Best Practices

1. **Regular Monitoring**: Run weekly/monthly to track stock trends
2. **Date Consistency**: Use consistent end dates for period comparisons
3. **Store-Specific Analysis**: Focus on individual stores for detailed insights
4. **Export for Analysis**: Use CSV export for deeper analysis in spreadsheet tools
5. **Cross-Verification**: Compare with physical stock counts regularly

---

**Note**: This report provides calculated stock based on recorded transactions. Always verify against physical inventory counts for accuracy.