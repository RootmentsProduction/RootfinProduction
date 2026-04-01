// Script to complete stuck transfer orders that have been in "in_transit" status for too long
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

// Helper function to transfer stock for an item
const transferItemStock = async (itemIdValue, quantity, sourceWarehouse, destinationWarehouse, itemName = null, itemGroupId = null, itemSku = null) => {
  const sourceWarehouseName = sourceWarehouse?.trim() || "Warehouse";
  const destWarehouseName = destinationWarehouse?.trim() || "Warehouse";
  
  console.log(`    📦 Transferring ${quantity} units of "${itemName || itemIdValue}" from "${sourceWarehouseName}" to "${destWarehouseName}"`);
  
  // Helper function to match warehouse names flexibly
  const matchesWarehouse = (itemWarehouse, targetWarehouse) => {
    if (!itemWarehouse || !targetWarehouse) return false;
    const itemWarehouseLower = itemWarehouse.toString().toLowerCase().trim();
    const targetWarehouseLower = targetWarehouse.toLowerCase().trim();
    
    // Exact match
    if (itemWarehouseLower === targetWarehouseLower) return true;
    
    // Base name match (e.g., "warehouse" matches "Warehouse", "kannur" matches "Kannur Branch")
    const itemBase = itemWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
    const targetBase = targetWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
    if (itemBase && targetBase && itemBase === targetBase) return true;
    
    // Partial match
    if (itemWarehouseLower.includes(targetWarehouseLower) || targetWarehouseLower.includes(itemWarehouseLower)) return true;
    
    return false;
  };
  
  // Try standalone item first
  if (itemIdValue && itemIdValue !== null && itemIdValue !== "null") {
    const shoeItem = await ShoeItem.findById(itemIdValue);
    if (shoeItem) {
      const itemPlain = shoeItem.toObject();
      
      if (!itemPlain.warehouseStocks || !Array.isArray(itemPlain.warehouseStocks)) {
        itemPlain.warehouseStocks = [];
      }
      
      // Helper to find or create warehouse stock entry
      const getOrCreateWarehouseStock = (warehouseName) => {
        let wsEntry = itemPlain.warehouseStocks.find(ws => 
          matchesWarehouse(ws.warehouse, warehouseName)
        );
        
        if (!wsEntry) {
          wsEntry = {
            warehouse: warehouseName,
            openingStock: 0,
            openingStockValue: 0,
            stockOnHand: 0,
            committedStock: 0,
            availableForSale: 0,
            physicalOpeningStock: 0,
            physicalStockOnHand: 0,
            physicalCommittedStock: 0,
            physicalAvailableForSale: 0,
          };
          itemPlain.warehouseStocks.push(wsEntry);
        }
        return wsEntry;
      };
      
      // Subtract from source warehouse
      const sourceWs = getOrCreateWarehouseStock(sourceWarehouseName);
      const sourceCurrentStock = parseFloat(sourceWs.stockOnHand) || 0;
      sourceWs.stockOnHand = Math.max(0, sourceCurrentStock - quantity);
      sourceWs.availableForSale = Math.max(0, (parseFloat(sourceWs.availableForSale) || 0) - quantity);
      sourceWs.physicalStockOnHand = Math.max(0, (parseFloat(sourceWs.physicalStockOnHand) || 0) - quantity);
      sourceWs.physicalAvailableForSale = Math.max(0, (parseFloat(sourceWs.physicalAvailableForSale) || 0) - quantity);
      sourceWs.warehouse = sourceWarehouseName;
      
      // Add to destination warehouse
      const destWs = getOrCreateWarehouseStock(destWarehouseName);
      const destCurrentStock = parseFloat(destWs.stockOnHand) || 0;
      destWs.stockOnHand = destCurrentStock + quantity;
      destWs.availableForSale = (parseFloat(destWs.availableForSale) || 0) + quantity;
      destWs.physicalStockOnHand = (parseFloat(destWs.physicalStockOnHand) || 0) + quantity;
      destWs.physicalAvailableForSale = (parseFloat(destWs.physicalAvailableForSale) || 0) + quantity;
      destWs.warehouse = destWarehouseName;
      
      // Update using $set
      await ShoeItem.findByIdAndUpdate(
        itemIdValue,
        { $set: { warehouseStocks: itemPlain.warehouseStocks } }
      );
      
      console.log(`    ✅ Standalone item stock transferred: ${sourceCurrentStock} → ${sourceWs.stockOnHand} (source), ${destCurrentStock} → ${destWs.stockOnHand} (dest)`);
      return { success: true, type: 'standalone' };
    }
  }
  
  // Try item groups
  if (itemGroupId && itemName) {
    const group = await ItemGroup.findById(itemGroupId);
    if (group) {
      const itemIndex = group.items.findIndex(item => {
        if (itemSku && item.sku) {
          return item.sku.toLowerCase() === itemSku.toLowerCase();
        }
        return item.name.toLowerCase() === itemName.toLowerCase();
      });
      
      if (itemIndex !== -1) {
        const groupPlain = group.toObject();
        const itemPlain = groupPlain.items[itemIndex];
        
        if (!itemPlain.warehouseStocks) {
          itemPlain.warehouseStocks = [];
        }
        
        // Helper to find or create warehouse stock entry
        const getOrCreateWarehouseStock = (warehouseName) => {
          let wsEntry = itemPlain.warehouseStocks.find(ws => 
            matchesWarehouse(ws.warehouse, warehouseName)
          );
          
          if (!wsEntry) {
            wsEntry = {
              warehouse: warehouseName,
              openingStock: 0,
              openingStockValue: 0,
              stockOnHand: 0,
              committedStock: 0,
              availableForSale: 0,
              physicalOpeningStock: 0,
              physicalStockOnHand: 0,
              physicalCommittedStock: 0,
              physicalAvailableForSale: 0,
            };
            itemPlain.warehouseStocks.push(wsEntry);
          }
          return wsEntry;
        };
        
        // Subtract from source warehouse
        const sourceWs = getOrCreateWarehouseStock(sourceWarehouseName);
        const sourceCurrentStock = parseFloat(sourceWs.stockOnHand) || 0;
        sourceWs.stockOnHand = Math.max(0, sourceCurrentStock - quantity);
        sourceWs.availableForSale = Math.max(0, (parseFloat(sourceWs.availableForSale) || 0) - quantity);
        sourceWs.physicalStockOnHand = Math.max(0, (parseFloat(sourceWs.physicalStockOnHand) || 0) - quantity);
        sourceWs.physicalAvailableForSale = Math.max(0, (parseFloat(sourceWs.physicalAvailableForSale) || 0) - quantity);
        sourceWs.warehouse = sourceWarehouseName;
        
        // Add to destination warehouse
        const destWs = getOrCreateWarehouseStock(destWarehouseName);
        const destCurrentStock = parseFloat(destWs.stockOnHand) || 0;
        destWs.stockOnHand = destCurrentStock + quantity;
        destWs.availableForSale = (parseFloat(destWs.availableForSale) || 0) + quantity;
        destWs.physicalStockOnHand = (parseFloat(destWs.physicalStockOnHand) || 0) + quantity;
        destWs.physicalAvailableForSale = (parseFloat(destWs.physicalAvailableForSale) || 0) + quantity;
        destWs.warehouse = destWarehouseName;
        
        // Update using $set
        await ItemGroup.findByIdAndUpdate(
          itemGroupId,
          { $set: { [`items.${itemIndex}`]: itemPlain } }
        );
        
        console.log(`    ✅ Group item stock transferred: ${sourceCurrentStock} → ${sourceWs.stockOnHand} (source), ${destCurrentStock} → ${destWs.stockOnHand} (dest)`);
        return { success: true, type: 'group' };
      }
    }
  }
  
  console.log(`    ❌ Item "${itemName || itemIdValue}" not found`);
  return { success: false, message: `Item "${itemName || itemIdValue}" not found` };
};

