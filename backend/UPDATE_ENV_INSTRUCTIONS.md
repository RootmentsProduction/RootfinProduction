# ⚡ Quick Fix: Connect to Both Databases

## The Problem

Your `.env.development` file currently has:
```
DB_TYPE=mongodb
```

This means it only connects to MongoDB. PostgreSQL is configured but not being used!

---

## ✅ The Solution

Open your `.env.development` file and change:

```env
DB_TYPE=mongodb
```

To:

```env
DB_TYPE=both
```

---

## 📝 Complete Example

Your `.env.development` file should look like this:

```env
NODE_ENV=development
PORT=7000

# ⬇️ CHANGE THIS LINE ⬇️
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

# JWT Secret (add your secret here)
JWT_SECRET=your_jwt_secret_here
```

---

## 🚀 After Making the Change

1. **Save the file**

2. **Restart your server:**
   ```powershell
   node server.js
   ```

3. **You should now see:**
   ```
   📊 Connecting to MongoDB database...
   ✅ MongoDB connected [development]
   📊 Connecting to PostgreSQL database...
   ✅ PostgreSQL connected [development]
   🚀  Server listening on :7000
   💾 Connected databases: MongoDB + PostgreSQL
   ```

---

## ✨ That's It!

Just change `DB_TYPE=mongodb` to `DB_TYPE=both` and restart your server!

