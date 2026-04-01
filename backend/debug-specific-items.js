// Debug script to check specific items showing in the UI
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models
import ShoeItem from "./model/ShoeItem.js";
import ItemGroup from "./model/ItemGroup.js";

// Connect to database
const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_DEV;
console.log("🔗 Connecting to MongoDB...");

try {
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB successfully");
} catch (error) {
  console.error("❌ MongoDB connection failed:", error.message);
  process.exit(1);
}

async function debugSpecificItems() {
  try {
    console.log("🔍 Debugging specific items from UI...");
    
    // Look for "Abhi" items that appear in the UI
    console.log("\n📦 Searching for 'Abhi' items...");
    
    // Check standalone items first
    const standaloneAbhiItems = await ShoeItem.find({
      itemName: { $regex: /abhi/i }
    }).select('itemName sku warehouseStocks');
    
    console.log(`📋 Standalone 'Abhi' items: ${standaloneAbhiItems.length} found`);
    standaloneAbhiItems.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.itemName} (${item.sku})`);
      if (item.warehouseStocks && item.warehouseStocks.length > 0) {
        item.warehouseStocks.forEach((ws, wsIdx) => {
          console.log(`    Warehouse ${wsIdx + 1}: ${ws.warehouse} - Opening: ${ws.openingStock || 0}, Current: ${ws.stockOnHand || 0}`);
        });
      } else {
        console.log(`    ❌ No warehouse stocks`);
      }
    });
    
    // Check item groups
    const abhiGroups = await ItemGroup.find({
      $or: [
        { name: { $regex: /abhi/i } },
        { 'items.name': { $regex: /abhi/i } }
      ]
    }).select('name items');
    
    console.log(`\n📋 'Abhi' item groups: ${abhiGroups.length} found`);
    abhiGroups.forEach((group, idx) => {
      console.log(`  ${idx + 1}. Group: ${group.name}`);
      if (group.items && group.items.length > 0) {
        group.items.forEach((item, itemIdx) => {
          if (item.name && item.name.toLowerCase().includes('abhi')) {
            console.log(`    Item ${itemIdx + 1}: ${item.name} (${item.sku || 'No SKU'})`);
            if (item.warehouseStocks && item.warehouseStocks.length > 0) {
              item.warehouseStocks.forEach((ws, wsIdx) => {
                console.log(`      Warehouse ${wsIdx + 1}: ${ws.warehouse} - Opening: ${ws.openingStock || 0}, Current: ${ws.stockOnHand || 0}`);
              });
            } else {
              console.log(`      ❌ No warehouse stocks`);
            }
          }
        });
      }
    });
    
    // Look for items with SKUs that match what we see in UI
    console.log("\n📦 Searching for items with SKUs: ABH, ABH BL, ABH BL1...");
    
    const skusToCheck = ['ABH', 'ABH BL', 'ABH BL1', 'ABH BL.'];
    
    for (const sku of skusToCheck) {
      console.log(`\n🔍 Checking SKU: "${sku}"`);
      
      // Check standalone items
      const standaloneItem = await ShoeItem.findOne({ sku: sku });
      if (standaloneItem) {
        console.log(`  ✅ Found standalone item: ${standaloneItem.itemName}`);
        if (standaloneItem.warehouseStocks && standaloneItem.warehouseStocks.length > 0) {
          standaloneItem.warehouseStocks.forEach((ws, wsIdx) => {
            console.log(`    Warehouse ${wsIdx + 1}: ${ws.warehouse} - Opening: ${ws.openingStock || 0}, Current: ${ws.stockOnHand || 0}`);
          });
        }
      }
      
      // Check item groups
      const groupsWithSku = await ItemGroup.find({
        'items.sku': sku
      });
      
      if (groupsWithSku.length > 0) {
        console.log(`  ✅ Found in ${groupsWithSku.length} item groups`);
        groupsWithSku.forEach((group, groupIdx) => {
          console.log(`    Group ${groupIdx + 1}: ${group.name}`);
          const matchingItems = group.items.filter(item => item.sku === sku);
          matchingItems.forEach((item, itemIdx) => {
            console.log(`      Item: ${item.name}`);
            if (item.warehouseStocks && item.warehouseStocks.length > 0) {
              item.warehouseStocks.forEach((ws, wsIdx) => {
                console.log(`        Warehouse ${wsIdx + 1}: ${ws.warehouse} - Opening: ${ws.openingStock || 0}, Current: ${ws.stockOnHand || 0}`);
              });
            } else {
              console.log(`        ❌ No warehouse stocks`);
            }
          });
        });
      }
      
      if (!standaloneItem && groupsWithSku.length === 0) {
        console.log(`  ❌ No items found with SKU: "${sku}"`);
      }
    }
    
    // Check warehouse names that might be causing issues
    console.log("\n🏪 Checking all unique warehouse names in the database...");
    
    const allStandaloneItems = await ShoeItem.find({}).select('warehouseStocks');
    const allGroups = await ItemGroup.find({}).select('items.warehouseStocks');
    
    const warehouseNames = new Set();
    
    // Collect from standalone items
    allStandaloneItems.forEach(item => {
      if (item.warehouseStocks) {
        item.warehouseStocks.forEach(ws => {
          if (ws.warehouse) {
            warehouseNames.add(ws.warehouse);
          }
        });
      }
    });
    
    // Collect from group items
    allGroups.forEach(group => {
      if (group.items) {
        group.items.forEach(item => {
          if (item.warehouseStocks) {
            item.warehouseStocks.forEach(ws => {
              if (ws.warehouse) {
                warehouseNames.add(ws.warehouse);
              }
            });
          }
        });
      }
    });
    
    console.log("📋 All warehouse names found:");
    Array.from(warehouseNames).sort().forEach((name, idx) => {
      console.log(`  ${idx + 1}. "${name}"`);
    });
    
    // Check for corrupted warehouse names
    const corruptedNames = Array.from(warehouseNames).filter(name => 
      name.startsWith('-') || name.includes('arehouse') || name.length < 3
    );
    
    if (corruptedNames.length > 0) {
      console.log("\n⚠️ Potentially corrupted warehouse names found:");
      corruptedNames.forEach((name, idx) => {
        console.log(`  ${idx + 1}. "${name}" (looks corrupted)`);
      });
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error);
  } finally {
    mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

debugSpecificItems();