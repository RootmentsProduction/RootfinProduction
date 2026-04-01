/**
 * Test script to verify stock reduction when selling full quantity
 * This tests the specific issue where selling all 20 items shows 20 instead of 0
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import ShoeItem from "./model/ShoeItem.js";
import ItemGroup from "./model/ItemGroup.js";
import { updateStockOnInvoiceCreate } from "./utils/stockManagement.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/your-database";

async function testFullQuantityStockReduction() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Test Case 1: Find an item with stock in Perinthalmanna Branch
    console.log("=== TEST CASE 1: Full Quantity Reduction ===\n");
    
    const testItem = await ShoeItem.findOne({
      "warehouseStocks": {
        $elemMatch: {
          warehouse: { $regex: /perinthalmanna/i },
          stockOnHand: { $gt: 0 }
        }
      }
    });

    if (!testItem) {
      console.log("❌ No test item found with stock in Perinthalmanna Branch");
      console.log("💡 Trying to find item from group...\n");
      
      // Try finding from item group
      const testGroup = await ItemGroup.findOne({
        "items.warehouseStocks": {
          $elemMatch: {
            warehouse: { $regex: /perinthalmanna/i },
            stockOnHand: { $gt: 0 }
          }
        }
      });
      
      if (!testGroup) {
        console.log("❌ No test group found either");
        await mongoose.disconnect();
        return;
      }
      
      const testGroupItem = testGroup.items.find(item => 
        item.warehouseStocks?.some(ws => 
          ws.warehouse.toLowerCase().includes("perinthalmanna") && ws.stockOnHand > 0
        )
      );
      
      if (!testGroupItem) {
        console.log("❌ No suitable item found in group");
        await mongoose.disconnect();
        return;
      }
      
      const warehouseStock = testGroupItem.warehouseStocks.find(ws => 
        ws.warehouse.toLowerCase().includes("perinthalmanna")
      );
      
      console.log(`📦 Found test item in group: ${testGroupItem.name}`);
      console.log(`   Group: ${testGroup.name}`);
      console.log(`   Current stock: ${warehouseStock.stockOnHand}`);
      console.log(`   Warehouse: ${warehouseStock.warehouse}\n`);
      
      const currentStock = warehouseStock.stockOnHand;
      
      // Test selling FULL quantity
      console.log(`🧪 TEST: Selling FULL quantity (${currentStock} items)...\n`);
      
      const lineItems = [{
        item: testGroupItem.name,
        quantity: currentStock,
        itemData: {
          _id: testGroupItem._id,
          itemName: testGroupItem.name,
          name: testGroupItem.name,
          sku: testGroupItem.sku,
          itemGroupId: testGroup._id
        },
        itemGroupId: testGroup._id
      }];
      
      await updateStockOnInvoiceCreate(lineItems, "Perinthalmanna Branch");
      
      // Verify the result
      const verifyGroup = await ItemGroup.findById(testGroup._id);
      const verifyItem = verifyGroup.items.find(item => 
        item._id.toString() === testGroupItem._id.toString()
      );
      const verifyWarehouseStock = verifyItem.warehouseStocks.find(ws => 
        ws.warehouse.toLowerCase().includes("perinthalmanna")
      );
      
      console.log(`\n📊 VERIFICATION RESULTS:`);
      console.log(`   Original stock: ${currentStock}`);
      console.log(`   Quantity sold: ${currentStock}`);
      console.log(`   Expected stock: 0`);
      console.log(`   Actual stock: ${verifyWarehouseStock.stockOnHand}`);
      console.log(`   Available for sale: ${verifyWarehouseStock.availableForSale}`);
      
      if (verifyWarehouseStock.stockOnHand === 0) {
        console.log(`\n✅ TEST PASSED! Stock correctly reduced to 0`);
      } else {
        console.log(`\n❌ TEST FAILED! Stock should be 0 but is ${verifyWarehouseStock.stockOnHand}`);
      }
      
      // Restore the stock
      console.log(`\n🔄 Restoring original stock...`);
      verifyWarehouseStock.stockOnHand = currentStock;
      verifyWarehouseStock.availableForSale = currentStock;
      verifyGroup.markModified('items');
      await verifyGroup.save();
      console.log(`✅ Stock restored to ${currentStock}\n`);
      
    } else {
      // Standalone item test
      const warehouseStock = testItem.warehouseStocks.find(ws => 
        ws.warehouse.toLowerCase().includes("perinthalmanna")
      );
      
      console.log(`📦 Found test item: ${testItem.itemName}`);
      console.log(`   Current stock: ${warehouseStock.stockOnHand}`);
      console.log(`   Warehouse: ${warehouseStock.warehouse}\n`);
      
      const currentStock = warehouseStock.stockOnHand;
      
      // Test selling FULL quantity
      console.log(`🧪 TEST: Selling FULL quantity (${currentStock} items)...\n`);
      
      const lineItems = [{
        item: testItem.itemName,
        quantity: currentStock,
        itemData: {
          _id: testItem._id,
          itemName: testItem.itemName,
          name: testItem.itemName
        }
      }];
      
      await updateStockOnInvoiceCreate(lineItems, "Perinthalmanna Branch");
      
      // Verify the result
      const verifyItem = await ShoeItem.findById(testItem._id);
      const verifyWarehouseStock = verifyItem.warehouseStocks.find(ws => 
        ws.warehouse.toLowerCase().includes("perinthalmanna")
      );
      
      console.log(`\n📊 VERIFICATION RESULTS:`);
      console.log(`   Original stock: ${currentStock}`);
      console.log(`   Quantity sold: ${currentStock}`);
      console.log(`   Expected stock: 0`);
      console.log(`   Actual stock: ${verifyWarehouseStock.stockOnHand}`);
      console.log(`   Available for sale: ${verifyWarehouseStock.availableForSale}`);
      
      if (verifyWarehouseStock.stockOnHand === 0) {
        console.log(`\n✅ TEST PASSED! Stock correctly reduced to 0`);
      } else {
        console.log(`\n❌ TEST FAILED! Stock should be 0 but is ${verifyWarehouseStock.stockOnHand}`);
      }
      
      // Restore the stock
      console.log(`\n🔄 Restoring original stock...`);
      verifyWarehouseStock.stockOnHand = currentStock;
      verifyWarehouseStock.availableForSale = currentStock;
      verifyItem.markModified('warehouseStocks');
      await verifyItem.save();
      console.log(`✅ Stock restored to ${currentStock}\n`);
    }

    console.log("=== TEST COMPLETE ===\n");
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    
  } catch (error) {
    console.error("❌ Test error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testFullQuantityStockReduction();
