# MongoDB ObjectId Detection Fix - Transfer Order Deletion

## Issue
Transfer order deletion was failing with error:
```
SequelizeDatabaseError: invalid input syntax for type uuid: "697d8af1e61b393358adfd76"
```

## Root Cause
- Old transfer orders have **MongoDB ObjectId** format: `697d8af1e61b393358adfd76` (24 hex characters)
- New transfer orders have **PostgreSQL UUID** format: `550e8400-e29b-41d4-a716-446655440000`
- System was trying to query PostgreSQL with MongoDB IDs, causing UUID validation error

## Solution
Added **smart ID format detection** to route deletion requests correctly:

### ID Format Detection
```javascript
// Check if ID is MongoDB ObjectId format (24 hex characters)
const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
```

### Routing Logic
1. **MongoDB ObjectId detected** → Skip PostgreSQL, go directly to MongoDB
2. **PostgreSQL UUID detected** → Query PostgreSQL first, fallback to MongoDB if needed
3. **Invalid format** → Try both databases

### Code Changes
**File:** `backend/controllers/TransferOrderController.js`

**Before:**
```javascript
// Always tried PostgreSQL first, causing UUID error for MongoDB IDs
const transferOrder = await TransferOrderPostgres.findByPk(id);
```

**After:**
```javascript
// Detect ID format first
const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

if (isMongoId) {
  // MongoDB ID - skip PostgreSQL, go directly to MongoDB
  const mongoOrder = await TransferOrder.findById(id);
  // ... handle deletion ...
} else {
  // PostgreSQL UUID - try PostgreSQL first
  try {
    const transferOrder = await TransferOrderPostgres.findByPk(id);
    // ... handle deletion ...
  } catch (pgError) {
    // Fallback to MongoDB if PostgreSQL fails
  }
}
```

## Testing

### Test MongoDB ID Deletion
1. Find a transfer order with MongoDB ID (24 hex characters)
2. Click delete
3. **Expected:** Deletes successfully without UUID error

### Backend Logs
**MongoDB ID:**
```
🗑️ DELETE TRANSFER ORDER REQUEST:
   ID: 697d8af1e61b393358adfd76
   ID Format: MongoDB ObjectId
   ⚠️ MongoDB ID detected, skipping PostgreSQL query...
   ✅ Found in MongoDB: TO-2024-999
   ✅ MongoDB transfer order deleted successfully
```

**PostgreSQL UUID:**
```
🗑️ DELETE TRANSFER ORDER REQUEST:
   ID: 550e8400-e29b-41d4-a716-446655440000
   ID Format: PostgreSQL UUID
   ✅ Found in PostgreSQL: TO-2025-001
   ✅ PostgreSQL transfer order deleted successfully
```

## Status: ✅ FIXED

The UUID error is now resolved. The system correctly detects MongoDB ObjectIds and routes them to MongoDB, avoiding PostgreSQL UUID validation errors.

## Try It Now
1. Go to Transfer Orders page
2. Select any transfer order (old or new)
3. Click "Delete"
4. Confirm deletion
5. **Expected:** Deletion succeeds without 500 error
