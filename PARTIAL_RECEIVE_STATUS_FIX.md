# Partial Receive Status Fix

## Issue
When creating a Purchase Receive with items in transit (e.g., 10 received, 20 in transit), the Purchase Order was still showing as "received" instead of "partially_received".

## Root Cause
The status determination logic was not correctly checking if ALL items were fully received. It was marking as "received" even when items were still in transit.

## Solution

### 1. Fixed Status Logic in Backend
Updated `updatePurchaseOrderStatus()` function in `backend/controllers/PurchaseReceiveController.js`:

**Before**:
```javascript
if (totals.remaining > 0 || totals.inTransit > 0) allReceived = false;
```

**After**:
```javascript
// For "received" status, ALL items must be fully received
if (totals.inTransit > 0 || totals.remaining > 0 || totals.received < totals.ordered) {
  allFullyReceived = false;
}
```

**New Logic**:
- **"received"**: ALL items fully received (received = ordered, no in-transit, no remaining)
- **"partially_received"**: Some items received OR in-transit (but not all fully received)
- **"sent" or "draft"**: No items received or in-transit yet

### 2. Added "Partially Received" Badge to Frontend

Updated status badges in:
- `frontend/src/pages/PurchaseOrderDetail.jsx`
- `frontend/src/pages/PurchaseOrders.jsx`

Added new status:
```javascript
partially_received: { 
  label: "Partially Received", 
  className: "bg-[#fef3c7] text-[#92400e]" // Yellow/amber badge
}
```

## Example Scenarios

### Scenario 1: Partial Receive with In-Transit
```
Purchase Order: 30 items

Purchase Receive:
- Received: 10 items
- In Transit: 20 items

Result: Purchase Order status = "partially_received" ✅
```

### Scenario 2: All Items Received
```
Purchase Order: 30 items

Purchase Receive:
- Received: 30 items
- In Transit: 0 items

Result: Purchase Order status = "received" ✅
```

### Scenario 3: All Items In-Transit
```
Purchase Order: 30 items

Purchase Receive:
- Received: 0 items
- In Transit: 30 items

Result: Purchase Order status = "partially_received" ✅
```

### Scenario 4: Multiple Receives
```
Purchase Order: 30 items

Receive #1:
- Received: 10 items
- In Transit: 20 items
→ Status: "partially_received"

Receive #2:
- Received: 20 items (the ones that were in transit)
- In Transit: 0 items
→ Status: "received" ✅
```

## Files Changed

### Backend
- `backend/controllers/PurchaseReceiveController.js` - Fixed status determination logic

### Frontend
- `frontend/src/pages/PurchaseOrderDetail.jsx` - Added "partially_received" badge
- `frontend/src/pages/PurchaseOrders.jsx` - Added "partially_received" badge

## Testing

1. Create a Purchase Order with 30 items
2. Create a Purchase Receive:
   - Received: 10
   - In Transit: 20
3. Save as "Received"
4. Check Purchase Order status - should show "Partially Received" (yellow badge)
5. Create another Purchase Receive for the same order:
   - Received: 20
   - In Transit: 0
6. Check Purchase Order status - should now show "Received" (green badge)

## Visual

**Status Badges**:
- Draft: Gray
- Sent: Blue
- Partially Received: Yellow/Amber ✅ NEW
- Received: Green
- Cancelled: Red
