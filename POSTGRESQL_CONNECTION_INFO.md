# PostgreSQL Connection Information Required

## What Data You Need to Connect to PostgreSQL

To connect to a PostgreSQL database, you need the following information:

---

## Required Connection Parameters

### 1. **Host (Server Address)**
   - **Local development**: `localhost` or `127.0.0.1`
   - **Remote server**: IP address or domain name (e.g., `db.example.com`)
   - **Cloud providers**: Provided by your hosting service (e.g., `abc-xyz-123.us-east-1.rds.amazonaws.com`)

### 2. **Port**
   - **Default PostgreSQL port**: `5432`
   - **Custom port**: If your PostgreSQL uses a different port

### 3. **Database Name**
   - The name of your database
   - Example: `rootfin_dev`, `rootfin_prod`, `myapp_db`
   - Must be created before connecting

### 4. **Username**
   - PostgreSQL user/login name
   - **Default**: `postgres` (superuser)
   - **Custom user**: Any user you created with database access

### 5. **Password**
   - Password for the PostgreSQL user
   - Set during PostgreSQL installation or when creating a user

---

## Connection Methods

You have **TWO options** to provide this information:

### Option 1: Connection URI (Recommended - Single String)

**Format:**
```
postgresql://username:password@host:port/database
```

**Examples:**

**Local Development:**
```env
POSTGRES_URI_DEV=postgresql://postgres:postgres@localhost:5432/rootfin_dev
```

**With Custom User:**
```env
POSTGRES_URI_DEV=postgresql://rootfin_user:mySecurePassword123@localhost:5432/rootfin_dev
```

**Remote Server:**
```env
POSTGRES_URI_DEV=postgresql://user:password@192.168.1.100:5432/rootfin_dev
```

**Cloud Provider (Heroku, Render, etc.):**
```env
POSTGRES_URI_PROD=postgresql://user:pass@ec2-xx-xx-xx-xx.compute-1.amazonaws.com:5432/dbname
```

**With SSL (Production):**
```
postgresql://user:password@host:port/database?sslmode=require
```

---

### Option 2: Individual Parameters (Separate Values)

Instead of a connection URI, you can provide each parameter separately:

```env
POSTGRES_HOST_DEV=localhost
POSTGRES_PORT_DEV=5432
POSTGRES_DB_DEV=rootfin_dev
POSTGRES_USER_DEV=postgres
POSTGRES_PASSWORD_DEV=postgres
```

**For Production:**
```env
POSTGRES_HOST_PROD=your-server.com
POSTGRES_PORT_PROD=5432
POSTGRES_DB_PROD=rootfin_prod
POSTGRES_USER_PROD=your_username
POSTGRES_PASSWORD_PROD=your_secure_password
```

---

## Complete Environment File Example

Create `backend/.env.development`:

```env
NODE_ENV=development
PORT=7000

# Database Selection
DB_TYPE=postgresql

# ============================================
# PostgreSQL Connection - Option 1 (URI)
# ============================================
POSTGRES_URI_DEV=postgresql://postgres:postgres@localhost:5432/rootfin_dev

# ============================================
# OR PostgreSQL Connection - Option 2 (Individual)
# ============================================
# POSTGRES_HOST_DEV=localhost
# POSTGRES_PORT_DEV=5432
# POSTGRES_DB_DEV=rootfin_dev
# POSTGRES_USER_DEV=postgres
# POSTGRES_PASSWORD_DEV=postgres

# Optional Settings
POSTGRES_LOGGING=false
SYNC_DB=true

# JWT Secret
JWT_SECRET=your_very_secure_jwt_secret_key_min_32_chars
```

---

## How to Get/Set Up These Values

### Step 1: Install PostgreSQL

If not installed, install PostgreSQL first:
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql`

### Step 2: Find Your PostgreSQL Connection Details

#### Default Local Installation:
- **Host**: `localhost` or `127.0.0.1`
- **Port**: `5432`
- **Username**: `postgres` (default superuser)
- **Password**: The password you set during installation

#### Check if PostgreSQL is Running:
```bash
# Windows
net start | findstr postgresql

