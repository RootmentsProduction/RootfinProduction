import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkInventoryAdjustments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check recent inventory adjustments for Perinthalmanna
    const db = mongoose.connection.db;
    const adjustments = await db.collection('inventoryadjustments').find({
      warehouse: { $regex: /perinthalmanna/i }
    }).sort({ createdAt: -1 }).limit(10).toArray();
    
    console.log(`\n=== RECENT INVENTORY ADJUSTMENTS FOR PERINTHALMANNA ===`);
    console.log(`Found ${adjustments.length} adjustments:`);
    
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
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkInventoryAdjustments();