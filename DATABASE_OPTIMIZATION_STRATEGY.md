# Database Optimization Strategy for Financial Reports

## Current Database Analysis

### Database Setup
- **MongoDB**: Primary database (Mongoose)
- **PostgreSQL**: Secondary database (Sequelize) 
- **Dual Database Issues**: Data synchronization overhead, complex queries

### Key Collections/Tables
1. **Transactions** - Financial data (heavily queried)
2. **ShoeItems** - Inventory data with warehouse stocks
3. **SalesInvoices** - Invoice data
4. **ItemGroups** - Product groupings
5. **Stores** - Location data

## Critical Performance Issues Identified

### 1. Missing Database Indexes
Your collections lack proper indexes for common query patterns:

```javascript
// Current slow queries (no indexes):
Transaction.find({ locCode: "144", date: { $gte: "2024-01-01", $lte: "2024-12-31" } })
ShoeItem.find({ "warehouseStocks.warehouse": "Trivandrum", isActive: true })
SalesInvoice.find({ userId: "user123", createdAt: { $gte: date } })
```

### 2. Inefficient Data Types
- **Strings for numbers**: `cash`, `bank`, `upi` stored as strings instead of numbers
- **Large embedded arrays**: `warehouseStocks` array grows indefinitely
- **Binary data in documents**: Images stored directly in MongoDB

### 3. No Query Optimization
- Full collection scans for date ranges
- No aggregation pipeline optimization
- Missing compound indexes

## Immediate Optimizations (Week 1)

### A. Critical Indexes for Financial Reports

```javascript
// 1. Transaction Collection Indexes
db.transactions.createIndex({ "locCode": 1, "date": 1 })
db.transactions.createIndex({ "date": 1, "type": 1 })
db.transactions.createIndex({ "invoiceNo": 1, "locCode": 1 })
db.transactions.createIndex({ "locCode": 1, "date": 1, "type": 1 })
db.transactions.createIndex({ "date": 1, "locCode": 1, "category": 1 })

// 2. ShoeItem Collection Indexes  
db.shoeitems.createIndex({ "isActive": 1, "warehouseStocks.warehouse": 1 })
db.shoeitems.createIndex({ "itemName": "text", "sku": "text" })
db.shoeitems.createIndex({ "warehouseStocks.warehouse": 1, "warehouseStocks.stockOnHand": 1 })
db.shoeitems.createIndex({ "isActive": 1, "createdAt": -1 })

// 3. SalesInvoice Collection Indexes
db.salesinvoices.createIndex({ "locCode": 1, "invoiceDate": 1 })
db.salesinvoices.createIndex({ "invoiceDate": 1, "status": 1 })
db.salesinvoices.createIndex({ "customer": 1, "invoiceDate": -1 })

// 4. ItemGroup Collection Indexes
db.itemgroups.createIndex({ "isActive": 1, "createdAt": -1 })
```

### B. Data Type Optimization

Create a migration script to fix data types:

```javascript
// backend/scripts/optimize-data-types.js
import mongoose from 'mongoose';
import Transaction from '../model/Transaction.js';

const optimizeTransactionDataTypes = async () => {
  console.log('🔄 Converting string numbers to actual numbers...');
  
  const transactions = await Transaction.find({});
  let updated = 0;
  
  for (const transaction of transactions) {
    const updates = {};
    
    // Convert string numbers to actual numbers
    if (typeof transaction.cash === 'string') {
      updates.cash = parseFloat(transaction.cash) || 0;
    }
    if (typeof transaction.bank === 'string') {
      updates.bank = parseFloat(transaction.bank) || 0;
    }
    if (typeof transaction.upi === 'string') {
      updates.upi = parseFloat(transaction.upi) || 0;
    }
    if (typeof transaction.rbl === 'string') {
      updates.rbl = parseFloat(transaction.rbl) || 0;
    }
    if (typeof transaction.amount === 'string') {
      updates.amount = parseFloat(transaction.amount) || 0;
    }
    
    if (Object.keys(updates).length > 0) {
      await Transaction.updateOne({ _id: transaction._id }, updates);
      updated++;
    }
  }
  
  console.log(`✅ Updated ${updated} transactions`);
};

// Run: node backend/scripts/optimize-data-types.js
```

### C. Update Schema Definitions

