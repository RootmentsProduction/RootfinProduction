// Debug script to test the transferItemStock function directly
import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

// Copy the transferItemStock function from TransferOrderController.js to test it directly
const transferItemStock = async (itemIdValue, quantity, sourceWarehouse, destinationWarehouse, itemName = null, itemGroupId = null, itemSku = null) => {
  const sourceWarehouseName = sourceWarehouse?.trim() || "Warehouse";
  const destWarehouseName = destinationWarehouse?.trim() || "Warehouse";
  
  console.log(`\n📦 transferItemStock called:`);
  console.log(`   Item: ${itemName || itemIdValue}`);
  console.log(`   Quantity: ${quantity}`);
  console.log(`   Source: "${sourceWarehouseName}"`);
  console.log(`   Destination: "${destWarehouseName}"`);
  console.log(`   ItemId: ${itemIdValue}`);
  console.log(`   ItemGroupId: ${itemGroupId}`);
  console.log(`   ItemSku: ${itemSku}`);
  
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
    console.log(`   🔍 Looking for standalone item with ID: ${itemIdValue}`);
    const shoeItem = await ShoeItem.findById(itemIdValue);
    if (shoeItem) {
      console.log(`   ✅ Found standalone item: "${shoeItem.itemName}"`);
      console.log(`   📊 Warehouse stocks:`, shoeItem.warehouseStocks?.map(ws => `${ws.warehouse}: ${ws.stockOnHand}`));
      
      const itemPlain = shoeItem.toObject();
      
      if (!itemPlain.warehouseStocks || !Array.isArray(itemPlain.warehouseStocks)) {
        console.log(`   ⚠️ No warehouseStocks array, creating empty one`);
        itemPlain.warehouseStocks = [];
      }
      
      // Helper to find or create warehouse stock entry
      const getOrCreateWarehouseStock = (warehouseName) => {
        console.log(`   🔍 Looking for warehouse stock: "${warehouseName}"`);
        let wsEntry = itemPlain.warehouseStocks.find(ws => {
          const matches = matchesWarehouse(ws.warehouse, warehouseName);
          console.log(`     Checking "${ws.warehouse}" vs "${warehouseName}": ${matches ? 'MATCH' : 'NO MATCH'}`);
          return matches;
        });
        
        if (!wsEntry) {
          console.log(`   📦 Creating new warehouse stock entry for "${warehouseName}"`);
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
        } else {
          console.log(`   ✅ Found existing warehouse stock: "${wsEntry.warehouse}" (${wsEntry.stockOnHand} units)`);
        }
        return wsEntry;
      };
      
      // Subtract from source warehouse
      console.log(`\n   📉 Processing source warehouse: "${sourceWarehouseName}"`);
      const sourceWs = getOrCreateWarehouseStock(sourceWarehouseName);
      const sourceCurrentStock = parseFloat(sourceWs.stockOnHand) || 0;
      console.log(`     Before: ${sourceCurrentStock} units`);
      sourceWs.stockOnHand = Math.max(0, sourceCurrentStock - quantity);
      sourceWs.availableForSale = Math.max(0, (parseFloat(sourceWs.availableForSale) || 0) - quantity);
      sourceWs.physicalStockOnHand = Math.max(0, (parseFloat(sourceWs.physicalStockOnHand) || 0) - quantity);
      sourceWs.physicalAvailableForSale = Math.max(0, (parseFloat(sourceWs.physicalAvailableForSale) || 0) - quantity);
      sourceWs.warehouse = sourceWarehouseName;
      console.log(`     After: ${sourceWs.stockOnHand} units (reduced by ${quantity})`);
      
      // Add to destination warehouse
      console.log(`\n   📈 Processing destination warehouse: "${destWarehouseName}"`);
      const destWs = getOrCreateWarehouseStock(destWarehouseName);
      const destCurrentStock = parseFloat(destWs.stockOnHand) || 0;
      console.log(`     Before: ${destCurrentStock} units`);
      destWs.stockOnHand = destCurrentStock + quantity;
      destWs.availableForSale = (parseFloat(destWs.availableForSale) || 0) + quantity;
      destWs.physicalStockOnHand = (parseFloat(destWs.physicalStockOnHand) || 0) + quantity;
      destWs.physicalAvailableForSale = (parseFloat(destWs.physicalAvailableForSale) || 0) + quantity;
      destWs.warehouse = destWarehouseName;
      console.log(`     After: ${destWs.stockOnHand} units (increased by ${quantity})`);
      
      // Update using $set
      console.log(`\n   💾 Saving changes to database...`);
      try {
        await ShoeItem.findByIdAndUpdate(
          itemIdValue,
          { $set: { warehouseStocks: itemPlain.warehouseStocks } }
        );
        console.log(`   ✅ Database update successful`);
        
        // Verify the update
        const verifyItem = await ShoeItem.findById(itemIdValue);
        const verifySourceWs = verifyItem.warehouseStocks.find(ws => matchesWarehouse(ws.warehouse, sourceWarehouseName));
        const verifyDestWs = verifyItem.warehouseStocks.find(ws => matchesWarehouse(ws.warehouse, destWarehouseName));
        
        console.log(`\n   🔍 Verification:`);
        console.log(`     Source "${sourceWarehouseName}": ${verifySourceWs?.stockOnHand || 0} units`);
        console.log(`     Destination "${destWarehouseName}": ${verifyDestWs?.stockOnHand || 0} units`);
        
        return { success: true, type: 'standalone' };
      } catch (updateError) {
        console.error(`   ❌ Database update failed:`, updateError);
        return { success: false, message: `Database update failed: ${updateError.message}` };
      }
    } else {
      console.log(`   ❌ Standalone item not found with ID: ${itemIdValue}`);
    }
  }
  
  // Try item groups
  if (itemGroupId && itemName) {
    console.log(`   🔍 Looking for item in group: ${itemGroupId}`);
    const group = await ItemGroup.findById(itemGroupId);
    if (group) {
      console.log(`   ✅ Found group: "${group.name}"`);
      const itemIndex = group.items.findIndex(item => {
        if (itemSku && item.sku) {
          return item.sku.toLowerCase() === itemSku.toLowerCase();
        }
        return item.name.toLowerCase() === itemName.toLowerCase();
      });
      
      if (itemIndex !== -1) {
        console.log(`   ✅ Found item in group at index ${itemIndex}: "${group.items[itemIndex].name}"`);
        // Similar logic for group items...
        return { success: true, type: 'group' };
      } else {
        console.log(`   ❌ Item "${itemName}" not found in group`);
      }
    } else {
      console.log(`   ❌ Group not found with ID: ${itemGroupId}`);
    }
  }
  
  console.log(`   ❌ Item not found: "${itemName || itemIdValue}"`);
  return { success: false, message: `Item "${itemName || itemIdValue}" not found` };
};

