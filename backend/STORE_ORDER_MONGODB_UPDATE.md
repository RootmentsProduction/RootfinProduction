# Store Order MongoDB Migration

## Changes Made

Converted StoreOrderController from PostgreSQL + MongoDB dual database to **MongoDB only**.

### Why?
- Production PostgreSQL table `store_orders` doesn't exist
- Simpler to maintain one database
- MongoDB is already working in production
- Avoids sync issues between two databases

### Files Modified

**backend/controllers/StoreOrderController.js**
- Removed PostgreSQL imports (`Op`, `StoreOrderPostgres`, `TransferOrderPostgres`)
- Updated all functions to use MongoDB only:
  - `getStoreOrders()` - Uses MongoDB queries
  - `getStoreOrderById()` - Uses `StoreOrder.findById()`
  - `createStoreOrder()` - Saves to MongoDB only
  - `updateStoreOrder()` - Updates MongoDB only
  - `deleteStoreOrder()` - Deletes from MongoDB only

### Transfer Orders
Transfer orders are still created when store orders are approved, but now they're created in MongoDB only (using the TransferOrder MongoDB model).

### Testing
After deployment, test:
1. Create a store order
2. View store orders list
3. Approve a store order
4. Check that transfer order is created

### Rollback
If needed, revert to the previous version that used both databases.
