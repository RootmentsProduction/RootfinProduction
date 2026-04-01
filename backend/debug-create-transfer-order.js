// Debug script to test the createTransferOrder API endpoint with detailed logging
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import ShoeItem from './model/ShoeItem.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test the createTransferOrder API with detailed request/response logging
const testCreateTransferOrderAPI = async () => {
  console.log('\n=== TESTING createTransferOrder API WITH DETAILED LOGGING ===\n');
  
  try {
    const API_URL = 'http://localhost:7000';
    
    // Find a test item
    const testItems = await ShoeItem.find({
      isActive: { $ne: false },
      warehouseStocks: {
        $elemMatch: {
          warehouse: { $regex: /warehouse/i },
          stockOnHand: { $gt: 5 }
        }
      }
    }).limit(1);
    
    if (testItems.length === 0) {
      console.log('❌ No test items found');
      return;
    }
    
    const testItem = testItems[0];
    const warehouseStock = testItem.warehouseStocks.find(ws => 
      ws.warehouse && ws.warehouse.toLowerCase().includes('warehouse') && ws.stockOnHand > 5
    );
    
    console.log(`📦 Test Item: ${testItem.itemName} (ID: ${testItem._id})`);
    console.log(`   Source: ${warehouseStock.warehouse} (${warehouseStock.stockOnHand} units)`);
    
    // Create the request payload
    const transferOrderData = {
      transferOrderNumber: `DEBUG-${Date.now()}`,
      date: new Date().toISOString(),
      reason: "Debug test for Save as Completed",
      sourceWarehouse: warehouseStock.warehouse,
      destinationWarehouse: "Edapally Branch",
      items: [{
        itemId: testItem._id.toString(),
        itemName: testItem.itemName,
        itemSku: testItem.sku || "",
        quantity: 2,
        sourceQuantity: warehouseStock.stockOnHand,
        destQuantity: 0,
      }],
      status: "transferred", // This should trigger immediate stock transfer
      userId: "debug-user@example.com",
    };
    
    console.log(`\n📤 Request Payload:`);
    console.log(JSON.stringify(transferOrderData, null, 2));
    
    console.log(`\n🚀 Making API call...`);
    const response = await fetch(`${API_URL}/api/inventory/transfer-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transferOrderData),
    });
    
    console.log(`\n📥 Response Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log(`\n📄 Response Body (raw):`);
    console.log(responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log(`\n✅ Parsed Response:`);
        console.log(JSON.stringify(result, null, 2));
        
        console.log(`\n🔍 Key Response Fields:`);
        console.log(`   Transfer Order Number: ${result.transferOrderNumber}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   ID: ${result.id || result._id}`);
        console.log(`   Warning: ${result.warning || 'None'}`);
        console.log(`   Items Count: ${result.items?.length || 0}`);
        
        // Check if it was saved to PostgreSQL or MongoDB only
        if (result.warning && result.warning.includes('MongoDB only')) {
          console.log(`\n⚠️ IMPORTANT: Order was saved to MongoDB only (PostgreSQL failed)`);
          console.log(`   This might explain why stock transfer didn't happen`);
        } else if (result.id && !result._id) {
          console.log(`\n✅ Order was saved to PostgreSQL successfully`);
        } else if (result._id && !result.id) {
          console.log(`\n⚠️ Order was saved to MongoDB only`);
        } else {
          console.log(`\n✅ Order was saved to both PostgreSQL and MongoDB`);
        }
        
        // Clean up
        try {
          const deleteResponse = await fetch(`${API_URL}/api/inventory/transfer-orders/${result.id || result._id}`, {
            method: 'DELETE',
          });
          if (deleteResponse.ok) {
            console.log(`\n🧹 Cleaned up test order`);
          }
        } catch (cleanupError) {
          console.log(`⚠️ Could not clean up test order:`, cleanupError.message);
        }
        
      } catch (parseError) {
        console.error(`❌ Failed to parse response as JSON:`, parseError);
      }
    } else {
      console.error(`❌ API call failed with status ${response.status}`);
      console.error(`   Response body:`, responseText);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await testCreateTransferOrderAPI();
  
  console.log('\n=== API DEBUG TEST COMPLETED ===');
  console.log('\n💡 ANALYSIS:');
  console.log('1. Check if the order was saved to PostgreSQL or MongoDB only');
  console.log('2. Look for any warnings in the response');
  console.log('3. Check server console logs for stock transfer messages');
  console.log('4. If PostgreSQL is failing, that explains why stock transfer is not happening');
  
  process.exit(0);
};

main().catch(console.error);