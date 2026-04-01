# Sales & Inventory Reports - Quick Start Guide

## Accessing the Reports

### From Navigation Menu
1. Click on **Reports** in the left sidebar
2. Select either:
   - **Sales Report** - For sales data analysis
   - **Inventory Report** - For inventory data analysis

### Direct URLs
- Sales Report: `/reports/sales`
- Inventory Report: `/reports/inventory`

## Sales Report

### Available Report Types
1. **Sales Summary**
   - Total invoices and sales amount
   - Payment breakdown (Cash, Bank, UPI, RBL)
   - Sales by category
   - Top 10 customers

2. **Sales by Item**
   - Items sold with quantities
   - Total amount per item
   - Sorted by highest sales

3. **Return Summary**
   - Total returns and amounts
   - Returns grouped by reason
   - Detailed return information

### How to Generate
1. Select **From Date** and **To Date**
2. (Admin only) Select a **Store** or leave as "All Stores"
3. Select **Report Type**
4. Click **Generate Report**
5. (Optional) Click **Export CSV** to download

## Inventory Report

### Available Report Types
1. **Inventory Summary**
   - Total items and quantities
   - Total stock value
   - Item-level details with warehouse breakdown

2. **Stock Summary**
   - Stock levels by warehouse
   - Total quantity and value per warehouse
   - Item count per warehouse

3. **Inventory Valuation**
   - Valuation by category
   - Item count and quantity per category
   - Average value per category

4. **Inventory Aging**
   - Items grouped by age (0-30, 31-60, 61-90, 90+ days)
   - Quantity and value per age bucket
   - Days old for each item

### How to Generate
1. (Admin only) Select a **Store** or leave as "All Stores"
2. Select **Report Type**
3. Click **Generate Report**
4. (Optional) Click **Export CSV** to download

## User Access

### Admin Users
- Can view all stores
- Can select specific store or view all stores combined
- Full access to all report types

### Store Users
- Can only view their own store's data
- No store selection dropdown
- Full access to all report types for their store

### Warehouse Users
- Can view all warehouses
- Can select specific warehouse or view all
- Full access to all report types

## CSV Export

- Click **Export CSV** button after generating a report
- File will download with format: `[report-type]-[date-range].csv`
- Open in Excel, Google Sheets, or any spreadsheet application
- Data is formatted with proper headers and values

## Tips

- Use date ranges to analyze specific periods
- Compare sales across different stores (admin only)
- Monitor inventory aging to identify slow-moving items
- Use valuation reports for financial planning
- Export reports for presentations or further analysis

## Troubleshooting

**No data showing?**
- Check date range is correct
- Verify store selection (if applicable)
- Ensure data exists for selected period

**Export not working?**
- Generate report first
- Check browser's download settings
- Try a different browser if issue persists

**Slow loading?**
- Try narrower date ranges
- Select specific store instead of all stores
- Check internet connection
