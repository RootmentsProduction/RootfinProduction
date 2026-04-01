import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';

dotenv.config();

async function simpleDebug() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rootments');
    console.log("✅ Connected to MongoDB");

    console.log("🔍 SIMPLE PERINTHALMANNA DEBUG\n");

    // 1. Find all items with any warehouse containing "perinth" (case insensitive)
    console.log("1️⃣ SEARCHING FOR PERINTHALMANNA ITEMS:");
    console.log("=".repeat(50));
    
    const standaloneItems = await ShoeItem.find({
      'warehouseStocks.warehouse': { $regex: /perinth/i }
    }).select('itemName sku warehouseStocks createdAt');

    const itemGroups = await ItemGroup.find({
      'items.warehouseStocks.warehouse': { $regex: /perinth/i }
    }).select('groupName items.name items.sku items.warehouseStocks createdAt');

    console.log(`Found ${standaloneItems.length} standalone items with Perinthalmanna warehouse`);
    console.log(`Found ${itemGroups.length} item groups with Perinthalmanna warehouse`);

    // 2. Check warehouse name variations
    const warehouseVariations = new Set();
    let totalItemsWithOpeningStock = 0;
    let totalOpeningStock = 0;

    // Process standalone items
    standaloneItems.forEach(item => {
      item.warehouseStocks.forEach(stock => {
        if (stock.warehouse && stock.warehouse.toLowerCase().includes('perinth')) {
          warehouseVariations.add(stock.warehouse);
          if (stock.openingStock > 0) {
            totalItemsWithOpeningStock++;
            totalOpeningStock += stock.openingStock;
            console.log(`📦 ${item.itemName} (${item.sku || 'No SKU'}) - Opening Stock: ${stock.openingStock} - Warehouse: "${stock.warehouse}" - Created: ${item.createdAt.toLocaleDateString()}`);
          }
        }
      });
    });

    // Process grouped items
    let groupedItemsCount = 0;
    itemGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.warehouseStocks) {
          item.warehouseStocks.forEach(stock => {
            if (stock.warehouse && stock.warehouse.toLowerCase().includes('perinth')) {
              warehouseVariations.add(stock.warehouse);
              if (stock.openingStock > 0) {
                groupedItemsCount++;
                totalItemsWithOpeningStock++;
                totalOpeningStock += stock.openingStock;
                console.log(`📦 ${item.name} (Group: ${group.groupName}) (${item.sku || 'No SKU'}) - Opening Stock: ${stock.openingStock} - Warehouse: "${stock.warehouse}" - Created: ${group.createdAt.toLocaleDateString()}`);
              }
            }
          });
        }
      });
    });

    console.log("\n2️⃣ WAREHOUSE NAME VARIATIONS FOUND:");
    console.log("=".repeat(50));
    Array.from(warehouseVariations).forEach(name => {
      console.log(`- "${name}"`);
    });

    console.log("\n3️⃣ SUMMARY:");
    console.log("=".repeat(50));
    console.log(`📊 Total items with Perinthalmanna opening stock: ${totalItemsWithOpeningStock}`);
    console.log(`📦 Total opening stock quantity: ${totalOpeningStock}`);
    console.log(`🏪 Warehouse variations found: ${warehouseVariations.size}`);

    // 4. Check items created in different months
    console.log("\n4️⃣ ITEMS BY CREATION MONTH:");
    console.log("=".repeat(50));
    
    const monthCounts = {};
    
    standaloneItems.forEach(item => {
      item.warehouseStocks.forEach(stock => {
        if (stock.warehouse && stock.warehouse.toLowerCase().includes('perinth') && stock.openingStock > 0) {
          const monthKey = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, '0')}`;
          monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        }
      });
    });

    itemGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.warehouseStocks) {
          item.warehouseStocks.forEach(stock => {
            if (stock.warehouse && stock.warehouse.toLowerCase().includes('perinth') && stock.openingStock > 0) {
              const monthKey = `${group.createdAt.getFullYear()}-${String(group.createdAt.getMonth() + 1).padStart(2, '0')}`;
              monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
            }
          });
        }
      });
    });

    Object.entries(monthCounts).sort().forEach(([month, count]) => {
      console.log(`${month}: ${count} items`);
    });

    if (totalItemsWithOpeningStock !== 159) {
      console.log(`\n⚠️  DISCREPANCY DETECTED!`);
      console.log(`Expected: 159 items`);
      console.log(`Found: ${totalItemsWithOpeningStock} items`);
      console.log(`Difference: ${Math.abs(159 - totalItemsWithOpeningStock)} items`);
    } else {
      console.log(`\n✅ MATCH FOUND! Found exactly 159 items as expected.`);
    }

    console.log("\n✅ Debug completed!");

  } catch (error) {
    console.error("❌ Error in debug:", error);
  } finally {
    await mongoose.connection.close();
  }
}

simpleDebug();