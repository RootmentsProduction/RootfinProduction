import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';
import ItemHistory from './model/ItemHistory.js';

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

async function debugOpeningStockEdits() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rootments');
    console.log("✅ Connected to MongoDB");

    console.log("🔍 DEBUGGING OPENING STOCK EDITS AND MISMATCHES\n");

    // Date range for January 2026
    const startDate = new Date(2026, 0, 1); // January 1, 2026
    const endDate = new Date(2026, 0, 31, 23, 59, 59); // January 31, 2026

    console.log(`📅 Checking period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}\n`);

    // 1. Check ItemHistory for opening stock changes in January 2026
    console.log("1️⃣ CHECKING ITEM HISTORY FOR OPENING STOCK EDITS:");
    console.log("=".repeat(60));

    const openingStockEdits = await ItemHistory.find({
      changedAt: {
        $gte: startDate,
        $lte: endDate
      },
      $or: [
        { details: { $regex: /opening.*stock/i } },
        { details: { $regex: /stock.*opening/i } },
        { changeType: "STOCK_UPDATE" },
        { "oldData.warehouseStocks": { $exists: true } },
        { "newData.warehouseStocks": { $exists: true } }
      ]
    }).sort({ changedAt: 1 });

    console.log(`Found ${openingStockEdits.length} potential opening stock edits in January 2026:`);

    if (openingStockEdits.length > 0) {
      openingStockEdits.forEach((edit, idx) => {
        console.log(`\n${idx + 1}. Edit on ${edit.changedAt.toLocaleDateString()} ${edit.changedAt.toLocaleTimeString()}`);
        console.log(`   Item ID: ${edit.itemId}`);
        console.log(`   Changed by: ${edit.changedBy}`);
        console.log(`   Change type: ${edit.changeType}`);
        console.log(`   Details: ${edit.details}`);
        
        // Check for opening stock changes in old vs new data
        if (edit.oldData && edit.newData) {
          const oldStocks = edit.oldData.warehouseStocks || [];
          const newStocks = edit.newData.warehouseStocks || [];
          
          // Compare opening stocks
          oldStocks.forEach(oldStock => {
            const newStock = newStocks.find(ns => ns.warehouse === oldStock.warehouse);
            if (newStock && oldStock.openingStock !== newStock.openingStock) {
              console.log(`   📦 ${oldStock.warehouse}: ${oldStock.openingStock} → ${newStock.openingStock}`);
            }
          });
        }
      });
    } else {
      console.log("   No opening stock edits found in ItemHistory for January 2026");
    }

    // 2. Check for items with multiple warehouse stock entries (potential duplicates)
    console.log("\n\n2️⃣ CHECKING FOR DUPLICATE WAREHOUSE ENTRIES:");
    console.log("=".repeat(60));

    const itemsWithDuplicates = await ShoeItem.find({
      'warehouseStocks.openingStock': { $gt: 0 },
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).select('itemName sku warehouseStocks createdAt');

    const itemGroupsWithDuplicates = await ItemGroup.find({
      'items.warehouseStocks.openingStock': { $gt: 0 },
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).select('groupName items.name items.sku items.warehouseStocks createdAt');

    let duplicatesFound = 0;

    // Check standalone items
    itemsWithDuplicates.forEach(item => {
      const warehouseCounts = {};
      item.warehouseStocks.forEach(stock => {
        if (stock.openingStock > 0) {
          const normalized = WAREHOUSE_NAME_MAPPING[stock.warehouse] || stock.warehouse;
          warehouseCounts[normalized] = (warehouseCounts[normalized] || 0) + 1;
        }
      });

      Object.entries(warehouseCounts).forEach(([warehouse, count]) => {
        if (count > 1) {
          duplicatesFound++;
          console.log(`⚠️  ${item.itemName} (${item.sku}) has ${count} entries for ${warehouse}`);
          
          // Show all entries for this warehouse
          item.warehouseStocks.forEach(stock => {
            const normalized = WAREHOUSE_NAME_MAPPING[stock.warehouse] || stock.warehouse;
            if (normalized === warehouse && stock.openingStock > 0) {
              console.log(`     - "${stock.warehouse}": ${stock.openingStock} stock`);
            }
          });
        }
      });
    });

    // Check grouped items
    itemGroupsWithDuplicates.forEach(group => {
      group.items.forEach(item => {
        if (item.warehouseStocks) {
          const warehouseCounts = {};
          item.warehouseStocks.forEach(stock => {
            if (stock.openingStock > 0) {
              const normalized = WAREHOUSE_NAME_MAPPING[stock.warehouse] || stock.warehouse;
              warehouseCounts[normalized] = (warehouseCounts[normalized] || 0) + 1;
            }
          });

          Object.entries(warehouseCounts).forEach(([warehouse, count]) => {
            if (count > 1) {
              duplicatesFound++;
              console.log(`⚠️  ${item.name} (Group: ${group.groupName}) has ${count} entries for ${warehouse}`);
              
              // Show all entries for this warehouse
              item.warehouseStocks.forEach(stock => {
                const normalized = WAREHOUSE_NAME_MAPPING[stock.warehouse] || stock.warehouse;
                if (normalized === warehouse && stock.openingStock > 0) {
                  console.log(`     - "${stock.warehouse}": ${stock.openingStock} stock`);
                }
              });
            }
          });
        }
      });
    });

    if (duplicatesFound === 0) {
      console.log("✅ No duplicate warehouse entries found");
    }

    // 3. Check for recent edits to January items (items created in Jan but edited later)
    console.log("\n\n3️⃣ CHECKING FOR RECENT EDITS TO JANUARY ITEMS:");
    console.log("=".repeat(60));

    const recentEdits = await ItemHistory.find({
      changedAt: {
        $gte: new Date(2026, 0, 31), // After January 31, 2026
      },
      $or: [
        { details: { $regex: /opening.*stock/i } },
        { details: { $regex: /stock.*opening/i } },
        { changeType: "STOCK_UPDATE" }
      ]
    }).sort({ changedAt: -1 }).limit(20);

    console.log(`Found ${recentEdits.length} recent opening stock edits (after January):`);

    if (recentEdits.length > 0) {
      for (const edit of recentEdits) {
        // Check if this item was created in January
        const item = await ShoeItem.findOne({ 
          _id: edit.itemId,
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        });

        if (item) {
          console.log(`\n📝 January item edited later:`);
          console.log(`   Item: ${item.itemName} (${item.sku})`);
          console.log(`   Created: ${item.createdAt.toLocaleDateString()}`);
          console.log(`   Edited: ${edit.changedAt.toLocaleDateString()} ${edit.changedAt.toLocaleTimeString()}`);
          console.log(`   Changed by: ${edit.changedBy}`);
          console.log(`   Details: ${edit.details}`);
        }
      }
    }

    // 4. Summary by store
    console.log("\n\n4️⃣ OPENING STOCK SUMMARY BY STORE (JANUARY 2026):");
    console.log("=".repeat(60));

    const storeSummary = {};

    // Process standalone items
    itemsWithDuplicates.forEach(item => {
      item.warehouseStocks.forEach(stock => {
        if (stock.openingStock > 0) {
          const normalized = WAREHOUSE_NAME_MAPPING[stock.warehouse] || stock.warehouse;
          if (!storeSummary[normalized]) {
            storeSummary[normalized] = { items: 0, totalStock: 0 };
          }
          storeSummary[normalized].items += 1;
          storeSummary[normalized].totalStock += stock.openingStock;
        }
      });
    });

    // Process grouped items
    itemGroupsWithDuplicates.forEach(group => {
      group.items.forEach(item => {
        if (item.warehouseStocks) {
          item.warehouseStocks.forEach(stock => {
            if (stock.openingStock > 0) {
              const normalized = WAREHOUSE_NAME_MAPPING[stock.warehouse] || stock.warehouse;
              if (!storeSummary[normalized]) {
                storeSummary[normalized] = { items: 0, totalStock: 0 };
              }
              storeSummary[normalized].items += 1;
              storeSummary[normalized].totalStock += stock.openingStock;
            }
          });
        }
      });
    });

    // Sort by total stock descending
    const sortedStores = Object.entries(storeSummary)
      .sort(([,a], [,b]) => b.totalStock - a.totalStock);

    sortedStores.forEach(([store, data]) => {
      console.log(`🏪 ${store}: ${data.items} items, ${data.totalStock} total stock`);
    });

    console.log("\n✅ Debug completed!");

  } catch (error) {
    console.error("❌ Error in debug:", error);
  } finally {
    await mongoose.connection.close();
  }
}

debugOpeningStockEdits();