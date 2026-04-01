// Debug TVM Grooms Stock Issue - Comprehensive Analysis
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';
import SalesInvoice from './model/SalesInvoice.js';
import TransferOrder from './model/TransferOrder.js';
import InventoryAdjustment from './model/InventoryAdjustment.js';

dotenv.config();

async function debugTVMGroomsStock() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    console.log('🔍 DEBUGGING TVM GROOMS STOCK DISCREPANCY');
    console.log('==========================================\n');

    // Step 1: Search for Grooms items more broadly
    console.log('📋 Step 1: Searching for Grooms items...');
    
    // Search in standalone items
    const standaloneGrooms = await ShoeItem.find({
      $or: [
        { itemName: /groom/i },
        { itemCode: /groom/i },
        { category: /groom/i },
        { brand: /groom/i },
        { itemName: /GRM/i },
        { itemCode: /GRM/i },
        { sku: /GRM/i }
      ]
    }).lean();

    console.log(`Found ${standaloneGrooms.length} standalone Grooms items:`);
    standaloneGrooms.forEach(item => {
      console.log(`- ${item.itemCode || item.sku}: ${item.itemName}`);
      if (item.warehouseStocks) {
        item.warehouseStocks.forEach(ws => {
          if (ws.warehouse && ws.warehouse.toLowerCase().includes('trivandrum')) {
            console.log(`  TVM Stock: ${ws.stockOnHand || 0} (Physical: ${ws.physicalStockOnHand || 0})`);
          }
        });
      }
    });

    // Search in item groups
    const gromsGroups = await ItemGroup.find({
      $or: [
        { name: /groom/i },
        { category: /groom/i },
        { 'items.name': /groom/i },
        { 'items.sku': /groom/i }
      ]
    }).lean();

    console.log(`\nFound ${gromsGroups.length} Grooms item groups:`);
    let gromsGroupItems = [];
    gromsGroups.forEach(group => {
      console.log(`- Group: ${group.name} (${group.items?.length || 0} items)`);
      if (group.items) {
        group.items.forEach(item => {
          if (item.name && item.name.toLowerCase().includes('groom')) {
            gromsGroupItems.push({ ...item, groupName: group.name, groupId: group._id });
            console.log(`  - ${item.sku}: ${item.name}`);
            if (item.warehouseStocks) {
              item.warehouseStocks.forEach(ws => {
                if (ws.warehouse && ws.warehouse.toLowerCase().includes('trivandrum')) {
                  console.log(`    TVM Stock: ${ws.stockOnHand || 0} (Physical: ${ws.physicalStockOnHand || 0})`);
                }
              });
            }
          }
        });
      }
    });

    // If no Grooms items found, let's look at all items with TVM stock
    if (standaloneGrooms.length === 0 && gromsGroupItems.length === 0) {
      console.log('\n❌ No Grooms items found. Checking all items with TVM stock...');
      
      // Check standalone items with TVM stock
      const tvmStandaloneItems = await ShoeItem.find({
        'warehouseStocks.warehouse': /trivandrum|tvm/i,
        'warehouseStocks.stockOnHand': { $gt: 0 }
      }).lean();

      console.log(`Found ${tvmStandaloneItems.length} standalone items with TVM stock:`);
      tvmStandaloneItems.forEach(item => {
        console.log(`- ${item.itemCode || item.sku}: ${item.itemName}`);
        item.warehouseStocks?.forEach(ws => {
          if (ws.warehouse && ws.warehouse.toLowerCase().includes('trivandrum')) {
            console.log(`  TVM Stock: ${ws.stockOnHand || 0}`);
          }
        });
      });

      // Check item groups with TVM stock
      const tvmGroups = await ItemGroup.find({
        'items.warehouseStocks.warehouse': /trivandrum|tvm/i,
        'items.warehouseStocks.stockOnHand': { $gt: 0 }
      }).lean();

      console.log(`\nFound ${tvmGroups.length} item groups with TVM stock:`);
      tvmGroups.forEach(group => {
        console.log(`- Group: ${group.name}`);
        group.items?.forEach(item => {
          const tvmStock = item.warehouseStocks?.find(ws => 
            ws.warehouse && ws.warehouse.toLowerCase().includes('trivandrum')
          );
          if (tvmStock && tvmStock.stockOnHand > 0) {
            console.log(`  - ${item.sku}: ${item.name} - TVM Stock: ${tvmStock.stockOnHand}`);
          }
        });
      });
    }

    // Step 2: Analyze the stock calculation problem
    console.log('\n🧮 Step 2: Stock Calculation Analysis...');
    
    // Let's assume we're looking at a specific item with the discrepancy
    // For now, let's analyze the first item we find with TVM stock
    let targetItem = null;
    let isFromGroup = false;
    let groupInfo = null;

    if (standaloneGrooms.length > 0) {
      targetItem = standaloneGrooms[0];
      console.log(`Analyzing standalone item: ${targetItem.itemName}`);
    } else if (gromsGroupItems.length > 0) {
      targetItem = gromsGroupItems[0];
      isFromGroup = true;
      groupInfo = { name: targetItem.groupName, id: targetItem.groupId };
      console.log(`Analyzing group item: ${targetItem.name} from group ${targetItem.groupName}`);
    } else {
      // Use any item with TVM stock for analysis
      const anyTvmItem = await ShoeItem.findOne({
        'warehouseStocks.warehouse': /trivandrum|tvm/i
      }).lean();
      
      if (anyTvmItem) {
        targetItem = anyTvmItem;
        console.log(`Analyzing any TVM item: ${targetItem.itemName}`);
      }
    }

    if (!targetItem) {
      console.log('❌ No items with TVM stock found for analysis');
      return;
    }

    // Get TVM warehouse stock
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

    console.log('\n📊 Current Stock Status:');
    console.log(`Item: ${targetItem.itemName || targetItem.name}`);
    console.log(`SKU: ${targetItem.sku || targetItem.itemCode}`);
    console.log(`Warehouse: ${tvmStock.warehouse}`);
    console.log(`Stock On Hand: ${tvmStock.stockOnHand || 0}`);
    console.log(`Physical Stock: ${tvmStock.physicalStockOnHand || 0}`);
    console.log(`Available for Sale: ${tvmStock.availableForSale || 0}`);
    console.log(`Opening Stock: ${tvmStock.openingStock || 0}`);

    // Step 3: Check January sales for this item
    console.log('\n📋 Step 3: Checking January sales...');
    
    const itemCode = targetItem.sku || targetItem.itemCode || targetItem.itemName || targetItem.name;
    
    const januarySales = await SalesInvoice.find({
      'lineItems.itemCode': itemCode,
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

    console.log(`Found ${januarySales.length} January sales invoices for this item in TVM:`);
    
    let totalSoldQuantity = 0;
    januarySales.forEach(invoice => {
      const lineItem = invoice.lineItems.find(li => li.itemCode === itemCode);
      if (lineItem) {
        totalSoldQuantity += lineItem.quantity || 0;
        console.log(`- Invoice ${invoice.invoiceNumber}: ${lineItem.quantity} pieces (${invoice.invoiceDate?.toDateString()})`);
      }
    });

    console.log(`Total sold in January: ${totalSoldQuantity} pieces`);

    // Step 4: Check transfers
    console.log('\n🚚 Step 4: Checking transfers...');
    
    const incomingTransfers = await TransferOrder.find({
      'lineItems.itemCode': itemCode,
      destinationWarehouse: /trivandrum|tvm/i,
      status: 'transferred',
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalReceived = 0;
    incomingTransfers.forEach(transfer => {
      const lineItem = transfer.lineItems.find(li => li.itemCode === itemCode);
      if (lineItem) {
        totalReceived += lineItem.quantity || 0;
        console.log(`+ Transfer IN ${transfer.transferOrderNumber}: ${lineItem.quantity} pieces from ${transfer.sourceWarehouse}`);
      }
    });

    const outgoingTransfers = await TransferOrder.find({
      'lineItems.itemCode': itemCode,
      sourceWarehouse: /trivandrum|tvm/i,
      status: 'transferred',
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalTransferredOut = 0;
    outgoingTransfers.forEach(transfer => {
      const lineItem = transfer.lineItems.find(li => li.itemCode === itemCode);
      if (lineItem) {
        totalTransferredOut += lineItem.quantity || 0;
        console.log(`- Transfer OUT ${transfer.transferOrderNumber}: ${lineItem.quantity} pieces to ${transfer.destinationWarehouse}`);
      }
    });

    console.log(`Total received: ${totalReceived} pieces`);
    console.log(`Total transferred out: ${totalTransferredOut} pieces`);

    // Step 5: Check inventory adjustments
    console.log('\n⚖️ Step 5: Checking inventory adjustments...');
    
    const adjustments = await InventoryAdjustment.find({
      'lineItems.itemCode': itemCode,
      branch: /trivandrum|tvm/i,
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalAdjustments = 0;
    adjustments.forEach(adj => {
      const lineItem = adj.lineItems.find(li => li.itemCode === itemCode);
      if (lineItem) {
        const adjustment = (lineItem.adjustedQuantity || 0) - (lineItem.currentQuantity || 0);
        totalAdjustments += adjustment;
        console.log(`${adjustment > 0 ? '+' : ''}${adjustment} Adjustment ${adj.referenceNumber}: ${lineItem.currentQuantity} → ${lineItem.adjustedQuantity}`);
      }
    });

    console.log(`Total adjustments: ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);

    // Step 6: Calculate expected vs actual
    console.log('\n🧮 Step 6: Stock Calculation Summary...');
    
    const openingStock = tvmStock.openingStock || 103; // Use reported opening stock
    const expectedStock = openingStock + totalReceived - totalSoldQuantity - totalTransferredOut + totalAdjustments;
    const currentSystemStock = tvmStock.stockOnHand || 0;
    const physicalStock = tvmStock.physicalStockOnHand || 0;
    const manualCount = 80; // As reported

    console.log('\n📊 STOCK RECONCILIATION:');
    console.log('========================');
    console.log(`Opening Stock (Jan 1):     ${openingStock} pieces`);
    console.log(`+ Transfers IN:            ${totalReceived} pieces`);
    console.log(`- Sales (invoices):        ${totalSoldQuantity} pieces`);
    console.log(`- Transfers OUT:           ${totalTransferredOut} pieces`);
    console.log(`+/- Adjustments:           ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);
    console.log(`--------------------------------`);
    console.log(`Expected Stock:            ${expectedStock} pieces`);
    console.log(`Current System Stock:      ${currentSystemStock} pieces`);
    console.log(`Physical System Stock:     ${physicalStock} pieces`);
    console.log(`Manual Count (Actual):     ${manualCount} pieces`);
    console.log(`--------------------------------`);
    console.log(`System vs Expected:        ${currentSystemStock - expectedStock > 0 ? '+' : ''}${currentSystemStock - expectedStock} pieces`);
    console.log(`System vs Manual:          ${currentSystemStock - manualCount > 0 ? '+' : ''}${currentSystemStock - manualCount} pieces`);
    console.log(`Expected vs Manual:        ${expectedStock - manualCount > 0 ? '+' : ''}${expectedStock - manualCount} pieces`);

    // Step 7: Identify the root cause
    console.log('\n🔍 ROOT CAUSE ANALYSIS:');
    console.log('=======================');
    
    if (totalSoldQuantity !== 29) {
      console.log(`❌ ISSUE 1: Expected 29 sales but found ${totalSoldQuantity} total quantity sold`);
      console.log('   This could mean:');
      console.log('   - Some invoices have multiple quantities per line item');
      console.log('   - Some invoices are not properly recorded');
      console.log('   - The item code matching is not working correctly');
    }

    if (Math.abs(currentSystemStock - expectedStock) > 0) {
      console.log(`❌ ISSUE 2: System stock (${currentSystemStock}) ≠ Expected stock (${expectedStock})`);
      console.log('   This could mean:');
      console.log('   - Stock update functions are not working correctly');
      console.log('   - Some transactions are not updating stock properly');
      console.log('   - Data corruption in warehouseStocks');
    }

    if (Math.abs(currentSystemStock - manualCount) > 0) {
      console.log(`❌ ISSUE 3: System stock (${currentSystemStock}) ≠ Manual count (${manualCount})`);
      console.log('   This could mean:');
      console.log('   - Physical stock loss or damage not recorded');
      console.log('   - Unrecorded sales or transfers');
      console.log('   - Manual counting errors');
      console.log('   - System not reflecting actual transactions');
    }

    // Step 8: Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    console.log('1. Verify the opening stock was correctly set to 103 pieces');
    console.log('2. Check if all 29 invoices are properly recorded and stock was deducted');
    console.log('3. Verify no unrecorded transfers or adjustments occurred');
    console.log('4. Consider running a stock reconciliation/adjustment');
    console.log('5. Implement better stock tracking and validation');

    // Step 9: Suggested fix
    if (Math.abs(currentSystemStock - manualCount) > 0) {
      console.log('\n🔧 SUGGESTED STOCK CORRECTION:');
      console.log('==============================');
      console.log(`Current System Stock: ${currentSystemStock}`);
      console.log(`Manual Count (Actual): ${manualCount}`);
      console.log(`Adjustment needed: ${manualCount - currentSystemStock > 0 ? '+' : ''}${manualCount - currentSystemStock} pieces`);
      console.log('\nTo fix this, you should create an inventory adjustment to align system stock with physical count.');
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

debugTVMGroomsStock();