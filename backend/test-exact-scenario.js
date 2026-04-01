/**
 * Test the exact scenario: Testing 635 - green/30 with 10 items
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import ItemGroup from "./model/ItemGroup.js";
import { updateStockOnInvoiceCreate } from "./utils/stockManagement.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/your-database";

async function testExactScenario() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find the exact item: Testing 635 - green/30
    console.log("=== TESTING: Testing 635 - green/30 ===\n");
    
    const group = await ItemGroup.findOne({
      $or: [
        { name: /Testing 635/i },
        { "items.sku": /TES-635-GR30/i }
      ]
    });
    
    if (!group) {
      console.log("❌ Group not found");
      await mongoose.disconnect();
      return;
    }
    
    console.log(`📦 Found group: ${group.name} (ID: ${group._id})\n`);
    
    // Find the specific item
    const item = group.items.find(i => 
      i.sku === "TES-635-GR30" || 
      (i.name && i.name.includes("green") && i.name.includes("30"))
    );
    
    if (!item) {
      console.log("❌ Item not found in group");
      await mongoose.disconnect();
      return;
    }
    
    console.log(`📦 Found item: ${item.name}`);
    console.log(`   SKU: ${item.sku}`);
    console.log(`   Item ID: ${item._id}\n`);
    
    // Show current stock
    console.log("📊 Current Stock:");
    item.warehouseStocks?.forEach(ws => {
      console.log(`   ${ws.warehouse}: ${ws.stockOnHand} (Available: ${ws.availableForSale})`);
    });
    
    // Find Perinthalmanna stock
    const perinthalmannaStock = item.warehouseStocks?.find(ws => 
      ws.warehouse.toLowerCase().includes("perinthalmanna")
    );
    
    if (!perinthalmannaStock) {
      console.log("\n❌ No Perinthalmanna stock found");
      await mongoose.disconnect();
      return;
    }
    
    const currentStock = perinthalmannaStock.stockOnHand;
    console.log(`\n🎯 Current Perinthalmanna stock: ${currentStock}`);
    
    if (currentStock === 0) {
      console.log("⚠️ Stock is already 0, cannot test reduction");
      await mongoose.disconnect();
      return;
    }
    
    // Test selling ALL items
    console.log(`\n🧪 TEST: Selling ALL ${currentStock} items...\n`);
    
    const lineItems = [{
      item: item.name,
      quantity: currentStock,
      itemData: {
        _id: item._id,
        itemName: item.name,
        name: item.name,
        sku: item.sku,
        itemGroupId: group._id
      },
      itemGroupId: group._id,
      itemSku: item.sku
    }];
    
    console.log("📦 Line item:", JSON.stringify(lineItems[0], null, 2));
    console.log("\n🔄 Calling updateStockOnInvoiceCreate...\n");
    
    await updateStockOnInvoiceCreate(lineItems, "Perinthalmanna Branch");
    
    // Verify the result
    console.log("\n🔍 Verifying result...\n");
    const verifyGroup = await ItemGroup.findById(group._id);
    const verifyItem = verifyGroup.items.find(i => i._id.toString() === item._id.toString());
    const verifyStock = verifyItem.warehouseStocks?.find(ws => 
      ws.warehouse.toLowerCase().includes("perinthalmanna")
    );
    
    console.log("📊 VERIFICATION RESULTS:");
    console.log(`   Original stock: ${currentStock}`);
    console.log(`   Quantity sold: ${currentStock}`);
    console.log(`   Expected stock: 0`);
    console.log(`   Actual stock: ${verifyStock.stockOnHand}`);
    console.log(`   Available for sale: ${verifyStock.availableForSale}`);
    
    if (verifyStock.stockOnHand === 0) {
      console.log(`\n✅ TEST PASSED! Stock correctly reduced to 0`);
    } else {
      console.log(`\n❌ TEST FAILED! Stock should be 0 but is ${verifyStock.stockOnHand}`);
      console.log(`\n🔍 Debugging info:`);
      console.log(`   Type of stockOnHand: ${typeof verifyStock.stockOnHand}`);
      console.log(`   Type of availableForSale: ${typeof verifyStock.availableForSale}`);
      console.log(`   stockOnHand === 0: ${verifyStock.stockOnHand === 0}`);
      console.log(`   stockOnHand == 0: ${verifyStock.stockOnHand == 0}`);
      console.log(`   parseFloat(stockOnHand): ${parseFloat(verifyStock.stockOnHand)}`);
    }
    
    // Restore the stock
    console.log(`\n🔄 Restoring original stock...`);
    verifyStock.stockOnHand = currentStock;
    verifyStock.availableForSale = currentStock;
    verifyGroup.markModified('items');
    await verifyGroup.save();
    console.log(`✅ Stock restored to ${currentStock}\n`);

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    
  } catch (error) {
    console.error("❌ Test error:", error);
    console.error("Stack:", error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testExactScenario();
