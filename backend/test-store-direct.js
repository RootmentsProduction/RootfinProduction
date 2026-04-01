// Test Store Controller Function Directly
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Store from './model/Store.js';

dotenv.config();

async function testStoreDirect() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    console.log('🧪 TESTING STORE CONTROLLER LOGIC DIRECTLY');
    console.log('==========================================\n');

    const locCode = "700";
    console.log(`📋 Finding store with locCode: ${locCode}`);
    
    const store = await Store.findOne({ locCode });
    
    if (!store) {
      console.log('❌ Store not found');
      return;
    }
    
    console.log('✅ Store found:');
    console.log(`   _id: ${store._id}`);
    console.log(`   name: "${store.name}"`);
    console.log(`   locCode: "${store.locCode}"`);
    
    // Test the toObject conversion
    const storeObj = store.toObject();
    console.log('\n📋 After toObject():');
    console.log(`   _id: ${storeObj._id}`);
    console.log(`   id: ${storeObj.id}`);
    
    // Add id field manually
    storeObj.id = storeObj._id.toString();
    console.log('\n📋 After adding id field:');
    console.log(`   _id: ${storeObj._id}`);
    console.log(`   id: ${storeObj.id}`);
    
    // Test the response structure
    const response = {
      message: "Store retrieved successfully",
      store: storeObj,
    };
    
    console.log('\n📋 Final response structure:');
    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

testStoreDirect();