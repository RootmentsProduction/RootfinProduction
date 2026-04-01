# Sync Production Database Models

## Problem
The 500 error on `/api/inventory/store-orders` in production suggests the database tables might not exist or are out of sync with your models.

## Solution Options

### Option 1: Quick Sync (Temporary - Use with Caution)

**Steps:**
1. Go to Render.com Dashboard → Your Backend Service → Environment
2. Add/Update environment variables:
   ```
   SYNC_DB=true
   NODE_ENV=production
   ```
3. Save and redeploy

**How it works:**
- The code in `backend/db/postgresql.js` checks `SYNC_DB` environment variable
- Currently it only syncs in development mode
- We need to modify the code to allow production sync when explicitly enabled

**Code Change Needed:**
Edit `backend/db/postgresql.js` around line 110:

```javascript
// OLD CODE:
if (env === 'development' && process.env.SYNC_DB === 'true') {
  console.log('🔄 Syncing database models...');
  await import('../models/sequelize/index.js');
  await sequelize.sync({ alter: false });
  console.log('✅ Database models synced');
}

// NEW CODE:
if (process.env.SYNC_DB === 'true') {
  console.log('🔄 Syncing database models...');
  await import('../models/sequelize/index.js');
  
  // Use alter: true in production to update existing tables without dropping
  const syncOptions = env === 'production' ? { alter: true } : { alter: false };
  await sequelize.sync(syncOptions);
  console.log('✅ Database models synced');
}
```

⚠️ **Warnings:**
- `sync({ alter: true })` modifies existing tables (adds/removes columns)
- Can cause data loss if columns are removed
- Not recommended for production with important data

---

### Option 2: Manual Database Sync Script (Safer)

Create a one-time script to sync the database:

**File: `backend/sync-production-db.js`**
```javascript
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load production environment
dotenv.config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

async function syncDatabase() {
  try {
    console.log('🔌 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Connected!');
    
    console.log('📦 Loading models...');
    await import('./models/sequelize/index.js');
    
    console.log('🔄 Syncing models (alter: true)...');
    await sequelize.sync({ alter: true });
    
    console.log('✅ Database synced successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

syncDatabase();
```

**Run locally (connects to production DB):**
```bash
cd backend
node sync-production-db.js
```

---

### Option 3: Use Sequelize Migrations (Best Practice)

This is the proper way for production databases.

**Install Sequelize CLI:**
```bash
cd backend
npm install --save-dev sequelize-cli
```

**Initialize migrations:**
```bash
npx sequelize-cli init
```

**Create migration for StoreOrder:**
```bash
npx sequelize-cli migration:generate --name create-store-orders
```

**Edit the migration file** (in `backend/migrations/XXXXXX-create-store-orders.js`):
```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StoreOrders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      storeWarehouse: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending',
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      items: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      notes: {
        type: Sequelize.TEXT,
      },
      createdBy: {
        type: Sequelize.STRING,
      },
      approvedBy: {
        type: Sequelize.STRING,
      },
      approvedAt: {
        type: Sequelize.DATE,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('StoreOrders');
  },
};
```

**Run migration in production:**
```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host/db"

# Run migrations
npx sequelize-cli db:migrate
```

---

## Recommended Approach

**For immediate fix:**
1. Use Option 2 (Manual Sync Script) - run it once from your local machine
2. It connects to production DB and syncs tables

**For long-term:**
1. Set up Sequelize migrations (Option 3)
2. Use migrations for all future schema changes
3. Never use `sync()` in production

---

## Check Current Database State

**Connect to production PostgreSQL:**
```bash
# Get connection string from Render dashboard
psql "postgresql://user:pass@host/db"

# List tables
\dt

# Check if StoreOrders table exists
\d "StoreOrders"
```

If the table doesn't exist, that's why you're getting the 500 error.

---

## After Syncing

Once tables are created, **remove** or set to `false`:
```
SYNC_DB=false
```

This prevents automatic syncing on every deployment.
