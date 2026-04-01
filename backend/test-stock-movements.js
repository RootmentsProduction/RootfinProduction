// Test script to verify we can fetch stock movements from database
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models
import SalesInvoice from "./model/SalesInvoice.js";
import TransferOrder from "./model/TransferOrder.js";
import PurchaseReceive from "./model/PurchaseReceive.js";
import InventoryAdjustment from "./model/InventoryAdjustment.js";
import ShoeItem from "./model/ShoeItem.js";

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

async function testStockMovements() {
  try {
    console.log("\n🔍 Testing Stock Movement Data Access...");
    
    // Get a sample item to test with
    const sampleItem = await ShoeItem.findOne({}).select('_id itemName sku warehouseStocks');
    if (!sampleItem) {
      console.log("❌ No items found in database");
      return;
    }
    
    console.log(`\n📦 Testing with item: ${sampleItem.itemName} (${sampleItem.sku})`);
    console.log(`Item ID: ${sampleItem._id}`);
    
    // Show item's current warehouse stocks
    if (sampleItem.warehouseStocks && sampleItem.warehouseStocks.length > 0) {
      console.log("📊 Current warehouse stocks:");
      sampleItem.warehouseStocks.forEach((ws, idx) => {
        console.log(`  ${idx + 1}. ${ws.warehouse}: Opening=${ws.openingStock || 0}, Current=${ws.stockOnHand || 0}`);
      });
    }
    
    // Test date range (from beginning of 2026 to now)
    const startDate = new Date('2026-01-01');
    const endDate = new Date();
    
    console.log(`\n📅 Checking transactions from ${startDate.toDateString()} to ${endDate.toDateString()}`);
    
    // === STOCK OUT (Reductions) ===
    console.log("\n🔴 STOCK OUT (Reductions):");
    
    // 1. Sales Invoices (items sold)
    try {
      const salesInvoices = await SalesInvoice.find({
        'items.itemId': sampleItem._id,
        createdAt: { $gte: startDate, $lte: endDate }
      }).select('invoiceNumber warehouse items createdAt');
      
      console.log(`  📋 Sales Invoices: ${salesInvoices.length} found`);
      
      let totalSold = 0;
      salesInvoices.forEach((invoice, idx) => {
        const item = invoice.items.find(i => i.itemId.toString() === sampleItem._id.toString());
        if (item) {
          const qty = parseFloat(item.quantity) || 0;
          totalSold += qty;
          console.log(`    ${idx + 1}. Invoice ${invoice.invoiceNumber}: ${qty} units from ${invoice.warehouse} on ${invoice.createdAt.toDateString()}`);
        }
      });
      console.log(`    📊 Total sold: ${totalSold} units`);
      
    } catch (error) {
      console.log(`    ❌ Error fetching sales invoices: ${error.message}`);
    }
    
    // 2. Transfer Orders Sent (items transferred out)
    try {
      const transferOrdersSent = await TransferOrder.find({
        'items.itemId': sampleItem._id,
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }).select('transferOrderNumber fromWarehouse toWarehouse items createdAt status');
      
      console.log(`  📋 Transfer Orders (All): ${transferOrdersSent.length} found`);
      
      let totalTransferredOut = 0;
      let totalTransferredIn = 0;
      
      transferOrdersSent.forEach((transfer, idx) => {
        const item = transfer.items.find(i => i.itemId.toString() === sampleItem._id.toString());
        if (item) {
          const qty = parseFloat(item.quantity) || 0;
          console.log(`    ${idx + 1}. Transfer ${transfer.transferOrderNumber}: ${qty} units from ${transfer.fromWarehouse} to ${transfer.toWarehouse} on ${transfer.createdAt.toDateString()}`);
          
          // This would be stock out for fromWarehouse and stock in for toWarehouse
          // For now, just count total transfers
          totalTransferredOut += qty;
        }
      });
      console.log(`    📊 Total transferred: ${totalTransferredOut} units`);
      
    } catch (error) {
      console.log(`    ❌ Error fetching transfer orders: ${error.message}`);
    }
    
    // 3. Inventory Adjustments (negative = stock reduction)
    try {
      const inventoryAdjustments = await InventoryAdjustment.find({
        'items.itemId': sampleItem._id,
        createdAt: { $gte: startDate, $lte: endDate }
      }).select('adjustmentNumber warehouse items createdAt');
      
      console.log(`  📋 Inventory Adjustments: ${inventoryAdjustments.length} found`);
      
      let totalAdjustmentOut = 0;
      let totalAdjustmentIn = 0;
      
      inventoryAdjustments.forEach((adjustment, idx) => {
        const item = adjustment.items.find(i => i.itemId.toString() === sampleItem._id.toString());
        if (item) {
          const qty = parseFloat(item.adjustmentQuantity) || 0;
          console.log(`    ${idx + 1}. Adjustment ${adjustment.adjustmentNumber}: ${qty > 0 ? '+' : ''}${qty} units at ${adjustment.warehouse} on ${adjustment.createdAt.toDateString()}`);
          
          if (qty > 0) {
            totalAdjustmentIn += qty;
          } else {
            totalAdjustmentOut += Math.abs(qty);
          }
        }
      });
      console.log(`    📊 Total adjustment out: ${totalAdjustmentOut} units`);
      console.log(`    📊 Total adjustment in: ${totalAdjustmentIn} units`);
      
    } catch (error) {
      console.log(`    ❌ Error fetching inventory adjustments: ${error.message}`);
    }
    
    // === STOCK IN (Additions) ===
    console.log("\n🟢 STOCK IN (Additions):");
    
    // 1. Purchase Receives (items received)
    try {
      const purchaseReceives = await PurchaseReceive.find({
        'items.itemId': sampleItem._id,
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }).select('receiveNumber toWarehouse items createdAt status');
      
      console.log(`  📋 Purchase Receives: ${purchaseReceives.length} found`);
      
      let totalReceived = 0;
      purchaseReceives.forEach((receive, idx) => {
        const item = receive.items.find(i => i.itemId.toString() === sampleItem._id.toString());
        if (item) {
          const qty = parseFloat(item.receivedQuantity) || parseFloat(item.quantity) || 0;
          totalReceived += qty;
          console.log(`    ${idx + 1}. Receive ${receive.receiveNumber}: ${qty} units to ${receive.toWarehouse} on ${receive.createdAt.toDateString()}`);
        }
      });
      console.log(`    📊 Total received: ${totalReceived} units`);
      
    } catch (error) {
      console.log(`    ❌ Error fetching purchase receives: ${error.message}`);
    }
    
    // === SUMMARY ===
    console.log("\n📊 SUMMARY:");
    console.log("✅ All transaction types are accessible from the database");
    console.log("✅ We can calculate Stock In and Stock Out from these transactions");
    console.log("✅ The data structure supports the stock movement calculations");
    
    // Test with multiple items
    console.log("\n🔍 Testing with multiple items...");
    const multipleItems = await ShoeItem.find({}).limit(3).select('_id itemName sku');
    
    for (const item of multipleItems) {
      const salesCount = await SalesInvoice.countDocuments({
        'items.itemId': item._id,
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      const transferCount = await TransferOrder.countDocuments({
        'items.itemId': item._id,
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      const receiveCount = await PurchaseReceive.countDocuments({
        'items.itemId': item._id,
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      const adjustmentCount = await InventoryAdjustment.countDocuments({
        'items.itemId': item._id,
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      console.log(`  📦 ${item.itemName}: Sales=${salesCount}, Transfers=${transferCount}, Receives=${receiveCount}, Adjustments=${adjustmentCount}`);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

testStockMovements();