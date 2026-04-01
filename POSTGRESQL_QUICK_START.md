# PostgreSQL Quick Start Guide

This is a quick guide to get started with PostgreSQL in your RootFin application.

## Step 1: Install PostgreSQL

### Windows
Download and install from: https://www.postgresql.org/download/windows/

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step 2: Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE rootfin_dev;

# Exit
\q
```

## Step 3: Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `pg` - PostgreSQL client
- `sequelize` - SQL ORM

## Step 4: Configure Environment

1. Copy the example environment file:
   ```bash
   cp backend/.env.postgresql.example backend/.env.development
   ```

2. Edit `backend/.env.development` and update:
   ```env
   DB_TYPE=postgresql
   POSTGRES_URI_DEV=postgresql://postgres:your_password@localhost:5432/rootfin_dev
   ```

   Replace `your_password` with your PostgreSQL password.

## Step 5: Test Connection

```bash
cd backend
node test-postgresql-connection.js
```

You should see:
```
✅ PostgreSQL connection successful!
📊 Connected to database: rootfin_dev
```

## Step 6: Start Server

```bash
cd backend
npm run dev
```

The server will connect to PostgreSQL instead of MongoDB.

## Using PostgreSQL Models

### Available Models

Models are located in `backend/models/sequelize/`:
- ✅ `User.js`
- ✅ `Transaction.js`
- ✅ `Vendor.js`

### Example Usage

```javascript
import { User, Transaction, Vendor } from '../models/sequelize/index.js';

// Find a user
const user = await User.findOne({ where: { email: 'user@example.com' } });

// Create a user
const newUser = await User.create({
  username: 'john',
  email: 'john@example.com',
  password: hashedPassword,
  locCode: 'LOC001',
  power: 'normal'
});

// Find all transactions
const transactions = await Transaction.findAll({ 
  where: { locCode: 'LOC001' } 
});
```

## Switching Back to MongoDB

To switch back to MongoDB, just change in `.env.development`:
```env
DB_TYPE=mongodb
```

## Next Steps

1. ✅ PostgreSQL is now set up
2. ⏳ Convert more models (see `POSTGRESQL_MIGRATION_GUIDE.md`)
3. ⏳ Update controllers to use Sequelize models
4. ⏳ Migrate existing data from MongoDB

## Need Help?

See the full guide: `POSTGRESQL_MIGRATION_GUIDE.md`

