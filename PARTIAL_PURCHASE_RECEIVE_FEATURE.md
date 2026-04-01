# Partial Purchase Receive & In-Transit Tracking

## Summary
Implemented partial receive functionality for Purchase Orders, allowing users to:
1. Receive only part of an order while marking remaining items as "in transit"
2. Track Purchase Order status based on received/in-transit quantities
3. Receive remaining items in multiple batches

---

## Problem Statement

### User Scenario
- Purchase Order created for 20 items
- Only 10 items arrive initially
- 10 items are still "in transit" (not yet received)
- User needs to:
  - Receive the 10 items that arrived (update stock)
  - Mark 10 items as "in transit" (not update stock yet)
  - Keep Purchase Order status as "partially_received" (not "received")
  - Later receive the remaining 10 items when they arrive

### Previous Behavior
- Could only mark entire order as "received" or "draft"
- No way to track partial receives
- Purchase Order status didn't reflect actual receive status
- Had to receive all items at once or none

---

## Solution Overview

### New Purchase Order Statuses
1. **draft**: Order created but not sent to vendor
2. **sent**: Order sent to vendor, awaiting delivery
3. **partially_received**: Some items received or in-transit, but not all ✅ NEW
4. **received**: All items fully received
5. **cancelled**: Order cancelled

### New Fields in Purchase Order Model

```javascript
// backend/model/PurchaseOrder.js
{
  status: { 
    type: String, 
    default: "draft" 
    // Values: "draft", "sent", "partially_received", "received", "cancelled"
  },
  
  // Track received quantities for each item
  receivedQuantities: [{
    itemId: { type: mongoose.Schema.Types.ObjectId },
    itemName: String,
    ordered: { type: Number, default: 0 },
    received: { type: Number, default: 0 },
    inTransit: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 },
  }],
}
```

### Existing Fields in Purchase Receive Model

```javascript
// backend/model/PurchaseReceive.js
{
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "ShoeItem" },
    itemName: String,
    itemSku: String,
    ordered: { type: Number, default: 0 },      // From PO
    received: { type: Number, default: 0 },     // Actually received
    inTransit: { type: Number, default: 0 },    // In transit
    quantityToReceive: { type: Number, default: 0 }, // Remaining
  }],
  
  status: { type: String, default: "received" }, // "draft", "in_transit", "received"
}
```

---

## Implementation Details

### 1. Helper Function: `updatePurchaseOrderStatus`

Located in: `backend/controllers/PurchaseReceiveController.js`

**Purpose**: Automatically update Purchase Order status based on all Purchase Receives

**Logic**:
```javascript
// For each item in Purchase Order:
// 1. Sum up received quantities from ALL purchase receives
// 2. Sum up in-transit quantities from ALL purchase receives
// 3. Calculate remaining = ordered - received - inTransit

// Determine status:
if (all items fully received && no items in transit) {
  status = "received"
} else if (any items received OR any items in transit) {
  status = "partially_received"
} else {
  status = "sent" or "draft" (keep existing)
}
```

**Example**:
```
Purchase Order: 20 items

Receive #1:
- Received: 10 items
- In Transit: 10 items
→ PO Status: "partially_received"

Receive #2 (later):
- Received: 10 items (the ones that were in transit)
- In Transit: 0 items
→ PO Status: "received"
```

### 2. Integration Points

#### A. Create Purchase Receive
`backend/controllers/PurchaseReceiveController.js` → `createPurchaseReceive()`

```javascript
// After saving purchase receive
const poUpdateResult = await updatePurchaseOrderStatus(
  receiveData.purchaseOrderId, 
  receiveData.items
);
```

#### B. Update Purchase Receive
`backend/controllers/PurchaseReceiveController.js` → `updatePurchaseReceive()`

```javascript
// After updating purchase receive
const poUpdateResult = await updatePurchaseOrderStatus(
  receiveData.purchaseOrderId, 
  receiveData.items
);
```

### 3. Stock Update Logic

**Important**: Stock is ONLY updated for items marked as "received", NOT for items "in transit"

```javascript
// In createPurchaseReceive and updatePurchaseReceive:
if (receiveData.status === "received" && item.received > 0) {
  // Update stock in warehouse
  await updateItemStock(itemId, item.received, 'add', ...);
}

// Items marked as "inTransit" do NOT update stock
// Stock will be updated when they are later marked as "received"
```

---

## User Workflow

### Scenario: Partial Receive

#### Step 1: Create Purchase Order
```
Purchase Order PO-00123:
- Item A: 20 units
- Item B: 15 units
- Status: "draft"
```

#### Step 2: Send Purchase Order to Vendor
```
Status: "sent"
```

#### Step 3: Partial Delivery Arrives (First Batch)
```
Create Purchase Receive PR-00117:
- Item A: 
  - Ordered: 20
  - Received: 10 ✅ (update stock)
  - In Transit: 10 ⏳ (don't update stock)
  - Remaining: 0
  
- Item B:
  - Ordered: 15
  - Received: 5 ✅ (update stock)
  - In Transit: 10 ⏳ (don't update stock)
  - Remaining: 0

Purchase Order Status: "partially_received" ✅
Stock Updated: +10 Item A, +5 Item B
```

#### Step 4: Remaining Items Arrive (Second Batch)
```
Create Purchase Receive PR-00118:
- Item A:
  - Ordered: 20
  - Received: 10 ✅ (update stock)
  - In Transit: 0
  - Remaining: 0
  
- Item B:
  - Ordered: 15
  - Received: 10 ✅ (update stock)
  - In Transit: 0
  - Remaining: 0

Purchase Order Status: "received" ✅ (all items received)
Stock Updated: +10 Item A, +10 Item B
Total Stock: 20 Item A, 15 Item B
```

