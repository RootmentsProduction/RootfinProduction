import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';

dotenv.config();

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
  "WAREHOUSE": "Warehouse",
  "G.Calicut": "Calicut",
  "G.Calicut ": "Calicut",
  "GCalicut": "Calicut",
  "Calicut": "Calicut",
  "G.Manjeri": "Manjery Branch",
  "G.Manjery": "Manjery Branch",
  "GManjeri": "Manjery Branch",
  "GManjery": "Manjery Branch",
  "Manjery Branch": "Manjery Branch",
  "G.Kannur": "Kannur Branch",
  "GKannur": "Kannur Branch",
  "Kannur Branch": "Kannur Branch",
  "G.Edappal": "Edappal Branch",
  "GEdappal": "Edappal Branch",
  "Edappal Branch": "Edappal Branch",
  "G.Edappally": "Edapally Branch",
  "G-Edappally": "Edapally Branch",
  "GEdappally": "Edapally Branch",
  "Edapally Branch": "Edapally Branch",
  "G.Kalpetta": "Kalpetta Branch",
  "GKalpetta": "Kalpetta Branch",
  "Kalpetta Branch": "Kalpetta Branch",
  "G.Kottakkal": "Kottakkal Branch",
  "GKottakkal": "Kottakkal Branch",
  "Kottakkal Branch": "Kottakkal Branch",
  "Z.Kottakkal": "Kottakkal Branch",
  "G.Perinthalmanna": "Perinthalmanna Branch",
  "GPerinthalmanna": "Perinthalmanna Branch",
  "Perinthalmanna Branch": "Perinthalmanna Branch",
  "Z.Perinthalmanna": "Perinthalmanna Branch",
  "G.Chavakkad": "Chavakkad Branch",
  "GChavakkad": "Chavakkad Branch",
  "Chavakkad Branch": "Chavakkad Branch",
  "G.Thrissur": "Thrissur Branch",
  "GThrissur": "Thrissur Branch",
  "Thrissur Branch": "Thrissur Branch"
};