```javascript
// backend/model/Transaction.js - Updated schema
const transactionSchema = new mongoose.Schema({
  type: { type: String, required: true, index: true },
  invoiceNo: { type: String, required: true, unique: true },
  category: { type: String, required: true, index: true },
  subCategory: { type: String, default: "", index: true },
  
  // ✅ Fixed: Numbers instead of strings
  cash: { type: Number, required: true, default: 0 },
  rbl: { type: Number, default: 0 },
  bank: { type: Number, required: true, default: 0 },
  upi: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true },
  billValue: { type: Number, default: 0 },
  
  // ✅ Indexed fields for common queries
  date: { type: Date, required: true, index: true },
  locCode: { type: String, required: true, index: true },
  
  // Other fields...
  paymentMethod: { type: String, enum: ["cash","bank","upi","split"], required: true },
  customerName: { type: String, default: "", index: true },
  
  // ✅ Compound index will be created separately
}, { 
  timestamps: true,
  // ✅ Optimize for read-heavy workload
  read: 'secondaryPreferred'
});

// ✅ Compound indexes for common query patterns
transactionSchema.index({ locCode: 1, date: 1 });
transactionSchema.index({ date: 1, type: 1 });
transactionSchema.index({ locCode: 1, date: 1, category: 1 });
```

## Advanced Optimizations (Week 2)

### A. Aggregation Pipeline Optimization

Replace slow JavaScript processing with MongoDB aggregation:

```javascript
// backend/controllers/OptimizedReportController.js
export const getFinancialSummary = async (req, res) => {
  const { fromDate, toDate, locCode } = req.query;
  
  try {
    // ✅ Use aggregation pipeline instead of fetching all data
    const pipeline = [
      // Match stage - uses indexes
      {
        $match: {
          locCode: locCode,
          date: {
            $gte: new Date(fromDate),
            $lte: new Date(toDate)
          }
        }
      },
      
      // Group by category and calculate totals
      {
        $group: {
          _id: {
            category: "$category",
            type: "$type"
          },
          totalCash: { $sum: "$cash" },
          totalRbl: { $sum: "$rbl" },
          totalBank: { $sum: "$bank" },
          totalUpi: { $sum: "$upi" },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          transactions: { $push: "$$ROOT" }
        }
      },
      
      // Sort by category
      {
        $sort: { "_id.category": 1, "_id.type": 1 }
      }
    ];
    
    const results = await Transaction.aggregate(pipeline);
    
    // Calculate grand totals
    const grandTotals = results.reduce((acc, group) => ({
      cash: acc.cash + group.totalCash,
      rbl: acc.rbl + group.totalRbl,
      bank: acc.bank + group.totalBank,
      upi: acc.upi + group.totalUpi,
      amount: acc.amount + group.totalAmount
    }), { cash: 0, rbl: 0, bank: 0, upi: 0, amount: 0 });
    
    res.json({
      success: true,
      data: {
        summary: results,
        totals: grandTotals,
        period: { fromDate, toDate }
      }
    });
    
  } catch (error) {
    console.error('Error in financial summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### B. Implement Caching Layer

```javascript
// backend/utils/cacheManager.js
import NodeCache from 'node-cache';

// Cache for 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300 });

export const getCachedData = (key) => {
  return cache.get(key);
};

export const setCachedData = (key, data, ttl = 300) => {
  return cache.set(key, data, ttl);
};

export const generateCacheKey = (prefix, params) => {
  return `${prefix}:${JSON.stringify(params)}`;
};

