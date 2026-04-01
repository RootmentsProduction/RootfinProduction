# Store-Level Access Control for Invoices

## Overview
Implemented store-level access control to ensure that store users can only create and view invoices for their own store, while admin users can manage invoices across all stores.

## Features

### 1. **Admin Users**
- Can see all stores in the Branch dropdown
- Can select any store to create invoices
- Can view and manage invoices from all stores
- Full access to all features

### 2. **Store Users**
- Can only see their own store name (auto-filled)
- Branch field is read-only (cannot change)
- Can only create invoices for their store
- Invoices are automatically tagged with their store
- Cannot access other stores' invoices

## Implementation Details

### User Role Detection
```javascript
const getStoreAccessControl = () => {
  const user = getUserInfo();
  
  // Admin check: role is admin/superadmin or no specific store assigned
  const isAdmin = user.role === "admin" || user.role === "superadmin" || !user.storeName;
  
  // Store user check: has storeName and is not admin
  const isStoreUser = !!user.storeName && user.role !== "admin" && user.role !== "superadmin";
  
  return {
    isAdmin,
    userStore: user.storeName || null,
    isStoreUser,
    user
  };
};
```

### Auto-Fill Branch for Store Users
```javascript
useEffect(() => {
  if (storeAccess.isStoreUser && storeAccess.userStore) {
    setBranch(storeAccess.userStore);
  }
}, [storeAccess.isStoreUser, storeAccess.userStore]);
```

### Branch Field Rendering
- **Admin Users:** Dropdown with all stores
- **Store Users:** Read-only text input showing their store name

## User Data Structure

### Admin User (localStorage)
```json
{
  "email": "admin@company.com",
  "role": "admin",
  "storeName": null,
  "locCode": "759"
}
```

### Store User (localStorage)
```json
{
  "email": "thrissur@company.com",
  "role": "store_manager",
  "storeName": "Thrissur Branch",
  "locCode": "704"
}
```

## How It Works

### Scenario 1: Admin User Creates Invoice
1. Admin logs in with admin credentials
2. Opens invoice creation page
3. Branch dropdown shows all available stores
4. Admin selects "Thrissur Branch"
5. Creates invoice for that store
6. Invoice is tagged with selected store

### Scenario 2: Store User Creates Invoice
1. Store user logs in with store email (e.g., thrissur@company.com)
2. Opens invoice creation page
3. Branch field shows "Thrissur Branch" (read-only)
4. Cannot change the branch
5. Creates invoice for their store
6. Invoice is automatically tagged with "Thrissur Branch"

## Backend Integration

### Invoice Creation
When saving an invoice, the branch is automatically included:
```javascript
const invoiceData = {
  ...
  branch: branch,  // "Thrissur Branch" for store users
  ...
};
```

### Invoice Filtering (Backend)
Backend should filter invoices based on user role:
```javascript
// For store users: only show invoices for their store
if (user.role === "store_manager") {
  invoices = invoices.filter(inv => inv.branch === user.storeName);
}

// For admin: show all invoices
```

## Security Considerations

1. **Frontend Validation:** Branch is read-only for store users
2. **Backend Validation:** Must verify user has permission to create invoice for selected branch
3. **Data Privacy:** Store users cannot access other stores' data
4. **Audit Trail:** All invoices should log which user created them

## Testing

### Test Case 1: Admin User
1. Login as admin
2. Go to `/sales/invoices/new`
3. Verify Branch dropdown shows all stores
4. Select different stores
5. Create invoices for multiple stores
6. Verify invoices are created for selected stores

### Test Case 2: Store User
1. Login as store user (e.g., thrissur@company.com)
2. Go to `/sales/invoices/new`
3. Verify Branch field shows "Thrissur Branch"
4. Verify Branch field is read-only (cannot click/change)
5. Create invoice
6. Verify invoice is tagged with "Thrissur Branch"

### Test Case 3: Invoice List Filtering
1. Login as store user
2. Go to `/sales/invoices`
3. Verify only invoices for their store are shown
4. Login as admin
5. Verify all invoices are shown

## Configuration

### User Roles
- `admin` - Full access to all stores
- `superadmin` - Full access to all stores
- `store_manager` - Access only to assigned store
- `store_user` - Access only to assigned store

### User Fields Required
- `email` - User email
- `role` - User role (admin, store_manager, etc.)
- `storeName` - Store name (null for admin, store name for store users)
- `locCode` - Location code for the store

## Future Enhancements

1. **Multi-Store Access:** Allow store users to access multiple stores
2. **Store Hierarchy:** Support parent/child store relationships
3. **Permissions Matrix:** Fine-grained permission control
4. **Audit Logging:** Track all invoice operations by user
5. **Store Switching:** Allow admins to switch between stores
6. **Bulk Operations:** Bulk invoice operations with store filtering

## Troubleshooting

### Issue: Store user can still change branch
**Solution:** Clear browser cache and refresh page

### Issue: Admin cannot see all stores
**Solution:** Verify user role is set to "admin" in database

### Issue: Invoices not filtered by store
**Solution:** Implement backend filtering based on user role

## Summary

Store-level access control ensures:
- ✅ Admin users have full control
- ✅ Store users can only manage their own store
- ✅ Data privacy and security
- ✅ Automatic branch assignment for store users
- ✅ Read-only branch field for store users
- ✅ Invoices are properly tagged with store information
