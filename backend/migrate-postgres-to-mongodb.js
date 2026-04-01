import { InventoryAdjustment as PostgresInventoryAdjustment } from "./models/sequelize/index.js";
import MongoInventoryAdjustment from "./model/InventoryAdjustment.js";
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to copy existing PostgreSQL inventory adjustments to MongoDB
 * This ensures data redundancy and backward compatibility
 */

async function migrateInventoryAdjustments() {
  try {
    console.log('🚀 Starting PostgreSQL to MongoDB migration for Inventory Adjustments...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all PostgreSQL inventory adjustments
    const pgAdjustments = await PostgresInventoryAdjustment.findAll({
      order: [['createdAt', 'ASC']]
    });
    
    console.log(`📊 Found ${pgAdjustments.length} inventory adjustments in PostgreSQL\n`);
    
    if (pgAdjustments.length === 0) {
      console.log('ℹ️  No adjustments to migrate');
      process.exit(0);
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const pgAdj of pgAdjustments) {
      try {
        console.log(`📦 Processing: ${pgAdj.referenceNumber} (${pgAdj.warehouse})`);
        
        // Check if already exists in MongoDB
        const existingMongo = await MongoInventoryAdjustment.findOne({
          $or: [
            { postgresqlId: pgAdj.id },
            { referenceNumber: pgAdj.referenceNumber }
          ]
        });
        
        if (existingMongo) {
          console.log(`   ⏭️  Already exists in MongoDB, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Convert PostgreSQL data to MongoDB format
        const mongoData = {
          // Basic Information
          referenceNumber: pgAdj.referenceNumber,
          date: pgAdj.date,
          adjustmentType: pgAdj.adjustmentType,
          status: pgAdj.status,
          
          // Location Information
          branch: pgAdj.branch,
          warehouse: pgAdj.warehouse,
          
          // Financial Information
          account: pgAdj.account,
          reason: pgAdj.reason,
          description: pgAdj.description,
          
          // Items - convert from PostgreSQL JSONB to MongoDB array
          items: (pgAdj.items || []).map(item => ({
            itemId: item.itemId ? item.itemId : null,
            itemGroupId: item.itemGroupId ? item.itemGroupId : null,
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
          
          // Audit Trail
          userId: pgAdj.userId,
          createdBy: pgAdj.createdBy,
          modifiedBy: pgAdj.modifiedBy,
          locCode: pgAdj.locCode,
          
          // Totals
          totalQuantityAdjusted: pgAdj.totalQuantityAdjusted || 0,
          totalValueAdjusted: pgAdj.totalValueAdjusted || 0,
          
          // Reference to PostgreSQL record
          postgresqlId: pgAdj.id,
          
          // Preserve original timestamps
          createdAt: pgAdj.createdAt,
          updatedAt: pgAdj.updatedAt,
        };
        
        // Create in MongoDB
        const mongoAdj = await MongoInventoryAdjustment.create(mongoData);
        
        console.log(`   ✅ Migrated successfully (MongoDB ID: ${mongoAdj._id})`);
        migratedCount++;
        
      } catch (itemError) {
        console.error(`   ❌ Error migrating ${pgAdj.referenceNumber}:`, itemError.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Total PostgreSQL records: ${pgAdjustments.length}`);
    console.log(`   Successfully migrated: ${migratedCount}`);
    console.log(`   Skipped (already exists): ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    if (migratedCount > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('🔄 Your inventory adjustments are now available in both PostgreSQL and MongoDB');
    } else {
      console.log('\nℹ️  No new records were migrated');
    }
    
    // Verify the migration
    const mongoCount = await MongoInventoryAdjustment.countDocuments();
    console.log(`\n🔍 Verification: MongoDB now has ${mongoCount} inventory adjustments total`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the migration
console.log('🔄 PostgreSQL to MongoDB Migration Tool');
console.log('=====================================\n');

migrateInventoryAdjustments();