---

## Frontend Usage

### Purchase Receive Create Page

The UI already has the necessary fields:

```jsx
// frontend/src/pages/PurchaseReceiveCreate.jsx

<Input
  type="number"
  value={item.received || ""}
  onChange={(e) => handleItemChange(item.id, "received", e.target.value)}
  label="Received"
/>

<Input
  type="number"
  value={item.inTransit || ""}
  onChange={(e) => handleItemChange(item.id, "inTransit", e.target.value)}
  label="In Transit"
/>

<Input
  type="number"
  value={item.quantityToReceive || ""}
  label="Quantity to Receive"
  readOnly
/>
```

### Auto-Calculation

```javascript
// When user changes "received" or "inTransit":
quantityToReceive = ordered - received - inTransit

// Example:
// Ordered: 20
// Received: 10
// In Transit: 10
// Quantity to Receive: 0 (all accounted for)
```

---

## Status Flow Diagram

```
Purchase Order Lifecycle:

draft
  ↓ (send to vendor)
sent
  ↓ (partial receive)
partially_received
  ↓ (receive remaining items)
received

OR

draft
  ↓ (receive all items at once)
received
```

---

## API Changes

### Purchase Order Model
- Added `receivedQuantities` array field
- Updated `status` enum to include "partially_received"

### Purchase Receive Controller
- Added `updatePurchaseOrderStatus()` helper function
- Integrated status update in `createPurchaseReceive()`
- Integrated status update in `updatePurchaseReceive()`

### Response Changes
```javascript
// Purchase Receive response now includes:
{
  ...receiveData,
  stockUpdateSummary: {
    processed: 2,
    skipped: 0,
    total: 2,
    warehouse: "Warehouse",
    status: "completed"
  },
  purchaseOrderStatus: "partially_received" // ✅ NEW
}
```

---

## Testing Instructions

### Test 1: Partial Receive
1. Create a Purchase Order with 20 units of Item A
2. Send the Purchase Order (status → "sent")
3. Create Purchase Receive:
   - Received: 10 units
   - In Transit: 10 units
4. Save as "Received"
5. **Expected Results**:
   - Stock increases by 10 units ✅
   - Purchase Order status: "partially_received" ✅
   - Purchase Receive saved successfully ✅

### Test 2: Complete Remaining Items
1. From Test 1, create another Purchase Receive
2. Enter:
   - Received: 10 units (the ones that were in transit)
   - In Transit: 0 units
3. Save as "Received"
4. **Expected Results**:
   - Stock increases by 10 units (total 20) ✅
   - Purchase Order status: "received" ✅
   - All items accounted for ✅

### Test 3: Multiple Items Partial Receive
1. Create Purchase Order:
   - Item A: 20 units
   - Item B: 15 units
   - Item C: 10 units
2. Create Purchase Receive:
   - Item A: Received 20, In Transit 0 (fully received)
   - Item B: Received 5, In Transit 10 (partial)
   - Item C: Received 0, In Transit 10 (all in transit)
3. **Expected Results**:
   - Stock: +20 Item A, +5 Item B, +0 Item C ✅
   - Purchase Order status: "partially_received" ✅

### Test 4: Edit Purchase Receive
1. Create Purchase Receive with Received: 10, In Transit: 10
2. Edit and change to Received: 15, In Transit: 5
3. **Expected Results**:
   - Stock adjusts by +5 (10 → 15) ✅
   - Purchase Order status updates correctly ✅

---

## Database Migration

### No Migration Required
- New fields have default values
- Existing Purchase Orders will work normally
- `receivedQuantities` will be populated when next Purchase Receive is created/updated

### Backward Compatibility
- Existing Purchase Receives without `inTransit` field will default to 0
- Existing Purchase Orders will show status based on current receives

---

## Benefits

1. **Accurate Inventory**: Only received items update stock, not in-transit items
2. **Better Tracking**: Know exactly what's received vs. what's coming
3. **Flexible Receiving**: Can receive items in multiple batches
4. **Clear Status**: Purchase Order status reflects actual receive state
5. **Audit Trail**: All receives are tracked with quantities and dates

---

## Edge Cases Handled

### 1. Multiple Receives for Same Order
- System sums up all receives to calculate total received/in-transit
- Status updates based on cumulative totals

### 2. Editing Previous Receives
- Stock adjusts by difference (not full quantity)
- Purchase Order status recalculates based on all receives

### 3. Over-Receiving
- System allows receiving more than ordered (for damaged/bonus items)
- Status will show "received" when all ordered items are accounted for

### 4. Changing Status from Received to Draft
- Stock is reversed (subtracted)
- Purchase Order status recalculates

---

## Files Changed

### Backend
- `backend/model/PurchaseOrder.js` - Added `receivedQuantities` field, updated status enum
- `backend/controllers/PurchaseReceiveController.js` - Added `updatePurchaseOrderStatus()` function and integration

### Frontend
- No changes required (UI already supports `inTransit` and `quantityToReceive` fields)

---

## Future Enhancements

1. **Email Notifications**: Notify when items are partially received
2. **Dashboard Widget**: Show orders with items in transit
3. **Expected Arrival Date**: Track when in-transit items are expected
4. **Carrier Tracking**: Link to shipping carrier tracking numbers
5. **Receive History**: Show all receives for a Purchase Order in detail view

---

## Notes

- The `inTransit` field is user-entered, not automatically calculated
- Users must manually enter how many items are in transit
- Stock is ONLY updated for items marked as "received"
- Purchase Order status is automatically calculated based on all receives
- Multiple Purchase Receives can be created for the same Purchase Order
