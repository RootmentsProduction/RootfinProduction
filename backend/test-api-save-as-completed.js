// Test script to verify "Save as Completed" API endpoint works correctly
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

// Helper function to get current stock for an item in a warehouse
const getCurrentStock = async (itemId, warehouseName) => {
  const targetWarehouse = warehouseName?.trim() || "Warehouse";
  
  const shoeItem = await ShoeItem.findById(itemId);
  if (shoeItem) {
    // Find matching warehouse stock
    let warehouseStock = null;
    for (const ws of (shoeItem.warehouseStocks || [])) {
      if (ws.warehouse && ws.warehouse.toLowerCase().includes(targetWarehouse.toLowerCase())) {
        warehouseStock = ws;
        break;
      }
    }
    
    if (warehouseStock) {
      const totalStock = parseFloat(warehouseStock.stockOnHand) || 0;
      return totalStock;
    }
  }
  
  return 0;
};

// Test the actual API endpoint for "Save as Completed"
const testApiSaveAsCompleted = async () => {
  console.log('\n=== TESTING API "SAVE AS COMPLETED" FUNCTIONALITY ===\n');
  
  try {
    const API_URL = 'http://localhost:7000'; // Adjust if your server runs on different port
    
    // Find a test item with stock in warehouse
    console.log('🔍 Finding test items with stock in Warehouse...');
    
    const testItems = await ShoeItem.find({
      isActive: { $ne: false },
      warehouseStocks: {
        $elemMatch: {
          warehouse: { $regex: /warehouse/i },
          stockOnHand: { $gt: 5 } // Need at least 5 units for testing
        }
      }
    }).limit(1);
    
    if (testItems.length === 0) {
      console.log('❌ No test items found with sufficient warehouse stock');
      return;
    }
    
    const testItem = testItems[0];
    const warehouseStock = testItem.warehouseStocks.find(ws => 
      ws.warehouse && ws.warehouse.toLowerCase().includes('warehouse') && ws.stockOnHand > 5
    );
    
    const sourceWarehouse = warehouseStock.warehouse;
    const destinationWarehouse = "Edapally Branch";
    const transferQuantity = 3; // Transfer 3 units
    
    console.log(`📦 Test Transfer Details:`);
    console.log(`   Item: ${testItem.itemName}`);
    console.log(`   Source: ${sourceWarehouse} (Current: ${warehouseStock.stockOnHand})`);
    console.log(`   Destination: ${destinationWarehouse}`);
    console.log(`   Quantity: ${transferQuantity}`);
    
    // Get stock before transfer
    const sourceStockBefore = await getCurrentStock(testItem._id, sourceWarehouse);
    const destStockBefore = await getCurrentStock(testItem._id, destinationWarehouse);
    
    console.log(`\n📊 Stock BEFORE transfer:`);
    console.log(`   Source (${sourceWarehouse}): ${sourceStockBefore}`);
    console.log(`   Destination (${destinationWarehouse}): ${destStockBefore}`);
    
    // Create transfer order via API with "transferred" status (Save as Completed)
    const transferOrderData = {
      transferOrderNumber: `API-TEST-${Date.now()}`,
      date: new Date().toISOString(),
      reason: "Testing Save as Completed API functionality",
      sourceWarehouse: sourceWarehouse,
      destinationWarehouse: destinationWarehouse,
      items: [{
        itemId: testItem._id.toString(),
        itemName: testItem.itemName,
        itemSku: testItem.sku || "",
        quantity: transferQuantity,
        sourceQuantity: sourceStockBefore,
        destQuantity: destStockBefore,
      }],
      status: "transferred", // This is the key - "Save as Completed" sets status to "transferred"
      userId: "test-user@example.com",
    };
    
    console.log(`\n🚀 Calling API to create transfer order with status "transferred"...`);
    console.log(`   URL: ${API_URL}/api/inventory/transfer-orders`);
    
    try {
      const response = await fetch(`${API_URL}/api/inventory/transfer-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferOrderData),
      });
      
      console.log(`   Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API call failed:`, errorText);
        return;
      }
      
      const result = await response.json();
      console.log(`✅ Transfer order created via API: ${result.transferOrderNumber}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   ID: ${result.id || result._id}`);
      
      // Wait a moment for stock transfer to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get stock after transfer
      const sourceStockAfter = await getCurrentStock(testItem._id, sourceWarehouse);
      const destStockAfter = await getCurrentStock(testItem._id, destinationWarehouse);
      
      console.log(`\n📊 Stock AFTER transfer:`);
      console.log(`   Source (${sourceWarehouse}): ${sourceStockAfter} (Expected: ${sourceStockBefore - transferQuantity})`);
      console.log(`   Destination (${destinationWarehouse}): ${destStockAfter} (Expected: ${destStockBefore + transferQuantity})`);
      
      // Verify stock was transferred correctly
      const expectedSourceStock = sourceStockBefore - transferQuantity;
      const expectedDestStock = destStockBefore + transferQuantity;
      
      const sourceCorrect = Math.abs(sourceStockAfter - expectedSourceStock) < 0.01;
      const destCorrect = Math.abs(destStockAfter - expectedDestStock) < 0.01;
      
      console.log(`\n🔍 VERIFICATION:`);
      if (sourceCorrect && destCorrect) {
        console.log(`✅ SUCCESS: Stock was transferred correctly via API!`);
        console.log(`   ✅ Source stock reduced by ${transferQuantity}`);
        console.log(`   ✅ Destination stock increased by ${transferQuantity}`);
      } else {
        console.log(`❌ FAILURE: Stock was NOT transferred correctly via API!`);
        if (!sourceCorrect) {
          console.log(`   ❌ Source stock: Expected ${expectedSourceStock}, Got ${sourceStockAfter}`);
        }
        if (!destCorrect) {
          console.log(`   ❌ Destination stock: Expected ${expectedDestStock}, Got ${destStockAfter}`);
        }
        
        console.log(`\n🔧 DEBUGGING INFO:`);
        console.log(`   Transfer order created with status: ${result.status}`);
        console.log(`   Check server logs for stock transfer messages`);
      }
      
      // Clean up - delete the test transfer order
      try {
        const deleteResponse = await fetch(`${API_URL}/api/inventory/transfer-orders/${result.id || result._id}`, {
          method: 'DELETE',
        });
        if (deleteResponse.ok) {
          console.log(`\n🧹 Cleaned up test transfer order: ${result.transferOrderNumber}`);
        }
      } catch (cleanupError) {
        console.log(`⚠️ Could not clean up test order (this is okay):`, cleanupError.message);
      }
      
    } catch (fetchError) {
      console.error(`❌ Error calling API:`, fetchError);
      console.log(`\n💡 Make sure the backend server is running on ${API_URL}`);
      console.log(`   Start it with: npm start or node server.js`);
    }
    
  } catch (error) {
    console.error('❌ Error testing API Save as Completed:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await testApiSaveAsCompleted();
  
  console.log('\n=== API TEST COMPLETED ===');
  console.log('\n💡 SUMMARY:');
  console.log('This test calls the actual API endpoint that the frontend uses');
  console.log('when clicking "Save as Completed" button.');
  console.log('\nIf the test shows SUCCESS, the API is working correctly.');
  console.log('If the test shows FAILURE, there is an issue with the API stock transfer logic.');
  
  process.exit(0);
};

main().catch(console.error);