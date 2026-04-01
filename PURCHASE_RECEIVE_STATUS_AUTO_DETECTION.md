# Purchase Receive Status Auto-Detection

## Issue
When creating a Purchase Receive with items in transit (e.g., 10 received, 20 in transit), the Purchase Receive was showing status as "Received" instead of "Partially Received". The Purchase Order was correctly showing "Partially Received", but the Purchase Receive itself was not.

## Solution
Implemented automatic status detection for Purchase Receives based on the items' received and in-transit quantities.

---

## Status Logic

### Purchase Receive Status
The system now automatically determines the Purchase Receive status based on items:

1. **"received"**: All items fully received (no in-transit)
   - All items have `received = ordered` and `inTransit = 0`

2. **"partially_received"**: Some items received, some in-transit
   - Some items have `received > 0` AND some items have `inTransit > 0`
   - OR some items have `received < ordered`

3. **"in_transit"**: All items in-transit (none received yet)
   - All items have `received = 0` and `inTransit > 0`

4. **"draft"**: Nothing received or in-transit
   - All items have `received = 0` and `inTransit = 0`

### Examples

#### Example 1: Partially Received
```
Item A:
- Ordered: 30
- Received: 10
- In Transit: 20

Result: Purchase Receive status = "partially_received" ✅
```

#### Example 2: All Received
```
Item A:
- Ordered: 30
- Received: 30
- In Transit: 0

Result: Purchase Receive status = "received" ✅
```

#### Example 3: All In Transit
```
Item A:
- Ordered: 30
- Received: 0
- In Transit: 30

Result: Purchase Receive status = "in_transit" ✅
```

#### Example 4: Multiple Items Mixed
```
Item A:
- Ordered: 30
- Received: 30
- In Transit: 0

Item B:
- Ordered: 20
- Received: 10
- In Transit: 10

Result: Purchase Receive status = "partially_received" ✅
(because Item B is not fully received)
```

---

## Stock Update Logic

Stock is ONLY updated when Purchase Receive status is:
- **"received"** ✅
- **"partially_received"** ✅

Stock is NOT updated when status is:
- **"in_transit"** ❌ (items not physically received yet)
- **"draft"** ❌ (not finalized)

### Stock Update Rules
- Only the `received` quantity updates stock
- The `inTransit` quantity does NOT update stock
- When items move from "in_transit" to "received", stock is updated

---

## Implementation Details

### Backend Changes

#### 1. Auto-Detect Status in `createPurchaseReceive()`
`backend/controllers/PurchaseReceiveController.js`

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

#### 2. Update Stock Logic
Changed from:
```javascript
if (statusLower === "received") {
  // Update stock
}
```

To:
```javascript
if (statusLower === "received" || statusLower === "partially_received") {
  // Update stock for received items only
}
```

#### 3. Update Purchase Receive Model
`backend/model/PurchaseReceive.js`

```javascript
status: { 
  type: String, 
  default: "received" 
  // Values: "draft", "in_transit", "partially_received", "received"
}
```

### Frontend Changes

#### 1. Added Status Badges
Updated in:
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

---

## User Workflow

### Scenario: Partial Receive

#### Step 1: Create Purchase Receive
```
Purchase Order PO-00123: 30 items

Create Purchase Receive:
- Received: 10 items
- In Transit: 20 items
- Click "Save as Received"
```

#### Step 2: System Auto-Detects Status
```
System calculates:
- hasReceived = true (10 items)
- hasInTransit = true (20 items)
- allFullyReceived = false (20 still in transit)

Result:
- Purchase Receive status = "partially_received" ✅
- Stock updated by +10 items ✅
- Purchase Order status = "partially_received" ✅
```

#### Step 3: Later, Receive Remaining Items
```
Create another Purchase Receive:
- Received: 20 items (the ones that were in transit)
- In Transit: 0 items
- Click "Save as Received"

System calculates:
- hasReceived = true (20 items)
- hasInTransit = false (0 items)
- allFullyReceived = true (all received)

Result:
- Purchase Receive status = "received" ✅
- Stock updated by +20 items ✅
- Purchase Order status = "received" ✅
- Total stock: 30 items ✅
```

---

## Status Badge Colors

| Status | Badge Color | Use Case |
|--------|-------------|----------|
| Draft | Gray | Not finalized |
| In Transit | Yellow/Amber | All items in transit |
| Partially Received | Yellow/Amber | Some received, some in transit |
| Received | Green | All items received |

---

## Files Changed

### Backend
- `backend/controllers/PurchaseReceiveController.js`
  - Added auto-detection logic in `createPurchaseReceive()`
  - Updated stock update conditions to include "partially_received"
  - Updated `updatePurchaseReceive()` to handle "partially_received"
- `backend/model/PurchaseReceive.js`
  - Updated status comment to include "partially_received"

### Frontend
- `frontend/src/pages/PurchaseReceives.jsx`
  - Added "partially_received" status badge
- `frontend/src/pages/PurchaseReceiveDetail.jsx`
  - Added "partially_received" and "in_transit" status badges

---

## Benefits

1. **Accurate Status**: Purchase Receive status reflects actual receive state
2. **Automatic Detection**: No manual status selection needed
3. **Clear Visibility**: Users can see at a glance which receives are partial
4. **Consistent Logic**: Both Purchase Order and Purchase Receive show matching statuses
5. **Stock Accuracy**: Stock only updates for actually received items

---

## Testing

1. Create Purchase Order with 30 items
2. Create Purchase Receive:
   - Received: 10
   - In Transit: 20
3. Click "Save as Received"
4. **Expected**:
   - Purchase Receive shows "Partially Received" (yellow badge) ✅
   - Purchase Order shows "Partially Received" (yellow badge) ✅
   - Stock increases by 10 ✅
5. Create another Purchase Receive:
   - Received: 20
   - In Transit: 0
6. **Expected**:
   - New Purchase Receive shows "Received" (green badge) ✅
   - Purchase Order shows "Received" (green badge) ✅
   - Stock increases by 20 (total 30) ✅

---

## Notes

- Status is automatically determined - users don't need to select it
- The "Save as Received" button name remains the same (doesn't change to "Save as Partially Received")
- System intelligently determines the correct status based on item quantities
- Stock updates are accurate - only received items affect inventory
