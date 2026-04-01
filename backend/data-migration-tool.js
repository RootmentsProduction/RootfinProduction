import { InventoryAdjustment as PostgresInventoryAdjustment } from "./models/sequelize/index.js";
import MongoInventoryAdjustment from "./model/InventoryAdjustment.js";
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Comprehensive Data Migration Tool
 * Supports bidirectional migration between PostgreSQL and MongoDB
 */

class DataMigrationTool {
  constructor() {
    this.connected = false;
  }

  async connect() {
    if (!this.connected) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to both PostgreSQL and MongoDB');
      this.connected = true;
    }
  }

  async migrateInventoryAdjustments(direction = 'pg-to-mongo') {
    await this.connect();
    
    if (direction === 'pg-to-mongo') {
      return await this.migratePostgresToMongo();
    } else if (direction === 'mongo-to-pg') {
      return await this.migrateMongoToPostgres();
    } else {
      throw new Error('Invalid direction. Use "pg-to-mongo" or "mongo-to-pg"');
    }
  }

  async migratePostgresToMongo() {
    console.log('🚀 Migrating Inventory Adjustments: PostgreSQL → MongoDB\n');
    
    const pgAdjustments = await PostgresInventoryAdjustment.findAll({
      order: [['createdAt', 'ASC']]
    });
    
    console.log(`📊 Found ${pgAdjustments.length} records in PostgreSQL`);
    
    let stats = { migrated: 0, skipped: 0, errors: 0 };
    
    for (const pgAdj of pgAdjustments) {
      try {
        // Check if already exists
        const existing = await MongoInventoryAdjustment.findOne({
          $or: [
            { postgresqlId: pgAdj.id },
            { referenceNumber: pgAdj.referenceNumber }
          ]
        });
        
        if (existing) {
          console.log(`   ⏭️  ${pgAdj.referenceNumber} already exists, skipping`);
          stats.skipped++;
          continue;
        }
        
        // Convert and create
        const mongoData = this.convertPgToMongo(pgAdj);
        const mongoAdj = await MongoInventoryAdjustment.create(mongoData);
        
        console.log(`   ✅ ${pgAdj.referenceNumber} → ${mongoAdj._id}`);
        stats.migrated++;
        
      } catch (error) {
        console.error(`   ❌ ${pgAdj.referenceNumber}: ${error.message}`);
        stats.errors++;
      }
    }
    
    return stats;
  }

  async migrateMongoToPostgres() {
    console.log('🚀 Migrating Inventory Adjustments: MongoDB → PostgreSQL\n');
    
    const mongoAdjustments = await MongoInventoryAdjustment.find({})
      .sort({ createdAt: 1 });
    
    console.log(`📊 Found ${mongoAdjustments.length} records in MongoDB`);
    
    let stats = { migrated: 0, skipped: 0, errors: 0 };
    
    for (const mongoAdj of mongoAdjustments) {
      try {
        // Check if already exists
        const existing = await PostgresInventoryAdjustment.findOne({
          where: { referenceNumber: mongoAdj.referenceNumber }
        });
        
        if (existing) {
          console.log(`   ⏭️  ${mongoAdj.referenceNumber} already exists, skipping`);
          stats.skipped++;
          continue;
        }
        
        // Convert and create
        const pgData = this.convertMongoToPg(mongoAdj);
        const pgAdj = await PostgresInventoryAdjustment.create(pgData);
        
        // Update MongoDB with PostgreSQL ID
        await MongoInventoryAdjustment.findByIdAndUpdate(mongoAdj._id, {
          postgresqlId: pgAdj.id
        });
        
        console.log(`   ✅ ${mongoAdj.referenceNumber} → ${pgAdj.id}`);
        stats.migrated++;
        
      } catch (error) {
        console.error(`   ❌ ${mongoAdj.referenceNumber}: ${error.message}`);
        stats.errors++;
      }
    }
    
    return stats;
  }

  convertPgToMongo(pgAdj) {
    return {
      referenceNumber: pgAdj.referenceNumber,
      date: pgAdj.date,
      adjustmentType: pgAdj.adjustmentType,
      status: pgAdj.status,
      branch: pgAdj.branch,
      warehouse: pgAdj.warehouse,
      account: pgAdj.account,
      reason: pgAdj.reason,
      description: pgAdj.description,
      items: (pgAdj.items || []).map(item => ({
        itemId: item.itemId || null,
        itemGroupId: item.itemGroupId || null,
        itemName: item.itemName,
        itemSku: item.itemSku,
        currentQuantity: item.currentQuantity || 0,
        currentValue: item.currentValue || 0,
        quantityAdjusted: item.quantityAdjusted || 0,
        newQuantity: item.newQuantity || 0,
        unitCost: item.unitCost || 0,
        valueAdjusted: item.valueAdjusted || 0,
        newValue: item.newValue || 0,
      })),
      userId: pgAdj.userId,
      createdBy: pgAdj.createdBy,
      modifiedBy: pgAdj.modifiedBy,
      locCode: pgAdj.locCode,
      totalQuantityAdjusted: pgAdj.totalQuantityAdjusted || 0,
      totalValueAdjusted: pgAdj.totalValueAdjusted || 0,
      postgresqlId: pgAdj.id,
      createdAt: pgAdj.createdAt,
      updatedAt: pgAdj.updatedAt,
    };
  }

  convertMongoToPg(mongoAdj) {
    return {
      referenceNumber: mongoAdj.referenceNumber,
      date: mongoAdj.date,
      adjustmentType: mongoAdj.adjustmentType,
      status: mongoAdj.status,
      branch: mongoAdj.branch,
      warehouse: mongoAdj.warehouse,
      account: mongoAdj.account,
      reason: mongoAdj.reason,
      description: mongoAdj.description,
      items: (mongoAdj.items || []).map(item => ({
        itemId: item.itemId ? item.itemId.toString() : null,
        itemGroupId: item.itemGroupId ? item.itemGroupId.toString() : null,
        itemName: item.itemName,
        itemSku: item.itemSku,
        currentQuantity: item.currentQuantity || 0,
        currentValue: item.currentValue || 0,
        quantityAdjusted: item.quantityAdjusted || 0,
        newQuantity: item.newQuantity || 0,
        unitCost: item.unitCost || 0,
        valueAdjusted: item.valueAdjusted || 0,
        newValue: item.newValue || 0,
      })),
      userId: mongoAdj.userId,
      createdBy: mongoAdj.createdBy,
      modifiedBy: mongoAdj.modifiedBy,
      locCode: mongoAdj.locCode,
      totalQuantityAdjusted: mongoAdj.totalQuantityAdjusted || 0,
      totalValueAdjusted: mongoAdj.totalValueAdjusted || 0,
      createdAt: mongoAdj.createdAt,
      updatedAt: mongoAdj.updatedAt,
    };
  }

  async syncDatabases() {
    console.log('🔄 Syncing databases bidirectionally...\n');
    
    // First migrate PostgreSQL to MongoDB
    const pgToMongo = await this.migrateInventoryAdjustments('pg-to-mongo');
    console.log('\n');
    
    // Then migrate MongoDB to PostgreSQL
    const mongoToPg = await this.migrateInventoryAdjustments('mongo-to-pg');
    
    return {
      pgToMongo,
      mongoToPg,
      total: {
        migrated: pgToMongo.migrated + mongoToPg.migrated,
        skipped: pgToMongo.skipped + mongoToPg.skipped,
        errors: pgToMongo.errors + mongoToPg.errors
      }
    };
  }

  async verifySync() {
    await this.connect();
    
    const pgCount = await PostgresInventoryAdjustment.count();
    const mongoCount = await MongoInventoryAdjustment.countDocuments();
    
    console.log('\n🔍 Database Verification:');
    console.log(`   PostgreSQL: ${pgCount} records`);
    console.log(`   MongoDB: ${mongoCount} records`);
    
    if (pgCount === mongoCount) {
      console.log('   ✅ Databases are in sync!');
    } else {
      console.log('   ⚠️  Databases have different record counts');
    }
    
    return { pgCount, mongoCount, inSync: pgCount === mongoCount };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  const migrator = new DataMigrationTool();
  
  try {
    switch (command) {
      case 'pg-to-mongo':
        console.log('🔄 PostgreSQL → MongoDB Migration');
        console.log('=================================\n');
        const pgStats = await migrator.migrateInventoryAdjustments('pg-to-mongo');
        console.log('\n📊 Migration Complete:');
        console.log(`   Migrated: ${pgStats.migrated}`);
        console.log(`   Skipped: ${pgStats.skipped}`);
        console.log(`   Errors: ${pgStats.errors}`);
        break;
        
      case 'mongo-to-pg':
        console.log('🔄 MongoDB → PostgreSQL Migration');
        console.log('=================================\n');
        const mongoStats = await migrator.migrateInventoryAdjustments('mongo-to-pg');
        console.log('\n📊 Migration Complete:');
        console.log(`   Migrated: ${mongoStats.migrated}`);
        console.log(`   Skipped: ${mongoStats.skipped}`);
        console.log(`   Errors: ${mongoStats.errors}`);
        break;
        
      case 'sync':
        console.log('🔄 Bidirectional Database Sync');
        console.log('==============================\n');
        const syncStats = await migrator.syncDatabases();
        console.log('\n📊 Sync Complete:');
        console.log(`   Total Migrated: ${syncStats.total.migrated}`);
        console.log(`   Total Skipped: ${syncStats.total.skipped}`);
        console.log(`   Total Errors: ${syncStats.total.errors}`);
        break;
        
      case 'verify':
        console.log('🔍 Database Verification');
        console.log('=======================');
        await migrator.verifySync();
        break;
        
      default:
        console.log('🔧 Data Migration Tool');
        console.log('=====================\n');
        console.log('Usage: node data-migration-tool.js <command>\n');
        console.log('Commands:');
        console.log('  pg-to-mongo  - Migrate PostgreSQL → MongoDB');
        console.log('  mongo-to-pg  - Migrate MongoDB → PostgreSQL');
        console.log('  sync         - Sync both directions');
        console.log('  verify       - Check database sync status');
        console.log('  help         - Show this help\n');
        console.log('Examples:');
        console.log('  node data-migration-tool.js pg-to-mongo');
        console.log('  node data-migration-tool.js sync');
        console.log('  node data-migration-tool.js verify');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

main();