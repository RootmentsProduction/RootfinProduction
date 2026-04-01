# User Experience Guide

## What Users Will See

### For Test Stores (4 Allowed Stores)

When users from these stores login:
- Suitorguymgroad@gmail.com
- suitorguy.trivandrum@gmail.com
- groomsweddinghubkannur@gmail.com
- groomsweddinghubperinthalmanna@gmail.com

**Navigation Menu Will Show:**
```
📄 Day Book
📄 Financial Summary
🛒 Sales ▼
   └─ Invoices
   └─ Invoice Return
📦 Inventory ▼
   └─ Items
   └─ Transfer Orders
   └─ Store Orders
   └─ (other inventory items)
🚚 Purchase ▼ (if admin/warehouse)
📊 Reports ▼
💰 Income & Expenses
💰 Cash / Bank Ledger
📁 Close Report (if admin)
📓 Admin Close (if admin)
🏪 Manage Stores (if admin)
```

---

### For Other Stores (Non-Allowed)

When users from other stores login:

**Navigation Menu Will Show:**
```
📄 Day Book
📄 Financial Summary
[Sales section HIDDEN]
[Inventory section HIDDEN]
🚚 Purchase ▼ (if admin/warehouse)
📊 Reports ▼
💰 Income & Expenses
💰 Cash / Bank Ledger
📁 Close Report (if admin)
📓 Admin Close (if admin)
🏪 Manage Stores (if admin)
```

**Note:** Sales and Inventory sections are completely hidden - no menu items visible.

---

## Bills Page - Bulk Add Feature

### Before (Old Way):
Users had to:
1. Click "Add New Row" for each item
2. Manually select item from dropdown
3. Enter quantity manually
4. Repeat for each item

### After (New Way):
Users can now:
1. Click "Bulk Add Items" button
2. Scan multiple barcodes quickly
3. Adjust quantities in the modal
4. Add all items at once

### Bulk Add Modal Layout:

```
┌─────────────────────────────────────────────────────────────┐
│  Bulk Add Items                                    [X]       │
│  Selected: 3 items • Total Qty: 15                          │
├──────────────────────────────┬──────────────────────────────┤
│  LEFT SIDE                   │  RIGHT SIDE                  │
│  (All Available Items)       │  (Selected Items)            │
│                              │                              │
│  [Search or scan barcode]    │  Selected Items              │
│                              │                              │
│  ┌────────────────────────┐  │  ┌────────────────────────┐ │
│  │ Item Name              │  │  │ Item Name          [X] │ │
│  │ SKU: ABC123            │  │  │ ABC123                 │ │
│  │ Stock: 50 pcs          │  │  │ [-] [5] [+]            │ │
│  └────────────────────────┘  │  └────────────────────────┘ │
│                              │                              │
│  ┌────────────────────────┐  │  ┌────────────────────────┐ │
│  │ Another Item           │  │  │ Another Item       [X] │ │
│  │ SKU: XYZ789            │  │  │ XYZ789                 │ │
│  │ Stock: 30 pcs          │  │  │ [-] [8] [+]            │ │
│  └────────────────────────┘  │  └────────────────────────┘ │
│                              │                              │
│  ┌────────────────────────┐  │  ┌────────────────────────┐ │
│  │ Out of Stock Item      │  │  │ Third Item         [X] │ │
│  │ SKU: DEF456            │  │  │ DEF456                 │ │
│  │ No Stock (RED)         │  │  │ [-] [2] [+]            │ │
│  └────────────────────────┘  │  └────────────────────────┘ │
│                              │                              │
├──────────────────────────────┴──────────────────────────────┤
│                    [Cancel]  [Add Items (3)]                │
└─────────────────────────────────────────────────────────────┘
```

### Key Features:
- ✅ **Left side**: Browse all items, see stock levels
- ✅ **Right side**: Manage selected items with quantity controls
- ✅ **Red items**: Out of stock items cannot be selected
- ✅ **Barcode scanning**: Type or scan to quickly find items
- ✅ **Quantity controls**: +/- buttons or manual input
- ✅ **Real-time count**: Header shows selected count and total quantity

---

## User Workflows

### Workflow 1: Store User Creating a Bill with Bulk Add

1. Navigate to Bills page
2. Click "New Bill"
3. Fill in vendor and bill details
4. Click "Bulk Add Items" button
5. Scan barcodes or search for items
6. Items automatically added to selected list
7. Adjust quantities if needed
8. Click "Add Items"
9. All items added to bill table
10. Complete bill and save

**Time Saved:** ~70% faster than manual row-by-row entry

---

### Workflow 2: Testing Access Control

**Test Store User (MG Road):**
1. Login with Suitorguymgroad@gmail.com
2. See Sales menu → Click to expand
3. See Inventory menu → Click to expand
4. Access all Sales and Inventory features
5. ✅ Full access granted

**Other Store User:**
1. Login with otheremail@gmail.com
2. Sales menu NOT visible
3. Inventory menu NOT visible
4. Can still access Day Book, Reports, etc.
5. ❌ Sales/Inventory access denied (as expected)

---

## Benefits

### For Test Stores:
- ✅ Early access to new Sales and Inventory features
- ✅ Provide feedback before full rollout
- ✅ Help identify issues before other stores use it

### For Other Stores:
- ✅ Stable system without new features
- ✅ No disruption to current workflows
- ✅ Will get access after successful testing

### For Admins:
- ✅ Easy to add/remove test stores
- ✅ Single JSON file to manage access
- ✅ No code changes needed
- ✅ Safe, controlled rollout

---

## FAQ

**Q: Why can't I see Sales and Inventory sections?**
A: Your store is not in the test group yet. These features are being tested with 4 stores first.

**Q: When will my store get access?**
A: After successful testing with the initial 4 stores, access will be gradually expanded.

**Q: How do I request access for my store?**
A: Contact the admin to add your email to the allowed list.

**Q: Will this affect my current work?**
A: No, all existing features remain unchanged. Only new Sales/Inventory sections are restricted.

**Q: Can I still use Purchase features?**
A: Yes, Purchase section access is controlled separately (admin/warehouse only).
