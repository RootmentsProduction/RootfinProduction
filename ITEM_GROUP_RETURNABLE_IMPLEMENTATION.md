# Item Group Returnable Status - Implementation Details

## Architecture

```
Item Group (has returnable status)
    ↓
    ├─ Item 1 (returnable: null → inherits from group)
    ├─ Item 2 (returnable: null → inherits from group)
    └─ Item 3 (returnable: null → inherits from group)
    
When fetched from backend:
    ↓
    ├─ Item 1 (returnable: true/false - inherited)
    ├─ Item 2 (returnable: true/false - inherited)
    └─ Item 3 (returnable: true/false - inherited)
```

## Code Changes

### 1. Model Layer (backend/model/ItemGroup.js)

**Before:**
```javascript
items: [
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    costPrice: { type: Number, default: 0 },
    // ... other fields
  }
]
```

**After:**
```javascript
items: [
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    returnable: { type: Boolean, default: null }, // NEW
    costPrice: { type: Number, default: 0 },
    // ... other fields
  }
]
```

### 2. Controller Layer (backend/controllers/ItemGroupController.js)

**Added to getItemGroupById function (before return statement):**
```javascript
// Apply returnable inheritance: items inherit from group if not explicitly set
if (groupObj.items && Array.isArray(groupObj.items)) {
  groupObj.items = groupObj.items.map(item => {
    // If item's returnable is null/undefined, inherit from group
    if (item.returnable === null || item.returnable === undefined) {
      item.returnable = groupObj.returnable;
    }
    return item;
  });
}
```

**Location:** Line ~783 in ItemGroupController.js, just before `return res.json(groupObj);`

### 3. Frontend - Item Details (frontend/src/pages/ShoeSalesItemDetailFromGroup.jsx)

**Added to Status section:**
```jsx
<span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${item.returnable !== false ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
  <span className={`w-2 h-2 rounded-full ${item.returnable !== false ? 'bg-purple-500' : 'bg-gray-400'}`}></span>
  {item.returnable !== false ? 'Returnable' : 'Non-Returnable'}
</span>
```

**Location:** In the Status section of the Overview tab, after Purchasable badge

### 4. Frontend - Item Group Create (frontend/src/pages/ShoeSalesItemGroupCreate.jsx)

**Updated item mapping:**
```javascript
items: validItems.map(item => {
  return {
    name: itemName,
    sku: item.sku || "",
    // ... other fields
    returnable: null, // Items inherit returnable status from group
  };
})
```

**Location:** In handleSave function, around line 763

## Data Flow

### Creating an Item Group

```
User fills form:
  - Group name: "Shoes"
  - Returnable: true (checked)
  - Items: [Item1, Item2, Item3]
    ↓
Frontend maps items:
  - Item1: { name: "...", returnable: null, ... }
  - Item2: { name: "...", returnable: null, ... }
  - Item3: { name: "...", returnable: null, ... }
    ↓
Backend saves:
  - ItemGroup: { name: "Shoes", returnable: true, items: [...] }
    ↓
Database stores items with returnable: null
```

### Fetching an Item Group

```
Frontend requests: GET /api/shoe-sales/item-groups/{id}
    ↓
Backend fetches ItemGroup from database
    ↓
Backend applies inheritance logic:
  - For each item where returnable is null/undefined:
    - Set item.returnable = group.returnable
    ↓
Backend returns:
  {
    name: "Shoes",
    returnable: true,
    items: [
      { name: "Item1", returnable: true, ... },
      { name: "Item2", returnable: true, ... },
      { name: "Item3", returnable: true, ... }
    ]
  }
    ↓
Frontend displays item with returnable status
```

### Processing Returns

```
User views sales invoice with items from "Shoes" group
    ↓
Frontend checks: item.itemData?.returnable !== false
    ↓
Since item.returnable = true (inherited):
  - Show item as returnable ✓
  - Allow return quantity input
  - Process return successfully
```

## Inheritance Logic

The inheritance uses a simple rule:

```javascript
if (item.returnable === null || item.returnable === undefined) {
  item.returnable = groupObj.returnable;
}
```

This means:
- `null` → inherit (default for new items)
- `undefined` → inherit (for backward compatibility)
- `true` → returnable (explicit override)
- `false` → non-returnable (explicit override)

## Return Eligibility Check

The existing return logic in SalesInvoiceDetail already supports this:

```javascript
const hasReturnableItems = invoice?.lineItems?.some(
  (item) => item.itemData?.returnable !== false
) || false;
```

This treats:
- `true` → returnable ✓
- `false` → not returnable ✗
- `null` → returnable ✓ (because null !== false)
- `undefined` → returnable ✓ (because undefined !== false)

## Backward Compatibility

- Existing items without returnable field will have `undefined`
- `undefined !== false` evaluates to true, so they're treated as returnable
- This maintains backward compatibility with existing data

## Future Enhancements

### Per-Item Override
To allow individual items to override group status:

```javascript
// In frontend when editing item
<input 
  type="checkbox" 
  checked={item.returnable !== false}
  onChange={(e) => setItem({...item, returnable: e.target.checked})}
/>
```

### Audit Trail
Track when returnable status changes:

```javascript
// In ItemHistory model
{
  itemGroupId: "...",
  changeType: "RETURNABLE_STATUS_CHANGED",
  oldValue: true,
  newValue: false,
  changedBy: "user@example.com",
  changedAt: new Date()
}
```

## Testing Scenarios

### Scenario 1: Create Returnable Group
1. Create item group with returnable = true
2. Add 3 items
3. Fetch group → all items have returnable = true
4. Create invoice with these items
5. Try to return → should work

### Scenario 2: Create Non-Returnable Group
1. Create item group with returnable = false
2. Add 3 items
3. Fetch group → all items have returnable = false
4. Create invoice with these items
5. Try to return → should show error

### Scenario 3: Edit Group Status
1. Create returnable group with items
2. Edit group → uncheck returnable
3. Fetch group → all items now have returnable = false
4. Create invoice with these items
5. Try to return → should show error

### Scenario 4: Mixed Items (Future)
1. Create returnable group
2. Edit item 1 → set returnable = false (override)
3. Fetch group → item 1 has returnable = false, others have true
4. Create invoice → only items 2 & 3 are returnable

## Performance Considerations

- Inheritance logic runs on every fetch (minimal overhead)
- No additional database queries needed
- Inheritance happens in-memory before response
- No impact on create/update performance

## Security Considerations

- Returnable status is set by group, not user input per item
- Prevents accidental non-returnable items in returnable groups
- Maintains data consistency across all items in group
