# Edit Store Feature - Implementation Summary

## Overview
Added functionality to view, edit, and update existing stores/users in the Manage Stores page.

## Features Added

### 1. View All Stores
- Table displaying all existing stores with details
- Shows: Store Name, Email, Location Code, Address, User Type
- Sorted by newest first
- Responsive table with hover effects

### 2. Edit Store
- Click edit icon to load store details into form
- Form switches to "Edit Mode"
- Pre-fills all fields except password (for security)
- Shows blue banner indicating which store is being edited
- Cancel button to exit edit mode

### 3. Update Store
- Update any field: username, email, locCode, address, power
- Password is optional - leave blank to keep current password
- Validates email uniqueness (can't use another user's email)
- Success message after update
- Automatically refreshes store list

## Changes Made

### Frontend (`frontend/src/pages/ManageStores.jsx`)

#### New State Variables:
```javascript
const [isEditMode, setIsEditMode] = useState(false);
const [editingUserId, setEditingUserId] = useState(null);
const [stores, setStores] = useState([]);
const [loadingStores, setLoadingStores] = useState(false);
```

#### New Functions:
```javascript
fetchStores()        // Fetch all stores from API
handleEdit(store)    // Load store data into form for editing
handleCancelEdit()   // Exit edit mode and reset form
```

#### Updated Functions:
```javascript
handleSubmit()       // Now handles both create and update
```

#### New UI Components:
1. **Edit Mode Banner** - Shows which store is being edited
2. **Stores Table** - Lists all existing stores
3. **Edit Button** - Icon button in each row
4. **Cancel Button** - Appears in edit mode
5. **Dynamic Labels** - Password field shows "(Leave blank to keep current)" in edit mode

### Backend

#### New Controller Functions (`backend/controllers/LoginAndSignup.js`):

1. **GetAllUsers**
   - Fetches all users with full details
   - Excludes passwords for security
   - Sorts by creation date (newest first)

2. **UpdateUser**
   - Updates user by ID
   - Validates required fields
   - Checks email uniqueness
   - Only updates password if provided
   - Hashes new password with bcrypt

#### New Routes (`backend/route/LoginRoute.js`):
```javascript
router.get('/getAllUsers', GetAllUsers)
router.put('/updateUser/:id', UpdateUser)
```

## API Endpoints

### GET `/user/getAllUsers`
Fetches all users with details (excluding passwords).

**Response:**
```json
{
  "message": "Users retrieved successfully",
  "users": [
    {
      "_id": "...",
      "username": "G.MG Road",
      "email": "mgroad@example.com",
      "locCode": "718",
      "address": "MG Road, Kochi, Kerala",
      "power": "normal",
      "createdAt": "2026-02-10T...",
      "updatedAt": "2026-02-10T..."
    }
  ]
}
```

### PUT `/user/updateUser/:id`
Updates user details.

**Request Body:**
```json
{
  "username": "G.MG Road Updated",
  "email": "mgroad@example.com",
  "locCode": "718",
  "address": "New Address, Kochi, Kerala",
  "power": "admin",
  "password": "newpassword123"  // Optional
}
```

**Response:**
```json
{
  "message": "User updated successfully.",
  "user": {
    "_id": "...",
    "username": "G.MG Road Updated",
    "email": "mgroad@example.com",
    "locCode": "718",
    "address": "New Address, Kochi, Kerala",
    "power": "admin"
  }
}
```

## User Flow

### Editing a Store:
1. Navigate to **Manage Stores** page
2. Scroll down to **Existing Stores** table
3. Click the **Edit icon** (pencil) for the store you want to edit
4. Form scrolls to top and switches to edit mode
5. Blue banner shows: "Editing: [Store Name]"
6. All fields are pre-filled (except password)
7. Make changes to any field
8. Optionally enter new password (leave blank to keep current)
9. Click **Update Store** button
10. Success message appears
11. Store list refreshes with updated data
12. Form resets to create mode

### Canceling Edit:
1. While in edit mode, click **Cancel** button
2. Form resets to create mode
3. All fields are cleared

## Security Features

1. **Password Protection**
   - Passwords never sent to frontend
   - Only updated if new password provided
   - New passwords hashed with bcrypt (10 salt rounds)

2. **Email Uniqueness**
   - Validates email isn't already taken by another user
   - Allows keeping same email when editing

3. **Required Fields**
   - Username, email, locCode always required
   - Password only required for new stores (optional for edit)

## UI/UX Improvements

1. **Visual Feedback**
   - Edit mode banner (blue background)
   - Loading states for buttons
   - Hover effects on table rows
   - Color-coded user type badges (purple for admin, blue for normal)

2. **Responsive Design**
   - Table scrolls horizontally on small screens
   - Form adapts to edit/create mode
   - Buttons resize based on mode

3. **User Guidance**
   - Dynamic password label shows "(Leave blank to keep current)"
   - Success/error messages
   - Loading indicators

## Testing Checklist

- [ ] View all stores in table
- [ ] Click edit button loads store data
- [ ] Edit mode banner appears
- [ ] Cancel button exits edit mode
- [ ] Update store with all fields
- [ ] Update store without changing password
- [ ] Update store with new password
- [ ] Try to use duplicate email (should fail)
- [ ] Update address field
- [ ] Change user type (normal ↔ admin)
- [ ] Store list refreshes after update
- [ ] Form resets after successful update

## Future Enhancements

1. **Delete Store**
   - Add delete button with confirmation
   - Soft delete (mark as inactive)

2. **Search/Filter**
   - Search stores by name, email, or locCode
   - Filter by user type

3. **Pagination**
   - Paginate store list for large datasets

4. **Bulk Operations**
   - Select multiple stores
   - Bulk update or delete

5. **Audit Log**
   - Track who edited what and when
   - Show edit history

6. **Advanced Validation**
   - Phone number format
   - PIN code validation
   - Duplicate locCode check

## Commit Message

```
Add edit functionality for existing stores in Manage Stores page with view all stores table, edit mode, and update API endpoints
```

## Files Modified

1. `frontend/src/pages/ManageStores.jsx` - Added edit mode, stores table, and update logic
2. `backend/controllers/LoginAndSignup.js` - Added GetAllUsers and UpdateUser functions
3. `backend/route/LoginRoute.js` - Added routes for getAllUsers and updateUser

## Dependencies

No new dependencies required. Uses existing:
- React hooks (useState, useEffect)
- React Icons (FaEdit)
- Existing API structure