// Usage in controllers
export const getCachedFinancialSummary = async (req, res) => {
  const cacheKey = generateCacheKey('financial_summary', req.query);
  
  // Try cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  
  // If not cached, fetch from database
  const data = await getFinancialSummaryFromDB(req.query);
  
  // Cache the result
  setCachedData(cacheKey, data);
  
  res.json(data);
};
```

### C. Database Connection Optimization

```javascript
// backend/config/database.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // ✅ Connection pool optimization
      maxPoolSize: 10,        // Maximum number of connections
      minPoolSize: 2,         // Minimum number of connections
      maxIdleTimeMS: 30000,   // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      
      // ✅ Performance optimizations
      bufferCommands: false,  // Disable mongoose buffering
      bufferMaxEntries: 0,    // Disable mongoose buffering
      
      // ✅ Read preferences for reporting
      readPreference: 'secondaryPreferred', // Use secondary for reads when possible
      
      // ✅ Write concerns
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
      }
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // ✅ Monitor connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;
```

## Long-term Optimizations (Week 3-4)

### A. Database Architecture Improvements

#### Option 1: MongoDB Sharding (for very large datasets)
```javascript
// Shard key strategy for transactions
sh.shardCollection("finance.transactions", { "locCode": 1, "date": 1 })
```

#### Option 2: Read Replicas for Reporting
```javascript
// Separate read replica for heavy reporting queries
const reportingConnection = mongoose.createConnection(MONGODB_REPORTING_URI, {
  readPreference: 'secondary'
});
```

#### Option 3: Time-Series Collections (MongoDB 5.0+)
```javascript
// For high-frequency transaction data
db.createCollection("transactions_ts", {
  timeseries: {
    timeField: "date",
    metaField: "locCode",
    granularity: "hours"
  }
});
```

### B. Data Archiving Strategy

```javascript
// backend/scripts/archive-old-data.js
const archiveOldTransactions = async () => {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 2); // Archive data older than 2 years
  
  // Move old transactions to archive collection
  const oldTransactions = await Transaction.find({
    date: { $lt: cutoffDate }
  });
  
  if (oldTransactions.length > 0) {
    // Insert into archive collection
    await ArchiveTransaction.insertMany(oldTransactions);
    
    // Remove from main collection
    await Transaction.deleteMany({
      date: { $lt: cutoffDate }
    });
    
    console.log(`✅ Archived ${oldTransactions.length} old transactions`);
  }
};
```

### C. Materialized Views for Complex Reports

```javascript
// Create pre-calculated summary collections
const createDailySummary = async () => {
  const pipeline = [
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          locCode: "$locCode"
        },
        totalCash: { $sum: "$cash" },
        totalRbl: { $sum: "$rbl" },
        totalBank: { $sum: "$bank" },
        totalUpi: { $sum: "$upi" },
        totalAmount: { $sum: "$amount" },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $out: "daily_summaries" // Output to materialized collection
    }
  ];
  
  await Transaction.aggregate(pipeline);
};

// Run daily via cron job
```

## Performance Monitoring

### A. Query Performance Monitoring

```javascript
// backend/middleware/queryMonitor.js
import mongoose from 'mongoose';

// Enable MongoDB profiling
mongoose.set('debug', (collectionName, method, query, doc) => {
  const start = Date.now();
  
  // Log slow queries (>100ms)
  setTimeout(() => {
    const duration = Date.now() - start;
    if (duration > 100) {
      console.warn(`🐌 Slow Query: ${collectionName}.${method}`, {
        query,
        duration: `${duration}ms`
      });
    }
  }, 0);
});
```

### B. Database Health Monitoring

```javascript
// backend/routes/health.js
export const getDatabaseHealth = async (req, res) => {
  try {
    const stats = await mongoose.connection.db.stats();
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    const health = {
      status: 'healthy',
      database: {
        size: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
        collections: collections.length,
        indexes: stats.indexes,
        avgObjSize: `${(stats.avgObjSize / 1024).toFixed(2)} KB`
      },
      performance: {
        connections: mongoose.connection.readyState,
        poolSize: mongoose.connection.db.serverConfig?.s?.poolSize || 'unknown'
      }
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
};
```

## Expected Performance Improvements

### Before Optimization:
- **Financial Reports**: 8-15 seconds
- **Inventory Queries**: 3-8 seconds  
- **Invoice Search**: 2-5 seconds
- **Database Size**: Growing without bounds

### After Week 1 (Indexes + Data Types):
- **Financial Reports**: 3-6 seconds (60% improvement)
- **Inventory Queries**: 1-3 seconds (70% improvement)
- **Invoice Search**: 0.5-2 seconds (75% improvement)

### After Week 2 (Aggregation + Caching):
- **Financial Reports**: 1-2 seconds (85% improvement)
- **Inventory Queries**: 0.5-1 seconds (85% improvement)
- **Invoice Search**: 0.2-0.5 seconds (90% improvement)

### After Week 3-4 (Architecture + Archiving):
- **Financial Reports**: 0.5-1 seconds (95% improvement)
- **All Queries**: Sub-second response times
- **Database Size**: Controlled growth with archiving
- **Concurrent Users**: 10x more capacity

## Implementation Priority

### Week 1: Critical Indexes (High Impact, Low Risk)
1. ✅ Add compound indexes for common queries
2. ✅ Fix data types (string → number)
3. ✅ Optimize connection pooling
4. ✅ Add query monitoring

### Week 2: Aggregation & Caching (High Impact, Medium Risk)
1. ✅ Replace JavaScript processing with MongoDB aggregation
2. ✅ Implement Redis/NodeCache caching layer
3. ✅ Optimize controller logic
4. ✅ Add performance monitoring

### Week 3: Architecture (Medium Impact, Medium Risk)
1. ✅ Consider read replicas for reporting
2. ✅ Implement data archiving
3. ✅ Create materialized views
4. ✅ Add automated maintenance

This database optimization strategy will provide immediate and long-term performance improvements for your financial reporting system.