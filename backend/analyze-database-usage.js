import { sequelize } from "./models/sequelize/index.js";
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

/**
 * Comprehensive Database Usage Analysis
 * Shows what's being saved to PostgreSQL vs MongoDB
 */

class DatabaseUsageAnalyzer {
  constructor() {
    this.postgresModels = [];
    this.mongoModels = [];
    this.controllerUsage = {};
  }

  async connect() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to both databases\n');
  }

  async analyzePostgresTables() {
    console.log('🔍 POSTGRESQL ANALYSIS');
    console.log('======================');
    
    // Get all PostgreSQL tables with data
    const [tables] = await sequelize.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const postgresData = [];
    
    for (const table of tables) {
      try {
        const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
        const rowCount = parseInt(countResult[0].count);
        
        if (rowCount > 0) {
          // Get recent activity
          const [recentResult] = await sequelize.query(`
            SELECT MAX(created_at) as last_created, MAX(updated_at) as last_updated 
            FROM "${table.table_name}" 
            WHERE created_at IS NOT NULL OR updated_at IS NOT NULL
          `);
          
          postgresData.push({
            table: table.table_name,
            records: rowCount,
            columns: table.column_count,
            lastActivity: recentResult[0]?.last_updated || recentResult[0]?.last_created || 'Unknown'
          });
        }
      } catch (error) {
        // Skip tables we can't access
      }
    }
    
    // Sort by record count
    postgresData.sort((a, b) => b.records - a.records);
    
    console.log('📊 PostgreSQL Tables with Data:');
    postgresData.forEach((table, index) => {
      const priority = table.records > 50 ? '🔥' : table.records > 10 ? '⚠️' : '📝';
      const lastActivity = table.lastActivity !== 'Unknown' ? 
        new Date(table.lastActivity).toLocaleDateString() : 'Unknown';
      
      console.log(`${index + 1}. ${priority} ${table.table} (${table.records} records, last: ${lastActivity})`);
    });
    
    return postgresData;
  }

  async analyzeMongoCollections() {
    console.log('\n🔍 MONGODB ANALYSIS');
    console.log('===================');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const mongoData = [];
    
    for (const collection of collections) {
      try {
        const collectionName = collection.name;
        const count = await db.collection(collectionName).countDocuments();
        
        if (count > 0) {
          // Get recent activity
          const recent = await db.collection(collectionName)
            .findOne({}, { sort: { updatedAt: -1, createdAt: -1 } });
          
          const lastActivity = recent?.updatedAt || recent?.createdAt || 'Unknown';
          
          mongoData.push({
            collection: collectionName,
            records: count,
            lastActivity: lastActivity
          });
        }
      } catch (error) {
        // Skip collections we can't access
      }
    }
    
    // Sort by record count
    mongoData.sort((a, b) => b.records - a.records);
    
    console.log('📊 MongoDB Collections with Data:');
    mongoData.forEach((coll, index) => {
      const priority = coll.records > 50 ? '🔥' : coll.records > 10 ? '⚠️' : '📝';
      const lastActivity = coll.lastActivity !== 'Unknown' ? 
        new Date(coll.lastActivity).toLocaleDateString() : 'Unknown';
      
      console.log(`${index + 1}. ${priority} ${coll.collection} (${coll.records} records, last: ${lastActivity})`);
    });
    
    return mongoData;
  }

  async analyzeControllerUsage() {
    console.log('\n🔍 CONTROLLER ANALYSIS');
    console.log('======================');
    
    const controllersDir = './controllers';
    const controllers = fs.readdirSync(controllersDir)
      .filter(file => file.endsWith('.js'))
      .map(file => file.replace('.js', ''));
    
    const usage = {};
    
    for (const controller of controllers) {
      try {
        const filePath = path.join(controllersDir, `${controller}.js`);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for PostgreSQL usage (Sequelize models)
        const pgMatches = content.match(/import.*from.*sequelize.*index/g) || [];
        const pgCreates = content.match(/\w+\.create\(/g) || [];
        const pgFinds = content.match(/\w+\.findAll\(|\w+\.findOne\(|\w+\.findByPk\(/g) || [];
        
        // Check for MongoDB usage (Mongoose models)
        const mongoImports = content.match(/import.*from.*model\//g) || [];
        const mongoCreates = content.match(/new \w+\(|\.create\(/g) || [];
        const mongoFinds = content.match(/\.find\(|\.findOne\(|\.findById\(/g) || [];
        
        usage[controller] = {
          postgresql: {
            imports: pgMatches.length,
            creates: pgCreates.length,
            reads: pgFinds.length,
            total: pgMatches.length + pgCreates.length + pgFinds.length
          },
          mongodb: {
            imports: mongoImports.length,
            creates: mongoCreates.length,
            reads: mongoFinds.length,
            total: mongoImports.length + mongoCreates.length + mongoFinds.length
          }
        };
      } catch (error) {
        // Skip files we can't read
      }
    }
    
    // Categorize controllers
    const postgresOnly = [];
    const mongoOnly = [];
    const dualDatabase = [];
    const noDatabase = [];
    
    Object.entries(usage).forEach(([controller, data]) => {
      const hasPg = data.postgresql.total > 0;
      const hasMongo = data.mongodb.total > 0;
      
      if (hasPg && hasMongo) {
        dualDatabase.push({ controller, ...data });
      } else if (hasPg) {
        postgresOnly.push({ controller, ...data });
      } else if (hasMongo) {
        mongoOnly.push({ controller, ...data });
      } else {
        noDatabase.push({ controller, ...data });
      }
    });
    
    console.log('🔥 CONTROLLERS USING POSTGRESQL ONLY:');
    postgresOnly.forEach(item => {
      console.log(`   - ${item.controller} (${item.postgresql.creates} creates, ${item.postgresql.reads} reads)`);
    });
    
    console.log('\n🔥 CONTROLLERS USING MONGODB ONLY:');
    mongoOnly.forEach(item => {
      console.log(`   - ${item.controller} (${item.mongodb.creates} creates, ${item.mongodb.reads} reads)`);
    });
    
    console.log('\n✅ CONTROLLERS USING BOTH DATABASES:');
    dualDatabase.forEach(item => {
      console.log(`   - ${item.controller} (PG: ${item.postgresql.total}, Mongo: ${item.mongodb.total})`);
    });
    
    return { postgresOnly, mongoOnly, dualDatabase, noDatabase };
  }

  async generateRecommendations(postgresData, mongoData, controllerData) {
    console.log('\n💡 RECOMMENDATIONS');
    console.log('==================');
    
    console.log('🎯 HIGH PRIORITY - Add Dual-Save Logic:');
    
    // Find PostgreSQL-only controllers with significant data
    const highPriorityPg = controllerData.postgresOnly.filter(item => {
      const tableName = this.controllerToTable(item.controller);
      const tableData = postgresData.find(t => t.table === tableName);
      return tableData && tableData.records > 5;
    });
    
    highPriorityPg.forEach(item => {
      const tableName = this.controllerToTable(item.controller);
      const tableData = postgresData.find(t => t.table === tableName);
      console.log(`   🔥 ${item.controller} → ${tableName} (${tableData?.records || 0} records)`);
    });
    
    console.log('\n📝 MEDIUM PRIORITY - Consider Dual-Save:');
    
    const mediumPriorityPg = controllerData.postgresOnly.filter(item => {
      const tableName = this.controllerToTable(item.controller);
      const tableData = postgresData.find(t => t.table === tableName);
      return tableData && tableData.records > 0 && tableData.records <= 5;
    });
    
    mediumPriorityPg.forEach(item => {
      const tableName = this.controllerToTable(item.controller);
      const tableData = postgresData.find(t => t.table === tableName);
      console.log(`   ⚠️ ${item.controller} → ${tableName} (${tableData?.records || 0} records)`);
    });
    
    console.log('\n✅ ALREADY DUAL-SAVE:');
    controllerData.dualDatabase.forEach(item => {
      console.log(`   ✅ ${item.controller} (Already using both databases)`);
    });
    
    console.log('\n🔧 IMPLEMENTATION PRIORITY:');
    console.log('1. InventoryAdjustmentController ✅ (Already done)');
    console.log('2. TransferOrderController ✅ (Already done)');
    console.log('3. VendorController ✅ (Just added)');
    
    const remaining = highPriorityPg.filter(item => 
      !['InventoryAdjustmentController', 'TransferOrderController', 'VendorController'].includes(item.controller)
    );
    
    remaining.forEach((item, index) => {
      console.log(`${index + 4}. ${item.controller} ⏳ (Needs dual-save)`);
    });
  }

  controllerToTable(controllerName) {
    // Map controller names to table names
    const mapping = {
      'InventoryAdjustmentController': 'inventory_adjustments',
      'TransferOrderController': 'transfer_orders',
      'SalesPersonController': 'sales_persons',
      'StoreController': 'stores',
      'VendorController': 'vendors',
      'VendorHistoryController': 'vendor_histories',
      'TransactionController': 'transactions',
      'UserController': 'users',
      'VendorCreditController': 'vendor_credits',
      'StoreOrderController': 'store_orders',
      'SalesInvoiceController': 'sales_invoices'
    };
    
    return mapping[controllerName] || controllerName.toLowerCase().replace('controller', 's');
  }
}

async function main() {
  const analyzer = new DatabaseUsageAnalyzer();
  
  try {
    await analyzer.connect();
    
    const postgresData = await analyzer.analyzePostgresTables();
    const mongoData = await analyzer.analyzeMongoCollections();
    const controllerData = await analyzer.analyzeControllerUsage();
    
    await analyzer.generateRecommendations(postgresData, mongoData, controllerData);
    
    console.log('\n📊 SUMMARY');
    console.log('==========');
    console.log(`PostgreSQL tables with data: ${postgresData.length}`);
    console.log(`MongoDB collections with data: ${mongoData.length}`);
    console.log(`Controllers using PostgreSQL only: ${controllerData.postgresOnly.length}`);
    console.log(`Controllers using MongoDB only: ${controllerData.mongoOnly.length}`);
    console.log(`Controllers using both: ${controllerData.dualDatabase.length}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

console.log('🔍 Database Usage Analyzer');
console.log('==========================\n');

main();