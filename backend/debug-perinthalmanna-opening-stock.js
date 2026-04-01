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

const WAREHOUSE_NAME_MAPPING = {
  "G.Perinthalmanna": "G.Perinthalmanna",
  "G Perinthalmanna": "G.Perinthalmanna", 
  "Perinthalmanna": "G.Perinthalmanna",
  "G.Perinthalmanna Branch": "G.Perinthalmanna",
  "G Perinthalmanna Branch": "G.Perinthalmanna"
};

const normalizeWarehouseName = (name) => {
  if (!name) return "Warehouse";
  const normalized = WAREHOUSE_NAME_MAPPING[name.trim()] || name.trim();
  return normalized;
};

async function debugPerinthalmannaOpeningStock() {
  try {
    console.log("🔍 Debugging Perinthalmanna Opening Stock for January 2026...\n");

    // Date range for January 2026
    const startDate = new Date(2026, 0, 1); // January 1, 2026
    const endDate = new Date(2026, 0, 31, 23, 59, 59); // January 31, 2026

    console.log(`📅 Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);

    // 1. Check standalone items with Perinthalmanna opening stock created in January 2026
    console.log("1️⃣ STANDALONE ITEMS:");
    console.log("=".repeat(50));
    
    const standaloneItems = await ShoeItem.find({
      'warehouseStocks.openingStock': { $gt: 0 },
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).select('itemName sku warehouseStocks createdAt');

    let standalonePerinthalmannaItems = [];
    standaloneItems.forEach(item => {
      item.warehouseStocks.forEach(stock => {
        if (stock.openingStock > 0) {
          const storeName = normalizeWarehouseName(stock.warehouse);
          if (storeName === "G.Perinthalmanna") {
            standalonePerinthalmannaItems.push({
              itemName: item.itemName,
              sku: item.sku,
              openingStock: stock.openingStock,
              createdAt: item.createdAt,
              type: 'standalone'
            });
          }
        }
      });
    });

    console.log(`Found ${standalonePerinthalmannaItems.length} standalone items with Perinthalmanna opening stock:`);
    standalonePerinthalmannaItems.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.itemName} (SKU: ${item.sku || 'N/A'}) - Stock: ${item.openingStock} - Created: ${item.createdAt.toLocaleDateString()}`);
    });

    // 2. Check item groups with Perinthalmanna opening stock created in January 2026
    console.log("\n2️⃣ GROUPED ITEMS:");
    console.log("=".repeat(50));
    
    const itemGroups = await ItemGroup.find({
      'items.warehouseStocks.openingStock': { $gt: 0 },
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).select('groupName items.name items.sku items.warehouseStocks createdAt');

    let groupedPerinthalmannaItems = [];
    itemGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.warehouseStocks) {
          item.warehouseStocks.forEach(stock => {
            if (stock.openingStock > 0) {
              const storeName = normalizeWarehouseName(stock.warehouse);
              if (storeName === "G.Perinthalmanna") {
                groupedPerinthalmannaItems.push({
                  itemName: item.name,
                  sku: item.sku,
                  groupName: group.groupName,
                  openingStock: stock.openingStock,
                  createdAt: group.createdAt,
                  type: 'grouped'
                });
              }
            }
          });
        }
      });
    });

    console.log(`Found ${groupedPerinthalmannaItems.length} grouped items with Perinthalmanna opening stock:`);
    groupedPerinthalmannaItems.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.itemName} (Group: ${item.groupName}) (SKU: ${item.sku || 'N/A'}) - Stock: ${item.openingStock} - Created: ${item.createdAt.toLocaleDateString()}`);
    });

    // 3. Total summary
    const totalItems = standalonePerinthalmannaItems.length + groupedPerinthalmannaItems.length;
    const totalStock = [...standalonePerinthalmannaItems, ...groupedPerinthalmannaItems]
      .reduce((sum, item) => sum + item.openingStock, 0);

    console.log("\n3️⃣ SUMMARY:");
    console.log("=".repeat(50));
    console.log(`📊 Total Items Found: ${totalItems}`);
    console.log(`📦 Total Opening Stock: ${totalStock}`);
    console.log(`🏪 Store: G.Perinthalmanna`);
    console.log(`📅 Period: January 2026`);

    if (totalItems !== 159) {
      console.log(`\n⚠️  DISCREPANCY DETECTED!`);
      console.log(`Expected: 159 items`);
      console.log(`Found: ${totalItems} items`);
      console.log(`Missing: ${159 - totalItems} items`);
    }

    // 4. Check for items created around January but might be just outside the date range
    console.log("\n4️⃣ CHECKING ITEMS CREATED NEAR JANUARY 2026:");
    console.log("=".repeat(50));
    
    const nearbyStartDate = new Date(2025, 11, 25); // December 25, 2025
    const nearbyEndDate = new Date(2026, 1, 5); // February 5, 2026

    const nearbyStandaloneItems = await ShoeItem.find({
      'warehouseStocks.openingStock': { $gt: 0 },
      createdAt: {
        $gte: nearbyStartDate,
        $lte: nearbyEndDate
      }
    }).select('itemName sku warehouseStocks createdAt');

    let nearbyPerinthalmannaItems = [];
    nearbyStandaloneItems.forEach(item => {
      item.warehouseStocks.forEach(stock => {
        if (stock.openingStock > 0) {
          const storeName = normalizeWarehouseName(stock.warehouse);
          if (storeName === "G.Perinthalmanna") {
            const isInJanuary = item.createdAt >= startDate && item.createdAt <= endDate;
            if (!isInJanuary) {
              nearbyPerinthalmannaItems.push({
                itemName: item.itemName,
                sku: item.sku,
                openingStock: stock.openingStock,
                createdAt: item.createdAt,
                type: 'standalone'
              });
            }
          }
        }
      });
    });

    const nearbyItemGroups = await ItemGroup.find({
      'items.warehouseStocks.openingStock': { $gt: 0 },
      createdAt: {
        $gte: nearbyStartDate,
        $lte: nearbyEndDate
      }
    }).select('groupName items.name items.sku items.warehouseStocks createdAt');

    nearbyItemGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.warehouseStocks) {
          item.warehouseStocks.forEach(stock => {
            if (stock.openingStock > 0) {
              const storeName = normalizeWarehouseName(stock.warehouse);
              if (storeName === "G.Perinthalmanna") {
                const isInJanuary = group.createdAt >= startDate && group.createdAt <= endDate;
                if (!isInJanuary) {
                  nearbyPerinthalmannaItems.push({
                    itemName: item.name,
                    sku: item.sku,
                    groupName: group.groupName,
                    openingStock: stock.openingStock,
                    createdAt: group.createdAt,
                    type: 'grouped'
                  });
                }
              }
            }
          });
        }
      });
    });

    if (nearbyPerinthalmannaItems.length > 0) {
      console.log(`Found ${nearbyPerinthalmannaItems.length} Perinthalmanna items created near January:`);
      nearbyPerinthalmannaItems.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.itemName} ${item.groupName ? `(Group: ${item.groupName})` : ''} - Stock: ${item.openingStock} - Created: ${item.createdAt.toLocaleDateString()}`);
      });
    } else {
      console.log("No Perinthalmanna items found outside January 2026 date range.");
    }

    // 5. Check for different warehouse name variations
    console.log("\n5️⃣ CHECKING ALL WAREHOUSE NAME VARIATIONS:");
    console.log("=".repeat(50));
    
    const allItems = await ShoeItem.find({
      'warehouseStocks.openingStock': { $gt: 0 },
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).select('itemName sku warehouseStocks createdAt');

    const warehouseVariations = new Set();
    allItems.forEach(item => {
      item.warehouseStocks.forEach(stock => {
        if (stock.openingStock > 0 && stock.warehouse && 
            (stock.warehouse.toLowerCase().includes('perinth') || 
             stock.warehouse.toLowerCase().includes('manjeri'))) {
          warehouseVariations.add(stock.warehouse);
        }
      });
    });

    console.log("Found these warehouse name variations containing 'perinth' or 'manjeri':");
    Array.from(warehouseVariations).forEach(name => {
      console.log(`- "${name}"`);
    });

    console.log("\n✅ Debug completed!");

  } catch (error) {
    console.error("❌ Error debugging Perinthalmanna opening stock:", error);
  } finally {
    mongoose.connection.close();
  }
}

debugPerinthalmannaOpeningStock();