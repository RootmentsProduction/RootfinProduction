// Test script to verify inventory adjustment stock updates
import mongoose from "mongoose";
import ShoeItem from "./model/ShoeItem.js";
import ItemGroup from "./model/ItemGroup.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/your-database";

async function testInventoryAdjustment() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // List all items to see what's available
    console.log("Listing all standalone items:");
    const standaloneItems = await ShoeItem.find({}).limit(5);
    console.log(`Found ${standaloneItems.length} standalone items`);
    standaloneItems.forEach(item => {
      console.log(`  - ${item.itemName} (ID: ${item._id})`);
      if (item.warehouseStocks && item.warehouseStocks.length > 0) {
        item.warehouseStocks.forEach(ws => {
          console.log(`    ${ws.warehouse}: ${ws.stockOnHand || 0}`);
        });
      }
    });
    
    console.log("\nListing all item groups:");
    const groups = await ItemGroup.find({}).limit(5);
    console.log(`Found ${groups.length} item groups`);
    groups.forEach(group => {
      console.log(`  - ${group.name} (${group.items?.length || 0} items)`);
      if (group.items && group.items.length > 0) {
        group.items.slice(0, 2).forEach(item => {
          console.log(`    - ${item.name}`);
          if (item.warehouseStocks && item.warehouseStocks.length > 0) {
            item.warehouseStocks.forEach(ws => {
              console.log(`      ${ws.warehouse}: ${ws.stockOnHand || 0}`);
            });
          }
        });
      }
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

testInventoryAdjustment();
