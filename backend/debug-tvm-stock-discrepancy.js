// Debug TVM Stock Discrepancy - Grooms Trivandrum
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SalesInvoice from './model/SalesInvoice.js';
import ShoeItem from './model/ShoeItem.js';
import TransferOrder from './model/TransferOrder.js';
import InventoryAdjustment from './model/InventoryAdjustment.js';
import Transaction from './model/Transaction.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

async function debugTVMStockDiscrepancy() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected\n');

    console.log('🔍 DEBUGGING TVM STOCK DISCREPANCY');
    console.log('==================================\n');

    // Step 1: Find the specific item (Grooms) in TVM
    console.log('📋 Step 1: Finding Grooms items in TVM...');
    const gromsItems = await ShoeItem.find({
      $or: [
        { itemName: /groom/i },
        { itemCode: /groom/i },
        { category: /groom/i }
      ]
    }).lean();

    console.log(`Found ${gromsItems.length} Grooms items:`);
    gromsItems.forEach(item => {
      console.log(`- ${item.itemCode}: ${item.itemName} | TVM Stock: ${item.tvmStock || 0}`);
    });

    if (gromsItems.length === 0) {
      console.log('❌ No Grooms items found. Searching for items with TVM stock...');
      
      const tvmItems = await ShoeItem.find({
        tvmStock: { $gt: 0 }
      }).limit(10).lean();
      
      console.log(`\nItems with TVM stock:`);
      tvmItems.forEach(item => {
        console.log(`- ${item.itemCode}: ${item.itemName} | TVM Stock: ${item.tvmStock}`);
      });
      
      return;
    }

    // Focus on the first Grooms item for detailed analysis
    const targetItem = gromsItems[0];
    console.log(`\n🎯 Analyzing item: ${targetItem.itemCode} - ${targetItem.itemName}`);
    console.log(`Current TVM Stock: ${targetItem.tvmStock || 0}`);

    // Step 2: Check opening stock for January
    console.log('\n📊 Step 2: Checking opening stock...');
    const openingStock = targetItem.openingStock || 0;
    console.log(`Opening Stock: ${openingStock}`);

    // Step 3: Find all sales invoices for this item in TVM
    console.log('\n📋 Step 3: Finding sales invoices for this item in TVM...');
    const salesInvoices = await SalesInvoice.find({
      'lineItems.itemCode': targetItem.itemCode,
      $or: [
        { branch: /trivandrum/i },
        { branch: /tvm/i },
        { locCode: '702' } // TVM location code
      ],
      invoiceDate: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    console.log(`Found ${salesInvoices.length} sales invoices in TVM for January`);
    
    let totalSold = 0;
    salesInvoices.forEach(invoice => {
      const lineItem = invoice.lineItems.find(item => item.itemCode === targetItem.itemCode);
      if (lineItem) {
        totalSold += lineItem.quantity || 0;
        console.log(`- Invoice ${invoice.invoiceNumber}: ${lineItem.quantity} pieces (${invoice.invoiceDate.toDateString()})`);
      }
    });

    console.log(`\nTotal sold in January: ${totalSold} pieces`);

    // Step 4: Check transfer orders (incoming/outgoing)
    console.log('\n🚚 Step 4: Checking transfer orders...');
    
    // Incoming transfers to TVM
    const incomingTransfers = await TransferOrder.find({
      'lineItems.itemCode': targetItem.itemCode,
      destinationWarehouse: /trivandrum|tvm/i,
      status: 'transferred',
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalReceived = 0;
    incomingTransfers.forEach(transfer => {
      const lineItem = transfer.lineItems.find(item => item.itemCode === targetItem.itemCode);
      if (lineItem) {
        totalReceived += lineItem.quantity || 0;
        console.log(`+ Transfer IN ${transfer.transferOrderNumber}: ${lineItem.quantity} pieces from ${transfer.sourceWarehouse}`);
      }
    });

    // Outgoing transfers from TVM
    const outgoingTransfers = await TransferOrder.find({
      'lineItems.itemCode': targetItem.itemCode,
      sourceWarehouse: /trivandrum|tvm/i,
      status: 'transferred',
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalTransferredOut = 0;
    outgoingTransfers.forEach(transfer => {
      const lineItem = transfer.lineItems.find(item => item.itemCode === targetItem.itemCode);
      if (lineItem) {
        totalTransferredOut += lineItem.quantity || 0;
        console.log(`- Transfer OUT ${transfer.transferOrderNumber}: ${lineItem.quantity} pieces to ${transfer.destinationWarehouse}`);
      }
    });

    console.log(`\nTotal received via transfers: ${totalReceived} pieces`);
    console.log(`Total transferred out: ${totalTransferredOut} pieces`);

    // Step 5: Check inventory adjustments
    console.log('\n⚖️ Step 5: Checking inventory adjustments...');
    const adjustments = await InventoryAdjustment.find({
      'lineItems.itemCode': targetItem.itemCode,
      branch: /trivandrum|tvm/i,
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalAdjustments = 0;
    adjustments.forEach(adj => {
      const lineItem = adj.lineItems.find(item => item.itemCode === targetItem.itemCode);
      if (lineItem) {
        const adjustment = lineItem.adjustedQuantity - lineItem.currentQuantity;
        totalAdjustments += adjustment;
        console.log(`${adjustment > 0 ? '+' : ''}${adjustment} Adjustment ${adj.referenceNumber}: ${lineItem.currentQuantity} → ${lineItem.adjustedQuantity}`);
      }
    });

    console.log(`\nTotal adjustments: ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);

    // Step 6: Calculate expected stock
    console.log('\n🧮 Step 6: Stock calculation analysis...');
    const expectedStock = openingStock + totalReceived - totalSold - totalTransferredOut + totalAdjustments;
    const currentStock = targetItem.tvmStock || 0;
    const discrepancy = currentStock - expectedStock;

    console.log('\n📊 STOCK CALCULATION SUMMARY:');
    console.log('============================');
    console.log(`Opening Stock (Jan 1):     ${openingStock} pieces`);
    console.log(`+ Transfers IN:            ${totalReceived} pieces`);
    console.log(`- Sales (29 invoices):     ${totalSold} pieces`);
    console.log(`- Transfers OUT:           ${totalTransferredOut} pieces`);
    console.log(`+/- Adjustments:           ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);
    console.log(`--------------------------------`);
    console.log(`Expected Stock:            ${expectedStock} pieces`);
    console.log(`Current System Stock:      ${currentStock} pieces`);
    console.log(`Manual Count:              80 pieces (as reported)`);
    console.log(`--------------------------------`);
    console.log(`System vs Expected:        ${discrepancy > 0 ? '+' : ''}${discrepancy} pieces`);
    console.log(`System vs Manual:          ${currentStock - 80 > 0 ? '+' : ''}${currentStock - 80} pieces`);
    console.log(`Expected vs Manual:        ${expectedStock - 80 > 0 ? '+' : ''}${expectedStock - 80} pieces`);

    // Step 7: Identify potential issues
    console.log('\n🔍 POTENTIAL ISSUES:');
    console.log('===================');
    
    if (Math.abs(discrepancy) > 0) {
      console.log(`❌ System stock (${currentStock}) doesn't match calculated stock (${expectedStock})`);
      console.log('   Possible causes:');
      console.log('   - Stock update function not working correctly');
      console.log('   - Missing or duplicate stock transactions');
      console.log('   - Data corruption in stock fields');
    }

    if (Math.abs(currentStock - 80) > 0) {
      console.log(`❌ System stock (${currentStock}) doesn't match manual count (80)`);
      console.log('   Possible causes:');
      console.log('   - Unrecorded sales or transfers');
      console.log('   - Physical stock loss/damage');
      console.log('   - Counting errors');
    }

    if (totalSold !== 29) {
      console.log(`❌ Expected 29 invoices but found ${salesInvoices.length} invoices with ${totalSold} total quantity`);
      console.log('   Check if:');
      console.log('   - Some invoices have multiple quantities per line item');
      console.log('   - Some invoices are missing from the query');
      console.log('   - Date range or branch filter is incorrect');
    }

    // Step 8: Check recent stock update transactions
    console.log('\n📝 Step 8: Recent stock update history...');
    const recentTransactions = await Transaction.find({
      $or: [
        { remark: new RegExp(targetItem.itemCode, 'i') },
        { customerName: new RegExp(targetItem.itemCode, 'i') }
      ],
      locCode: '702', // TVM
      date: {
        $gte: new Date('2026-01-01')
      }
    }).sort({ date: -1 }).limit(5).lean();

    console.log(`Found ${recentTransactions.length} recent transactions:`);
    recentTransactions.forEach(txn => {
      console.log(`- ${txn.date.toDateString()}: ${txn.type} - ${txn.remark || txn.customerName}`);
    });

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

debugTVMStockDiscrepancy();