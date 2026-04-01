// Test script to verify "Save as Completed" functionality works correctly
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TransferOrder from './model/TransferOrder.js';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';

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
const getCurrentStock = async (itemId, warehouseName, itemName = null, itemGroupId = null, itemSku = null) => {
  const targetWarehouse = warehouseName?.trim() || "Warehouse";
  
  console.log(`\n🔍 Getting stock for warehouse: "${targetWarehouse}"`);
  console.log(`   ItemId: ${itemId}, ItemName: ${itemName}, ItemGroupId: ${itemGroupId}, ItemSku: ${itemSku}`);
  
  // Try standalone item first
  if (itemId && itemId !== null && itemId !== "null") {
    const shoeItem = await ShoeItem.findById(itemId);
    if (shoeItem) {
      console.log(`   Found standalone item: "${shoeItem.itemName}"`);
      
      // Find matching warehouse stock
      let warehouseStock = null;
      for (const ws of (shoeItem.warehouseStocks || [])) {
        if (ws.warehouse && ws.warehouse.toLowerCase().includes(targetWarehouse.toLowerCase())) {
          warehouseStock = ws;
          console.log(`   ✅ Matched "${ws.warehouse}" with target "${targetWarehouse}"`);
          break;
        }
      }
      
      if (warehouseStock) {
        const totalStock = parseFloat(warehouseStock.stockOnHand) || 0;
        console.log(`   ✅ Found stock in "${warehouseStock.warehouse}": ${totalStock}`);
        return {
          success: true,
          stockOnHand: totalStock,
          currentQuantity: totalStock,
        };
      } else {
        console.log(`   ❌ No stock found in "${targetWarehouse}"`);
      }
    }
  }
  
  // Try item groups
  if (itemGroupId && itemName) {
    const group = await ItemGroup.findById(itemGroupId);
    if (group) {
      const item = group.items.find(item => {
        if (itemSku && item.sku) {
          return item.sku.toLowerCase() === itemSku.toLowerCase();
        }
        return item.name.toLowerCase() === itemName.toLowerCase();
      });
      
      if (item) {
        console.log(`   Found item in group: "${item.name}"`);
        
        // Find matching warehouse stock
        let warehouseStock = null;
        for (const ws of (item.warehouseStocks || [])) {
          if (ws.warehouse && ws.warehouse.toLowerCase().includes(targetWarehouse.toLowerCase())) {
            warehouseStock = ws;
            console.log(`   ✅ Matched "${ws.warehouse}" with target "${targetWarehouse}"`);
            break;
          }
        }
        
        if (warehouseStock) {
          const totalStock = parseFloat(warehouseStock.stockOnHand) || 0;
          console.log(`   ✅ Found stock in "${warehouseStock.warehouse}": ${totalStock}`);
          return {
            success: true,
            stockOnHand: totalStock,
            currentQuantity: totalStock,
          };
        } else {
          console.log(`   ❌ No stock found in "${targetWarehouse}"`);
        }
      }
    }
  }
  
  console.log(`   ⚠️ Returning 0 stock\n`);
  return { success: false, currentQuantity: 0 };
};

