// Test script to calculate Stock In and Stock Out for a product by SKU
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

async function calculateStockBySKU(sku, startDate = null, endDate = null) {
  try {
    console.log(`\n🔍 Calculating Stock In/Out for SKU: ${sku}`);
    
    // Find the item by SKU
    const item = await ShoeItem.findOne({ sku: sku }).select('_id itemName sku warehouseStocks costPrice');
    if (!item) {
      console.log(`❌ No item found with SKU: ${sku}`);
      return null;
    }
    
    console.log(`📦 Found item: ${item.itemName} (${item.sku})`);
    console.log(`💰 Cost Price: ₹${item.costPrice}`);
    
    // Show current warehouse stocks
    if (item.warehouseStocks && item.warehouseStocks.length > 0) {
      console.log("📊 Current warehouse stocks:");
      item.warehouseStocks.forEach((ws, idx) => {
        console.log(`  ${idx + 1}. ${ws.warehouse}: Opening=${ws.openingStock || 0}, Current=${ws.stockOnHand || 0}`);
      });
    }
    
    // Set date range
    const startDateObj = startDate ? new Date(startDate) : new Date('2020-01-01');
    const endDateObj = endDate ? new Date(endDate) : new Date();
    
    console.log(`📅 Date range: ${startDateObj.toDateString()} to ${endDateObj.toDateString()}`);
    
    let totalStockIn = 0;
    let totalStockOut = 0;
    let stockInDetails = [];
    let stockOutDetails = [];
    
    // === STOCK OUT (Reductions) ===
    console.log("\n🔴 STOCK OUT (Reductions):");
    
    // 1. Sales Invoices (items sold)
    try {
      const salesInvoices = await SalesInvoice.find({
        'items.sku': sku,
        createdAt: { $gte: startDateObj, $lte: endDateObj }
      }).select('invoiceNumber warehouse items createdAt');
      
      console.log(`  📋 Sales Invoices: ${salesInvoices.length} found`);
      
      let soldFromSales = 0;
      salesInvoices.forEach((invoice, idx) => {
        const items = invoice.items.filter(i => i.sku === sku);
        items.forEach(item => {
          const qty = parseFloat(item.quantity) || 0;
          soldFromSales += qty;
          stockOutDetails.push({
            type: 'Sales Invoice',
            reference: invoice.invoiceNumber,
            warehouse: invoice.warehouse,
            quantity: qty,
            date: invoice.createdAt
          });
          console.log(`    ${idx + 1}. Invoice ${invoice.invoiceNumber}: ${qty} units from ${invoice.warehouse} on ${invoice.createdAt.toDateString()}`);
        });
      });
      totalStockOut += soldFromSales;
      console.log(`    📊 Total sold via invoices: ${soldFromSales} units`);
      
    } catch (error) {
      console.log(`    ❌ Error fetching sales invoices: ${error.message}`);
    }
    
    // 2. Transfer Orders Sent (items transferred out)
    try {
      const transferOrdersSent = await TransferOrder.find({
        'items.sku': sku,
        status: 'completed',
        createdAt: { $gte: startDateObj, $lte: endDateObj }
      }).select('transferOrderNumber fromWarehouse toWarehouse items createdAt status');
      
      console.log(`  📋 Transfer Orders: ${transferOrdersSent.length} found`);
      
      let transferredOut = 0;
      transferOrdersSent.forEach((transfer, idx) => {
        const items = transfer.items.filter(i => i.sku === sku);
        items.forEach(item => {
          const qty = parseFloat(item.quantity) || 0;
          transferredOut += qty;
          stockOutDetails.push({
            type: 'Transfer Out',
            reference: transfer.transferOrderNumber,
            warehouse: transfer.fromWarehouse,
            toWarehouse: transfer.toWarehouse,
            quantity: qty,
            date: transfer.createdAt
          });
          console.log(`    ${idx + 1}. Transfer ${transfer.transferOrderNumber}: ${qty} units from ${transfer.fromWarehouse} to ${transfer.toWarehouse} on ${transfer.createdAt.toDateString()}`);
        });
      });
      totalStockOut += transferredOut;
      console.log(`    📊 Total transferred out: ${transferredOut} units`);
      
    } catch (error) {
      console.log(`    ❌ Error fetching transfer orders: ${error.message}`);
    }
    
    // 3. Inventory Adjustments (negative = stock reduction)
    try {
      const inventoryAdjustments = await InventoryAdjustment.find({
        'items.sku': sku,
        createdAt: { $gte: startDateObj, $lte: endDateObj }
      }).select('adjustmentNumber warehouse items createdAt');
      
      console.log(`  📋 Inventory Adjustments: ${inventoryAdjustments.length} found`);
      
      let adjustmentOut = 0;
      inventoryAdjustments.forEach((adjustment, idx) => {
        const items = adjustment.items.filter(i => i.sku === sku);
        items.forEach(item => {
          const qty = parseFloat(item.adjustmentQuantity) || 0;
          if (qty < 0) {
            const absQty = Math.abs(qty);
            adjustmentOut += absQty;
            stockOutDetails.push({
              type: 'Inventory Adjustment (Reduction)',
              reference: adjustment.adjustmentNumber,
              warehouse: adjustment.warehouse,
              quantity: absQty,
              date: adjustment.createdAt
            });
            console.log(`    ${idx + 1}. Adjustment ${adjustment.adjustmentNumber}: -${absQty} units at ${adjustment.warehouse} on ${adjustment.createdAt.toDateString()}`);
          }
        });
      });
      totalStockOut += adjustmentOut;
      console.log(`    📊 Total adjustment reductions: ${adjustmentOut} units`);
      
    } catch (error) {
      console.log(`    ❌ Error fetching inventory adjustments: ${error.message}`);
    }
    
    // === STOCK IN (Additions) ===
    console.log("\n🟢 STOCK IN (Additions):");
    
    // 1. Purchase Receives (items received)
    try {
      const purchaseReceives = await PurchaseReceive.find({
        'items.sku': sku,
        status: 'completed',
        createdAt: { $gte: startDateObj, $lte: endDateObj }
      }).select('receiveNumber toWarehouse items createdAt status');
      
      console.log(`  📋 Purchase Receives: ${purchaseReceives.length} found`);
      
      let receivedFromPurchases = 0;
      purchaseReceives.forEach((receive, idx) => {
        const items = receive.items.filter(i => i.sku === sku);
        items.forEach(item => {
          const qty = parseFloat(item.receivedQuantity) || parseFloat(item.quantity) || 0;
          receivedFromPurchases += qty;
          stockInDetails.push({
            type: 'Purchase Receive',
            reference: receive.receiveNumber,
            warehouse: receive.toWarehouse,
            quantity: qty,
            date: receive.createdAt
          });
          console.log(`    ${idx + 1}. Receive ${receive.receiveNumber}: ${qty} units to ${receive.toWarehouse} on ${receive.createdAt.toDateString()}`);
        });
      });
      totalStockIn += receivedFromPurchases;
      console.log(`    📊 Total received via purchases: ${receivedFromPurchases} units`);
      
    } catch (error) {
      console.log(`    ❌ Error fetching purchase receives: ${error.message}`);
    }
    
    // 2. Transfer Orders Received (items transferred in)
    try {
      const transferOrdersReceived = await TransferOrder.find({
        'items.sku': sku,
        status: 'completed',
        createdAt: { $gte: startDateObj, $lte: endDateObj }
      }).select('transferOrderNumber fromWarehouse toWarehouse items createdAt status');
      
      console.log(`  📋 Transfer Orders (for Stock In): ${transferOrdersReceived.length} found`);
      
      let transferredIn = 0;
      transferOrdersReceived.forEach((transfer, idx) => {
        const items = transfer.items.filter(i => i.sku === sku);
        items.forEach(item => {
          const qty = parseFloat(item.quantity) || 0;
          transferredIn += qty;
          stockInDetails.push({
            type: 'Transfer In',
            reference: transfer.transferOrderNumber,
            warehouse: transfer.toWarehouse,
            fromWarehouse: transfer.fromWarehouse,
            quantity: qty,
            date: transfer.createdAt
          });
          console.log(`    ${idx + 1}. Transfer ${transfer.transferOrderNumber}: ${qty} units to ${transfer.toWarehouse} from ${transfer.fromWarehouse} on ${transfer.createdAt.toDateString()}`);
        });
      });
      totalStockIn += transferredIn;
      console.log(`    📊 Total transferred in: ${transferredIn} units`);
      
    } catch (error) {
      console.log(`    ❌ Error fetching transfer orders for stock in: ${error.message}`);
    }
    
    // 3. Inventory Adjustments (positive = stock addition)
    try {
      const inventoryAdjustments = await InventoryAdjustment.find({
        'items.sku': sku,
        createdAt: { $gte: startDateObj, $lte: endDateObj }
      }).select('adjustmentNumber warehouse items createdAt');
      
      let adjustmentIn = 0;
      inventoryAdjustments.forEach((adjustment, idx) => {
        const items = adjustment.items.filter(i => i.sku === sku);
        items.forEach(item => {
          const qty = parseFloat(item.adjustmentQuantity) || 0;
          if (qty > 0) {
            adjustmentIn += qty;
            stockInDetails.push({
              type: 'Inventory Adjustment (Addition)',
              reference: adjustment.adjustmentNumber,
              warehouse: adjustment.warehouse,
              quantity: qty,
              date: adjustment.createdAt
            });
            console.log(`    Adjustment ${adjustment.adjustmentNumber}: +${qty} units at ${adjustment.warehouse} on ${adjustment.createdAt.toDateString()}`);
          }
        });
      });
      totalStockIn += adjustmentIn;
      console.log(`    📊 Total adjustment additions: ${adjustmentIn} units`);
      
    } catch (error) {
      console.log(`    ❌ Error fetching inventory adjustments for stock in: ${error.message}`);
    }
    
    // === SUMMARY ===
    console.log("\n📊 SUMMARY:");
    console.log(`🟢 Total Stock In: ${totalStockIn} units`);
    console.log(`🔴 Total Stock Out: ${totalStockOut} units`);
    console.log(`📈 Net Movement: ${totalStockIn - totalStockOut} units`);
    
    // Calculate opening stock from warehouse stocks
    const totalOpeningStock = (item.warehouseStocks || []).reduce((sum, ws) => {
      return sum + (parseFloat(ws.openingStock) || 0);
    }, 0);
    
    const calculatedClosingStock = totalOpeningStock + totalStockIn - totalStockOut;
    console.log(`📊 Opening Stock: ${totalOpeningStock} units`);
    console.log(`📊 Calculated Closing Stock: ${calculatedClosingStock} units`);
    
    // Calculate stock value
    const stockValue = calculatedClosingStock * (item.costPrice || 0);
    console.log(`💰 Closing Stock Value: ₹${stockValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}`);
    
    return {
      item: {
        id: item._id,
        name: item.itemName,
        sku: item.sku,
        costPrice: item.costPrice
      },
      openingStock: totalOpeningStock,
      stockIn: totalStockIn,
      stockOut: totalStockOut,
      closingStock: calculatedClosingStock,
      stockValue: stockValue,
      stockInDetails,
      stockOutDetails
    };
    
  } catch (error) {
    console.error("❌ Error calculating stock:", error);
    return null;
  }
}

// Test with multiple SKUs
async function testMultipleSKUs() {
  try {
    // Get some sample SKUs from the database
    const sampleItems = await ShoeItem.find({}).limit(5).select('sku itemName');
    
    console.log("🧪 Testing Stock Calculation with Sample SKUs:");
    console.log("=" .repeat(60));
    
    for (const item of sampleItems) {
      if (item.sku) {
        const result = await calculateStockBySKU(item.sku, '2026-01-01', '2026-02-27');
        if (result) {
          console.log(`\n✅ ${item.sku}: Opening=${result.openingStock}, In=${result.stockIn}, Out=${result.stockOut}, Closing=${result.closingStock}`);
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the test
testMultipleSKUs();