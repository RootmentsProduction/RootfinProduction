import { InventoryAdjustment as PostgresInventoryAdjustment } from "./models/sequelize/index.js";
import MongoInventoryAdjustment from "./model/InventoryAdjustment.js";
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to copy existing MongoDB inventory adjustments to PostgreSQL
 * This is the reverse migration in case you need to move data back
 */

async function migrateInventoryAdjustmentsReverse() {
  try {
    console.log('🚀 Starting MongoDB to PostgreSQL migration for Inventory Adjustments...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all MongoDB inventory adjustments
    const mongoAdjustments = await MongoInventoryAdjustment.find({})
      .sort({ createdAt: 1 });
    
    console.log(`📊 Found ${mongoAdjustments.length} inventory adjustments in MongoDB\n`);
    
    if (mongoAdjustments.length === 0) {
      console.log('ℹ️  No adjustments to migrate');
      process.exit(0);
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const mongoAdj of mongoAdjustments) {
      try {
        console.log(`📦 Processing: ${mongoAdj.referenceNumber} (${mongoAdj.warehouse})`);
        
        // Check if already exists in PostgreSQL
        const existingPg = await PostgresInventoryAdjustment.findOne({
          where: {
            referenceNumber: mongoAdj.referenceNumber
          }
        });
        
        if (existingPg) {
          console.log(`   ⏭️  Already exists in PostgreSQL, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Convert MongoDB data to PostgreSQL format
        const pgData = {
          // Basic Information
          referenceNumber: mongoAdj.referenceNumber,
          date: mongoAdj.date,
          adjustmentType: mongoAdj.adjustmentType,
          status: mongoAdj.status,
          
          // Location Information
          branch: mongoAdj.branch,
          warehouse: mongoAdj.warehouse,
          
          // Financial Information
          account: mongoAdj.account,
          reason: mongoAdj.reason,
          description: mongoAdj.description,
          
          // Items - convert from MongoDB array to PostgreSQL JSONB
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
          
          // Audit Trail
          userId: mongoAdj.userId,
          createdBy: mongoAdj.createdBy,
          modifiedBy: mongoAdj.modifiedBy,
          locCode: mongoAdj.locCode,
          
          // Totals
          totalQuantityAdjusted: mongoAdj.totalQuantityAdjusted || 0,
          totalValueAdjusted: mongoAdj.totalValueAdjusted || 0,
          
          // Preserve original timestamps
          createdAt: mongoAdj.createdAt,
          updatedAt: mongoAdj.updatedAt,
        };
        
        // Create in PostgreSQL
        const pgAdj = await PostgresInventoryAdjustment.create(pgData);
        
        // Update MongoDB record with PostgreSQL ID reference
        await MongoInventoryAdjustment.findByIdAndUpdate(mongoAdj._id, {
          postgresqlId: pgAdj.id
        });
        
        console.log(`   ✅ Migrated successfully (PostgreSQL ID: ${pgAdj.id})`);
        migratedCount++;
        
      } catch (itemError) {
        console.error(`   ❌ Error migrating ${mongoAdj.referenceNumber}:`, itemError.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Total MongoDB records: ${mongoAdjustments.length}`);
    console.log(`   Successfully migrated: ${migratedCount}`);
    console.log(`   Skipped (already exists): ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    if (migratedCount > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('🔄 Your inventory adjustments are now available in both MongoDB and PostgreSQL');
    } else {
      console.log('\nℹ️  No new records were migrated');
    }
    
    // Verify the migration
    const pgCount = await PostgresInventoryAdjustment.count();
    console.log(`\n🔍 Verification: PostgreSQL now has ${pgCount} inventory adjustments total`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the migration
console.log('🔄 MongoDB to PostgreSQL Migration Tool');
console.log('=====================================\n');

migrateInventoryAdjustmentsReverse();