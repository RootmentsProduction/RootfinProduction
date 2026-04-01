# Enable Both Databases (MongoDB + PostgreSQL)

## Current Issue

Your server is only connecting to MongoDB. To connect to **both** MongoDB and PostgreSQL, you need to set `DB_TYPE=both` in your `.env.development` file.

---

## Quick Fix

### Step 1: Open or Create `.env.development`

In the `backend/` folder, open or create `.env.development` file.

### Step 2: Add or Update DB_TYPE

Make sure your `.env.development` file has this line:

```env
DB_TYPE=both
```

### Step 3: Full Example

Your `.env.development` should look like this:

```env
NODE_ENV=development
PORT=7000

# Connect to BOTH databases
DB_TYPE=both

# MongoDB Configuration
MONGODB_URI_DEV=mongodb://localhost:27017/rootfin_dev

# PostgreSQL Configuration
POSTGRES_HOST_DEV=localhost
POSTGRES_PORT_DEV=5432
POSTGRES_DB_DEV=rootfin_dev
POSTGRES_USER_DEV=postgres
POSTGRES_PASSWORD_DEV=root

# Optional
SYNC_DB=true
POSTGRES_LOGGING=false

# JWT Secret
JWT_SECRET=your_jwt_secret_here
```

---

## After Updating

1. **Save the file**

2. **Restart your server:**
   ```powershell
   node server.js
   ```

3. **You should see:**
   ```
   📊 Connecting to MongoDB database...
   ✅ MongoDB connected [development]
   📊 Connecting to PostgreSQL database...
   ✅ PostgreSQL connected [development]
   🚀  Server listening on :7000
   💾 Connected databases: MongoDB + PostgreSQL
   ```

---

## DB_TYPE Options

- `DB_TYPE=mongodb` - Only MongoDB
- `DB_TYPE=postgresql` - Only PostgreSQL  
- `DB_TYPE=both` - Both MongoDB and PostgreSQL ✅ (This is what you want)

---

## Troubleshooting

If PostgreSQL doesn't connect:
1. Check PostgreSQL service is running
2. Verify password is correct (`root`)
3. Test connection: `node test-postgresql-connection.js`

