# Purchase Receive Partial Status - Final Implementation

## Summary
Implemented automatic status detection for Purchase Receives to show "Partially Received" when some items are received and some are in transit. **Purchase Orders remain unchanged** - they keep their original status (sent/draft/received).

---

## Key Points

1. **Purchase Receive Status**: Automatically determined based on items
   - Shows "Partially Received" when some items are received and some in transit
   - Shows "Received" when all items are fully received
   - Shows "In Transit" when all items are in transit (none received)
   - Shows "Draft" when nothing is received or in transit

2. **Purchase Order Status**: **NOT CHANGED**
   - Remains as "sent", "draft", "received", or "cancelled"
   - Does NOT show "partially_received"
   - User manually changes Purchase Order status when needed

3. **Stock Updates**: Only for received items
   - Items marked as "received" update stock
   - Items marked as "in transit" do NOT update stock

---

## Purchase Receive Status Logic

### Automatic Status Determination

```javascript
// System automatically calculates status based on items:

if (all items fully received && no items in transit) {
  status = "received"
} else if (some items received && some items in transit) {
  status = "partially_received"
} else if (all items in transit && no items received) {
  status = "in_transit"
} else {
  status = "draft"
}
```

### Examples

#### Example 1: Partially Received
```
Purchase Receive:
- Item A: Ordered 30, Received 10, In Transit 20

Result:
- Purchase Receive status: "partially_received" ✅
- Purchase Order status: "sent" (unchanged) ✅
- Stock updated: +10 items ✅
```

#### Example 2: Fully Received
```
Purchase Receive:
- Item A: Ordered 30, Received 30, In Transit 0

Result:
- Purchase Receive status: "received" ✅
- Purchase Order status: "sent" (unchanged) ✅
- Stock updated: +30 items ✅
```

#### Example 3: All In Transit
```
Purchase Receive:
- Item A: Ordered 30, Received 0, In Transit 30

Result:
- Purchase Receive status: "in_transit" ✅
- Purchase Order status: "sent" (unchanged) ✅
- Stock updated: 0 items (nothing received yet) ✅
```

---

## User Workflow

### Scenario: Partial Delivery

#### Step 1: Create Purchase Order
```
Purchase Order PO-00123:
- Item A: 30 units
- Status: "draft"
```

#### Step 2: Send to Vendor
```
Purchase Order PO-00123:
- Status: "sent" ✅
```

#### Step 3: First Delivery (Partial)
```
Create Purchase Receive PR-00117:
- Item A: Received 10, In Transit 20
- Click "Save as Received"

Result:
- Purchase Receive status: "partially_received" ✅ (yellow badge)
- Purchase Order status: "sent" ✅ (blue badge - unchanged)
- Stock: +10 items ✅
```

#### Step 4: Second Delivery (Remaining Items)
```
Create Purchase Receive PR-00118:
- Item A: Received 20, In Transit 0
- Click "Save as Received"

Result:
- Purchase Receive status: "received" ✅ (green badge)
- Purchase Order status: "sent" ✅ (blue badge - still unchanged)
- Stock: +20 items (total 30) ✅
```

#### Step 5: Manually Update Purchase Order (Optional)
```
User manually changes Purchase Order status to "received"
- Purchase Order status: "received" ✅ (green badge)
```

---

## Status Badges

### Purchase Receive Statuses
| Status | Badge Color | Description |
|--------|-------------|-------------|
| Draft | Gray | Not finalized |
| In Transit | Yellow/Amber | All items in transit, none received |
| Partially Received | Yellow/Amber | Some received, some in transit |
| Received | Green | All items fully received |

### Purchase Order Statuses (Unchanged)
| Status | Badge Color | Description |
|--------|-------------|-------------|
| Draft | Gray | Not sent to vendor |
| Sent | Blue | Sent to vendor, awaiting delivery |
| Received | Green | Manually marked as received |
| Cancelled | Red | Order cancelled |

---

## Implementation Details

### Backend Changes

#### 1. Auto-Detect Purchase Receive Status
`backend/controllers/PurchaseReceiveController.js` → `createPurchaseReceive()`

```javascript
// Automatically determine status based on items
let hasReceived = false;
let hasInTransit = false;
let allFullyReceived = true;

receiveData.items.forEach(item => {
  const received = parseFloat(item.received) || 0;
  const inTransit = parseFloat(item.inTransit) || 0;
  const ordered = parseFloat(item.ordered) || 0;
  
  if (received > 0) hasReceived = true;
  if (inTransit > 0) hasInTransit = true;
  if (inTransit > 0 || received < ordered) allFullyReceived = false;
});

// Determine status
if (allFullyReceived && hasReceived) {
  receiveData.status = "received";
} else if (hasReceived && hasInTransit) {
  receiveData.status = "partially_received";
} else if (hasInTransit && !hasReceived) {
  receiveData.status = "in_transit";
} else {
  receiveData.status = "draft";
}
```

