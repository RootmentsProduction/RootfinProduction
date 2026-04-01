// Debug Stock Calculation Error - Why 89 instead of 74?
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';
import SalesInvoice from './model/SalesInvoice.js';
import TransferOrder from './model/TransferOrder.js';
import InventoryAdjustment from './model/InventoryAdjustment.js';

dotenv.config();

async function debugStockCalculationError() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    console.log('🔍 DEBUGGING STOCK CALCULATION ERROR');
    console.log('===================================');
    console.log('Expected: 103 - 29 = 74 pieces');
    console.log('Actual: 89 pieces showing');
    console.log('Discrepancy: +15 pieces\n');

    // Let's run the search script first to find the problematic item
    console.log('📋 Step 1: Finding items in Grooms Trivandrum with significant stock...');
    
    const itemGroups = await ItemGroup.find({
      'items.warehouseStocks.warehouse': /grooms.*trivandrum/i
    }).lean();

    let targetItem = null;
    let targetGroup = null;

    // Look for items with stock around 89 and opening stock around 103
    for (const group of itemGroups) {
      if (group.items) {
        for (const item of group.items) {
          const groomsStock = item.warehouseStocks?.find(ws => 
            ws.warehouse && ws.warehouse.toLowerCase().includes('grooms') && 
            ws.warehouse.toLowerCase().includes('trivandrum')
          );
          
          if (groomsStock) {
            const currentStock = groomsStock.stockOnHand || 0;
            const openingStock = groomsStock.openingStock || 0;
            
            // Look for the item with the described issue
            if ((currentStock >= 85 && currentStock <= 95) || (openingStock >= 100 && openingStock <= 110)) {
              console.log(`Found candidate: ${item.sku} - ${item.name}`);
              console.log(`  Current: ${currentStock}, Opening: ${openingStock}`);
              
              if (!targetItem || Math.abs(currentStock - 89) < Math.abs((targetItem.groomsStock?.stockOnHand || 0) - 89)) {
                targetItem = item;
                targetGroup = group;
                targetItem.groomsStock = groomsStock;
              }
            }
          }
        }
      }
    }

    if (!targetItem) {
      console.log('❌ No item found matching the described issue');
      return;
    }

    console.log(`\n🎯 Analyzing: ${targetItem.sku} - ${targetItem.name}`);
    console.log(`Group: ${targetGroup.name}`);
    console.log(`Current Stock: ${targetItem.groomsStock.stockOnHand || 0}`);
    console.log(`Opening Stock: ${targetItem.groomsStock.openingStock || 0}`);

    // Step 2: Check ALL transactions that could affect this item's stock
    console.log(`\n📊 Step 2: Checking ALL transactions for ${targetItem.sku}...`);

    // 2a. Sales Invoices
    console.log('\n🛒 Sales Invoices (January 2026):');
    const salesInvoices = await SalesInvoice.find({
      'lineItems.itemCode': targetItem.sku,
      invoiceDate: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      },
      $or: [
        { branch: /grooms.*trivandrum/i },
        { branch: /trivandrum/i },
        { branch: /tvm/i }
      ]
    }).lean();

    let totalSalesQuantity = 0;
    let salesInvoiceCount = 0;
    
    salesInvoices.forEach(invoice => {
      const lineItem = invoice.lineItems.find(li => li.itemCode === targetItem.sku);
      if (lineItem) {
        totalSalesQuantity += lineItem.quantity || 0;
        salesInvoiceCount++;
        console.log(`- ${invoice.invoiceNumber}: -${lineItem.quantity} pieces (${invoice.invoiceDate?.toDateString()}) - ${invoice.customer}`);
      }
    });

    console.log(`Total Sales: ${salesInvoiceCount} invoices, ${totalSalesQuantity} pieces DEDUCTED`);

    // 2b. Transfer Orders IN (to Grooms Trivandrum)
    console.log('\n📦 Transfer Orders IN (January 2026):');
    const transfersIn = await TransferOrder.find({
      'lineItems.itemCode': targetItem.sku,
      destinationWarehouse: /grooms.*trivandrum/i,
      status: 'transferred',
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalTransfersIn = 0;
    transfersIn.forEach(transfer => {
      const lineItem = transfer.lineItems.find(li => li.itemCode === targetItem.sku);
      if (lineItem) {
        totalTransfersIn += lineItem.quantity || 0;
        console.log(`+ ${transfer.transferOrderNumber}: +${lineItem.quantity} pieces from ${transfer.sourceWarehouse} (${transfer.date?.toDateString()})`);
      }
    });

    console.log(`Total Transfers IN: ${totalTransfersIn} pieces ADDED`);

    // 2c. Transfer Orders OUT (from Grooms Trivandrum)
    console.log('\n📤 Transfer Orders OUT (January 2026):');
    const transfersOut = await TransferOrder.find({
      'lineItems.itemCode': targetItem.sku,
      sourceWarehouse: /grooms.*trivandrum/i,
      status: 'transferred',
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalTransfersOut = 0;
    transfersOut.forEach(transfer => {
      const lineItem = transfer.lineItems.find(li => li.itemCode === targetItem.sku);
      if (lineItem) {
        totalTransfersOut += lineItem.quantity || 0;
        console.log(`- ${transfer.transferOrderNumber}: -${lineItem.quantity} pieces to ${transfer.destinationWarehouse} (${transfer.date?.toDateString()})`);
      }
    });

    console.log(`Total Transfers OUT: ${totalTransfersOut} pieces DEDUCTED`);

    // 2d. Inventory Adjustments
    console.log('\n⚖️ Inventory Adjustments (January 2026):');
    const adjustments = await InventoryAdjustment.find({
      'lineItems.itemCode': targetItem.sku,
      branch: /grooms.*trivandrum/i,
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalAdjustments = 0;
    adjustments.forEach(adj => {
      const lineItem = adj.lineItems.find(li => li.itemCode === targetItem.sku);
      if (lineItem) {
        const currentQty = lineItem.currentQuantity || 0;
        const adjustedQty = lineItem.adjustedQuantity || 0;
        const adjustment = adjustedQty - currentQty;
        totalAdjustments += adjustment;
        console.log(`${adjustment > 0 ? '+' : ''}${adjustment} ${adj.referenceNumber}: ${currentQty} → ${adjustedQty} (${adj.date?.toDateString()})`);
      }
    });

    console.log(`Total Adjustments: ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);

    // Step 3: Calculate the expected stock step by step
    console.log(`\n🧮 Step 3: DETAILED STOCK CALCULATION`);
    console.log('=====================================');
    
    const openingStock = targetItem.groomsStock.openingStock || 0;
    const currentStock = targetItem.groomsStock.stockOnHand || 0;
    
    console.log(`Starting Opening Stock:    ${openingStock} pieces`);
    console.log(`+ Transfers IN:            ${totalTransfersIn} pieces`);
    console.log(`- Sales:                   ${totalSalesQuantity} pieces`);
    console.log(`- Transfers OUT:           ${totalTransfersOut} pieces`);
    console.log(`+/- Adjustments:           ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);
    console.log(`-----------------------------------`);
    
    const calculatedStock = openingStock + totalTransfersIn - totalSalesQuantity - totalTransfersOut + totalAdjustments;
    console.log(`CALCULATED Stock:          ${calculatedStock} pieces`);
    console.log(`ACTUAL System Stock:       ${currentStock} pieces`);
    console.log(`MANUAL Count:              80 pieces`);
    console.log(`-----------------------------------`);
    console.log(`System vs Calculated:      ${currentStock - calculatedStock > 0 ? '+' : ''}${currentStock - calculatedStock} pieces`);
    console.log(`System vs Manual:          ${currentStock - 80 > 0 ? '+' : ''}${currentStock - 80} pieces`);

    // Step 4: Identify the specific cause of +15 discrepancy
    console.log(`\n🔍 Step 4: ROOT CAUSE ANALYSIS`);
    console.log('==============================');
    
    const expectedFromDescription = 103 - 29; // 74 pieces
    const actualSystem = currentStock;
    const discrepancy = actualSystem - expectedFromDescription;
    
    console.log(`Expected (103 - 29):       ${expectedFromDescription} pieces`);
    console.log(`Actual System:             ${actualSystem} pieces`);
    console.log(`Discrepancy:               ${discrepancy > 0 ? '+' : ''}${discrepancy} pieces`);
    
    console.log(`\n🔍 POSSIBLE CAUSES OF +${discrepancy} DISCREPANCY:`);
    
    // Check if opening stock is not 103
    if (openingStock !== 103) {
      const openingDiff = openingStock - 103;
      console.log(`❌ CAUSE 1: Opening stock is ${openingStock}, not 103 (${openingDiff > 0 ? '+' : ''}${openingDiff} difference)`);
    }
    
    // Check if sales are not exactly 29 pieces
    if (totalSalesQuantity !== 29) {
      const salesDiff = 29 - totalSalesQuantity;
      console.log(`❌ CAUSE 2: Sales are ${totalSalesQuantity} pieces, not 29 (${salesDiff > 0 ? '+' : ''}${salesDiff} difference in deduction)`);
    }
    
    // Check for unexpected transfers IN
    if (totalTransfersIn > 0) {
      console.log(`❌ CAUSE 3: Unexpected transfers IN: +${totalTransfersIn} pieces added`);
    }
    
    // Check for transfers OUT
    if (totalTransfersOut > 0) {
      console.log(`❌ CAUSE 4: Transfers OUT: -${totalTransfersOut} pieces deducted`);
    }
    
    // Check for adjustments
    if (totalAdjustments !== 0) {
      console.log(`❌ CAUSE 5: Inventory adjustments: ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);
    }

    // Check if the stock update function is working correctly
    if (Math.abs(currentStock - calculatedStock) > 0) {
      console.log(`❌ CAUSE 6: Stock update function error: System shows ${currentStock} but should be ${calculatedStock}`);
    }

    // Step 5: Provide specific fix
    console.log(`\n💡 Step 5: SPECIFIC FIX RECOMMENDATIONS`);
    console.log('======================================');
    
    if (openingStock !== 103) {
      console.log(`1. ✅ Fix opening stock: Change from ${openingStock} to 103`);
    }
    
    if (totalSalesQuantity !== 29) {
      console.log(`2. ✅ Verify sales: Expected 29 pieces sold, but found ${totalSalesQuantity} pieces`);
      console.log(`   Check if some invoices have wrong quantities or are missing`);
    }
    
    if (totalTransfersIn > 0) {
      console.log(`3. ✅ Review transfers IN: ${totalTransfersIn} pieces were added - verify if these are correct`);
    }
    
    if (Math.abs(currentStock - 80) > 5) {
      console.log(`4. ✅ Create inventory adjustment: Align system stock (${currentStock}) with manual count (80)`);
    }

    // Show the exact calculation that should happen
    console.log(`\n🔧 CORRECTED CALCULATION:`);
    console.log('=========================');
    console.log(`Opening Stock:             103 pieces (corrected)`);
    console.log(`- Sales:                   29 pieces (as described)`);
    console.log(`= Expected Stock:          74 pieces`);
    console.log(`Manual Count:              80 pieces`);
    console.log(`Acceptable difference:     ±6 pieces (within normal range)`);

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

debugStockCalculationError();