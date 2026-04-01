# Edit Purchase Receive - Auto Status & Stock Adjustment

## Feature
When editing a Purchase Receive, the system automatically:
1. Detects the new status based on received/in-transit quantities
2. Adjusts stock based on the changes

---

## Scenario: Edit Fully Received to Partially Received

### Initial State
```
Purchase Receive PR-00117:
- Item A: Ordered 30, Received 30, In Transit 0
- Status: "received" ✅
- Stock: 30 items in warehouse ✅
```

### User Edits
```
User changes Purchase Receive:
- Item A: Ordered 30, Received 20, In Transit 10
- (Changed 10 items from "received" to "in transit")
```

### System Actions

#### 1. Auto-Detect New Status
```javascript
// System calculates:
hasReceived = true (20 items)
hasInTransit = true (10 items)
allFullyReceived = false (10 still in transit)

// Result:
New status = "partially_received" ✅
```

#### 2. Calculate Stock Adjustment
```javascript
// Old state:
oldStatus = "received"
oldReceived = 30

// New state:
newStatus = "partially_received"
newReceived = 20

// Calculation:
qtyDifference = newReceived - oldReceived
qtyDifference = 20 - 30 = -10

// Stock adjustment:
operation = "adjust"
qtyToUpdate = -10 (reduce stock by 10)
```

#### 3. Update Stock
```
Stock before: 30 items
Stock adjustment: -10 items
Stock after: 20 items ✅
```

### Final State
```
Purchase Receive PR-00117:
- Item A: Ordered 30, Received 20, In Transit 10
- Status: "partially_received" ✅ (auto-changed from "received")
- Stock: 20 items in warehouse ✅ (reduced by 10)
```

---

## How It Works

### Auto-Status Detection Logic

```javascript
// When updating Purchase Receive:

// 1. Calculate item states
let hasReceived = false;
let hasInTransit = false;
let allFullyReceived = true;

items.forEach(item => {
  if (item.received > 0) hasReceived = true;
  if (item.inTransit > 0) hasInTransit = true;
  if (item.inTransit > 0 || item.received < item.ordered) {
    allFullyReceived = false;
  }
});

// 2. Determine status
if (allFullyReceived && hasReceived) {
  status = "received";
} else if (hasReceived && hasInTransit) {
  status = "partially_received";
} else if (hasInTransit && !hasReceived) {
  status = "in_transit";
} else {
  status = "draft";
}

// 3. Update status if changed
if (autoDetectedStatus !== currentStatus) {
  purchaseReceive.status = autoDetectedStatus;
  await purchaseReceive.save();
}
```

### Stock Adjustment Logic

```javascript
// For each item:

// 1. Get old and new quantities
const oldReceivedQty = (oldStatus === "received" || oldStatus === "partially_received") 
  ? oldItem.received 
  : 0;
const newReceivedQty = newItem.received;

// 2. Calculate difference
const qtyDifference = newReceivedQty - oldReceivedQty;

// 3. Determine operation
if (oldWasReceived && newIsReceived) {
  // Both received/partially_received - adjust by difference
  operation = "adjust";
  qtyToUpdate = qtyDifference;
}

// 4. Update stock
await updateItemStock(itemId, qtyToUpdate, operation, ...);
```

---

## Examples

### Example 1: Fully Received → Partially Received
```
Before Edit:
- Received: 30, In Transit: 0
- Status: "received"
- Stock: 30

After Edit:
- Received: 20, In Transit: 10
- Status: "partially_received" ✅ (auto-changed)
- Stock: 20 ✅ (reduced by 10)
```

### Example 2: Partially Received → Fully Received
```
Before Edit:
- Received: 20, In Transit: 10
- Status: "partially_received"
- Stock: 20

After Edit:
- Received: 30, In Transit: 0
- Status: "received" ✅ (auto-changed)
- Stock: 30 ✅ (increased by 10)
```

### Example 3: Received → In Transit
```
Before Edit:
- Received: 30, In Transit: 0
- Status: "received"
- Stock: 30

After Edit:
- Received: 0, In Transit: 30
- Status: "in_transit" ✅ (auto-changed)
- Stock: 0 ✅ (reduced by 30)
```

### Example 4: Increase Received Quantity
```
Before Edit:
- Received: 20, In Transit: 10
- Status: "partially_received"
- Stock: 20

After Edit:
- Received: 25, In Transit: 5
- Status: "partially_received" ✅ (stays same)
- Stock: 25 ✅ (increased by 5)
```

