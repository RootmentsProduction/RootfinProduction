// Debug: Check what store exists with locCode "700"
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Store from './model/Store.js';

dotenv.config();

async function debugStore700() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    console.log('🔍 DEBUGGING STORE WITH LOCCODE "700"');
    console.log('====================================');

    // Find all stores with locCode "700"
    const stores = await Store.find({ locCode: "700" });
    
    console.log(`Found ${stores.length} store(s) with locCode "700":`);
    
    stores.forEach((store, index) => {
      console.log(`\nStore ${index + 1}:`);
      console.log(`  ID: ${store._id}`);
      console.log(`  Name: "${store.name}"`);
      console.log(`  LocCode: "${store.locCode}"`);
      console.log(`  IsActive: ${store.isActive}`);
      console.log(`  Created: ${store.createdAt}`);
    });

    // Also check for similar names
    console.log('\n🔍 Checking for stores with similar names...');
    const similarStores = await Store.find({
      name: { $regex: /trivandrum|grooms|sg/i }
    });
    
    console.log(`Found ${similarStores.length} store(s) with similar names:`);
    
    similarStores.forEach((store, index) => {
      console.log(`\nSimilar Store ${index + 1}:`);
      console.log(`  ID: ${store._id}`);
      console.log(`  Name: "${store.name}"`);
      console.log(`  LocCode: "${store.locCode}"`);
      console.log(`  IsActive: ${store.isActive}`);
    });

    // Test the API endpoint
    console.log('\n🧪 Testing API endpoint...');
    try {
      const testStore = await Store.findOne({ locCode: "700" });
      if (testStore) {
        console.log('✅ Store.findOne({ locCode: "700" }) works:');
        console.log(`   Name: "${testStore.name}"`);
        console.log(`   ID: ${testStore._id}`);
      } else {
        console.log('❌ Store.findOne({ locCode: "700" }) returned null');
      }
    } catch (error) {
      console.error('❌ Error testing findOne:', error);
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

debugStore700();