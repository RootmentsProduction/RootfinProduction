# Quick Fix: PostgreSQL Password Authentication

## ✅ PostgreSQL is Running!

Your PostgreSQL 18 service is running. The issue is the password authentication.

## 🔧 Quick Fix Steps:

### Step 1: Find PostgreSQL Installation

PostgreSQL is installed. Find the `psql.exe` file:
- Usually at: `C:\Program Files\PostgreSQL\18\bin\psql.exe`

### Step 2: Connect to PostgreSQL

Open PowerShell and run:

```powershell
cd "C:\Program Files\PostgreSQL\18\bin"
.\psql.exe -U postgres
```

You might be prompted for a password. Try:
- `postgres`
- `root`
- `admin`
- Or leave empty (press Enter)

### Step 3: Reset Password

Once connected, run:

```sql
ALTER USER postgres PASSWORD 'root';
\q
```

This sets the password to `root` (matching your .env.development).

### Step 4: Test Connection

```powershell
cd D:\MEARN\TESTROOTFIN\backend
node test-postgresql-connection.js
```

---

## 🚀 Alternative: Use the Batch Script

I've created a helper script for you. Run:

```powershell
cd D:\MEARN\TESTROOTFIN\backend
.\reset-postgres-password.bat
```

This will guide you through resetting the password.

---

## 📝 If You Don't Know the Current Password

### Option A: Try Common Passwords

Try connecting with these common passwords:
- `postgres`
- `root`
- `admin`
- `password`
- (empty - just press Enter)

### Option B: Reset via Windows Authentication

If PostgreSQL was set up with Windows Authentication:

1. Open Command Prompt as Administrator
2. Run:
   ```cmd
   cd "C:\Program Files\PostgreSQL\18\bin"
   psql.exe -U postgres -d postgres
   ```
3. If it connects (no password), run:
   ```sql
   ALTER USER postgres PASSWORD 'root';
   \q
   ```

---

## ✅ After Fixing Password

1. **Verify `.env.development` has:**
   ```env
   POSTGRES_PASSWORD_DEV=root
   ```

2. **Test connection:**
   ```powershell
   node backend/test-postgresql-connection.js
   ```

3. **Start server:**
   ```powershell
   npm run dev
   ```

You should see both databases connected!

---

## 🆘 Still Not Working?

If you still can't connect:

1. **Check if database exists:**
   ```powershell
   cd "C:\Program Files\PostgreSQL\18\bin"
   .\psql.exe -U postgres
   ```
   Then:
   ```sql
   \l
   ```
   Look for `rootfin_dev`. If missing:
   ```sql
   CREATE DATABASE rootfin_dev;
   \q
   ```

2. **Check PostgreSQL logs:**
   - Location: `C:\Program Files\PostgreSQL\18\data\log\`
   - Look for authentication errors

3. **Verify connection string:**
   Make sure your `.env.development` has:
   ```env
   POSTGRES_HOST_DEV=localhost
   POSTGRES_PORT_DEV=5432
   POSTGRES_DB_DEV=rootfin_dev
   POSTGRES_USER_DEV=postgres
   POSTGRES_PASSWORD_DEV=root
   ```

---

## 🎯 Most Likely Solution

**Try this first:**

1. Open PowerShell
2. Run:
   ```powershell
   cd "C:\Program Files\PostgreSQL\18\bin"
   .\psql.exe -U postgres
   ```
3. When prompted for password, try `postgres` or leave empty
4. Once connected:
   ```sql
   ALTER USER postgres PASSWORD 'root';
   \q
   ```
5. Test: `node backend/test-postgresql-connection.js`

This should fix it! 🎉

