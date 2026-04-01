# Backend Store-Level Access Control Implementation Guide

## Current Status

### ✅ What Exists:
- User model has `power` field (admin/normal)
- User model has `username` field (can be store name)
- User model has `locCode` field (location code)
- Login endpoint returns user data

### ❌ What's Missing:
- `storeName` field in User model
- `role` field (currently using `power`)
- Store filtering logic in SalesInvoiceController
- Invoice filtering by store in GET endpoints
- Store validation when creating invoices

## Implementation Steps

### Step 1: Update User Model

**File:** `backend/model/UserModel.js`

Add these fields:
```javascript
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    locCode: { type: String, required: true },
    power: { type: String, enum: ["admin", "normal"], required: true, default: 'normal' },
    role: { type: String, enum: ["admin", "superadmin", "store_manager", "store_user"], default: "store_user" },
    storeName: { type: String, default: null }, // Store name for store users
    storeId: { type: String, default: null }, // Store ID reference
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
```

### Step 2: Update Login Endpoint

**File:** `backend/controllers/LoginAndSignup.js`

Update the Login response to include `storeName` and `role`:
```javascript
export const Login = async (req, res) => {
    try {
        const { email, EmpId: password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        res.status(200).json({
            message: 'Login successful',
            user: {
                email: user.email,
                username: user.username,
                power: user.power,
                role: user.role,
                locCode: user.locCode,
                storeName: user.storeName, // Add this
                storeId: user.storeId,     // Add this
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            message: 'An error occurred during login.',
            error: error.message,
        });
    }
};
```

### Step 3: Update SalesInvoiceController

**File:** `backend/controllers/SalesInvoiceController.js`

Add store validation in `createSalesInvoice`:
```javascript
export const createSalesInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;
    const userId = invoiceData.userId;

    if (!invoiceData.customer || !userId) {
      return res.status(400).json({
        message: "Customer name and userId are required"
      });
    }

    // Get user to check store access
    const user = await User.findOne({ email: userId });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Store-level access control
    if (user.role === "store_manager" || user.role === "store_user") {
      // Store user can only create invoices for their store
      if (invoiceData.branch !== user.storeName) {
        return res.status(403).json({
          message: "You can only create invoices for your store",
          userStore: user.storeName,
          requestedStore: invoiceData.branch
        });
      }
    }

    // Rest of the invoice creation logic...
    let finalInvoiceNumber = invoiceData.invoiceNumber;

    if (!finalInvoiceNumber) {
      finalInvoiceNumber = await nextGlobalSalesInvoice("INV-");
    }

    invoiceData.invoiceNumber = finalInvoiceNumber;
    invoiceData.createdBy = userId; // Track who created the invoice
    invoiceData.storeId = user.storeId; // Tag with store ID

    // Save invoice...
    const invoice = await SalesInvoice.create(invoiceData);

    res.status(201).json(invoice);
  } catch (error) {
    console.error("Create sales invoice error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Step 4: Add Invoice Filtering Endpoint

**File:** `backend/controllers/SalesInvoiceController.js`

Add a GET endpoint that filters invoices by store:
```javascript
export const getSalesInvoices = async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Get user to check role
    const user = await User.findOne({ email: userId });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    let query = {};

    // Filter by store for non-admin users
    if (user.role === "store_manager" || user.role === "store_user") {
      query.branch = user.storeName;
    }

    const invoices = await SalesInvoice.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Invoices retrieved successfully",
      invoices: invoices,
      userRole: user.role,
      userStore: user.storeName
    });
  } catch (error) {
    console.error("Get sales invoices error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

### Step 5: Update Routes

**File:** `backend/route/` (find the sales invoice routes file)

Add the new endpoint:
```javascript
router.get('/invoices', getSalesInvoices);
```

## Database Migration

For existing users, run this migration:

```javascript
// Migration script
import User from '../model/UserModel.js';

export const migrateUsers = async () => {
  try {
    // For admin users
    await User.updateMany(
      { power: "admin" },
      { 
        role: "admin",
        storeName: null
      }
    );

    // For normal users (store users)
    await User.updateMany(
      { power: "normal" },
      { 
        role: "store_manager",
        storeName: "$username" // Use username as store name
      }
    );

    console.log("✅ User migration completed");
  } catch (error) {
    console.error("❌ Migration error:", error);
  }
};
```

## Testing Checklist

- [ ] Admin user can create invoices for any store
- [ ] Admin user can view all invoices
- [ ] Store user can only create invoices for their store
- [ ] Store user cannot create invoices for other stores
- [ ] Store user can only view their own invoices
- [ ] Login returns `storeName` and `role` fields
- [ ] Branch field is auto-filled for store users
- [ ] Backend validates store access on invoice creation

## API Endpoints to Update

1. **POST /api/sales/invoices** - Create invoice (add store validation)
2. **GET /api/sales/invoices** - Get invoices (add store filtering)
3. **GET /api/sales/invoices/:id** - Get single invoice (add store validation)
4. **PUT /api/sales/invoices/:id** - Update invoice (add store validation)
5. **DELETE /api/sales/invoices/:id** - Delete invoice (add store validation)

## Security Considerations

1. **Always validate on backend** - Never trust frontend role/store
2. **Use userId from token** - Don't use userId from request body
3. **Check store access** - Verify user has permission for the store
4. **Log all operations** - Track who created/modified invoices
5. **Audit trail** - Keep history of all invoice operations

## Summary

To implement store-level access control on the backend:

1. ✅ Add `storeName` and `role` fields to User model
2. ✅ Update Login endpoint to return these fields
3. ✅ Add store validation in SalesInvoiceController
4. ✅ Add invoice filtering by store
5. ✅ Update all invoice endpoints with store checks
6. ✅ Run database migration for existing users
7. ✅ Test all scenarios

The frontend is already ready! Just implement these backend changes.