# macOS/Linux
sudo systemctl status postgresql
```

### Step 3: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE rootfin_dev;

# (Optional) Create a dedicated user
CREATE USER rootfin_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE rootfin_dev TO rootfin_user;

# Exit
\q
```

### Step 4: Test Connection

You can test your connection using:

```bash
psql -h localhost -p 5432 -U postgres -d rootfin_dev
```

Or use our test script:
```bash
cd backend
node test-postgresql-connection.js
```

---

## For Cloud Providers

### Heroku
- Connection URI is automatically provided in `DATABASE_URL` environment variable
- Format: `postgresql://user:pass@host:port/database`

### Render
- Get connection string from Dashboard → Database → Internal Database URL
- Format: `postgresql://user:pass@host:port/database`

### AWS RDS
- Get from RDS Console → Connectivity & Security → Endpoint
- Format: `postgresql://user:pass@your-instance.region.rds.amazonaws.com:5432/dbname`

### Railway, Supabase, Neon, etc.
- Each provider gives you a connection string in their dashboard
- Usually in format: `postgresql://user:pass@host:port/database`

---

## Quick Reference Table

| Parameter | Description | Example Values |
|-----------|-------------|----------------|
| **Host** | Server address | `localhost`, `192.168.1.100`, `db.example.com` |
| **Port** | PostgreSQL port | `5432` (default) |
| **Database** | Database name | `rootfin_dev`, `myapp_db` |
| **Username** | PostgreSQL user | `postgres`, `rootfin_user` |
| **Password** | User password | `your_password_here` |

---

## Connection String Breakdown

```
postgresql://username:password@host:port/database
          │        │         │    │    │     │
          │        │         │    │    │     └─ Database name
          │        │         │    │    └─────── Port (default: 5432)
          │        │         │    └──────────── Host/server
          │        │         └───────────────── Password
          │        └─────────────────────────── Username
          └──────────────────────────────────── Protocol
```

**Example:**
```
postgresql://postgres:mypassword@localhost:5432/rootfin_dev
```

Means:
- **Protocol**: `postgresql://`
- **Username**: `postgres`
- **Password**: `mypassword`
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `rootfin_dev`

---

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for production databases
3. **Use SSL** for remote connections (especially production)
4. **Create dedicated users** instead of using superuser (`postgres`)
5. **Limit database permissions** to what's needed

---

## Troubleshooting Connection Issues

### Issue: "Connection refused"
- **Solution**: Check if PostgreSQL is running
  ```bash
  # Windows
  net start postgresql-x64-XX
  
  # macOS/Linux
  sudo systemctl start postgresql
  ```

### Issue: "Authentication failed"
- **Solution**: Check username and password
- Verify `pg_hba.conf` allows connections

### Issue: "Database does not exist"
- **Solution**: Create the database first:
  ```sql
  CREATE DATABASE rootfin_dev;
  ```

### Issue: "Connection timeout"
- **Solution**: Check host and port are correct
- Verify firewall allows connections on port 5432

---

## Example: Complete Setup for Local Development

1. **Install PostgreSQL** ✅
2. **Set password for postgres user:**
   ```bash
   psql -U postgres
   ALTER USER postgres PASSWORD 'your_password';
   \q
   ```

3. **Create database:**
   ```bash
   psql -U postgres
   CREATE DATABASE rootfin_dev;
   \q
   ```

4. **Create `.env.development` file:**
   ```env
   DB_TYPE=postgresql
   POSTGRES_URI_DEV=postgresql://postgres:your_password@localhost:5432/rootfin_dev
   SYNC_DB=true
   ```

5. **Test connection:**
   ```bash
   cd backend
   node test-postgresql-connection.js
   ```

---

**That's all you need!** Once you have these 5 pieces of information (host, port, database, username, password), you can connect to PostgreSQL.

