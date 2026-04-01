# Purchase Receive Stock Update Test

This test file verifies that purchase receive correctly updates stock in the database.

## How to Run

1. **Update the test configuration** in `test-purchase-receive-stock.js`:
   ```javascript
   const TEST_CONFIG = {
     warehouse: 'Kannur Branch', // or 'Warehouse'
     locCode: '716', // Kannur locCode
     userId: 'test@example.com',
     itemName: 'ronaldo - blue',
     itemGroupId: '69326eb097e2603cb86efee7', // Replace with actual group ID
     itemSku: 'ROBL',
     quantity: 2
   };
   ```

2. **Make sure MongoDB is running** and the database connection is correct.

3. **Run the test**:
   ```bash
   npm run test:stock
   ```
   
   Or directly:
   ```bash
   node test-purchase-receive-stock.js
   ```

## What the Test Does

1. **Tests Warehouse Matching**: Verifies that warehouse names are matched correctly (e.g., "Kannur" matches "Kannur Branch")

2. **Tests Stock Update**: 
   - Gets current stock for an item
   - Simulates adding stock via purchase receive
   - Verifies the stock is updated correctly in the database
   - Compares before/after stock values

## Expected Output

```
🚀 Starting Purchase Receive Stock Update Tests

========================================
TEST: Warehouse Name Matching
========================================

✅ "Kannur Branch" vs "Kannur Branch": true (expected: true)
✅ "Kannur Branch" vs "Kannur": true (expected: true)
...

========================================
TEST: Purchase Receive Stock Update
========================================

🔍 Getting current stock for:
   Item Group ID: 69326eb097e2603cb86efee7
   Item Name: ronaldo - blue
   Item SKU: ROBL
   Target Warehouse: Kannur Branch
   ✅ Found item: "ronaldo - blue"
   Available warehouses: Warehouse (stock: 36), Kannur Branch (stock: 24)
   ✅ Found stock in "Kannur Branch": 24

📦 Simulating Purchase Receive:
   Warehouse: Kannur Branch
   Quantity: 2
   Item: ronaldo - blue (ROBL)
   ✅ Found item at index X
   ✅ Found existing warehouse stock for "Kannur Branch"
   📈 Updated stock: 24 + 2 = 26
   ✅ Saved item group with updated stock

========================================
TEST RESULTS:
========================================
Stock Before: 24
Stock After: 26
Expected Increase: 2
Actual Increase: 2
✅ TEST PASSED: Stock updated correctly!
========================================
```

## Notes

- The test uses the same warehouse matching logic as the actual controller
- Make sure to use a valid `itemGroupId` and `itemName`/`itemSku` that exists in your database
- The test will modify the database, so use a test database or be careful with production data