// Complete stuck transfer orders
const completeStuckTransfers = async (dryRun = true) => {
  console.log('\n=== COMPLETING STUCK TRANSFER ORDERS ===\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  } else {
    console.log('⚠️ LIVE MODE - Changes will be applied');
  }
  
  try {
    // Find transfer orders stuck in "in_transit" status for more than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const stuckOrders = await TransferOrder.find({
      status: 'in_transit',
      createdAt: { $lt: sevenDaysAgo }
    }).sort({ createdAt: 1 });
    
    console.log(`Found ${stuckOrders.length} transfer orders stuck in "in_transit" status for more than 7 days:`);
    
    if (stuckOrders.length === 0) {
      console.log('✅ No stuck transfer orders found!');
      return;
    }
    
    for (const order of stuckOrders) {
      const daysSinceCreated = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24));
      
      console.log(`\n📦 Processing: ${order.transferOrderNumber}`);
      console.log(`   Status: ${order.status} (${daysSinceCreated} days)`);
      console.log(`   Route: ${order.sourceWarehouse} → ${order.destinationWarehouse}`);
      console.log(`   Items: ${order.items?.length || 0}`);
      
      if (!dryRun) {
        // Transfer stock for each item
        const items = order.items || [];
        let successCount = 0;
        let failCount = 0;
        
        for (const item of items) {
          try {
            const result = await transferItemStock(
              item.itemId,
              item.quantity,
              order.sourceWarehouse,
              order.destinationWarehouse,
              item.itemName,
              item.itemGroupId,
              item.itemSku
            );
            
            if (result.success) {
              successCount++;
            } else {
              failCount++;
              console.log(`    ❌ Failed: ${result.message}`);
            }
          } catch (stockError) {
            failCount++;
            console.error(`    ❌ Error transferring stock for item ${item.itemName}:`, stockError.message);
          }
        }
        
        // Update order status to transferred
        await order.updateOne({ 
          status: 'transferred',
          modifiedBy: 'system-auto-complete'
        });
        
        console.log(`   ✅ Order completed: ${successCount} items transferred, ${failCount} failed`);
        console.log(`   📊 Status changed: in_transit → transferred`);
      } else {
        console.log(`   🔍 Would transfer ${order.items?.length || 0} items and change status to "transferred"`);
      }
    }
    
    if (!dryRun) {
      console.log(`\n✅ Completed ${stuckOrders.length} stuck transfer orders`);
    } else {
      console.log(`\n🔍 Dry run completed - ${stuckOrders.length} orders would be processed`);
      console.log('\n💡 To apply changes, run: node complete-stuck-transfers.js --live');
    }
    
  } catch (error) {
    console.error('❌ Error completing stuck transfers:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  
  // Check if --live flag is provided
  const isLiveMode = process.argv.includes('--live');
  
  await completeStuckTransfers(!isLiveMode);
  
  console.log('\n=== COMPLETION SCRIPT FINISHED ===');
  
  if (!isLiveMode) {
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Review the orders listed above');
    console.log('2. If everything looks correct, run with --live flag:');
    console.log('   node complete-stuck-transfers.js --live');
    console.log('3. Verify stock movements in inventory reports');
  } else {
    console.log('\n✅ All stuck transfer orders have been completed');
    console.log('📊 Check inventory reports to verify stock movements');
  }
  
  process.exit(0);
};

main().catch(console.error);