# PostgreSQL Migration Guide

This guide will help you migrate from MongoDB (NoSQL) to PostgreSQL (SQL) for your RootFin application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Migration Strategy](#migration-strategy)
6. [Using the New Models](#using-the-new-models)
7. [Data Migration](#data-migration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Install PostgreSQL

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Or use Chocolatey: `choco install postgresql`

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Verify PostgreSQL Installation

```bash
psql --version
```

### 3. Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create development database
CREATE DATABASE rootfin_dev;

# Create production database (optional)
CREATE DATABASE rootfin_prod;

# Create a user (optional, you can use postgres user)
CREATE USER rootfin_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE rootfin_dev TO rootfin_user;

# Exit
\q
```

---

## Installation

### 1. Install Dependencies

The required packages have been added to `package.json`. Install them:

```bash
cd backend
npm install
```

This will install:
- `pg` - PostgreSQL client for Node.js
- `sequelize` - SQL ORM for Node.js (similar to Mongoose)

---

## Database Setup

### PostgreSQL Connection Options

You can connect to PostgreSQL using either:

**Option 1: Connection URI** (Recommended for cloud deployments)
```
postgresql://username:password@host:port/database
```

**Option 2: Individual Parameters**
- Database name
- Username
- Password
- Host
- Port

---

## Environment Configuration

### Development Environment

Create or update `backend/.env.development`:

```env
NODE_ENV=development
PORT=7000

# PostgreSQL Configuration (Option 1: Connection URI)
POSTGRES_URI_DEV=postgresql://postgres:postgres@localhost:5432/rootfin_dev

# PostgreSQL Configuration (Option 2: Individual Parameters)
POSTGRES_DB_DEV=rootfin_dev
POSTGRES_USER_DEV=postgres
POSTGRES_PASSWORD_DEV=postgres
POSTGRES_HOST_DEV=localhost
POSTGRES_PORT_DEV=5432

# Optional: Enable SQL logging for debugging
POSTGRES_LOGGING=false

# Optional: Auto-sync database models (set to false in production)
SYNC_DB=true

# Keep MongoDB config for backward compatibility during migration
MONGODB_URI_DEV=mongodb://localhost:27017/rootfin_dev

# JWT Secret
JWT_SECRET=your_very_secure_jwt_secret_key_min_32_chars
```

### Production Environment

Create or update `backend/.env.production`:

```env
NODE_ENV=production
PORT=7000

# PostgreSQL Configuration (Use connection URI for cloud providers)
POSTGRES_URI_PROD=postgresql://user:password@host:port/database

# Or use individual parameters
POSTGRES_DB_PROD=rootfin_prod
POSTGRES_USER_PROD=your_user
POSTGRES_PASSWORD_PROD=your_secure_password
POSTGRES_HOST_PROD=your_host
POSTGRES_PORT_PROD=5432

# For cloud providers like Heroku, Render, AWS RDS, etc.
DATABASE_URL=postgresql://user:password@host:port/database

# MongoDB (can be removed after full migration)
MONGODB_URI_PROD=your_mongodb_connection_string

JWT_SECRET=your_very_secure_jwt_secret_key_min_32_chars
```

---

## Migration Strategy

### Phase 1: Parallel Running (Current)

During this phase, both MongoDB and PostgreSQL will be available:

1. **New features** → Use PostgreSQL models (`backend/models/sequelize/`)
2. **Existing features** → Continue using MongoDB models (`backend/model/`)
3. Gradually migrate controllers to use Sequelize models

### Phase 2: Full Migration

1. Migrate all controllers to use Sequelize models
2. Migrate existing data from MongoDB to PostgreSQL
3. Update server.js to use only PostgreSQL
4. Remove MongoDB dependencies

---

## Using the New Models

### Available Sequelize Models

Current Sequelize models are located in `backend/models/sequelize/`:

- ✅ `User.js` - User authentication and authorization
- ✅ `Transaction.js` - Financial transactions
- ✅ `Vendor.js` - Vendor management

### Example: Using Sequelize Models in Controllers

**Old MongoDB Way:**
```javascript
import User from '../model/UserModel.js';

const user = await User.findOne({ email: req.body.email });
```

**New PostgreSQL Way:**
```javascript
import { User } from '../models/sequelize/index.js';

const user = await User.findOne({ where: { email: req.body.email } });
```

### Key Differences

| MongoDB (Mongoose) | PostgreSQL (Sequelize) |
|-------------------|------------------------|
| `User.findById(id)` | `User.findByPk(id)` |
| `User.findOne({ email })` | `User.findOne({ where: { email } })` |
| `User.create(data)` | `User.create(data)` ✅ Same |
| `User.updateOne({}, {})` | `User.update({}, { where: {} })` |
| `User.deleteOne({})` | `User.destroy({ where: {} })` |
| `doc.save()` | `instance.save()` ✅ Same |

### Query Examples

**Find All:**
```javascript
// MongoDB
const users = await User.find({ locCode: 'LOC001' });

// Sequelize
const users = await User.findAll({ where: { locCode: 'LOC001' } });
```

**Create:**
```javascript
// Both are similar
const user = await User.create({
  username: 'john',
  email: 'john@example.com',
  password: hashedPassword,
  locCode: 'LOC001',
  power: 'normal'
});
```

**Update:**
```javascript
// MongoDB
await User.updateOne({ _id: userId }, { power: 'admin' });

// Sequelize
await User.update({ power: 'admin' }, { where: { id: userId } });
```

**Delete:**
```javascript
// MongoDB
await User.deleteOne({ _id: userId });

// Sequelize
await User.destroy({ where: { id: userId } });
```

---

## Data Migration

### Manual Migration Script

Create a migration script to copy data from MongoDB to PostgreSQL:

```javascript
// backend/scripts/migrateToPostgres.js
import mongoose from 'mongoose';
import { connectPostgreSQL, User, Transaction, Vendor } from '../models/sequelize/index.js';
import UserMongo from '../model/UserModel.js';
// ... import other MongoDB models

async function migrateUsers() {
  const mongoUsers = await UserMongo.find({});
  
  for (const mongoUser of mongoUsers) {
    await User.create({
      username: mongoUser.username,
      email: mongoUser.email,
      password: mongoUser.password,
      locCode: mongoUser.locCode,
      power: mongoUser.power,
      createdAt: mongoUser.createdAt,
      updatedAt: mongoUser.updatedAt,
    });
  }
  
  console.log(`✅ Migrated ${mongoUsers.length} users`);
}

// Run migrations
async function runMigrations() {
  await connectPostgreSQL();
  // Connect to MongoDB first
  await mongoose.connect(process.env.MONGODB_URI_DEV);
  
  await migrateUsers();
  // Add other migration functions here
  
  process.exit(0);
}

runMigrations();
```

### Using Migration Script

```bash
cd backend
node scripts/migrateToPostgres.js
```

---

## Testing

### 1. Test Database Connection

Create a test script `backend/test-db-connection.js`:

```javascript
import { connectPostgreSQL } from './db/postgresql.js';

(async () => {
  try {
    await connectPostgreSQL();
    console.log('✅ PostgreSQL connection successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
})();
```

Run it:
```bash
node backend/test-db-connection.js
```

### 2. Test Model Creation

```javascript
import { connectPostgreSQL, User } from './models/sequelize/index.js';

(async () => {
  await connectPostgreSQL();
  
  // Test creating a user
  const testUser = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    locCode: 'TEST',
    power: 'normal'
  });
  
  console.log('✅ User created:', testUser.toJSON());
  
  // Clean up
  await testUser.destroy();
  console.log('✅ Test user deleted');
  
  process.exit(0);
})();
```

---

## Updating server.js

The server.js file has been updated to support both databases. To switch to PostgreSQL only:

1. Update `backend/server.js` to use PostgreSQL connection:

```javascript
// Replace
import connectMongoDB from "./db/database.js";
// With
import { connectPostgreSQL } from "./db/postgresql.js";

// Replace
connectMongoDB(env);
// With
await connectPostgreSQL();
```

---

## Troubleshooting

### Issue: Cannot connect to PostgreSQL

**Solution:**
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   net start postgresql-x64-XX
   
   # macOS/Linux
   sudo systemctl status postgresql
   ```

2. Check connection credentials in `.env.development`
3. Verify database exists: `psql -U postgres -l`

### Issue: Authentication failed

**Solution:**
- Check username and password
- Verify pg_hba.conf allows connections
- For localhost, ensure trust or password authentication is enabled

### Issue: Models not syncing

**Solution:**
- Set `SYNC_DB=true` in `.env.development`
- In production, use migrations instead of sync

### Issue: UUID vs Integer IDs

**Solution:**
- Current models use UUID as primary keys (similar to MongoDB ObjectId)
- If you prefer integers, change `DataTypes.UUID` to `DataTypes.INTEGER` with `autoIncrement: true`

---

## Next Steps

1. ✅ Install PostgreSQL dependencies
2. ✅ Set up PostgreSQL database
3. ✅ Configure environment variables
4. ✅ Test database connection
5. ⏳ Convert remaining models to Sequelize
6. ⏳ Update controllers to use Sequelize models
7. ⏳ Migrate existing data
8. ⏳ Test all features
9. ⏳ Deploy to production

---

## Additional Resources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Node.js Driver (pg)](https://node-postgres.com/)

---

## Support

For issues or questions, refer to:
- Project documentation: `COMPLETE_PROJECT_DOCUMENTATION.md`
- Backend models: `backend/models/sequelize/`
- Database connection: `backend/db/postgresql.js`

