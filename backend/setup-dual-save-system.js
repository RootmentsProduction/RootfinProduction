import { 
  InventoryAdjustment as PgInventoryAdjustment,
  TransferOrder as PgTransferOrder,
  SalesPerson as PgSalesPerson,
  Store as PgStore,
  Vendor as PgVendor,
  VendorHistory as PgVendorHistory
} from "./models/sequelize/index.js";

import MongoInventoryAdjustment from "./model/InventoryAdjustment.js";
import MongoTransferOrder from "./model/TransferOrder.js";
import MongoSalesPerson from "./model/SalesPerson.js";
import MongoStore from "./model/Store.js";
import MongoVendor from "./model/Vendor.js";
import MongoVendorHistory from "./model/VendorHistory.js";

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Comprehensive Dual-Save Migration Tool
 * Migrates all PostgreSQL data to MongoDB for safety
 */

class DualSaveMigrationTool {
  constructor() {
    this.connected = false;
    this.migrations = [
      {
        name: 'Inventory Adjustments',
        pgModel: PgInventoryAdjustment,
        mongoModel: MongoInventoryAdjustment,
        converter: this.convertInventoryAdjustment.bind(this)
      },
      {
        name: 'Transfer Orders',
        pgModel: PgTransferOrder,
        mongoModel: MongoTransferOrder,
        converter: this.convertTransferOrder.bind(this)
      },
      {
        name: 'Sales Persons',
        pgModel: PgSalesPerson,
        mongoModel: MongoSalesPerson,
        converter: this.convertSalesPerson.bind(this)
      },
      {
        name: 'Stores',
        pgModel: PgStore,
        mongoModel: MongoStore,
        converter: this.convertStore.bind(this)
      },
      {
        name: 'Vendors',
        pgModel: PgVendor,
        mongoModel: MongoVendor,
        converter: this.convertVendor.bind(this)
      },
      {
        name: 'Vendor Histories',
        pgModel: PgVendorHistory,
        mongoModel: MongoVendorHistory,
        converter: this.convertVendorHistory.bind(this)
      }
    ];
  }