// Test the transferItemStock function directly
const testTransferItemStock = async () => {
  console.log('\n=== TESTING transferItemStock FUNCTION DIRECTLY ===\n');
  
  try {
    // Find a test item with stock in warehouse
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
      console.log('❌ No test items found with warehouse stock');
      return;
    }
    
    const testItem = testItems[0];
    const warehouseStock = testItem.warehouseStocks.find(ws => 
      ws.warehouse && ws.warehouse.toLowerCase().includes('warehouse') && ws.stockOnHand > 5
    );
    
    console.log(`📦 Test Item: ${testItem.itemName}`);
    console.log(`   ID: ${testItem._id}`);
    console.log(`   Source Warehouse: ${warehouseStock.warehouse}`);
    console.log(`   Current Stock: ${warehouseStock.stockOnHand}`);
    
    // Test transferring 2 units
    const result = await transferItemStock(
      testItem._id.toString(),
      2,
      warehouseStock.warehouse,
      "Edapally Branch",
      testItem.itemName,
      null,
      testItem.sku
    );
    
    console.log(`\n📊 Transfer Result:`, result);
    
  } catch (error) {
    console.error('❌ Error testing transferItemStock:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await testTransferItemStock();
  
  console.log('\n=== DIRECT FUNCTION TEST COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);