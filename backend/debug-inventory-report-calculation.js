// Debug Inventory Report Calculation Logic
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';

dotenv.config();

// Copy the exact warehouse mapping from InventoryReportController
const WAREHOUSE_NAME_MAPPING = {
  "Grooms Trivandum": "Grooms Trivandrum",
  "Grooms Trivandrum": "Grooms Trivandrum",
  "SG-Trivandrum": "Grooms Trivandrum",
  "G.Palakkad": "Palakkad Branch",
  "G.Palakkad ": "Palakkad Branch",
  "GPalakkad": "Palakkad Branch",
  "Palakkad Branch": "Palakkad Branch",
  "Warehouse": "Warehouse",
  "warehouse": "Warehouse",
  "WAREHOUSE": "Warehouse"
};

const normalizeWarehouseName = (warehouseName) => {
  if (!warehouseName) return null;
  const trimmed = warehouseName.toString().trim();
  if (WAREHOUSE_NAME_MAPPING[trimmed]) {
    return WAREHOUSE_NAME_MAPPING[trimmed];
  }
  const lowerName = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(WAREHOUSE_NAME_MAPPING)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  return trimmed;
};

async function debugInventoryReportCalculation() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    console.log('🔍 DEBUGGING INVENTORY REPORT CALCULATION');
    console.log('=========================================\n');

    // Simulate the exact logic from InventoryReportController
    const warehouse = "Grooms Trivandrum";
    const normalizedWarehouse = normalizeWarehouseName(warehouse);
    
    console.log(`Target warehouse: "${warehouse}"`);
    console.log(`Normalized warehouse: "${normalizedWarehouse}"`);

    // Step 1: Get all standalone items (same as controller)
    console.log('\n📦 Step 1: Fetching standalone items...');
    const standaloneItems = await ShoeItem.find({});
    console.log(`Found ${standaloneItems.length} standalone items`);

    // Filter items that have warehouseStocks for Grooms Trivandrum
    const filteredStandaloneItems = standaloneItems.filter(item => {
      return (item.warehouseStocks || []).some(ws => {
        if (!ws || !ws.warehouse) return false;
        const wsWarehouseStr = ws.warehouse.toString().trim();
        const normalizedWs = normalizeWarehouseName(wsWarehouseStr);
        return normalizedWs === normalizedWarehouse || 
               wsWarehouseStr.toLowerCase().includes('grooms') && wsWarehouseStr.toLowerCase().includes('trivandrum');
      });
    });

    console.log(`Filtered to ${filteredStandaloneItems.length} standalone items with Grooms Trivandrum stock`);

    // Step 2: Get item groups (same as controller)
    console.log('\n📦 Step 2: Fetching item groups...');
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    console.log(`Found ${itemGroups.length} item groups`);

    let groupItems = [];
    let groupItemsChecked = 0;
    let groupItemsIncluded = 0;

    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item, index) => {
          groupItemsChecked++;
          
          // Check if item has stock for Grooms Trivandrum
          const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
            item.warehouseStocks.some(ws => {
              if (!ws || !ws.warehouse) return false;
              const wsWarehouseStr = ws.warehouse.toString().trim();
              const normalizedWs = normalizeWarehouseName(wsWarehouseStr);
              return normalizedWs === normalizedWarehouse || 
                     wsWarehouseStr.toLowerCase().includes('grooms') && wsWarehouseStr.toLowerCase().includes('trivandrum');
            });

          if (hasStock) {
            groupItemsIncluded++;
            const standaloneItem = {
              _id: item._id || `${group._id}_${index}`,
              itemName: item.name || "",
              sku: item.sku || "",
              costPrice: item.costPrice || 0,
              category: group.category || "",
              warehouseStocks: item.warehouseStocks || [],
              itemGroupId: group._id,
              itemGroupName: group.name,
              isFromGroup: true,
              createdAt: group.createdAt,
            };
            groupItems.push(standaloneItem);
          }
        });
      }
    });

    console.log(`Found ${groupItems.length} items from groups with Grooms Trivandrum stock`);
    console.log(`(Checked ${groupItemsChecked} items, included ${groupItemsIncluded})`);

    // Step 3: Combine items and calculate stock (same as controller)
    const allItems = [
      ...filteredStandaloneItems.map(item => ({ ...item.toObject(), isFromGroup: false })), 
      ...groupItems
    ];

    console.log(`\n📊 Step 3: Processing ${allItems.length} total items...`);

    // Process each item to calculate stock (same logic as controller)
    const inventorySummary = allItems.map(item => {
      let totalStock = 0;
      let totalValue = 0;
      
      // Filter warehouseStocks to only Grooms Trivandrum
      let warehouseStocksToShow = (item.warehouseStocks || []).filter(ws => {
        if (!ws || !ws.warehouse) return false;
        const wsWarehouseStr = ws.warehouse.toString().trim();
        const normalizedWs = normalizeWarehouseName(wsWarehouseStr);
        return normalizedWs === normalizedWarehouse || 
               wsWarehouseStr.toLowerCase().includes('grooms') && wsWarehouseStr.toLowerCase().includes('trivandrum');
      });

      if (warehouseStocksToShow && Array.isArray(warehouseStocksToShow)) {
        warehouseStocksToShow.forEach(ws => {
          const stock = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
          const cost = parseFloat(item.costPrice) || 0;
          totalStock += stock;
          totalValue += stock * cost;
        });
      }

      return {
        itemId: item._id,
        itemName: item.itemName || item.name,
        sku: item.sku,
        category: item.category,
        cost: parseFloat(item.costPrice) || 0,
        totalStock,
        totalValue,
        warehouseStocks: warehouseStocksToShow,
        isFromGroup: item.isFromGroup || false,
        itemGroupName: item.itemGroupName || null
      };
    }).filter(item => {
      // Only include items that have matching warehouse stock entries
      return item.warehouseStocks && item.warehouseStocks.length > 0;
    });

    console.log(`Final inventory summary: ${inventorySummary.length} items`);

    // Step 4: Show detailed results
    console.log(`\n📋 Step 4: Detailed Results for Grooms Trivandrum:`);
    console.log('================================================');

    if (inventorySummary.length === 0) {
      console.log('❌ No items found with Grooms Trivandrum stock');
      
      // Let's check what warehouse names actually exist
      console.log('\n🔍 Checking actual warehouse names in the database...');
      
      const allWarehouseNames = new Set();
      
      // Check standalone items
      standaloneItems.forEach(item => {
        if (item.warehouseStocks) {
          item.warehouseStocks.forEach(ws => {
            if (ws.warehouse) {
              allWarehouseNames.add(ws.warehouse);
            }
          });
        }
      });
      
      // Check group items
      itemGroups.forEach(group => {
        if (group.items) {
          group.items.forEach(item => {
            if (item.warehouseStocks) {
              item.warehouseStocks.forEach(ws => {
                if (ws.warehouse) {
                  allWarehouseNames.add(ws.warehouse);
                }
              });
            }
          });
        }
      });
      
      console.log('\nAll warehouse names found in database:');
      Array.from(allWarehouseNames).sort().forEach(name => {
        console.log(`- "${name}"`);
      });
      
      // Look for Trivandrum-related names
      console.log('\nTrivandrum-related warehouse names:');
      Array.from(allWarehouseNames).filter(name => 
        name.toLowerCase().includes('trivandrum') || 
        name.toLowerCase().includes('tvm') ||
        name.toLowerCase().includes('grooms')
      ).forEach(name => {
        console.log(`- "${name}"`);
      });
      
    } else {
      // Show items with stock around the problematic range
      console.log('Items with significant stock (>50 pieces):');
      inventorySummary
        .filter(item => item.totalStock > 50)
        .sort((a, b) => b.totalStock - a.totalStock)
        .forEach(item => {
          console.log(`\n📦 ${item.sku}: ${item.itemName}`);
          console.log(`   Total Stock: ${item.totalStock} pieces`);
          console.log(`   From Group: ${item.isFromGroup ? item.itemGroupName : 'Standalone'}`);
          
          item.warehouseStocks.forEach(ws => {
            console.log(`   - Warehouse: "${ws.warehouse}"`);
            console.log(`     Stock: ${ws.stockOnHand || 0}, Opening: ${ws.openingStock || 0}`);
            console.log(`     Physical: ${ws.physicalStockOnHand || 0}`);
          });
          
          // Check if this could be the problematic item
          if (item.totalStock >= 85 && item.totalStock <= 95) {
            console.log(`   🎯 *** POTENTIAL MATCH: Stock around 89 ***`);
          }
        });
    }

    // Step 5: Check the total stock calculation
    const totalQuantity = inventorySummary.reduce((sum, item) => sum + item.totalStock, 0);
    const totalValue = inventorySummary.reduce((sum, item) => sum + item.totalValue, 0);
    
    console.log(`\n📊 SUMMARY FOR GROOMS TRIVANDRUM:`);
    console.log('================================');
    console.log(`Total Items: ${inventorySummary.length}`);
    console.log(`Total Quantity: ${totalQuantity} pieces`);
    console.log(`Total Value: ₹${totalValue.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

debugInventoryReportCalculation();