  async connect() {
    if (!this.connected) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to both PostgreSQL and MongoDB\n');
      this.connected = true;
    }
  }

  async migrateAll() {
    await this.connect();
    
    console.log('🚀 Starting Comprehensive Dual-Save Migration');
    console.log('==============================================\n');
    
    const totalStats = {
      migrated: 0,
      skipped: 0,
      errors: 0,
      tables: 0
    };
    
    for (const migration of this.migrations) {
      try {
        console.log(`📊 Migrating ${migration.name}...`);
        const stats = await this.migrateTable(migration);
        
        totalStats.migrated += stats.migrated;
        totalStats.skipped += stats.skipped;
        totalStats.errors += stats.errors;
        totalStats.tables++;
        
        console.log(`   ✅ ${migration.name}: ${stats.migrated} migrated, ${stats.skipped} skipped, ${stats.errors} errors\n`);
        
      } catch (error) {
        console.error(`   ❌ ${migration.name} failed: ${error.message}\n`);
        totalStats.errors++;
      }
    }
    
    console.log('📊 Migration Summary:');
    console.log('====================');
    console.log(`Tables processed: ${totalStats.tables}`);
    console.log(`Total migrated: ${totalStats.migrated}`);
    console.log(`Total skipped: ${totalStats.skipped}`);
    console.log(`Total errors: ${totalStats.errors}`);
    
    return totalStats;
  }

  async migrateTable(migration) {
    const { name, pgModel, mongoModel, converter } = migration;
    
    // Get all PostgreSQL records
    const pgRecords = await pgModel.findAll({
      order: [['createdAt', 'ASC']]
    });
    
    const stats = { migrated: 0, skipped: 0, errors: 0 };
    
    for (const pgRecord of pgRecords) {
      try {
        // Check if already exists in MongoDB
        const existing = await this.findExistingMongo(mongoModel, pgRecord);
        
        if (existing) {
          stats.skipped++;
          continue;
        }
        
        // Convert and create
        const mongoData = converter(pgRecord);
        await mongoModel.create(mongoData);
        
        stats.migrated++;
        
      } catch (error) {
        console.error(`     Error migrating record: ${error.message}`);
        stats.errors++;
      }
    }
    
    return stats;
  }

  async findExistingMongo(mongoModel, pgRecord) {
    // Try different strategies to find existing records
    const queries = [];
    
    // Strategy 1: PostgreSQL ID reference
    if (pgRecord.id) {
      queries.push({ postgresqlId: pgRecord.id });
    }
    
    // Strategy 2: Unique identifiers
    if (pgRecord.referenceNumber) {
      queries.push({ referenceNumber: pgRecord.referenceNumber });
    }
    if (pgRecord.transferOrderNumber) {
      queries.push({ transferOrderNumber: pgRecord.transferOrderNumber });
    }
    if (pgRecord.employeeId) {
      queries.push({ employeeId: pgRecord.employeeId });
    }
    if (pgRecord.locCode) {
      queries.push({ locCode: pgRecord.locCode });
    }
    if (pgRecord.email) {
      queries.push({ email: pgRecord.email });
    }
    
    // Try each query
    for (const query of queries) {
      try {
        const existing = await mongoModel.findOne(query);
        if (existing) return existing;
      } catch (error) {
        // Continue to next query
      }
    }
    
    return null;
  }

  // Converter functions for each data type
  convertInventoryAdjustment(pgRecord) {
    return {
      referenceNumber: pgRecord.referenceNumber,
      date: pgRecord.date,
      adjustmentType: pgRecord.adjustmentType,
      status: pgRecord.status,
      branch: pgRecord.branch,
      warehouse: pgRecord.warehouse,
      account: pgRecord.account,
      reason: pgRecord.reason,
      description: pgRecord.description,
      items: (pgRecord.items || []).map(item => ({
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
      userId: pgRecord.userId,
      createdBy: pgRecord.createdBy,
      modifiedBy: pgRecord.modifiedBy,
      locCode: pgRecord.locCode,
      totalQuantityAdjusted: pgRecord.totalQuantityAdjusted || 0,
      totalValueAdjusted: pgRecord.totalValueAdjusted || 0,
      postgresqlId: pgRecord.id,
      createdAt: pgRecord.createdAt,
      updatedAt: pgRecord.updatedAt,
    };
  }

  convertTransferOrder(pgRecord) {
    return {
      transferOrderNumber: pgRecord.transferOrderNumber,
      date: pgRecord.date,
      reason: pgRecord.reason,
      status: pgRecord.status,
      sourceWarehouse: pgRecord.sourceWarehouse,
      destinationWarehouse: pgRecord.destinationWarehouse,
      items: pgRecord.items || [],
      totalQuantity: pgRecord.totalQuantity || 0,
      totalValue: pgRecord.totalValue || 0,
      userId: pgRecord.userId,
      createdBy: pgRecord.createdBy,
      modifiedBy: pgRecord.modifiedBy,
      locCode: pgRecord.locCode,
      postgresqlId: pgRecord.id,
      createdAt: pgRecord.createdAt,
      updatedAt: pgRecord.updatedAt,
    };
  }

  convertSalesPerson(pgRecord) {
    return {
      firstName: pgRecord.firstName,
      lastName: pgRecord.lastName,
      employeeId: pgRecord.employeeId,
      email: pgRecord.email,
      phone: pgRecord.phone,
      storeId: pgRecord.storeId,
      isActive: pgRecord.isActive !== false,
      userId: pgRecord.userId,
      createdBy: pgRecord.createdBy,
      postgresqlId: pgRecord.id,
      createdAt: pgRecord.createdAt,
      updatedAt: pgRecord.updatedAt,
    };
  }

  convertStore(pgRecord) {
    return {
      name: pgRecord.name,
      locCode: pgRecord.locCode,
      address: pgRecord.address,
      city: pgRecord.city,
      state: pgRecord.state,
      pincode: pgRecord.pincode,
      phone: pgRecord.phone,
      email: pgRecord.email,
      isActive: pgRecord.isActive !== false,
      userId: pgRecord.userId,
      postgresqlId: pgRecord.id,
      createdAt: pgRecord.createdAt,
      updatedAt: pgRecord.updatedAt,
    };
  }

  convertVendor(pgRecord) {
    return {
      salutation: pgRecord.salutation,
      firstName: pgRecord.firstName,
      lastName: pgRecord.lastName,
      companyName: pgRecord.companyName,
      displayName: pgRecord.displayName,
      email: pgRecord.email,
      phone: pgRecord.phone,
      mobile: pgRecord.mobile,
      website: pgRecord.website,
      gstTreatment: pgRecord.gstTreatment,
      gstin: pgRecord.gstin,
      panNumber: pgRecord.panNumber,
      paymentTerms: pgRecord.paymentTerms,
      currency: pgRecord.currency,
      openingBalance: pgRecord.openingBalance || 0,
      isActive: pgRecord.isActive !== false,
      userId: pgRecord.userId,
      postgresqlId: pgRecord.id,
      createdAt: pgRecord.createdAt,
      updatedAt: pgRecord.updatedAt,
    };
  }

  convertVendorHistory(pgRecord) {
    return {
      vendorId: pgRecord.vendorId,
      eventType: pgRecord.eventType,
      title: pgRecord.title,
      description: pgRecord.description,
      metadata: pgRecord.metadata || {},
      userId: pgRecord.userId,
      createdBy: pgRecord.createdBy,
      postgresqlId: pgRecord.id,
      createdAt: pgRecord.createdAt,
      updatedAt: pgRecord.updatedAt,
    };
  }

  async verifyMigration() {
    await this.connect();
    
    console.log('\n🔍 Verification Report:');
    console.log('======================');
    
    for (const migration of this.migrations) {
      try {
        const pgCount = await migration.pgModel.count();
        const mongoCount = await migration.mongoModel.countDocuments();
        
        const status = pgCount === mongoCount ? '✅' : '⚠️ ';
        console.log(`${status} ${migration.name}: PG=${pgCount}, Mongo=${mongoCount}`);
        
      } catch (error) {
        console.log(`❌ ${migration.name}: Error - ${error.message}`);
      }
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  const migrator = new DualSaveMigrationTool();
  
  try {
    switch (command) {
      case 'migrate':
        await migrator.migrateAll();
        await migrator.verifyMigration();
        break;
        
      case 'verify':
        await migrator.verifyMigration();
        break;
        
      default:
        console.log('🔧 Comprehensive Dual-Save Migration Tool');
        console.log('=========================================\n');
        console.log('Usage: node setup-dual-save-system.js <command>\n');
        console.log('Commands:');
        console.log('  migrate  - Migrate all PostgreSQL data to MongoDB');
        console.log('  verify   - Check migration status');
        console.log('  help     - Show this help\n');
        console.log('This will migrate:');
        console.log('  - Inventory Adjustments (11 records)');
        console.log('  - Transfer Orders (20 records)');
        console.log('  - Sales Persons (15 records)');
        console.log('  - Stores (13 records)');
        console.log('  - Vendors (1 record)');
        console.log('  - Vendor Histories (15 records)');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

main();