import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rootments', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function comprehensiveDebug() {
  try {
    console.log("🔍 COMPREHENSIVE PERINTHALMANNA DEBUG\n");

    // 1. Check what databases and collections exist
    console.log("1️⃣ DATABASE INFO:");
    console.log("=".repeat(50));
    console.log(`Connected to: ${mongoose.connection.db.databaseName}`);
    
    // 2. Check total items in database
    const totalStandaloneItems = await ShoeItem.countDocuments();
    const totalItemGroups = await ItemGroup.countDocuments();
    console.log(`Total standalone items in DB: ${totalStandaloneItems}`);
    console.log(`Total item groups in DB: ${totalItemGroups}`);

    // 3. Check all warehouse names that contain "perinth" (case insensitive)
    console.log("\n2️⃣ ALL WAREHOUSE NAMES CONTAINING 'PERINTH':");
    console.log("=".repeat(50));
    
    const allStandaloneItems = await ShoeItem.find({}).select('itemName warehouseStocks createdAt');
    const allItemGroups = await ItemGroup.find({}).select('groupName items.name items.warehouseStocks createdAt');

    const warehouseNames = new Set();
    
    // Check standalone items
    allStandaloneItems.forEach(item => {
      if (item.warehouseStocks) {
        item.warehouseStocks.forEach(stock => {
          if (stock.warehouse && stock.warehouse.toLowerCase().includes('perinth')) {
            warehouseNames.add(stock.warehouse);
          }
        });
      }
    });

    // Check grouped items
    allItemGroups.forEach(group => {
      if (group.items) {
        group.items.forEach(item => {
          if (item.warehouseStocks) {
            item.warehouseStocks.forEach(stock => {
              if (stock.warehouse && stock.warehouse.toLowerCase().includes('perinth')) {
                warehouseNames.add(stock.warehouse);
              }
            });
          }
        });
      }
    });

    console.log("Found warehouse names containing 'perinth':");
    Array.from(warehouseNames).forEach(name => {
      console.log(`- "${name}"`);
    });

    // 4. Check items with opening stock for each warehouse name variation
    console.log("\n3️⃣ ITEMS WITH OPENING STOCK BY WAREHOUSE NAME:");
    console.log("=".repeat(50));

    for (const warehouseName of warehouseNames) {
      console.log(`\n🏪 Warehouse: "${warehouseName}"`);
      
      // Count standalone items
      let standaloneCount = 0;
      let groupedCount = 0;
      let totalOpeningStock = 0;

      allStandaloneItems.forEach(item => {
        if (item.warehouseStocks) {
          item.warehouseStocks.forEach(stock => {
            if (stock.warehouse === warehouseName && stock.openingStock > 0) {
              standaloneCount++;
              totalOpeningStock += stock.openingStock;
            }
          });
        }
      });

      allItemGroups.forEach(group => {
        if (group.items) {
          group.items.forEach(item => {
            if (item.warehouseStocks) {
              item.warehouseStocks.forEach(stock => {
                if (stock.warehouse === warehouseName && stock.openingStock > 0) {
                  groupedCount++;
                  totalOpeningStock += stock.openingStock;
                }
              });
            }
          });
        }
      });

      console.log(`  Standalone items: ${standaloneCount}`);
      console.log(`  Grouped items: ${groupedCount}`);
      console.log(`  Total items: ${standaloneCount + groupedCount}`);
      console.log(`  Total opening stock: ${totalOpeningStock}`);
    }

    // 5. Check creation dates for Perinthalmanna items
    console.log("\n4️⃣ CREATION DATES FOR PERINTHALMANNA ITEMS:");
    console.log("=".repeat(50));

    const creationDates = new Map();

    for (const warehouseName of warehouseNames) {
      allStandaloneItems.forEach(item => {
        if (item.warehouseStocks) {
          item.warehouseStocks.forEach(stock => {
            if (stock.warehouse === warehouseName && stock.openingStock > 0) {
              const dateKey = item.createdAt.toISOString().split('T')[0];
              creationDates.set(dateKey, (creationDates.get(dateKey) || 0) + 1);
            }
          });
        }
      });

      allItemGroups.forEach(group => {
        if (group.items) {
          group.items.forEach(item => {
            if (item.warehouseStocks) {
              item.warehouseStocks.forEach(stock => {
                if (stock.warehouse === warehouseName && stock.openingStock > 0) {
                  const dateKey = group.createdAt.toISOString().split('T')[0];
                  creationDates.set(dateKey, (creationDates.get(dateKey) || 0) + 1);
                }
              });
            }
          });
        }
      });
    }

    // Sort dates and display
    const sortedDates = Array.from(creationDates.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    console.log("Items created by date:");
    sortedDates.forEach(([date, count]) => {
      console.log(`  ${date}: ${count} items`);
    });

    // 6. Check if items exist but without opening stock
    console.log("\n5️⃣ PERINTHALMANNA ITEMS WITHOUT OPENING STOCK:");
    console.log("=".repeat(50));

    let itemsWithoutOpeningStock = 0;
    for (const warehouseName of warehouseNames) {
      allStandaloneItems.forEach(item => {
        if (item.warehouseStocks) {
          item.warehouseStocks.forEach(stock => {
            if (stock.warehouse === warehouseName && (!stock.openingStock || stock.openingStock === 0)) {
              itemsWithoutOpeningStock++;
            }
          });
        }
      });

      allItemGroups.forEach(group => {
        if (group.items) {
          group.items.forEach(item => {
            if (item.warehouseStocks) {
              item.warehouseStocks.forEach(stock => {
                if (stock.warehouse === warehouseName && (!stock.openingStock || stock.openingStock === 0)) {
                  itemsWithoutOpeningStock++;
                }
              });
            }
          });
        }
      });
    }

    console.log(`Items with Perinthalmanna warehouse but no opening stock: ${itemsWithoutOpeningStock}`);

    console.log("\n✅ Comprehensive debug completed!");

  } catch (error) {
    console.error("❌ Error in comprehensive debug:", error);
  } finally {
    mongoose.connection.close();
  }
}

comprehensiveDebug();