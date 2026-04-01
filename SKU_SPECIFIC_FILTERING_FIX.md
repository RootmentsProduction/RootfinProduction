# SKU-Specific Filtering Fix

## 🐛 PROBLEM IDENTIFIED

When searching by SKU, if an invoice contains multiple items with different SKUs, the report was showing:
- **Total items**: All items in invoice (e.g., 2 items)
- **Total amount**: Full invoice amount (e.g., ₹1500)

**But user wanted**:
- **Items**: Only count of matching SKU items (e.g., 1 item)
- **Amount**: Only amount of matching SKU items (e.g., ₹1000)

## ✅ SOLUTION IMPLEMENTED

### **Updated Logic in `getSalesByInvoice`**

#### **Before**:
```javascript
// Used full invoice data regardless of filters
const amount = parseFloat(invoice.finalTotal) || 0;
const itemCount = invoice.lineItems ? invoice.lineItems.length : 0;
```

#### **After**:
```javascript
// Filter line items to only matching items
let relevantItems = invoice.lineItems || [];

if (sku || size) {
  relevantItems = relevantItems.filter(item => {
    // Apply same SKU/size matching logic
    return matchesSku && matchesSize;
  });
}

// Calculate amounts based only on relevant items
const itemCount = relevantItems.length;
let itemAmount = relevantItems.reduce((sum, item) => {
  return sum + (parseFloat(item.amount) || 0);
}, 0);
```

### **Smart Discount Calculation**
- **Proportional discount**: If invoice has discount, calculate proportionally based on item amounts
- **Formula**: `itemDiscount = (itemAmount / totalInvoiceAmount) * totalInvoiceDiscount`

## 🔧 HOW IT WORKS

### **Example Scenario**:
**Invoice INV-001** has:
- Item 1: SKU "TK-1", Amount: ₹1000
- Item 2: SKU "ABC-2", Amount: ₹500
- **Total**: ₹1500, Discount: ₹150

### **When searching SKU "TK-1"**:

#### **Before (Wrong)**:
- Items: 2
- Amount: ₹1500
- Discount: ₹150
- Net: ₹1350

#### **After (Correct)**:
- Items: 1 (only TK-1 item)
- Amount: ₹1000 (only TK-1 amount)
- Discount: ₹100 (proportional: 1000/1500 * 150)
- Net: ₹900

## 🚀 BENEFITS

1. **Accurate Item Counts**: Shows only matching items
2. **Precise Amounts**: Shows only amounts for searched SKU
3. **Proportional Discounts**: Calculates fair discount allocation
4. **Better Analytics**: More meaningful data for specific SKU analysis
5. **Maintains Compatibility**: Works with existing filters (size, category, etc.)

## 📝 TESTING

**Restart Backend**:
```bash
cd backend
node server.js
```

**Test Cases**:
1. **Single SKU in invoice**: Should work same as before
2. **Multiple SKUs in invoice**: Should show only matching SKU data
3. **Combined filters**: SKU + Size should work correctly
4. **No filters**: Should show full invoice data (unchanged)

The filtering now provides **item-specific results** instead of **invoice-level results**! 🎉