// Test creating a transfer order with "transferred" status (Save as Completed)
const testSaveAsCompleted = async () => {
  console.log('\n=== TESTING "SAVE AS COMPLETED" FUNCTIONALITY ===\n');
  
  try {
    // Find a test item with stock in warehouse
    console.log('🔍 Finding test items with stock in Warehouse...');
    
    const testItems = await ShoeItem.find({
      isActive: { $ne: false },
      warehouseStocks: {
        $elemMatch: {
          warehouse: { $regex: /warehouse/i },
          stockOnHand: { $gt: 0 }
        }
      }
    }).limit(3);
    
    console.log(`Found ${testItems.length} test items with warehouse stock:`);
    
    for (const item of testItems) {
      const warehouseStock = item.warehouseStocks.find(ws => 
        ws.warehouse && ws.warehouse.toLowerCase().includes('warehouse') && ws.stockOnHand > 0
      );
      console.log(`  - ${item.itemName}: ${warehouseStock?.stockOnHand || 0} units in ${warehouseStock?.warehouse}`);
    }
    
    if (testItems.length === 0) {
      console.log('❌ No test items found with warehouse stock');
      return;
    }
    
    // Use the first item for testing
    const testItem = testItems[0];
    const warehouseStock = testItem.warehouseStocks.find(ws => 
      ws.warehouse && ws.warehouse.toLowerCase().includes('warehouse') && ws.stockOnHand > 0
    );
    
    const sourceWarehouse = warehouseStock.warehouse;
    const destinationWarehouse = "Edapally Branch";
    const transferQuantity = Math.min(5, Math.floor(warehouseStock.stockOnHand / 2)); // Transfer half or 5, whichever is smaller
    
    console.log(`\n📦 Test Transfer Details:`);
    console.log(`   Item: ${testItem.itemName}`);
    console.log(`   Source: ${sourceWarehouse} (Current: ${warehouseStock.stockOnHand})`);
    console.log(`   Destination: ${destinationWarehouse}`);
    console.log(`   Quantity: ${transferQuantity}`);
    
    // Get stock before transfer
    const sourceStockBefore = await getCurrentStock(testItem._id, sourceWarehouse, testItem.itemName);
    const destStockBefore = await getCurrentStock(testItem._id, destinationWarehouse, testItem.itemName);
    
    console.log(`\n📊 Stock BEFORE transfer:`);
    console.log(`   Source (${sourceWarehouse}): ${sourceStockBefore.currentQuantity}`);
    console.log(`   Destination (${destinationWarehouse}): ${destStockBefore.currentQuantity}`);
    
    // Create transfer order with "transferred" status (simulating "Save as Completed")
    const transferOrderData = {
      transferOrderNumber: `TEST-${Date.now()}`,
      date: new Date(),
      reason: "Testing Save as Completed functionality",
      sourceWarehouse: sourceWarehouse,
      destinationWarehouse: destinationWarehouse,
      items: [{
        itemId: testItem._id.toString(),
        itemName: testItem.itemName,
        itemSku: testItem.sku || "",
        quantity: transferQuantity,
        sourceQuantity: sourceStockBefore.currentQuantity,
        destQuantity: destStockBefore.currentQuantity,
      }],
      totalQuantityTransferred: transferQuantity,
      userId: "test-user",
      createdBy: "test-user",
      status: "transferred", // This is the key - "Save as Completed" sets status to "transferred"
      locCode: "",
      attachments: [],
    };
    
    console.log(`\n🚀 Creating transfer order with status "transferred"...`);
    
    // Simulate the backend createTransferOrder logic
    const mongoOrder = await TransferOrder.create(transferOrderData);
    console.log(`✅ Transfer order created: ${mongoOrder.transferOrderNumber} (ID: ${mongoOrder._id})`);
    console.log(`   Status: ${mongoOrder.status}`);
    
    // The backend should have transferred stock automatically since status is "transferred"
    // Let's check if stock was actually transferred
    
    // Wait a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get stock after transfer
    const sourceStockAfter = await getCurrentStock(testItem._id, sourceWarehouse, testItem.itemName);
    const destStockAfter = await getCurrentStock(testItem._id, destinationWarehouse, testItem.itemName);
    
    console.log(`\n📊 Stock AFTER transfer:`);
    console.log(`   Source (${sourceWarehouse}): ${sourceStockAfter.currentQuantity} (Expected: ${sourceStockBefore.currentQuantity - transferQuantity})`);
    console.log(`   Destination (${destinationWarehouse}): ${destStockAfter.currentQuantity} (Expected: ${destStockBefore.currentQuantity + transferQuantity})`);
    
    // Verify stock was transferred correctly
    const expectedSourceStock = sourceStockBefore.currentQuantity - transferQuantity;
    const expectedDestStock = destStockBefore.currentQuantity + transferQuantity;
    
    const sourceCorrect = Math.abs(sourceStockAfter.currentQuantity - expectedSourceStock) < 0.01;
    const destCorrect = Math.abs(destStockAfter.currentQuantity - expectedDestStock) < 0.01;
    
    console.log(`\n🔍 VERIFICATION:`);
    if (sourceCorrect && destCorrect) {
      console.log(`✅ SUCCESS: Stock was transferred correctly!`);
      console.log(`   ✅ Source stock reduced by ${transferQuantity}`);
      console.log(`   ✅ Destination stock increased by ${transferQuantity}`);
    } else {
      console.log(`❌ FAILURE: Stock was NOT transferred correctly!`);
      if (!sourceCorrect) {
        console.log(`   ❌ Source stock: Expected ${expectedSourceStock}, Got ${sourceStockAfter.currentQuantity}`);
      }
      if (!destCorrect) {
        console.log(`   ❌ Destination stock: Expected ${expectedDestStock}, Got ${destStockAfter.currentQuantity}`);
      }
      
      console.log(`\n🔧 POSSIBLE ISSUES:`);
      console.log(`   1. transferItemStock function not being called`);
      console.log(`   2. Warehouse name matching issues`);
      console.log(`   3. Item not found during stock transfer`);
      console.log(`   4. Database update not working`);
    }
    
    // Clean up - delete the test transfer order
    await TransferOrder.findByIdAndDelete(mongoOrder._id);
    console.log(`\n🧹 Cleaned up test transfer order: ${mongoOrder.transferOrderNumber}`);
    
  } catch (error) {
    console.error('❌ Error testing Save as Completed:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await testSaveAsCompleted();
  
  console.log('\n=== TEST COMPLETED ===');
  console.log('\n💡 SUMMARY:');
  console.log('This test verifies that creating a transfer order with status "transferred"');
  console.log('(which happens when clicking "Save as Completed") properly transfers stock.');
  console.log('\nIf the test shows SUCCESS, the functionality is working correctly.');
  console.log('If the test shows FAILURE, there is an issue with the stock transfer logic.');
  
  process.exit(0);
};

main().catch(console.error);