### Example 5: Decrease Received Quantity
```
Before Edit:
- Received: 20, In Transit: 10
- Status: "partially_received"
- Stock: 20

After Edit:
- Received: 15, In Transit: 15
- Status: "partially_received" ✅ (stays same)
- Stock: 15 ✅ (reduced by 5)
```

---

## Implementation Details

### Backend Changes

#### 1. Added Auto-Status Detection in `updatePurchaseReceive()`
`backend/controllers/PurchaseReceiveController.js`

```javascript
// After updating purchase receive, auto-detect status
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

// Determine and update status
let autoDetectedStatus = ...;
if (autoDetectedStatus !== receiveData.status) {
  purchaseReceive.status = autoDetectedStatus;
  await purchaseReceive.save();
}
```

#### 2. Stock Adjustment Uses Auto-Detected Status
```javascript
// Use finalNewStatus (auto-detected) instead of user-provided status
const finalNewStatus = autoDetectedStatus;

// Stock updates based on finalNewStatus
if ((finalNewStatus === "received" || finalNewStatus === "partially_received") && newReceivedQty > 0) {
  // Calculate difference and adjust stock
  const qtyDifference = newReceivedQty - oldReceivedQty;
  await updateItemStock(itemId, qtyDifference, 'adjust', ...);
}
```

---

## User Workflow

### Step 1: View Purchase Receive
```
Purchase Receive PR-00117:
- Item A: Received 30, In Transit 0
- Status: "Received" (green badge)
- Stock: 30 items
```

### Step 2: Click Edit
```
Navigate to edit page
```

### Step 3: Change Quantities
```
Change Item A:
- Received: 30 → 20
- In Transit: 0 → 10
```

### Step 4: Save
```
Click "Save" or "Update"
```

### Step 5: System Auto-Updates
```
System automatically:
1. Detects new status: "partially_received"
2. Calculates stock difference: -10
3. Updates stock: 30 → 20
4. Saves changes
```

### Step 6: View Updated Receive
```
Purchase Receive PR-00117:
- Item A: Received 20, In Transit 10
- Status: "Partially Received" (yellow badge) ✅
- Stock: 20 items ✅
```

---

## Benefits

1. **Automatic Status**: No manual status selection needed
2. **Accurate Stock**: Stock automatically adjusts based on changes
3. **Prevents Errors**: Can't have wrong status or stock levels
4. **Flexible Editing**: Can move items between received/in-transit freely
5. **Audit Trail**: All changes are tracked

---

## Edge Cases Handled

### 1. Multiple Items
```
Item A: 30 → 20 received (reduce stock by 10)
Item B: 20 → 25 received (increase stock by 5)

Result: Each item's stock adjusts independently
```

### 2. Status Transitions
```
"received" → "partially_received": Stock reduces
"partially_received" → "received": Stock increases
"received" → "in_transit": Stock reduces to 0
"in_transit" → "received": Stock increases from 0
```

### 3. No Changes
```
If quantities don't change:
- Status stays same
- Stock stays same
- No unnecessary updates
```

### 4. Partial Changes
```
If only some items change:
- Only changed items' stock adjusts
- Unchanged items' stock stays same
```

---

## Testing

### Test 1: Edit Fully Received to Partially Received
1. Create Purchase Receive with 30 items received
2. Verify stock = 30
3. Edit: Change to 20 received, 10 in transit
4. Save
5. **Expected**:
   - Status changes to "Partially Received" ✅
   - Stock reduces to 20 ✅

### Test 2: Edit Partially Received to Fully Received
1. Create Purchase Receive with 20 received, 10 in transit
2. Verify stock = 20
3. Edit: Change to 30 received, 0 in transit
4. Save
5. **Expected**:
   - Status changes to "Received" ✅
   - Stock increases to 30 ✅

### Test 3: Edit Received to In Transit
1. Create Purchase Receive with 30 items received
2. Verify stock = 30
3. Edit: Change to 0 received, 30 in transit
4. Save
5. **Expected**:
   - Status changes to "In Transit" ✅
   - Stock reduces to 0 ✅

---

## Files Changed

### Backend
- `backend/controllers/PurchaseReceiveController.js`
  - Added auto-status detection in `updatePurchaseReceive()`
  - Updated stock adjustment logic to use auto-detected status
  - Changed all `newStatus` references to `finalNewStatus`

---

## Notes

- Status is automatically determined - users don't select it
- Stock adjusts by the difference (not full quantity)
- Works for both increases and decreases in received quantity
- Handles transitions between all status types
- No manual intervention needed - system handles everything automatically
