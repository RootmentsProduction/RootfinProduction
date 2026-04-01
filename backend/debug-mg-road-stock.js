// Debug script to check MG Road stock issue
import mongoose from 'mongoose';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';
import TransferOrder from './model/TransferOrder.js';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/rootfin";
await mongoose.connect(MONGODB_URI);

console.log("🔍 Debugging MG Road stock issue...\n");

// Check recent transfer orders to MG Road
console.log("=== RECENT TRANSFER ORDERS TO MG ROAD ===");
const mgRoadOrders = await TransferOrder.find({
  destinationWarehouse: { $regex: /mg.*road/i },
  status: "transferred"
}).sort({ date: -1 }).limit(5);

console.log(`Found ${mgRoadOrders.length} transferred orders to MG Road:`);
mgRoadOrders.forEach(order => {
  console.log(`- Order ${order.transferOrderNumber}: ${order.sourceWarehouse} → ${order.destinationWarehouse}`);
  console.log(`  Status: ${order.status}, Items: ${order.items?.length || 0}`);
  console.log(`  Date: ${order.date}`);
});

// Check a few items to see their warehouse stocks
console.log("\n=== SAMPLE ITEM WAREHOUSE STOCKS ===");
const sampleItems = await ShoeItem.find({}).limit(3);

for (const item of sampleItems) {
  console.log(`\nItem: ${item.itemName}`);
  console.log(`Warehouses with stock:`);
  
  if (item.warehouseStocks && item.warehouseStocks.length > 0) {
    item.warehouseStocks.forEach(ws => {
      if (ws.stockOnHand > 0) {
        console.log(`  - ${ws.warehouse}: ${ws.stockOnHand} units`);
      }
    });
  } else {
    console.log(`  - No warehouse stocks found`);
  }
}

// Check item groups too
console.log("\n=== SAMPLE ITEM GROUP WAREHOUSE STOCKS ===");
const sampleGroups = await ItemGroup.find({}).limit(2);

for (const group of sampleGroups) {
  console.log(`\nGroup: ${group.name}`);
  
  if (group.items && group.items.length > 0) {
    const firstItem = group.items[0];
    console.log(`  First item: ${firstItem.name}`);
    
    if (firstItem.warehouseStocks && firstItem.warehouseStocks.length > 0) {
      firstItem.warehouseStocks.forEach(ws => {
        if (ws.stockOnHand > 0) {
          console.log(`    - ${ws.warehouse}: ${ws.stockOnHand} units`);
        }
      });
    } else {
      console.log(`    - No warehouse stocks found`);
    }
  }
}

console.log("\n=== WAREHOUSE NAME VARIATIONS ===");
console.log("Looking for all unique warehouse names in the system...");

// Get all unique warehouse names from items
const itemWarehouses = await ShoeItem.aggregate([
  { $unwind: "$warehouseStocks" },
  { $group: { _id: "$warehouseStocks.warehouse" } },
  { $sort: { _id: 1 } }
]);

console.log("\nWarehouse names in ShoeItem collection:");
itemWarehouses.forEach(w => console.log(`  - "${w._id}"`));

// Get all unique warehouse names from item groups
const groupWarehouses = await ItemGroup.aggregate([
  { $unwind: "$items" },
  { $unwind: "$items.warehouseStocks" },
  { $group: { _id: "$items.warehouseStocks.warehouse" } },
  { $sort: { _id: 1 } }
]);

console.log("\nWarehouse names in ItemGroup collection:");
groupWarehouses.forEach(w => console.log(`  - "${w._id}"`));

await mongoose.disconnect();
console.log("\n✅ Debug complete!");