#### 2. Stock Update Logic
```javascript
// Stock updates for "received" or "partially_received" status
if (statusLower === "received" || statusLower === "partially_received") {
  // Update stock for received items only
  // Items in transit do NOT update stock
}
```

#### 3. Purchase Order Status - NOT UPDATED
```javascript
// Note: We do NOT update Purchase Order status
// Purchase Order status remains unchanged
// Only the Purchase Receive shows "partially_received" status
```

### Frontend Changes

#### 1. Purchase Receive Pages - Added Status Badges
- `frontend/src/pages/PurchaseReceives.jsx`
- `frontend/src/pages/PurchaseReceiveDetail.jsx`

```javascript
const statusMap = {
  draft: { label: "Draft", className: "bg-[#f3f4f6] text-[#6b7280]" },
  in_transit: { label: "In Transit", className: "bg-[#fef3c7] text-[#92400e]" },
  partially_received: { label: "Partially Received", className: "bg-[#fef3c7] text-[#92400e]" },
  received: { label: "Received", className: "bg-[#dcfce7] text-[#166534]" },
};
```

#### 2. Purchase Order Pages - NO CHANGES
- `frontend/src/pages/PurchaseOrders.jsx`
- `frontend/src/pages/PurchaseOrderDetail.jsx`

Status badges remain:
```javascript
const statusMap = {
  draft: { label: "Draft", className: "bg-[#f3f4f6] text-[#6b7280]" },
  sent: { label: "Sent", className: "bg-[#dbeafe] text-[#1e40af]" },
  received: { label: "Received", className: "bg-[#dcfce7] text-[#166534]" },
  cancelled: { label: "Cancelled", className: "bg-[#fee2e2] text-[#991b1b]" },
};
```

---

## Files Changed

### Backend
- `backend/controllers/PurchaseReceiveController.js`
  - Added auto-detection logic in `createPurchaseReceive()`
  - Updated stock update conditions to include "partially_received"
  - Updated `updatePurchaseReceive()` to handle "partially_received"
  - **Removed** Purchase Order status update logic
- `backend/model/PurchaseReceive.js`
  - Updated status comment to include "partially_received"

### Frontend
- `frontend/src/pages/PurchaseReceives.jsx`
  - Added "partially_received" status badge
- `frontend/src/pages/PurchaseReceiveDetail.jsx`
  - Added "partially_received" and "in_transit" status badges

### NOT Changed
- `backend/model/PurchaseOrder.js` - No changes
- `frontend/src/pages/PurchaseOrders.jsx` - No changes
- `frontend/src/pages/PurchaseOrderDetail.jsx` - No changes

---

## Testing

### Test 1: Partial Receive
1. Create Purchase Order with 30 items, status "sent"
2. Create Purchase Receive:
   - Received: 10
   - In Transit: 20
3. Click "Save as Received"
4. **Expected**:
   - Purchase Receive shows "Partially Received" (yellow badge) ✅
   - Purchase Order shows "Sent" (blue badge - unchanged) ✅
   - Stock increases by 10 ✅

### Test 2: Full Receive
1. From Test 1, create another Purchase Receive:
   - Received: 20
   - In Transit: 0
2. Click "Save as Received"
3. **Expected**:
   - New Purchase Receive shows "Received" (green badge) ✅
   - Purchase Order still shows "Sent" (blue badge - unchanged) ✅
   - Stock increases by 20 (total 30) ✅

### Test 3: All In Transit
1. Create Purchase Order with 30 items
2. Create Purchase Receive:
   - Received: 0
   - In Transit: 30
3. Click "Save as Received"
4. **Expected**:
   - Purchase Receive shows "In Transit" (yellow badge) ✅
   - Purchase Order shows "Sent" (unchanged) ✅
   - Stock does NOT increase (0 items received) ✅

---

## Benefits

1. **Clear Visibility**: Purchase Receives show accurate status (partially received, in transit, etc.)
2. **Purchase Order Simplicity**: Purchase Order status remains simple (draft, sent, received, cancelled)
3. **Manual Control**: Users manually update Purchase Order status when they want
4. **Accurate Stock**: Stock only updates for actually received items
5. **Automatic Detection**: System automatically determines Purchase Receive status

---

## Notes

- Purchase Receive status is **automatically determined** - users don't select it
- Purchase Order status is **NOT automatically updated** - users manually change it
- Stock updates only for items marked as "received" (not "in transit")
- The "Save as Received" button name remains the same
- System intelligently determines the correct Purchase Receive status based on item quantities
