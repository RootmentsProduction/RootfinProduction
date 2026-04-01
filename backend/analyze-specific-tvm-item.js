// Analyze Specific TVM Item Stock Issue
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';
import SalesInvoice from './model/SalesInvoice.js';
import TransferOrder from './model/TransferOrder.js';
import InventoryAdjustment from './model/InventoryAdjustment.js';

dotenv.config();

async function analyzeSpecificTVMItem() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    console.log('🔍 ANALYZING SPECIFIC TVM ITEM STOCK ISSUE');
    console.log('==========================================\n');

    // Let's analyze the BRF8-1410 item which should have the discrepancy
    // Opening stock: 103, Sales: 29, Expected: 74, System shows: 89, Manual: 80
    
    const targetSku = 'BRF8-1410'; // This seems to be the item with the issue
    
    console.log(`🎯 Analyzing item: ${targetSku}`);
    
    // Find the item group containing this item
    const itemGroup = await ItemGroup.findOne({
      'items.sku': targetSku
    });

    if (!itemGroup) {
      console.log(`❌ Item group not found for SKU: ${targetSku}`);
      return;
    }

    console.log(`📦 Found in group: ${itemGroup.name}`);
    
    // Find the specific item in the group
    const targetItem = itemGroup.items.find(item => item.sku === targetSku);
    
    if (!targetItem) {
      console.log(`❌ Item not found in group: ${targetSku}`);
      return;
    }

    console.log(`📋 Item details:`);
    console.log(`- Name: ${targetItem.name}`);
    console.log(`- SKU: ${targetItem.sku}`);
    console.log(`- Cost Price: ${targetItem.costPrice || 0}`);

    // Find TVM warehouse stock
    const tvmStock = targetItem.warehouseStocks?.find(ws => 
      ws.warehouse && (
        ws.warehouse.toLowerCase().includes('trivandrum') ||
        ws.warehouse.toLowerCase().includes('tvm') ||
        ws.warehouse === 'Grooms Trivandrum'
      )
    );

    if (!tvmStock) {
      console.log('❌ No TVM warehouse stock found for this item');
      return;
    }

    console.log(`\n📊 Current TVM Stock Status:`);
    console.log(`- Warehouse: ${tvmStock.warehouse}`);
    console.log(`- Stock On Hand: ${tvmStock.stockOnHand || 0}`);
    console.log(`- Physical Stock: ${tvmStock.physicalStockOnHand || 0}`);
    console.log(`- Available for Sale: ${tvmStock.availableForSale || 0}`);
    console.log(`- Opening Stock: ${tvmStock.openingStock || 0}`);
    console.log(`- Opening Stock Value: ${tvmStock.openingStockValue || 0}`);

    // Check January sales for this specific item
    console.log(`\n📋 Checking January 2026 sales for ${targetSku}...`);
    
    const januarySales = await SalesInvoice.find({
      'lineItems.itemCode': targetSku,
      invoiceDate: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      },
      $or: [
        { branch: /trivandrum/i },
        { branch: /tvm/i },
        { locCode: '702' }
      ]
    }).lean();

    console.log(`Found ${januarySales.length} January sales invoices for ${targetSku} in TVM:`);
    
    let totalSoldQuantity = 0;
    let invoiceCount = 0;
    januarySales.forEach(invoice => {
      const lineItem = invoice.lineItems.find(li => li.itemCode === targetSku);
      if (lineItem) {
        totalSoldQuantity += lineItem.quantity || 0;
        invoiceCount++;
        console.log(`- Invoice ${invoice.invoiceNumber}: ${lineItem.quantity} pieces (${invoice.invoiceDate?.toDateString()}) - Customer: ${invoice.customer}`);
      }
    });

    console.log(`\nSales Summary:`);
    console.log(`- Total invoices: ${invoiceCount}`);
    console.log(`- Total quantity sold: ${totalSoldQuantity} pieces`);

    // Check transfers for this item
    console.log(`\n🚚 Checking transfers for ${targetSku}...`);
    
    // Incoming transfers to TVM
    const incomingTransfers = await TransferOrder.find({
      'lineItems.itemCode': targetSku,
      destinationWarehouse: /trivandrum|tvm/i,
      status: 'transferred',
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalReceived = 0;
    incomingTransfers.forEach(transfer => {
      const lineItem = transfer.lineItems.find(li => li.itemCode === targetSku);
      if (lineItem) {
        totalReceived += lineItem.quantity || 0;
        console.log(`+ Transfer IN ${transfer.transferOrderNumber}: ${lineItem.quantity} pieces from ${transfer.sourceWarehouse} (${transfer.date?.toDateString()})`);
      }
    });

    // Outgoing transfers from TVM
    const outgoingTransfers = await TransferOrder.find({
      'lineItems.itemCode': targetSku,
      sourceWarehouse: /trivandrum|tvm/i,
      status: 'transferred',
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalTransferredOut = 0;
    outgoingTransfers.forEach(transfer => {
      const lineItem = transfer.lineItems.find(li => li.itemCode === targetSku);
      if (lineItem) {
        totalTransferredOut += lineItem.quantity || 0;
        console.log(`- Transfer OUT ${transfer.transferOrderNumber}: ${lineItem.quantity} pieces to ${transfer.destinationWarehouse} (${transfer.date?.toDateString()})`);
      }
    });

    console.log(`\nTransfer Summary:`);
    console.log(`- Total received: ${totalReceived} pieces`);
    console.log(`- Total transferred out: ${totalTransferredOut} pieces`);

    // Check inventory adjustments
    console.log(`\n⚖️ Checking inventory adjustments for ${targetSku}...`);
    
    const adjustments = await InventoryAdjustment.find({
      'lineItems.itemCode': targetSku,
      branch: /trivandrum|tvm/i,
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalAdjustments = 0;
    adjustments.forEach(adj => {
      const lineItem = adj.lineItems.find(li => li.itemCode === targetSku);
      if (lineItem) {
        const adjustment = (lineItem.adjustedQuantity || 0) - (lineItem.currentQuantity || 0);
        totalAdjustments += adjustment;
        console.log(`${adjustment > 0 ? '+' : ''}${adjustment} Adjustment ${adj.referenceNumber}: ${lineItem.currentQuantity} → ${lineItem.adjustedQuantity} (${adj.date?.toDateString()})`);
      }
    });

    console.log(`Total adjustments: ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);

    // Calculate expected vs actual stock
    console.log(`\n🧮 STOCK RECONCILIATION FOR ${targetSku}:`);
    console.log('================================================');
    
    const openingStock = tvmStock.openingStock || 0;
    const currentSystemStock = tvmStock.stockOnHand || 0;
    const physicalSystemStock = tvmStock.physicalStockOnHand || 0;
    
    // Calculate expected stock
    const expectedStock = openingStock + totalReceived - totalSoldQuantity - totalTransferredOut + totalAdjustments;
    
    console.log(`Opening Stock (Jan 1):     ${openingStock} pieces`);
    console.log(`+ Transfers IN:            ${totalReceived} pieces`);
    console.log(`- Sales (${invoiceCount} invoices):        ${totalSoldQuantity} pieces`);
    console.log(`- Transfers OUT:           ${totalTransferredOut} pieces`);
    console.log(`+/- Adjustments:           ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);
    console.log(`--------------------------------`);
    console.log(`Expected Stock:            ${expectedStock} pieces`);
    console.log(`Current System Stock:      ${currentSystemStock} pieces`);
    console.log(`Physical System Stock:     ${physicalSystemStock} pieces`);
    console.log(`Manual Count (Reported):   80 pieces`);
    console.log(`--------------------------------`);
    
    const systemVsExpected = currentSystemStock - expectedStock;
    const systemVsManual = currentSystemStock - 80;
    const expectedVsManual = expectedStock - 80;
    
    console.log(`System vs Expected:        ${systemVsExpected > 0 ? '+' : ''}${systemVsExpected} pieces`);
    console.log(`System vs Manual:          ${systemVsManual > 0 ? '+' : ''}${systemVsManual} pieces`);
    console.log(`Expected vs Manual:        ${expectedVsManual > 0 ? '+' : ''}${expectedVsManual} pieces`);

    // Identify the specific issues
    console.log(`\n🔍 ISSUE ANALYSIS:`);
    console.log('==================');
    
    if (openingStock !== 103) {
      console.log(`❌ ISSUE 1: Opening stock is ${openingStock}, but you reported it should be 103`);
      console.log('   This is likely the main cause of the discrepancy');
    }
    
    if (totalSoldQuantity !== 29) {
      console.log(`❌ ISSUE 2: Total sold quantity is ${totalSoldQuantity}, but you expected 29 invoices`);
      console.log('   This could mean:');
      console.log('   - Some invoices have different quantities than expected');
      console.log('   - Some invoices are missing or not properly recorded');
      console.log('   - The item code matching is not working correctly');
    }
    
    if (Math.abs(systemVsExpected) > 0) {
      console.log(`❌ ISSUE 3: System stock (${currentSystemStock}) doesn't match calculated expected stock (${expectedStock})`);
      console.log('   This suggests stock update functions may not be working correctly');
    }
    
    if (Math.abs(systemVsManual) > 0) {
      console.log(`❌ ISSUE 4: System stock (${currentSystemStock}) doesn't match manual count (80)`);
      console.log('   This suggests either:');
      console.log('   - Physical stock loss/damage not recorded in system');
      console.log('   - Unrecorded transactions');
      console.log('   - Manual counting errors');
    }

    // Provide specific recommendations
    console.log(`\n💡 SPECIFIC RECOMMENDATIONS:`);
    console.log('============================');
    
    if (openingStock !== 103) {
      console.log(`1. ✅ CRITICAL: Update opening stock from ${openingStock} to 103 pieces`);
      console.log(`   This will fix the main discrepancy`);
    }
    
    if (Math.abs(currentSystemStock - 80) > 0) {
      console.log(`2. ✅ Create inventory adjustment to align system stock with manual count`);
      console.log(`   Adjust from ${currentSystemStock} to 80 pieces (${80 - currentSystemStock > 0 ? '+' : ''}${80 - currentSystemStock} adjustment)`);
    }
    
    console.log(`3. ✅ Verify all ${invoiceCount} sales invoices are correct and stock was properly deducted`);
    console.log(`4. ✅ Check if there are any unrecorded transactions or physical losses`);
    console.log(`5. ✅ Implement regular stock reconciliation processes`);

    // Show the corrected calculation
    if (openingStock !== 103) {
      console.log(`\n🔧 CORRECTED CALCULATION (with opening stock = 103):`);
      console.log('===================================================');
      const correctedExpected = 103 + totalReceived - totalSoldQuantity - totalTransferredOut + totalAdjustments;
      console.log(`Opening Stock (Corrected): 103 pieces`);
      console.log(`+ Transfers IN:            ${totalReceived} pieces`);
      console.log(`- Sales:                   ${totalSoldQuantity} pieces`);
      console.log(`- Transfers OUT:           ${totalTransferredOut} pieces`);
      console.log(`+/- Adjustments:           ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);
      console.log(`--------------------------------`);
      console.log(`Corrected Expected:        ${correctedExpected} pieces`);
      console.log(`Manual Count:              80 pieces`);
      console.log(`Difference:                ${correctedExpected - 80 > 0 ? '+' : ''}${correctedExpected - 80} pieces`);
      
      if (Math.abs(correctedExpected - 80) <= 5) {
        console.log(`✅ This difference is within acceptable range (±5 pieces)`);
      } else {
        console.log(`❌ This difference suggests additional unrecorded transactions or losses`);
      }
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

analyzeSpecificTVMItem();