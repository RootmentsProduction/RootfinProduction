import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import PurchaseReceive from "./model/PurchaseReceive.js";
import ShoeItem from "./model/ShoeItem.js";

// Load environment variables
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

const MONGODB_URI = process.env.MONGODB_URI_DEV || process.env.MONGODB_URI || "mongodb://localhost:27017/rootfin_dev";

async function testStockUpdate() {
  try {
    console.log("🔍 Testing Purchase Receive Stock Update...\n");
    
    // Connect to MongoDB
    console.log("📊 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");
    
    // Find a purchase receive with status "received"
    console.log("🔍 Finding a purchase receive with status 'received'...");
    const purchaseReceive = await PurchaseReceive.findOne({ status: "received" })
      .populate("items.itemId");
    
    if (!purchaseReceive) {
      console.log("❌ No purchase receive with status 'received' found.");
      console.log("   Please create a purchase receive first.");
      await mongoose.disconnect();
      return;
    }
    
    console.log(`✅ Found purchase receive: ${purchaseReceive.receiveNumber}`);
    console.log(`   ID: ${purchaseReceive._id}`);
    console.log(`   Status: ${purchaseReceive.status}`);
    console.log(`   Items count: ${purchaseReceive.items.length}\n`);
    
    // Get the first item from the purchase receive
    if (purchaseReceive.items.length === 0) {
      console.log("❌ Purchase receive has no items.");
      await mongoose.disconnect();
      return;
    }
    
    const firstItem = purchaseReceive.items[0];
    const itemId = firstItem.itemId?._id || firstItem.itemId;
    
    if (!itemId) {
      console.log("❌ First item has no itemId.");
      await mongoose.disconnect();
      return;
    }
    
    console.log(`📦 Testing with item:`);
    console.log(`   Item ID: ${itemId}`);
    console.log(`   Item Name: ${firstItem.itemName || 'N/A'}`);
    console.log(`   Current Received Qty: ${firstItem.received}\n`);
    
    // Get current stock for this item
    const shoeItem = await ShoeItem.findById(itemId);
    if (!shoeItem) {
      console.log(`❌ Item with ID ${itemId} not found in database.`);
      await mongoose.disconnect();
      return;
    }
    
    console.log(`📊 Current Stock Information:`);
    const warehouseStock = shoeItem.warehouseStocks?.find(ws => 
      ws.warehouse === "Warehouse" || 
      ws.warehouse === "Main Warehouse" ||
      !ws.warehouse
    ) || shoeItem.warehouseStocks?.[0];
    
    if (warehouseStock) {
      console.log(`   Warehouse: ${warehouseStock.warehouse || 'N/A'}`);
      console.log(`   Stock On Hand: ${warehouseStock.stockOnHand || 0}`);
      console.log(`   Available for Sale: ${warehouseStock.availableForSale || 0}`);
      console.log(`   Physical Stock On Hand: ${warehouseStock.physicalStockOnHand || 0}`);
    } else {
      console.log(`   No warehouse stock found`);
    }
    
    const currentStock = warehouseStock?.stockOnHand || 0;
    const oldReceivedQty = parseFloat(firstItem.received) || 0;
    const newReceivedQty = oldReceivedQty + 10; // Increase by 10 for testing
    
    console.log(`\n🔄 Simulating stock update:`);
    console.log(`   Old received qty: ${oldReceivedQty}`);
    console.log(`   New received qty: ${newReceivedQty}`);
    console.log(`   Difference: +${newReceivedQty - oldReceivedQty}`);
    console.log(`   Current stock: ${currentStock}`);
    console.log(`   Expected new stock: ${currentStock + (newReceivedQty - oldReceivedQty)}\n`);
    
    // Update the purchase receive item
    const updatedItems = purchaseReceive.items.map(item => {
      if ((item.itemId?._id || item.itemId)?.toString() === itemId.toString()) {
        return {
          ...item.toObject(),
          received: newReceivedQty
        };
      }
      return item.toObject();
    });
    
    // Simulate the update
    console.log("🔄 Updating purchase receive...");
    const updateData = {
      ...purchaseReceive.toObject(),
      items: updatedItems,
      status: "received"
    };
    
    // Get old purchase receive data
    const oldPurchaseReceive = await PurchaseReceive.findById(purchaseReceive._id);
    const oldStatus = oldPurchaseReceive.status;
    const newStatus = updateData.status;
    const oldItems = oldPurchaseReceive.items || [];
    const newItems = updateData.items || [];
    
    console.log(`   Old status: ${oldStatus}, New status: ${newStatus}`);
    console.log(`   Old items count: ${oldItems.length}, New items count: ${newItems.length}\n`);
    
    // Simulate stock update logic
    if (newStatus === "received" && newItems && newItems.length > 0) {
      console.log("🔄 Processing stock update...\n");
      
      for (const newItem of newItems) {
        let itemIdValue = newItem.itemId?._id || newItem.itemId || null;
        
        if (itemIdValue && typeof itemIdValue === 'object' && itemIdValue.toString) {
          itemIdValue = itemIdValue.toString();
        }
        
        if (!itemIdValue) {
          console.log(`⚠️ Skipping item - no itemId`);
          continue;
        }
        
        // Find old item
        let oldItem = null;
        const newItemIdStr = itemIdValue?.toString();
        
        for (const oi of oldItems) {
          let oldItemId = null;
          if (oi.itemId) {
            if (oi.itemId._id) {
              oldItemId = oi.itemId._id.toString();
            } else if (typeof oi.itemId === 'object' && oi.itemId.toString) {
              oldItemId = oi.itemId.toString();
            } else {
              oldItemId = String(oi.itemId);
            }
          }
          
          if (oldItemId === newItemIdStr) {
            oldItem = oi;
            break;
          }
        }
        
        const oldReceivedQty = oldStatus === "received" ? (parseFloat(oldItem?.received) || 0) : 0;
        const newReceivedQty = parseFloat(newItem.received) || 0;
        const qtyDifference = newReceivedQty - oldReceivedQty;
        
        console.log(`📦 Processing item ${itemIdValue} (${newItem.itemName || 'Unknown'}):`);
        console.log(`   Old item found: ${oldItem ? 'Yes' : 'No'}`);
        console.log(`   Old received qty: ${oldReceivedQty}, New received qty: ${newReceivedQty}`);
        console.log(`   Quantity difference: ${qtyDifference}`);
        
        if (newStatus === "received" && newReceivedQty > 0) {
          const testItem = await ShoeItem.findById(itemIdValue);
          if (testItem) {
            const defaultWarehouseName = "Warehouse";
            
            if (!testItem.warehouseStocks || testItem.warehouseStocks.length === 0) {
              console.log(`   Creating new warehouse stock entry`);
              testItem.warehouseStocks = [{
                warehouse: defaultWarehouseName,
                openingStock: 0,
                openingStockValue: 0,
                stockOnHand: newReceivedQty,
                committedStock: 0,
                availableForSale: newReceivedQty,
                physicalOpeningStock: 0,
                physicalStockOnHand: newReceivedQty,
                physicalCommittedStock: 0,
                physicalAvailableForSale: newReceivedQty,
              }];
            } else {
              let warehouseStock = testItem.warehouseStocks.find(ws => 
                ws.warehouse === defaultWarehouseName || 
                ws.warehouse === "Main Warehouse" ||
                !ws.warehouse
              );
              
              if (!warehouseStock) {
                warehouseStock = {
                  warehouse: defaultWarehouseName,
                  openingStock: 0,
                  openingStockValue: 0,
                  stockOnHand: 0,
                  committedStock: 0,
                  availableForSale: 0,
                  physicalOpeningStock: 0,
                  physicalStockOnHand: 0,
                  physicalCommittedStock: 0,
                  physicalAvailableForSale: 0,
                };
                testItem.warehouseStocks.push(warehouseStock);
              }
              
              const currentStockOnHand = parseFloat(warehouseStock.stockOnHand) || 0;
              const currentAvailableForSale = parseFloat(warehouseStock.availableForSale) || 0;
              const currentPhysicalStockOnHand = parseFloat(warehouseStock.physicalStockOnHand) || 0;
              const currentPhysicalAvailableForSale = parseFloat(warehouseStock.physicalAvailableForSale) || 0;
              
              console.log(`   Current stock: ${currentStockOnHand}`);
              
              if (oldStatus !== "received" && newStatus === "received") {
                warehouseStock.stockOnHand = currentStockOnHand + newReceivedQty;
                warehouseStock.availableForSale = currentAvailableForSale + newReceivedQty;
                warehouseStock.physicalStockOnHand = currentPhysicalStockOnHand + newReceivedQty;
                warehouseStock.physicalAvailableForSale = currentPhysicalAvailableForSale + newReceivedQty;
                console.log(`   Adding new quantity: +${newReceivedQty}`);
              } else if (oldStatus === "received" && newStatus !== "received") {
                warehouseStock.stockOnHand = Math.max(0, currentStockOnHand - oldReceivedQty);
                warehouseStock.availableForSale = Math.max(0, currentAvailableForSale - oldReceivedQty);
                warehouseStock.physicalStockOnHand = Math.max(0, currentPhysicalStockOnHand - oldReceivedQty);
                warehouseStock.physicalAvailableForSale = Math.max(0, currentPhysicalAvailableForSale - oldReceivedQty);
                console.log(`   Subtracting old quantity: -${oldReceivedQty}`);
              } else if (oldStatus === "received" && newStatus === "received") {
                if (!oldItem) {
                  warehouseStock.stockOnHand = currentStockOnHand + newReceivedQty;
                  warehouseStock.availableForSale = currentAvailableForSale + newReceivedQty;
                  warehouseStock.physicalStockOnHand = currentPhysicalStockOnHand + newReceivedQty;
                  warehouseStock.physicalAvailableForSale = currentPhysicalAvailableForSale + newReceivedQty;
                  console.log(`   Old item not found - adding full quantity: +${newReceivedQty}`);
                } else {
                  warehouseStock.stockOnHand = currentStockOnHand + qtyDifference;
                  warehouseStock.availableForSale = currentAvailableForSale + qtyDifference;
                  warehouseStock.physicalStockOnHand = currentPhysicalStockOnHand + qtyDifference;
                  warehouseStock.physicalAvailableForSale = currentPhysicalAvailableForSale + qtyDifference;
                  console.log(`   Adjusting by difference: ${qtyDifference > 0 ? '+' : ''}${qtyDifference}`);
                }
              }
              
              console.log(`   New stock: ${warehouseStock.stockOnHand}`);
            }
            
            // Save the item
            await testItem.save();
            
            // Reload to verify
            const savedItem = await ShoeItem.findById(itemIdValue);
            const updatedStock = savedItem?.warehouseStocks?.find(ws => ws.warehouse === defaultWarehouseName) || savedItem?.warehouseStocks?.[0];
            
            console.log(`\n✅ Stock update completed:`);
            console.log(`   Stock On Hand: ${updatedStock?.stockOnHand || 0}`);
            console.log(`   Available for Sale: ${updatedStock?.availableForSale || 0}`);
            console.log(`   Physical Stock On Hand: ${updatedStock?.physicalStockOnHand || 0}`);
            console.log(`   Physical Available for Sale: ${updatedStock?.physicalAvailableForSale || 0}`);
            console.log(`   Warehouse: ${updatedStock?.warehouse || 'N/A'}\n`);
          } else {
            console.log(`   ⚠️ Item not found in database\n`);
          }
        }
      }
    }
    
    console.log("✅ Test completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("\n📊 Disconnected from MongoDB");
  }
}

// Run the test
testStockUpdate();

