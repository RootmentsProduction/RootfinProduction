import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkAllAdjustments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check all recent inventory adjustments
    const db = mongoose.connection.db;
    const adjustments = await db.collection('inventoryadjustments').find({})
      .sort({ createdAt: -1 }).limit(20).toArray();
    
    console.log(`\n=== ALL RECENT INVENTORY ADJUSTMENTS ===`);
    console.log(`Found ${adjustments.length} total adjustments:`);
    
    adjustments.forEach((adj, index) => {
      console.log(`\n${index + 1}. Adjustment ID: ${adj._id}`);
      console.log(`   Date: ${adj.date}`);
      console.log(`   Created: ${adj.createdAt}`);
      console.log(`   Warehouse: ${adj.warehouse}`);
      console.log(`   Status: ${adj.status}`);
      console.log(`   Items: ${adj.items?.length || 0}`);
      
      if (adj.items && adj.items.length > 0) {
        adj.items.forEach(item => {
          console.log(`     - ${item.itemName} (${item.itemSku}): ${item.quantityAdjusted > 0 ? '+' : ''}${item.quantityAdjusted}`);
        });
      }
    });
    
    // Also check if there are any adjustments with different warehouse name variations
    console.log(`\n=== CHECKING WAREHOUSE NAME VARIATIONS ===`);
    const warehouseNames = await db.collection('inventoryadjustments').distinct('warehouse');
    console.log('All warehouse names in adjustments:', warehouseNames);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkAllAdjustments();