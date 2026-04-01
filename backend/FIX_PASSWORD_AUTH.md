# Fix PostgreSQL Password Authentication Error

## 🔴 Current Error
```
❌ PostgreSQL connection error: password authentication failed
```

## ✅ Quick Fix Options

### Solution 1: Reset PostgreSQL Password (Recommended)

**Step 1:** Find your PostgreSQL installation path. Common locations:
- `C:\Program Files\PostgreSQL\16\bin\psql.exe`
- `C:\Program Files\PostgreSQL\15\bin\psql.exe`
- `C:\Program Files\PostgreSQL\14\bin\psql.exe`

**Step 2:** Open PowerShell and navigate to the bin folder:
```powershell
cd "C:\Program Files\PostgreSQL\16\bin"
```
(Replace `16` with your PostgreSQL version)

**Step 3:** Connect to PostgreSQL (it might not ask for password if using trust):
```powershell
.\psql.exe -U postgres
```

**Step 4:** Reset the password:
```sql
ALTER USER postgres PASSWORD 'root';
\q
```

**Step 5:** Update your `.env.development` file to match:
```env
POSTGRES_PASSWORD_DEV=root
```

---

### Solution 2: Check Current Password

Try connecting with different passwords. Common defaults:
- `postgres`
- `root`
- `admin`
- `password`
- (empty - no password)

**Test each one:**
```powershell
cd "C:\Program Files\PostgreSQL\16\bin"
.\psql.exe -U postgres -d postgres
```

Then try each password when prompted.

---

### Solution 3: Use Windows Authentication

If PostgreSQL was installed with Windows Authentication, you might not need a password:

**Option A: Connect without password**
Try updating `.env.development` to use a connection string that trusts local connections.

**Option B: Switch to password authentication**
1. Find `pg_hba.conf` file:
   - Usually at: `C:\Program Files\PostgreSQL\16\data\pg_hba.conf`
   
2. Edit the file (as Administrator) and change:
   ```
   # IPv4 local connections:
   host    all             all             127.0.0.1/32            scram-sha-256
   ```
   To use password authentication.

3. Restart PostgreSQL service:
   ```powershell
   net stop postgresql-x64-16
   net start postgresql-x64-16
   ```

---

### Solution 4: Use Connection URI (Alternative)

Instead of individual parameters, try using a connection URI in `.env.development`:

```env
# Remove individual POSTGRES_* parameters
# Add this instead:
POSTGRES_URI_DEV=postgresql://postgres:root@localhost:5432/rootfin_dev
```

---

### Solution 5: Check if Database Exists

Make sure the database exists:

```powershell
cd "C:\Program Files\PostgreSQL\16\bin"
.\psql.exe -U postgres
```

Then run:
```sql
\l
```

Look for `rootfin_dev` in the list. If it doesn't exist:
```sql
CREATE DATABASE rootfin_dev;
\q
```

---

## 🧪 Test Your Fix

After applying any solution above:

1. **Test connection:**
   ```powershell
   node backend/test-postgresql-connection.js
   ```

2. **If successful, you'll see:**
   ```
   ✅ PostgreSQL connection successful!
   📊 Connected to database: rootfin_dev
   ```

---

## 📝 Quick Checklist

- [ ] PostgreSQL service is running
- [ ] Password in `.env.development` matches PostgreSQL password
- [ ] Database `rootfin_dev` exists
- [ ] User `postgres` exists and has permissions
- [ ] Connection parameters are correct in `.env.development`

---

## 🆘 Still Having Issues?

1. **Find PostgreSQL installation:**
   - Check: `C:\Program Files\PostgreSQL\`
   - Look for version folders (14, 15, 16, etc.)

2. **Check PostgreSQL service:**
   - Press `Win + R`, type `services.msc`
   - Look for `postgresql-x64-XX` service
   - Make sure it's running

3. **Check logs:**
   - Look in: `C:\Program Files\PostgreSQL\16\data\log\`
   - Check for authentication errors

---

## 💡 Most Common Fix

**90% of the time, it's a password mismatch.**

Try this:
1. Open PowerShell
2. Navigate to PostgreSQL bin folder
3. Connect: `.\psql.exe -U postgres`
4. Reset password: `ALTER USER postgres PASSWORD 'root';`
5. Update `.env.development`: `POSTGRES_PASSWORD_DEV=root`
6. Test: `node backend/test-postgresql-connection.js`

