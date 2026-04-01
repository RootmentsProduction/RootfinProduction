# Store Order Status Synchronization Fix

## Problem
When you have two pages open:
1. **Store Orders List** (`/inventory/store-orders`) - showing all orders with "Approve" buttons
2. **Store Order Detail** (`/inventory/store-orders/:id`) - showing a single order with "Accept & Create Transfer Order" button

If you click "Approve" on one page, the other page doesn't refresh, allowing you to accidentally approve the same order twice.

## Solution
Added real-time synchronization between pages using custom events:
- When status changes on one page, it dispatches a `storeOrderStatusChanged` event
- Other pages listen for this event and update their data automatically
- Prevents duplicate approvals and keeps all pages in sync

## Changes Made

### 1. StoreOrders.jsx (List Page)
**Added event dispatch after approval:**
```javascript
// After successful status update
window.dispatchEvent(new CustomEvent("storeOrderStatusChanged", {
  detail: {
    orderId,
    status: newStatus,
    source: "store-orders-list"
  }
}));
```

**Added event listener to update list:**
```javascript
useEffect(() => {
  const handleStatusChange = (event) => {
    const { orderId, status } = event.detail;
    
    // Update the order in the list
    setStoreOrders(prevOrders => {
      return prevOrders.map(order => {
        if (order._id === orderId) {
          return { ...order, status };
        }
        return order;
      });
    });
  };

  window.addEventListener("storeOrderStatusChanged", handleStatusChange);
  return () => {
    window.removeEventListener("storeOrderStatusChanged", handleStatusChange);
  };
}, []);
```

### 2. StoreOrderView.jsx (Detail Page)
**Added event dispatch after rejection:**
```javascript
// After successful rejection
window.dispatchEvent(new CustomEvent("storeOrderStatusChanged", {
  detail: {
    orderId: id,
    status: "rejected",
    source: "store-order-view"
  }
}));
```

**Added event listener to refresh detail:**
```javascript
useEffect(() => {
  const handleStatusChange = (event) => {
    const { orderId, status } = event.detail;
    const currentOrderId = storeOrder?._id || storeOrder?.id;
    
    // Check if this is the current order
    if (currentOrderId === orderId) {
      // Refetch the store order data
      fetch(`${API_URL}/api/inventory/store-orders/${id}`)
        .then(res => res.json())
        .then(data => {
          setStoreOrder(data);
        });
    }
  };

  window.addEventListener("storeOrderStatusChanged", handleStatusChange);
  return () => {
    window.removeEventListener("storeOrderStatusChanged", handleStatusChange);
  };
}, [id, storeOrder, API_URL]);
```

## How It Works

### Scenario 1: Approve from List Page
1. User clicks "Approve" on Store Orders list page
2. Backend updates status to "approved"
3. List page dispatches `storeOrderStatusChanged` event
4. Detail page (if open) receives event and refreshes
5. Detail page now shows "Approved" status
6. "Accept & Create Transfer Order" button is disabled (already approved)

### Scenario 2: Reject from Detail Page
1. User clicks "Reject" on Store Order detail page
2. Backend updates status to "rejected"
3. Detail page dispatches `storeOrderStatusChanged` event
4. List page receives event and updates the order status in the list
5. List page now shows "Rejected" badge
6. "Approve" button is no longer available

### Scenario 3: Multiple Tabs Open
1. User has 3 tabs open: List page, Detail page for Order A, Detail page for Order B
2. User approves Order A from the list page
3. Event is dispatched
4. Detail page for Order A refreshes and shows "Approved"
5. Detail page for Order B ignores the event (different order ID)
6. List page updates Order A's status in the table

## Benefits
- ✅ Prevents duplicate approvals
- ✅ Real-time synchronization across all open pages
- ✅ No manual refresh needed
- ✅ Works across multiple browser tabs
- ✅ Consistent with other parts of the app (inventory adjustments, stock updates)

## Testing

### Test 1: Approve from List, Check Detail
1. Open Store Orders list page
2. Open a specific store order detail page in a new tab
3. Go back to the list page
4. Click "Approve" on that order
5. Switch to the detail page tab
6. **Expected**: Detail page automatically updates to show "Approved" status

### Test 2: Reject from Detail, Check List
1. Open Store Orders list page
2. Open a specific store order detail page in a new tab
3. On the detail page, click "Reject"
4. Switch back to the list page tab
5. **Expected**: List page automatically updates to show "Rejected" badge

### Test 3: Multiple Tabs
1. Open Store Orders list page in 3 tabs
2. In one tab, approve an order
3. Check the other 2 tabs
4. **Expected**: All tabs show the updated status

## Console Logs

When working correctly, you'll see:
```
📦 Dispatching storeOrderStatusChanged event {orderId: "...", newStatus: "approved"}
📦 Store order status changed event received in StoreOrderView
🔄 This store order was updated, refreshing...
✅ Store order data refreshed {newStatus: "approved"}
```

Or:
```
📦 Dispatching storeOrderStatusChanged event {orderId: "...", newStatus: "rejected"}
📦 Store order status changed event received in StoreOrders list
🔄 Updating order SO-00111 status to rejected
```

## Files Changed
1. `frontend/src/pages/StoreOrders.jsx` - Added event dispatch and listener
2. `frontend/src/pages/StoreOrderView.jsx` - Added event dispatch and listener
