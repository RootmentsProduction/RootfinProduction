# PostgreSQL Setup Instructions

## 🚨 PostgreSQL is Not Installed

Your system doesn't have PostgreSQL installed yet. Here are your options:

---

## Option 1: Install PostgreSQL Locally (Recommended for Development)

### Windows Installation Steps:

1. **Download PostgreSQL:**
   - Visit: https://www.postgresql.org/download/windows/
   - Click "Download the installer"
   - Download the latest version (e.g., PostgreSQL 16)

2. **Run the Installer:**
   - Run the downloaded `.exe` file
   - Follow the installation wizard
   - **Important:** Remember the password you set for the `postgres` user!
   - Port: Keep default `5432`
   - Installation location: Keep default

3. **Verify Installation:**
   - After installation, restart your terminal/PowerShell
   - Run: `psql --version`
   - You should see a version number

4. **Start PostgreSQL Service:**
   - Windows should start it automatically
   - If not, go to Services (Win+R → `services.msc`)
   - Find "postgresql-x64-16" (version may vary)
   - Start the service

5. **Create Database:**
   ```powershell
   psql -U postgres
   ```
   - Enter your password when prompted
   - Then run:
   ```sql
   CREATE DATABASE rootfin_dev;
   \q
   ```

6. **Create `.env.development` file:**
   Create this file in `backend/` folder:
   ```env
   NODE_ENV=development
   PORT=7000
   DB_TYPE=both
   
   MONGODB_URI_DEV=mongodb://localhost:27017/rootfin_dev
   POSTGRES_URI_DEV=postgresql://postgres:YOUR_PASSWORD@localhost:5432/rootfin_dev
   
   SYNC_DB=true
   POSTGRES_LOGGING=false
   JWT_SECRET=your_jwt_secret_here
   ```
   
   Replace `YOUR_PASSWORD` with the password you set during installation.

---

## Option 2: Use Remote PostgreSQL (Cloud/Server)

If you have a PostgreSQL database hosted elsewhere (AWS RDS, Heroku, Render, etc.):

1. **Get your connection string** from your provider
   - Format: `postgresql://user:password@host:port/database`

2. **Create `.env.development` file:**
   ```env
   NODE_ENV=development
   PORT=7000
   DB_TYPE=both
   
   MONGODB_URI_DEV=mongodb://localhost:27017/rootfin_dev
   POSTGRES_URI_DEV=postgresql://user:password@your-host:5432/your_database
   
   SYNC_DB=true
   JWT_SECRET=your_jwt_secret_here
   ```

---

## Option 3: Use Docker (Alternative)

If you have Docker installed:

```powershell
docker run --name postgres-rootfin -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=rootfin_dev -p 5432:5432 -d postgres
```

Then use:
```env
POSTGRES_URI_DEV=postgresql://postgres:postgres@localhost:5432/rootfin_dev
```

---

## Quick Test After Setup

Once PostgreSQL is installed and configured:

1. **Test connection:**
   ```powershell
   cd backend
   node test-postgresql-connection.js
   ```

2. **Start server:**
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

---

## Current Status

✅ **MongoDB:** Working (already connected)  
❌ **PostgreSQL:** Not installed yet

---

## Next Steps

1. **Choose an option above** (local install recommended)
2. **Install PostgreSQL** if using Option 1
3. **Create `.env.development`** file with your PostgreSQL connection details
4. **Test the connection**
5. **Start your server** with both databases

---

## Need Help?

- **Installation issues:** Check PostgreSQL documentation
- **Connection issues:** Verify your password and database name
- **Service not starting:** Check Windows Event Viewer for errors

