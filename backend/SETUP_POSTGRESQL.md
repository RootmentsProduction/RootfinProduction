# Quick Setup: Connect PostgreSQL to Your Server

## Step 1: Check if PostgreSQL is Installed

Run this command to check:
```powershell
psql --version
```

If you see a version number, PostgreSQL is installed! ✅

## Step 2: Check if PostgreSQL is Running

On Windows:
```powershell
net start | findstr postgresql
```

Or check Windows Services:
- Press `Win + R`
- Type `services.msc`
- Look for "postgresql" service
- Start it if it's stopped

## Step 3: Create PostgreSQL Database

Open PowerShell and run:
```powershell
psql -U postgres
```

If it asks for a password, enter the password you set during PostgreSQL installation.

Then run:
```sql
CREATE DATABASE rootfin_dev;
\q
```

(To exit, type `\q` and press Enter)

## Step 4: Find Your PostgreSQL Password

If you don't remember your PostgreSQL password, you can:
1. Try the default (might be `postgres` or empty)
2. Or reset it:
   ```powershell
   psql -U postgres
   ALTER USER postgres PASSWORD 'your_new_password';
   \q
   ```

## Step 5: Create .env.development File

Create a file named `.env.development` in the `backend` folder with this content:

```env
NODE_ENV=development
PORT=7000

# Connect to BOTH databases
DB_TYPE=both

# MongoDB (keep your existing connection)
MONGODB_URI_DEV=mongodb://localhost:27017/rootfin_dev

# PostgreSQL Connection
# Replace 'your_password' with your actual PostgreSQL password
POSTGRES_URI_DEV=postgresql://postgres:your_password@localhost:5432/rootfin_dev

# Optional
SYNC_DB=true
POSTGRES_LOGGING=false

# JWT Secret
JWT_SECRET=your_jwt_secret_here
```

## Step 6: Update Your Connection String

In the `.env.development` file, replace:
- `your_password` → Your actual PostgreSQL password
- `rootfin_dev` → Your database name (if different)

**Example:**
If your password is `mypass123`, it should look like:
```env
POSTGRES_URI_DEV=postgresql://postgres:mypass123@localhost:5432/rootfin_dev
```

## Step 7: Test PostgreSQL Connection

Run this to test:
```powershell
cd backend
node test-postgresql-connection.js
```

If successful, you'll see:
```
✅ PostgreSQL connection successful!
```

## Step 8: Start Your Server

Now start your server:
```powershell
npm run dev
```

You should see:
```
📊 Connecting to MongoDB database...
✅ MongoDB connected [development]
📊 Connecting to PostgreSQL database...
✅ PostgreSQL connected [development]
🚀  Server listening on :7000
💾 Connected databases: MongoDB + PostgreSQL
```

## Troubleshooting

### "psql: command not found"
PostgreSQL is not installed. Download from: https://www.postgresql.org/download/windows/

### "password authentication failed"
Check your PostgreSQL password. Try resetting it (see Step 4).

### "database does not exist"
Create the database (see Step 3).

### "connection refused" or "could not connect"
Make sure PostgreSQL service is running (see Step 2).

## Need Help?

1. Check if PostgreSQL is running
2. Verify your password
3. Make sure database exists
4. Check your connection string format

