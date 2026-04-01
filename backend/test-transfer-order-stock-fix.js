// Test script to verify transfer order stock updates are working correctly
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
          currentValue: totalStock * (shoeItem.costPrice || 0),
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
            currentValue: totalStock * (item.costPrice || 0),
          };
        } else {
          console.log(`   ❌ No stock found in "${targetWarehouse}"`);
        }
      }
    }
  }
  
  console.log(`   ⚠️ Returning 0 stock\n`);
  return { success: false, currentQuantity: 0, currentValue: 0 };
};

// Test transfer order stock updates
const testTransferOrderStockUpdates = async () => {
  console.log('\n=== TESTING TRANSFER ORDER STOCK UPDATES ===\n');
  
  try {
    // Find recent transfer orders
    const recentOrders = await TransferOrder.find({
      destinationWarehouse: { $regex: /edapally/i }
    })
    .sort({ createdAt: -1 })
    .limit(5);
    
    console.log(`Found ${recentOrders.length} recent transfer orders to Edapally:`);
    
    for (const order of recentOrders) {
      console.log(`\n📦 Transfer Order: ${order.transferOrderNumber}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Source: ${order.sourceWarehouse} → Destination: ${order.destinationWarehouse}`);
      console.log(`   Date: ${order.date}`);
      console.log(`   Items: ${order.items?.length || 0}`);
      
      if (order.items && order.items.length > 0) {
        console.log(`\n   📋 Items in this transfer order:`);
        
        for (const item of order.items) {
          console.log(`\n   Item: ${item.itemName} (Qty: ${item.quantity})`);
          console.log(`     ItemId: ${item.itemId || 'N/A'}`);
          console.log(`     ItemGroupId: ${item.itemGroupId || 'N/A'}`);
          console.log(`     ItemSku: ${item.itemSku || 'N/A'}`);
          
          // Check current stock in source warehouse
          const sourceStock = await getCurrentStock(
            item.itemId,
            order.sourceWarehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
          
          // Check current stock in destination warehouse
          const destStock = await getCurrentStock(
            item.itemId,
            order.destinationWarehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
          
          console.log(`     📊 Current Stock:`);
          console.log(`       Source (${order.sourceWarehouse}): ${sourceStock.currentQuantity || 0}`);
          console.log(`       Destination (${order.destinationWarehouse}): ${destStock.currentQuantity || 0}`);
          
          // Analysis
          if (order.status === 'transferred') {
            console.log(`     ✅ Order status is "transferred" - stock should have been moved`);
          } else if (order.status === 'in_transit') {
            console.log(`     ⚠️ Order status is "in_transit" - stock should still be in source warehouse`);
          } else if (order.status === 'draft') {
            console.log(`     📝 Order status is "draft" - stock should still be in source warehouse`);
          }
        }
      }
      
      console.log(`\n   ${'='.repeat(60)}`);
    }
    
    // Check for any transfer orders that might be stuck in "in_transit" status
    console.log(`\n🔍 Checking for transfer orders stuck in "in_transit" status...`);
    
    const inTransitOrders = await TransferOrder.find({
      status: 'in_transit',
      destinationWarehouse: { $regex: /edapally/i }
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${inTransitOrders.length} transfer orders in "in_transit" status to Edapally:`);
    
    for (const order of inTransitOrders) {
      console.log(`\n📦 IN-TRANSIT Order: ${order.transferOrderNumber}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Source: ${order.sourceWarehouse} → Destination: ${order.destinationWarehouse}`);
      console.log(`   Items: ${order.items?.length || 0}`);
      
      const daysSinceCreated = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24));
      console.log(`   ⏰ Days since created: ${daysSinceCreated}`);
      
      if (daysSinceCreated > 7) {
        console.log(`   ⚠️ This order has been in transit for more than 7 days - might need manual review`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing transfer orders:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await testTransferOrderStockUpdates();
  
  console.log('\n=== TEST COMPLETED ===');
  console.log('\n💡 SUMMARY:');
  console.log('1. Transfer orders with status "draft" or "in_transit" should NOT move stock');
  console.log('2. Stock is only moved when status changes to "transferred"');
  console.log('3. If you created a transfer order and stock wasn\'t moved, check the status');
  console.log('4. Use the "Receive" button to change status from "in_transit" to "transferred"');
  console.log('\n🔧 TO FIX THE ISSUE:');
  console.log('1. Find your transfer order in the system');
  console.log('2. If status is "in_transit", click "Receive" to complete the transfer');
  console.log('3. If status is "draft", first change to "in_transit", then "Receive"');
  
  process.exit(0);
};

main().catch(console.error);