async function debugStockVsOpeningDiscrepancy() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rootments');
    console.log("✅ Connected to MongoDB");

    console.log("🔍 DEBUGGING STOCK SUMMARY vs OPENING STOCK DISCREPANCY\n");

    const normalizeWarehouseName = (name) => {
      if (!name) return "Warehouse";
      return WAREHOUSE_NAME_MAPPING[name.trim()] || name.trim();
    };

    // 1. Calculate CURRENT STOCK SUMMARY (like Inventory Summary report)
    console.log("1️⃣ CURRENT STOCK SUMMARY (Inventory Summary Logic):");
    console.log("=".repeat(70));

    const standaloneItems = await ShoeItem.find({});
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });

    const currentStockByStore = {};
    let totalCurrentItems = 0;
    let totalCurrentStock = 0;

    // Process standalone items
    standaloneItems.forEach(item => {
      if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
        item.warehouseStocks.forEach(ws => {
          const stock = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
          if (stock > 0) {
            const storeName = normalizeWarehouseName(ws.warehouse);
            if (!currentStockByStore[storeName]) {
              currentStockByStore[storeName] = { items: 0, totalStock: 0 };
            }
            currentStockByStore[storeName].items += 1;
            currentStockByStore[storeName].totalStock += stock;
            totalCurrentItems += 1;
            totalCurrentStock += stock;
          }
        });
      }
    });

    // Process grouped items
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach(item => {
          if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
            item.warehouseStocks.forEach(ws => {
              const stock = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
              if (stock > 0) {
                const storeName = normalizeWarehouseName(ws.warehouse);
                if (!currentStockByStore[storeName]) {
                  currentStockByStore[storeName] = { items: 0, totalStock: 0 };
                }
                currentStockByStore[storeName].items += 1;
                currentStockByStore[storeName].totalStock += stock;
                totalCurrentItems += 1;
                totalCurrentStock += stock;
              }
            });
          }
        });
      }
    });

    console.log(`📊 CURRENT STOCK TOTALS:`);
    console.log(`Total Items with Stock: ${totalCurrentItems}`);
    console.log(`Total Current Stock: ${totalCurrentStock}`);

    console.log(`\n📋 BY STORE:`);
    Object.entries(currentStockByStore)
      .sort(([,a], [,b]) => b.totalStock - a.totalStock)
      .forEach(([store, data]) => {
        console.log(`  ${store}: ${data.items} items, ${data.totalStock} stock`);
      });

    // 2. Calculate OPENING STOCK SUMMARY for January 2026
    console.log("\n\n2️⃣ OPENING STOCK SUMMARY - JANUARY 2026:");
    console.log("=".repeat(70));

    const janStartDate = new Date(2026, 0, 1);
    const janEndDate = new Date(2026, 0, 31, 23, 59, 59);

    const janStandaloneItems = await ShoeItem.find({
      'warehouseStocks.openingStock': { $gt: 0 },
      createdAt: { $gte: janStartDate, $lte: janEndDate }
    });

    const janItemGroups = await ItemGroup.find({
      'items.warehouseStocks.openingStock': { $gt: 0 },
      createdAt: { $gte: janStartDate, $lte: janEndDate }
    });

    const janOpeningStockByStore = {};
    let totalJanItems = 0;
    let totalJanStock = 0;

    // Process January standalone items
    janStandaloneItems.forEach(item => {
      if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
        item.warehouseStocks.forEach(ws => {
          const openingStock = parseFloat(ws.openingStock) || 0;
          if (openingStock > 0) {
            const storeName = normalizeWarehouseName(ws.warehouse);
            if (!janOpeningStockByStore[storeName]) {
              janOpeningStockByStore[storeName] = { items: 0, totalStock: 0 };
            }
            janOpeningStockByStore[storeName].items += 1;
            janOpeningStockByStore[storeName].totalStock += openingStock;
            totalJanItems += 1;
            totalJanStock += openingStock;
          }
        });
      }
    });

    // Process January grouped items
    janItemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach(item => {
          if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
            item.warehouseStocks.forEach(ws => {
              const openingStock = parseFloat(ws.openingStock) || 0;
              if (openingStock > 0) {
                const storeName = normalizeWarehouseName(ws.warehouse);
                if (!janOpeningStockByStore[storeName]) {
                  janOpeningStockByStore[storeName] = { items: 0, totalStock: 0 };
                }
                janOpeningStockByStore[storeName].items += 1;
                janOpeningStockByStore[storeName].totalStock += openingStock;
                totalJanItems += 1;
                totalJanStock += openingStock;
              }
            });
          }
        });
      }
    });

    console.log(`📊 JANUARY OPENING STOCK TOTALS:`);
    console.log(`Total Items: ${totalJanItems}`);
    console.log(`Total Opening Stock: ${totalJanStock}`);

    console.log(`\n📋 BY STORE:`);
    Object.entries(janOpeningStockByStore)
      .sort(([,a], [,b]) => b.totalStock - a.totalStock)
      .forEach(([store, data]) => {
        console.log(`  ${store}: ${data.items} items, ${data.totalStock} stock`);
      });

    // 3. Calculate OPENING STOCK SUMMARY for February 2026
    console.log("\n\n3️⃣ OPENING STOCK SUMMARY - FEBRUARY 2026:");
    console.log("=".repeat(70));

    const febStartDate = new Date(2026, 1, 1);
    const febEndDate = new Date(2026, 1, 28, 23, 59, 59);

    const febStandaloneItems = await ShoeItem.find({
      'warehouseStocks.openingStock': { $gt: 0 },
      createdAt: { $gte: febStartDate, $lte: febEndDate }
    });

    const febItemGroups = await ItemGroup.find({
      'items.warehouseStocks.openingStock': { $gt: 0 },
      createdAt: { $gte: febStartDate, $lte: febEndDate }
    });

    const febOpeningStockByStore = {};
    let totalFebItems = 0;
    let totalFebStock = 0;

    // Process February standalone items
    febStandaloneItems.forEach(item => {
      if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
        item.warehouseStocks.forEach(ws => {
          const openingStock = parseFloat(ws.openingStock) || 0;
          if (openingStock > 0) {
            const storeName = normalizeWarehouseName(ws.warehouse);
            if (!febOpeningStockByStore[storeName]) {
              febOpeningStockByStore[storeName] = { items: 0, totalStock: 0 };
            }
            febOpeningStockByStore[storeName].items += 1;
            febOpeningStockByStore[storeName].totalStock += openingStock;
            totalFebItems += 1;
            totalFebStock += openingStock;
          }
        });
      }
    });

    // Process February grouped items
    febItemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach(item => {
          if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
            item.warehouseStocks.forEach(ws => {
              const openingStock = parseFloat(ws.openingStock) || 0;
              if (openingStock > 0) {
                const storeName = normalizeWarehouseName(ws.warehouse);
                if (!febOpeningStockByStore[storeName]) {
                  febOpeningStockByStore[storeName] = { items: 0, totalStock: 0 };
                }
                febOpeningStockByStore[storeName].items += 1;
                febOpeningStockByStore[storeName].totalStock += openingStock;
                totalFebItems += 1;
                totalFebStock += openingStock;
              }
            });
          }
        });
      }
    });

    console.log(`📊 FEBRUARY OPENING STOCK TOTALS:`);
    console.log(`Total Items: ${totalFebItems}`);
    console.log(`Total Opening Stock: ${totalFebStock}`);

    console.log(`\n📋 BY STORE:`);
    Object.entries(febOpeningStockByStore)
      .sort(([,a], [,b]) => b.totalStock - a.totalStock)
      .forEach(([store, data]) => {
        console.log(`  ${store}: ${data.items} items, ${data.totalStock} stock`);
      });

    // 4. COMPARISON AND ANALYSIS
    console.log("\n\n4️⃣ COMPARISON AND DISCREPANCY ANALYSIS:");
    console.log("=".repeat(70));

    const totalOpeningStock = totalJanStock + totalFebStock;
    const totalOpeningItems = totalJanItems + totalFebItems;

    console.log(`📊 SUMMARY COMPARISON:`);
    console.log(`Current Stock Total: ${totalCurrentStock}`);
    console.log(`January Opening Stock: ${totalJanStock}`);
    console.log(`February Opening Stock: ${totalFebStock}`);
    console.log(`Combined Opening Stock: ${totalOpeningStock}`);
    console.log(`Difference: ${totalCurrentStock - totalOpeningStock}`);

    console.log(`\nCurrent Items Total: ${totalCurrentItems}`);
    console.log(`January Opening Items: ${totalJanItems}`);
    console.log(`February Opening Items: ${totalFebItems}`);
    console.log(`Combined Opening Items: ${totalOpeningItems}`);
    console.log(`Item Difference: ${totalCurrentItems - totalOpeningItems}`);

    if (Math.abs(totalCurrentStock - totalOpeningStock) > 0.01) {
      console.log(`\n⚠️  MAJOR DISCREPANCY DETECTED!`);
      console.log(`Stock difference: ${totalCurrentStock - totalOpeningStock}`);
      console.log(`This indicates:`);
      console.log(`- Items created before January 2026 with current stock`);
      console.log(`- Items created after February 2026 with opening stock`);
      console.log(`- Stock additions through purchases/transfers/adjustments`);
      console.log(`- Stock reductions through sales not reflected in opening stock`);
      console.log(`- Data corruption or synchronization issues`);
    }

    // 5. Store-by-store comparison
    console.log(`\n5️⃣ STORE-BY-STORE DISCREPANCY ANALYSIS:`);
    console.log("=".repeat(70));

    const allStores = new Set([
      ...Object.keys(currentStockByStore),
      ...Object.keys(janOpeningStockByStore),
      ...Object.keys(febOpeningStockByStore)
    ]);

    allStores.forEach(store => {
      const currentStock = currentStockByStore[store]?.totalStock || 0;
      const janOpening = janOpeningStockByStore[store]?.totalStock || 0;
      const febOpening = febOpeningStockByStore[store]?.totalStock || 0;
      const totalOpening = janOpening + febOpening;
      const difference = currentStock - totalOpening;

      if (Math.abs(difference) > 0.01) {
        console.log(`\n🏪 ${store}:`);
        console.log(`  Current Stock: ${currentStock}`);
        console.log(`  Jan Opening: ${janOpening}`);
        console.log(`  Feb Opening: ${febOpening}`);
        console.log(`  Total Opening: ${totalOpening}`);
        console.log(`  Difference: ${difference > 0 ? '+' : ''}${difference}`);
        
        if (difference > 0) {
          console.log(`  ↗️  More current stock than opening (purchases/transfers/adjustments)`);
        } else {
          console.log(`  ↘️  Less current stock than opening (sales/transfers out)`);
        }
      }
    });

    // 6. Check for items created outside Jan-Feb 2026
    console.log(`\n6️⃣ ITEMS CREATED OUTSIDE JAN-FEB 2026:`);
    console.log("=".repeat(70));

    const outsideRangeItems = await ShoeItem.find({
      $or: [
        { createdAt: { $lt: janStartDate } },
        { createdAt: { $gt: febEndDate } }
      ]
    }).select('itemName createdAt warehouseStocks');

    const outsideRangeGroups = await ItemGroup.find({
      $or: [
        { createdAt: { $lt: janStartDate } },
        { createdAt: { $gt: febEndDate } }
      ]
    }).select('groupName createdAt items.warehouseStocks');

    let outsideRangeStock = 0;
    let outsideRangeCount = 0;

    outsideRangeItems.forEach(item => {
      if (item.warehouseStocks) {
        item.warehouseStocks.forEach(ws => {
          const stock = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
          if (stock > 0) {
            outsideRangeStock += stock;
            outsideRangeCount++;
          }
        });
      }
    });

    outsideRangeGroups.forEach(group => {
      if (group.items) {
        group.items.forEach(item => {
          if (item.warehouseStocks) {
            item.warehouseStocks.forEach(ws => {
              const stock = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
              if (stock > 0) {
                outsideRangeStock += stock;
                outsideRangeCount++;
              }
            });
          }
        });
      }
    });

    console.log(`Items created outside Jan-Feb 2026 with current stock:`);
    console.log(`Count: ${outsideRangeCount}`);
    console.log(`Total Stock: ${outsideRangeStock}`);

    if (outsideRangeStock > 0) {
      console.log(`\n💡 This explains part of the discrepancy!`);
      console.log(`Items created before January or after February have current stock`);
      console.log(`but are not included in Jan+Feb opening stock totals.`);
    }

    console.log("\n✅ Analysis completed!");

  } catch (error) {
    console.error("❌ Error in analysis:", error);
  } finally {
    await mongoose.connection.close();
  }
}

debugStockVsOpeningDiscrepancy();