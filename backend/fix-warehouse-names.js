/**
 * Fix dirty warehouse names in MongoDB
 * Merges duplicate/misspelled warehouse entries into canonical names
 * Run: node fix-warehouse-names.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });

const MONGODB_URI = process.env.MONGODB_URI;

const ShoeItemSchema = new mongoose.Schema({ itemName: String, sku: String, warehouseStocks: Array }, { strict: false });
const ItemGroupSchema = new mongoose.Schema({ name: String, items: Array, isActive: Boolean }, { strict: false });
const ShoeItem = mongoose.model("ShoeItem", ShoeItemSchema);
const ItemGroup = mongoose.model("ItemGroup", ItemGroupSchema);

// Map bad names -> canonical name
const NAME_FIX_MAP = {
  "arehouse Branch":    "Warehouse",
  "Grooms Trivandum":   "Grooms Trivandrum",
  "SuitorGuy MG Road":  "MG Road",
  "-Kalpetta Branch":   "Kalpetta Branch",
  "-Kannur Branch":     "Kannur Branch",
  "G.Kottayam Branch":  "Kottayam Branch",
};

/**
 * Merge warehouseStocks array:
 * - Rename bad entries to canonical name
 * - If canonical already exists, add stock values together and remove the bad entry
 */
function mergeWarehouseStocks(warehouseStocks) {
  if (!warehouseStocks || !Array.isArray(warehouseStocks)) return { stocks: warehouseStocks, changed: false };

  let changed = false;
  const result = [...warehouseStocks.map(ws => ({ ...ws }))];

  for (const [badName, canonicalName] of Object.entries(NAME_FIX_MAP)) {
    const badIdx = result.findIndex(ws => ws.warehouse === badName);
    if (badIdx === -1) continue;

    changed = true;
    const canonicalIdx = result.findIndex(ws => ws.warehouse === canonicalName);

    if (canonicalIdx === -1) {
      // Just rename
      result[badIdx].warehouse = canonicalName;
      console.log(`    rename: "${badName}" -> "${canonicalName}"`);
    } else {
      // Merge stock into canonical, remove bad entry
      const bad = result[badIdx];
      const canon = result[canonicalIdx];
      const fields = ["stockOnHand", "openingStock", "committedStock", "availableForSale",
                      "physicalStockOnHand", "physicalOpeningStock", "physicalCommittedStock", "physicalAvailableForSale"];
      for (const f of fields) {
        canon[f] = (parseFloat(canon[f]) || 0) + (parseFloat(bad[f]) || 0);
      }
      result.splice(badIdx, 1);
      console.log(`    merge: "${badName}" (stock: ${bad.stockOnHand || 0}) into "${canonicalName}" (new stock: ${canon.stockOnHand})`);
    }
  }

  return { stocks: result, changed };
}

async function fixStandaloneItems() {
  const items = await ShoeItem.find({});
  let fixedCount = 0;

  for (const item of items) {
    const { stocks, changed } = mergeWarehouseStocks(item.warehouseStocks);
    if (changed) {
      console.log(`\n📦 Standalone: "${item.itemName}" (${item.sku})`);
      await ShoeItem.updateOne({ _id: item._id }, { $set: { warehouseStocks: stocks } });
      fixedCount++;
    }
  }
  console.log(`\n✅ Fixed ${fixedCount} standalone items`);
}

async function fixGroupItems() {
  const groups = await ItemGroup.find({});
  let fixedGroups = 0;

  for (const group of groups) {
    if (!group.items || !Array.isArray(group.items)) continue;

    let groupChanged = false;
    const updatedItems = group.items.map(item => {
      const { stocks, changed } = mergeWarehouseStocks(item.warehouseStocks);
      if (changed) {
        groupChanged = true;
        console.log(`\n📦 Group "${group.name}" -> item "${item.name}" (${item.sku})`);
        return { ...item, warehouseStocks: stocks };
      }
      return item;
    });

    if (groupChanged) {
      await ItemGroup.updateOne({ _id: group._id }, { $set: { items: updatedItems } });
      fixedGroups++;
    }
  }
  console.log(`✅ Fixed ${fixedGroups} item groups`);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB\n");
  console.log("🔧 Fixing dirty warehouse names...\n");

  await fixStandaloneItems();
  await fixGroupItems();

  console.log("\n🎉 Done. Re-run verify-stock-count.js to confirm.");
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
