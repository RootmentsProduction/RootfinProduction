# PostgreSQL Connection - Required Information

## ✅ What You Need to Connect to PostgreSQL

To connect your application to PostgreSQL, you need these **5 pieces of information**:

---

## 1. **Host** (Server Address)
- **Local**: `localhost` or `127.0.0.1`
- **Remote**: Your server IP or domain name

## 2. **Port**
- **Default**: `5432`
- Check if your PostgreSQL uses a different port

## 3. **Database Name**
- The name of your database (must exist first)
- Example: `rootfin_dev`

## 4. **Username**
- PostgreSQL login user
- Default: `postgres`

## 5. **Password**
- Password for the username
- Set during PostgreSQL installation

---

## 📝 Two Ways to Provide This Information

### **Option 1: Connection URI (Easiest - Recommended)**

One single string with all information:

```
postgresql://username:password@host:port/database
```

**Example:**
```env
POSTGRES_URI_DEV=postgresql://postgres:postgres@localhost:5432/rootfin_dev
```

**In your `.env.development` file:**
```env
DB_TYPE=postgresql
POSTGRES_URI_DEV=postgresql://postgres:YOUR_PASSWORD@localhost:5432/rootfin_dev
```

---

### **Option 2: Separate Parameters**

Individual environment variables:

```env
POSTGRES_HOST_DEV=localhost
POSTGRES_PORT_DEV=5432
POSTGRES_DB_DEV=rootfin_dev
POSTGRES_USER_DEV=postgres
POSTGRES_PASSWORD_DEV=your_password
```

---

## 🎯 Quick Setup Example

### For Local Development:

**1. Install PostgreSQL** (if not already installed)

**2. Create database:**
```bash
psql -U postgres
CREATE DATABASE rootfin_dev;
\q
```

**3. Create `.env.development` file in `backend/` folder:**
```env
NODE_ENV=development
PORT=7000

# Database Selection
DB_TYPE=postgresql

# PostgreSQL Connection
POSTGRES_URI_DEV=postgresql://postgres:YOUR_PASSWORD@localhost:5432/rootfin_dev

# Optional
SYNC_DB=true
POSTGRES_LOGGING=false

# JWT Secret
JWT_SECRET=your_jwt_secret_here
```

**Replace `YOUR_PASSWORD` with your actual PostgreSQL password!**

---

## 🔍 How to Find Your Connection Details

### Default Local PostgreSQL Setup:
- **Host**: `localhost`
- **Port**: `5432`
- **Username**: `postgres`
- **Password**: The password you set during PostgreSQL installation
- **Database**: You need to create it (see above)

### If You Don't Know Your PostgreSQL Password:

**Option 1: Reset it**
```bash
psql -U postgres
ALTER USER postgres PASSWORD 'new_password';
\q
```

**Option 2: Check if you can connect without password:**
```bash
psql -U postgres -d postgres
```
(If this works, your password might be empty or you need to set one)

---

## 📋 Connection String Format Breakdown

```
postgresql://username:password@host:port/database
```

**Example:**
```
postgresql://postgres:mySecurePass123@localhost:5432/rootfin_dev
         │      │           │              │        │      │
         │      │           │              │        │      └─ Database name
         │      │           │              │        └──────── Port
         │      │           │              └───────────────── Host
         │      │           └──────────────────────────────── Password
         │      └──────────────────────────────────────────── Username
         └─────────────────────────────────────────────────── Protocol
```

---

## 🚀 Quick Test

After setting up your `.env.development` file, test the connection:

```bash
cd backend
node test-postgresql-connection.js
```

If successful, you'll see:
```
✅ PostgreSQL connection successful!
📊 Connected to database: rootfin_dev
```

---

## 📦 Environment Variables Summary

### Minimum Required (Option 1 - URI):
```env
DB_TYPE=postgresql
POSTGRES_URI_DEV=postgresql://user:pass@host:port/database
```

### OR Minimum Required (Option 2 - Separate):
```env
DB_TYPE=postgresql
POSTGRES_HOST_DEV=localhost
POSTGRES_PORT_DEV=5432
POSTGRES_DB_DEV=rootfin_dev
POSTGRES_USER_DEV=postgres
POSTGRES_PASSWORD_DEV=your_password
```

### Optional Settings:
```env
SYNC_DB=true              # Auto-create tables (dev only)
POSTGRES_LOGGING=false    # Show SQL queries in console
```

---

## ⚠️ Important Notes

1. **Database must exist first** - Create it before connecting
2. **Replace placeholder values** - Change `YOUR_PASSWORD`, etc.
3. **Never commit `.env` files** - Keep credentials secret
4. **Use strong passwords** - Especially for production

---

## 🆘 Still Having Issues?

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   net start | findstr postgresql
   
   # macOS/Linux
   sudo systemctl status postgresql
   ```

2. **Verify database exists:**
   ```bash
   psql -U postgres -l
   ```

3. **Test connection manually:**
   ```bash
   psql -h localhost -p 5432 -U postgres -d rootfin_dev
   ```

---

## 📚 More Details

See `POSTGRESQL_CONNECTION_INFO.md` for comprehensive information about:
- Cloud provider connections
- Remote server setup
- Security best practices
- Troubleshooting tips

