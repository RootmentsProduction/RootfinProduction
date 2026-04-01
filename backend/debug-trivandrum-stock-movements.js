import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';
import SalesInvoice from './model/SalesInvoice.js';
import PurchaseReceive from './model/PurchaseReceive.js';
import TransferOrder from './model/TransferOrder.js';
import InventoryAdjustment from './model/InventoryAdjustment.js';

dotenv.config();

const WAREHOUSE_NAME_MAPPING = {
  "Grooms Trivandum": "Grooms Trivandrum",
  "Grooms Trivandrum": "Grooms Trivandrum",
  "SG-Trivandrum": "Grooms Trivandrum",
  "Trivandrum Branch": "Grooms Trivandrum"
};

async function debugTrivandrumStockMovements() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rootments');
    console.log("✅ Connected to MongoDB");

    console.log("🔍 DEBUGGING TRIVANDRUM STOCK MOVEMENTS\n");

    const normalizeWarehouseName = (name) => {
      if (!name) return "Warehouse";
      return WAREHOUSE_NAME_MAPPING[name.trim()] || name.trim();
    };

    // 1. Get current stock for Trivandrum
    console.log("1️⃣ CURRENT STOCK IN TRIVANDRUM:");
    console.log("=".repeat(60));

    const standaloneItems = await ShoeItem.find({
      'warehouseStocks.warehouse': { $regex: /trivandrum|trivandum/i }
    }).select('itemName sku warehouseStocks createdAt');

    const itemGroups = await ItemGroup.find({
      'items.warehouseStocks.warehouse': { $regex: /trivandrum|trivandum/i }
    }).select('groupName items.name items.sku items.warehouseStocks createdAt');

    let currentStockSummary = {
      totalItems: 0,
      totalOpeningStock: 0,
      totalCurrentStock: 0,
      items: []
    };

    // Process standalone items
    standaloneItems.forEach(item => {
      item.warehouseStocks.forEach(stock => {
        const normalized = normalizeWarehouseName(stock.warehouse);
        if (normalized === "Grooms Trivandrum") {
          const openingStock = stock.openingStock || 0;
          const currentStock = stock.stockOnHand || stock.stock || 0;
          
          if (openingStock > 0 || currentStock > 0) {
            currentStockSummary.totalItems++;
            currentStockSummary.totalOpeningStock += openingStock;
            currentStockSummary.totalCurrentStock += currentStock;
            
            currentStockSummary.items.push({
              name: item.itemName,
              sku: item.sku,
              type: 'standalone',
              openingStock,
              currentStock,
              difference: currentStock - openingStock,
              createdAt: item.createdAt
            });
          }
        }
      });
    });

    // Process grouped items
    itemGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.warehouseStocks) {
          item.warehouseStocks.forEach(stock => {
            const normalized = normalizeWarehouseName(stock.warehouse);
            if (normalized === "Grooms Trivandrum") {
              const openingStock = stock.openingStock || 0;
              const currentStock = stock.stockOnHand || stock.stock || 0;
              
              if (openingStock > 0 || currentStock > 0) {
                currentStockSummary.totalItems++;
                currentStockSummary.totalOpeningStock += openingStock;
                currentStockSummary.totalCurrentStock += currentStock;
                
                currentStockSummary.items.push({
                  name: item.name,
                  sku: item.sku,
                  type: 'grouped',
                  groupName: group.groupName,
                  openingStock,
                  currentStock,
                  difference: currentStock - openingStock,
                  createdAt: group.createdAt
                });
              }
            }
          });
        }
      });
    });

    console.log(`📊 SUMMARY:`);
    console.log(`Total Items: ${currentStockSummary.totalItems}`);
    console.log(`Total Opening Stock: ${currentStockSummary.totalOpeningStock}`);
    console.log(`Total Current Stock: ${currentStockSummary.totalCurrentStock}`);
    console.log(`Net Difference: ${currentStockSummary.totalCurrentStock - currentStockSummary.totalOpeningStock}`);

    // Show items with differences
    const itemsWithDifferences = currentStockSummary.items.filter(item => item.difference !== 0);
    if (itemsWithDifferences.length > 0) {
      console.log(`\n📈 ITEMS WITH STOCK CHANGES (${itemsWithDifferences.length} items):`);
      itemsWithDifferences.forEach((item, idx) => {
        const sign = item.difference > 0 ? '+' : '';
        console.log(`${idx + 1}. ${item.name} (${item.sku || 'No SKU'})`);
        console.log(`   Opening: ${item.openingStock}, Current: ${item.currentStock}, Change: ${sign}${item.difference}`);
        console.log(`   Type: ${item.type}${item.groupName ? ` (Group: ${item.groupName})` : ''}`);
        console.log(`   Created: ${item.createdAt.toLocaleDateString()}`);
      });
    }

    // 2. Check sales invoices for Trivandrum
    console.log("\n\n2️⃣ SALES INVOICES FROM TRIVANDRUM:");
    console.log("=".repeat(60));

    const salesInvoices = await SalesInvoice.find({
      $or: [
        { warehouse: { $regex: /trivandrum|trivandum/i } },
        { branch: { $regex: /trivandrum|trivandum/i } }
      ]
    }).select('invoiceNo warehouse branch lineItems totalAmount createdAt category').sort({ createdAt: -1 });

    let totalSoldQuantity = 0;
    let totalSalesValue = 0;

    console.log(`Found ${salesInvoices.length} sales invoices from Trivandrum:`);
    salesInvoices.forEach((invoice, idx) => {
      const invoiceQuantity = invoice.lineItems?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;
      totalSoldQuantity += invoiceQuantity;
      totalSalesValue += invoice.totalAmount || 0;
      
      console.log(`${idx + 1}. ${invoice.invoiceNo} - ${invoice.createdAt.toLocaleDateString()}`);
      console.log(`   Warehouse: ${invoice.warehouse || invoice.branch}`);
      console.log(`   Category: ${invoice.category || 'N/A'}`);
      console.log(`   Quantity: ${invoiceQuantity} items, Value: ₹${invoice.totalAmount || 0}`);
    });

    console.log(`\n📊 SALES SUMMARY:`);
    console.log(`Total Invoices: ${salesInvoices.length}`);
    console.log(`Total Quantity Sold: ${totalSoldQuantity}`);
    console.log(`Total Sales Value: ₹${totalSalesValue}`);

    // 3. Check purchase receives for Trivandrum
    console.log("\n\n3️⃣ PURCHASE RECEIVES TO TRIVANDRUM:");
    console.log("=".repeat(60));

    const purchaseReceives = await PurchaseReceive.find({
      $or: [
        { warehouse: { $regex: /trivandrum|trivandum/i } },
        { branch: { $regex: /trivandrum|trivandum/i } }
      ]
    }).select('receiveNo warehouse branch lineItems totalAmount createdAt status').sort({ createdAt: -1 });

    let totalReceivedQuantity = 0;
    let totalReceiveValue = 0;

    console.log(`Found ${purchaseReceives.length} purchase receives to Trivandrum:`);
    purchaseReceives.forEach((receive, idx) => {
      const receiveQuantity = receive.lineItems?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;
      totalReceivedQuantity += receiveQuantity;
      totalReceiveValue += receive.totalAmount || 0;
      
      console.log(`${idx + 1}. ${receive.receiveNo} - ${receive.createdAt.toLocaleDateString()}`);
      console.log(`   Warehouse: ${receive.warehouse || receive.branch}`);
      console.log(`   Status: ${receive.status || 'N/A'}`);
      console.log(`   Quantity: ${receiveQuantity} items, Value: ₹${receive.totalAmount || 0}`);
    });

    console.log(`\n📊 PURCHASE SUMMARY:`);
    console.log(`Total Receives: ${purchaseReceives.length}`);
    console.log(`Total Quantity Received: ${totalReceivedQuantity}`);
    console.log(`Total Receive Value: ₹${totalReceiveValue}`);

    // 4. Check transfer orders (both incoming and outgoing)
    console.log("\n\n4️⃣ TRANSFER ORDERS (TRIVANDRUM):");
    console.log("=".repeat(60));

    const transfersOut = await TransferOrder.find({
      fromWarehouse: { $regex: /trivandrum|trivandum/i }
    }).select('transferNo fromWarehouse toWarehouse lineItems createdAt status').sort({ createdAt: -1 });

    const transfersIn = await TransferOrder.find({
      toWarehouse: { $regex: /trivandrum|trivandum/i }
    }).select('transferNo fromWarehouse toWarehouse lineItems createdAt status').sort({ createdAt: -1 });

    let totalTransferredOut = 0;
    let totalTransferredIn = 0;

    console.log(`\n📤 OUTGOING TRANSFERS (${transfersOut.length}):`);
    transfersOut.forEach((transfer, idx) => {
      const quantity = transfer.lineItems?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;
      totalTransferredOut += quantity;
      
      console.log(`${idx + 1}. ${transfer.transferNo} - ${transfer.createdAt.toLocaleDateString()}`);
      console.log(`   From: ${transfer.fromWarehouse} → To: ${transfer.toWarehouse}`);
      console.log(`   Status: ${transfer.status}, Quantity: ${quantity} items`);
    });

    console.log(`\n📥 INCOMING TRANSFERS (${transfersIn.length}):`);
    transfersIn.forEach((transfer, idx) => {
      const quantity = transfer.lineItems?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;
      totalTransferredIn += quantity;
      
      console.log(`${idx + 1}. ${transfer.transferNo} - ${transfer.createdAt.toLocaleDateString()}`);
      console.log(`   From: ${transfer.fromWarehouse} → To: ${transfer.toWarehouse}`);
      console.log(`   Status: ${transfer.status}, Quantity: ${quantity} items`);
    });

    console.log(`\n📊 TRANSFER SUMMARY:`);
    console.log(`Total Transferred Out: ${totalTransferredOut}`);
    console.log(`Total Transferred In: ${totalTransferredIn}`);
    console.log(`Net Transfer: ${totalTransferredIn - totalTransferredOut}`);

    // 5. Check inventory adjustments
    console.log("\n\n5️⃣ INVENTORY ADJUSTMENTS (TRIVANDRUM):");
    console.log("=".repeat(60));

    const adjustments = await InventoryAdjustment.find({
      warehouse: { $regex: /trivandrum|trivandum/i }
    }).select('adjustmentNo warehouse lineItems createdAt reason').sort({ createdAt: -1 });

    let totalAdjustmentQuantity = 0;

    console.log(`Found ${adjustments.length} inventory adjustments for Trivandrum:`);
    adjustments.forEach((adjustment, idx) => {
      const adjustmentQuantity = adjustment.lineItems?.reduce((sum, item) => {
        const qty = parseFloat(item.adjustmentQuantity) || 0;
        return sum + qty;
      }, 0) || 0;
      totalAdjustmentQuantity += adjustmentQuantity;
      
      console.log(`${idx + 1}. ${adjustment.adjustmentNo} - ${adjustment.createdAt.toLocaleDateString()}`);
      console.log(`   Warehouse: ${adjustment.warehouse}`);
      console.log(`   Reason: ${adjustment.reason || 'N/A'}`);
      console.log(`   Adjustment Quantity: ${adjustmentQuantity}`);
    });

    console.log(`\n📊 ADJUSTMENT SUMMARY:`);
    console.log(`Total Adjustments: ${adjustments.length}`);
    console.log(`Total Adjustment Quantity: ${totalAdjustmentQuantity}`);

    // 6. Final calculation
    console.log("\n\n6️⃣ STOCK MOVEMENT ANALYSIS:");
    console.log("=".repeat(60));

    const expectedStock = currentStockSummary.totalOpeningStock - totalSoldQuantity + totalReceivedQuantity + (totalTransferredIn - totalTransferredOut) + totalAdjustmentQuantity;

    console.log(`📊 CALCULATION:`);
    console.log(`Opening Stock: ${currentStockSummary.totalOpeningStock}`);
    console.log(`- Sales: ${totalSoldQuantity}`);
    console.log(`+ Purchases: ${totalReceivedQuantity}`);
    console.log(`+ Net Transfers: ${totalTransferredIn - totalTransferredOut}`);
    console.log(`+ Adjustments: ${totalAdjustmentQuantity}`);
    console.log(`= Expected Stock: ${expectedStock}`);
    console.log(`Actual Current Stock: ${currentStockSummary.totalCurrentStock}`);
    console.log(`Difference: ${currentStockSummary.totalCurrentStock - expectedStock}`);

    if (Math.abs(currentStockSummary.totalCurrentStock - expectedStock) > 0.01) {
      console.log(`\n⚠️  DISCREPANCY DETECTED!`);
      console.log(`There's a difference of ${currentStockSummary.totalCurrentStock - expectedStock} pieces`);
      console.log(`This could be due to:`);
      console.log(`- Missing transactions in the system`);
      console.log(`- Manual stock edits not tracked`);
      console.log(`- Data synchronization issues`);
      console.log(`- Different warehouse name variations`);
    } else {
      console.log(`\n✅ STOCK CALCULATION MATCHES!`);
    }

    console.log("\n✅ Debug completed!");

  } catch (error) {
    console.error("❌ Error in debug:", error);
  } finally {
    await mongoose.connection.close();
  }
}

debugTrivandrumStockMovements();