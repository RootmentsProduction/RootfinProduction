# Store Address Feature - Implementation Summary

## Overview
Added address field to store management system to capture and store physical addresses for each store location.

## Changes Made

### 1. Database Schema Updates

#### MongoDB (UserModel)
**File:** `backend/model/UserModel.js`

Added `address` field to user schema:
```javascript
address: { type: String, default: '' }
```

#### PostgreSQL (Store Model)
**File:** `backend/models/sequelize/Store.js`

Address field already exists in Store model:
```javascript
address: {
  type: DataTypes.TEXT,
  defaultValue: '',
}
```

### 2. Backend Controller Updates

**File:** `backend/controllers/LoginAndSignup.js`

Updated `SignUp` function to handle address:
```javascript
const { username, email, password, locCode, address, power } = req.body;

const newUser = new User({
    username,
    email,
    power,
    password: hashedPassword,
    locCode,
    address: address || '',
});
```

### 3. Frontend Updates

**File:** `frontend/src/pages/ManageStores.jsx`

#### Added State:
```javascript
const [address, setAddress] = useState("");
```

#### Added Form Field:
```jsx
<div>
    <label className="block mb-2 font-semibold text-gray-700">
        Store Address
    </label>
    <textarea
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="e.g., MG Road, Kochi, Kerala - 682016"
        rows="3"
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#016E5B] focus:border-none outline-none resize-none"
    />
</div>
```

#### Updated Payload:
```javascript
const payload = {
    username,
    email,
    password,
    locCode,
    address,
    power,
};
```

## Features

### Address Input
- Multi-line textarea for full address entry
- Optional field (not required)
- Placeholder text guides users on format
- Matches RootFin design system (teal focus ring)

### Data Storage
- Stored in MongoDB `users` collection
- Default value: empty string
- No validation (flexible format)
- Backward compatible (existing stores without address work fine)

## Usage

### Adding a New Store with Address:
1. Navigate to **Manage Stores** page
2. Fill in required fields:
   - Store Name
   - Email
   - Password
   - Location Code
3. Optionally fill in **Store Address**:
   - Example: "MG Road, Kochi, Kerala - 682016"
4. Select User Type
5. Click **Create Store**

### Address Format (Suggested):
```
Street/Building Name
Area, City, State - PIN Code
```

Example:
```
Rootments Building, MG Road
Ernakulam, Kochi, Kerala - 682016
```

## Database Impact

### MongoDB Collection: `users`
New field added:
- `address` (String, default: '')

### Existing Data:
- All existing stores will have `address: ''` (empty string)
- No migration needed
- Backward compatible

## Testing Checklist

- [ ] Create new store with address
- [ ] Create new store without address (should work)
- [ ] Verify address is saved in database
- [ ] Check existing stores still work
- [ ] Verify address displays correctly (if you add display feature later)

## Future Enhancements

### Potential Additions:
1. **Display address in store list**
   - Show address in admin dashboard
   - Add to store details view

2. **Structured address fields**
   - Separate fields for: Street, City, State, PIN
   - Better for filtering/searching

3. **Address validation**
   - PIN code format validation
   - Required field for certain store types

4. **Google Maps integration**
   - Address autocomplete
   - Map view of store locations

5. **Export functionality**
   - Include address in store reports
   - CSV export with addresses

## API Changes

### POST `/user/signin` (Create Store)

**Request Body:**
```json
{
  "username": "G.MG Road",
  "email": "mgroad@example.com",
  "password": "password123",
  "locCode": "718",
  "address": "MG Road, Kochi, Kerala - 682016",
  "power": "normal"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "_id": "...",
    "username": "G.MG Road",
    "email": "mgroad@example.com",
    "locCode": "718",
    "address": "MG Road, Kochi, Kerala - 682016",
    "power": "normal",
    "createdAt": "2026-02-10T...",
    "updatedAt": "2026-02-10T..."
  }
}
```

## Commit Message

```
Add address field to store management for capturing store physical addresses in ManageStores page and UserModel
```

## Files Modified

1. `backend/model/UserModel.js` - Added address field to schema
2. `backend/controllers/LoginAndSignup.js` - Updated SignUp to handle address
3. `frontend/src/pages/ManageStores.jsx` - Added address input field

## Notes

- Address field is optional (not required)
- No validation applied (flexible format)
- Backward compatible with existing stores
- PostgreSQL Store model already had address field
- MongoDB UserModel now matches PostgreSQL structure
