/**
 * Check actual stock in database for debugging
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import ShoeItem from "./model/ShoeItem.js";
import ItemGroup from "./model/ItemGroup.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/your-database";

async function checkActualStock() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Check the specific item mentioned in the logs: Shoe Formal 1003 - 7/Brown
    console.log("=== CHECKING: Shoe Formal 1003 - 7/Brown ===\n");
    
    // First, try to find it as a standalone item
    const standaloneItem = await ShoeItem.findOne({
      $or: [
        { itemName: /Shoe Formal 1003.*7.*Brown/i },
        { sku: /BRF7-1003/i }
      ]
    });
    
    if (standaloneItem) {
      console.log("📦 Found as STANDALONE item:");
      console.log(`   ID: ${standaloneItem._id}`);
      console.log(`   Name: ${standaloneItem.itemName}`);
      console.log(`   SKU: ${standaloneItem.sku}`);
      console.log(`\n   Warehouse Stocks:`);
      standaloneItem.warehouseStocks?.forEach(ws => {
        console.log(`     - ${ws.warehouse}: ${ws.stockOnHand} (Available: ${ws.availableForSale})`);
      });
    } else {
      console.log("❌ Not found as standalone item");
    }
    
    // Try to find it in item groups
    console.log("\n🔍 Searching in item groups...\n");
    
    const groups = await ItemGroup.find({
      $or: [
        { "items.name": /Shoe Formal 1003.*7.*Brown/i },
        { "items.sku": /BRF7-1003/i },
        { name: /Shoe Formal 1003/i }
      ]
    });
    
    if (groups.length > 0) {
      console.log(`📦 Found in ${groups.length} group(s):\n`);
      
      groups.forEach(group => {
        console.log(`   Group: ${group.name} (ID: ${group._id})`);
        
        const matchingItems = group.items.filter(item => 
          item.name?.includes("7") && item.name?.includes("Brown") ||
          item.sku?.includes("BRF7-1003")
        );
        
        matchingItems.forEach(item => {
          console.log(`\n   Item: ${item.name}`);
          console.log(`   SKU: ${item.sku}`);
          console.log(`   Item ID: ${item._id}`);
          console.log(`   Warehouse Stocks:`);
          item.warehouseStocks?.forEach(ws => {
            console.log(`     - ${ws.warehouse}: ${ws.stockOnHand} (Available: ${ws.availableForSale})`);
          });
        });
      });
    } else {
      console.log("❌ Not found in any item groups");
    }
    
    // Now check ALL items in Perinthalmanna Branch with stock
    console.log("\n\n=== ALL ITEMS IN PERINTHALMANNA BRANCH ===\n");
    
    const itemsWithStock = await ItemGroup.find({
      "items.warehouseStocks": {
        $elemMatch: {
          warehouse: { $regex: /perinthalmanna/i },
          stockOnHand: { $gt: 0 }
        }
      }
    }).limit(5);
    
    console.log(`Found ${itemsWithStock.length} groups with stock in Perinthalmanna:\n`);
    
    itemsWithStock.forEach(group => {
      console.log(`Group: ${group.name}`);
      group.items.forEach(item => {
        const perinthalmannaStock = item.warehouseStocks?.find(ws => 
          ws.warehouse.toLowerCase().includes("perinthalmanna")
        );
        if (perinthalmannaStock && perinthalmannaStock.stockOnHand > 0) {
          console.log(`  - ${item.name}: ${perinthalmannaStock.stockOnHand} (${perinthalmannaStock.warehouse})`);
        }
      });
      console.log("");
    });

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkActualStock();
