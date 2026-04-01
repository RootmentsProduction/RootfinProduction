# Reorder Point Notification System

## Overview
The reorder point notification system automatically monitors inventory levels and creates alerts when stock reaches or falls below the reorder point threshold set for each product.

## How It Works

### 1. **Reorder Point Configuration**
- Each item (standalone or group item) has a `reorderPoint` field
- When stock reaches or falls below this point, an alert is automatically created
- Example: If reorder point is set to 2, an alert triggers when stock becomes ≤ 2

### 2. **Automatic Alert Creation**
- Alerts are created automatically when:
  - An invoice is created (stock is reduced)
  - Stock is updated through any transaction
  - The system checks if current stock ≤ reorder point

### 3. **Alert Management**
- Admins and users can view all active reorder alerts in the **Inventory > Reorder Alerts** section
- Each alert shows:
  - Product name and SKU
  - Current stock level
  - Reorder point threshold
  - Warehouse location
  - Item group (if applicable)

### 4. **Alert Actions**

#### Notify
- Click the **Bell icon** to notify admin and users about the low stock
- Marks the alert as "notified" with timestamp
- Can be used to trigger email/SMS notifications (future enhancement)

#### Resolve
- Click the **Check icon** to mark alert as resolved
- Use when stock has been replenished
- Moves alert to "Resolved" tab

#### Delete
- Click the **Trash icon** to remove the alert
- Permanently deletes the alert record

### 5. **Alert Statuses**
- **Active**: Alert is current and needs attention
- **Notified**: Alert has been notified but not yet resolved
- **Resolved**: Stock has been replenished, alert is closed

## Backend Implementation

### Files Created/Modified:

1. **backend/utils/reorderNotification.js**
   - `checkAndCreateReorderAlerts()` - Checks items and creates alerts
   - `createReorderAlert()` - Creates individual alert
   - `getActiveReorderAlerts()` - Retrieves alerts
   - `markAlertAsNotified()` - Marks as notified
   - `resolveReorderAlert()` - Resolves alert

2. **backend/model/ReorderAlert.js**
   - MongoDB schema for storing reorder alerts
   - Fields: itemId, itemName, itemSku, currentStock, reorderPoint, warehouse, status, etc.

3. **backend/route/ReorderAlertRoutes.js**
   - API endpoints for alert management
   - GET `/api/reorder-alerts` - Get all alerts
   - GET `/api/reorder-alerts/warehouse/:warehouse` - Get warehouse-specific alerts
   - PUT `/api/reorder-alerts/:id/notify` - Mark as notified
   - PUT `/api/reorder-alerts/:id/resolve` - Resolve alert
   - DELETE `/api/reorder-alerts/:id` - Delete alert

4. **backend/utils/stockManagement.js** (Modified)
   - Added call to `checkAndCreateReorderAlerts()` after stock updates
   - Automatically triggers alert creation when stock changes

## Frontend Implementation

### Files Created/Modified:

1. **frontend/src/pages/ReorderAlerts.jsx**
   - Main page for viewing and managing reorder alerts
   - Filter by status (Active/Resolved)
   - Filter by warehouse
   - Actions: Notify, Resolve, Delete

2. **frontend/src/App.jsx** (Modified)
   - Added route: `/inventory/reorder-alerts`

3. **frontend/src/components/Nav.jsx** (Modified)
   - Added "Reorder Alerts" link in Inventory menu
   - Added AlertTriangle icon

## Usage Flow

1. **Admin sets reorder point** for each product (e.g., 2 units)
2. **Stock is sold/used** through invoices or adjustments
3. **System automatically checks** if stock ≤ reorder point
4. **Alert is created** if threshold is reached
5. **Admin/User sees alert** in Inventory > Reorder Alerts
6. **Admin clicks "Notify"** to alert team members
7. **Admin clicks "Resolve"** once stock is replenished
8. **Alert moves to Resolved** tab

## Future Enhancements

- Email notifications to admin and users
- SMS notifications for critical low stock
- Automatic purchase order creation
- Slack/Teams integration
- Dashboard widget showing active alerts
- Reorder history and trends
- Bulk reorder point updates
- Reorder suggestions based on sales velocity

## API Integration

To integrate with your backend, ensure:

1. Add ReorderAlertRoutes to your main server file:
```javascript
import ReorderAlertRoutes from "./route/ReorderAlertRoutes.js";
app.use("/api", ReorderAlertRoutes);
```

2. Ensure ReorderAlert model is imported in your database setup

3. The stock management utility will automatically call the reorder check function
