# Purchase Receive Stock Update Test

This test file (`test-purchase-receive-full.js`) tests the complete purchase receive stock update flow to identify why stock is not being added.

## What It Tests

1. **Admin Email Detection**: Verifies that `officerootments@gmail.com` uses "Warehouse" regardless of locCode
2. **Warehouse Determination**: Checks that regular users get the correct warehouse from their locCode
3. **Stock Update**: Verifies that stock is actually updated in the database after creating a purchase receive
4. **Status Check**: Ensures that only purchase receives with status "received" update stock

## How to Run

1. **Update the test configuration** in `test-purchase-receive-full.js`:
   ```javascript
   const TEST_CONFIG = {
     adminTest: {
       userId: 'officerootments@gmail.com',
       locCode: '144',
       expectedWarehouse: 'Warehouse',
       itemName: 'leks - 9',  // Your actual item name
       itemGroupId: '6933b6b2b747e38f77df106b',  // Your actual group ID
       itemSku: '',  // SKU if available
       quantity: 5,  // Test quantity
     }
   };
   ```

2. **Make sure MongoDB is running** and your `.env` file is configured correctly.

3. **Run the test**:
   ```bash
   cd backend
   node test-purchase-receive-full.js
   ```

## What to Look For

### ✅ Success Indicators:
- `Stock Before: X` and `Stock After: X + quantity`
- `Expected Warehouse: Warehouse` matches `Actual Warehouse: Warehouse`
- `✅ TEST PASSED: Stock updated correctly in correct warehouse!`
- `Stock Update Summary: processed: 1, skipped: 0`

### ❌ Failure Indicators:
- `Stock Before: X` and `Stock After: X` (no change)
- `Stock Update Summary: status: skipped` or `processed: 0`
- `❌ TEST FAILED: Stock not increased correctly`
- Warehouse mismatch

## Common Issues

1. **Stock Update Skipped**: 
   - Check if status is "received" (not "draft")
   - Check if `received` quantity > 0
   - Check backend console logs for errors

2. **Wrong Warehouse**:
   - For admin: Should always be "Warehouse"
   - For regular users: Should match locCode mapping

3. **Item Not Found**:
   - Verify `itemGroupId` is correct
   - Verify `itemName` matches exactly (case-sensitive)
   - Check if item exists in the database

4. **Purchase Order ID Missing**:
   - The test will try to find an existing Purchase Order
   - If none exists, it will use a dummy ID (may fail validation)

## Interpreting Results

The test will show:
- Stock before and after values
- Which warehouse was used
- Whether stock was updated correctly
- Any errors or warnings

If the test passes but stock still doesn't update in the UI, the issue is likely:
- Frontend not refreshing after save
- Frontend filtering/display logic
- Event dispatching not working

If the test fails, check:
- Backend console logs for detailed error messages
- Database to verify if stock was actually updated
- Item group structure in database

