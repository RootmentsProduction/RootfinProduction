// Find Root Cause of Stock Discrepancy in Grooms Trivandrum
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';
import SalesInvoice from './model/SalesInvoice.js';
import TransferOrder from './model/TransferOrder.js';
import InventoryAdjustment from './model/InventoryAdjustment.js';

dotenv.config();

async function findRootCauseStockDiscrepancy() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    console.log('🔍 FINDING ROOT CAUSE OF STOCK DISCREPANCY');
    console.log('==========================================');
    console.log('Expected: 103 - 29 = 74 pieces');
    console.log('Actual: 89 pieces');
    console.log('Manual Count: 80 pieces');
    console.log('Discrepancy: +15 pieces (89 - 74)\n');

    // Step 1: Get all items in Grooms Trivandrum and their opening stock
    console.log('📊 Step 1: Calculating TOTAL OPENING STOCK for Grooms Trivandrum...');
    
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    let totalOpeningStock = 0;
    let totalCurrentStock = 0;
    let itemsWithStock = [];

    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach(item => {
          const groomsStock = item.warehouseStocks?.find(ws => 
            ws.warehouse && (
              ws.warehouse.toLowerCase().includes('grooms') && 
              ws.warehouse.toLowerCase().includes('trivandrum')
            )
          );
          
          if (groomsStock) {
            const openingStock = groomsStock.openingStock || 0;
            const currentStock = groomsStock.stockOnHand || 0;
            
            if (openingStock > 0 || currentStock > 0) {
              totalOpeningStock += openingStock;
              totalCurrentStock += currentStock;
              
              itemsWithStock.push({
                sku: item.sku,
                name: item.name,
                groupName: group.name,
                openingStock: openingStock,
                currentStock: currentStock,
                warehouse: groomsStock.warehouse
              });
            }
          }
        });
      }
    });

    console.log(`Total Opening Stock: ${totalOpeningStock} pieces`);
    console.log(`Total Current Stock: ${totalCurrentStock} pieces`);
    console.log(`Items with stock: ${itemsWithStock.length}`);

    // Show items with significant opening stock
    console.log('\nItems with opening stock:');
    itemsWithStock
      .filter(item => item.openingStock > 0)
      .sort((a, b) => b.openingStock - a.openingStock)
      .forEach(item => {
        console.log(`- ${item.sku}: Opening=${item.openingStock}, Current=${item.currentStock}`);
      });

    // Step 2: Calculate TOTAL SALES in January for Grooms Trivandrum
    console.log('\n📋 Step 2: Calculating TOTAL SALES for January 2026...');
    
    const januaryInvoices = await SalesInvoice.find({
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

    console.log(`Found ${januaryInvoices.length} January invoices in Grooms Trivandrum`);

    let totalSalesQuantity = 0;
    let salesByItem = {};

    januaryInvoices.forEach(invoice => {
      if (invoice.lineItems && Array.isArray(invoice.lineItems)) {
        invoice.lineItems.forEach(lineItem => {
          const quantity = lineItem.quantity || 0;
          totalSalesQuantity += quantity;
          
          const itemCode = lineItem.itemCode || 'Unknown';
          if (!salesByItem[itemCode]) {
            salesByItem[itemCode] = { quantity: 0, invoices: 0 };
          }
          salesByItem[itemCode].quantity += quantity;
          salesByItem[itemCode].invoices++;
        });
      }
    });

    console.log(`Total Sales Quantity: ${totalSalesQuantity} pieces`);
    console.log(`Total Sales Invoices: ${januaryInvoices.length}`);

    // Show top selling items
    console.log('\nTop 10 items sold in January:');
    Object.entries(salesByItem)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 10)
      .forEach(([itemCode, data]) => {
        console.log(`- ${itemCode}: ${data.quantity} pieces (${data.invoices} invoices)`);
      });

    // Step 3: Check TRANSFERS IN to Grooms Trivandrum
    console.log('\n📦 Step 3: Checking TRANSFERS IN to Grooms Trivandrum...');
    
    const transfersIn = await TransferOrder.find({
      destinationWarehouse: /grooms.*trivandrum/i,
      status: 'transferred',
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalTransfersIn = 0;
    transfersIn.forEach(transfer => {
      if (transfer.lineItems && Array.isArray(transfer.lineItems)) {
        transfer.lineItems.forEach(lineItem => {
          totalTransfersIn += lineItem.quantity || 0;
        });
      }
    });

    console.log(`Transfers IN: ${transfersIn.length} orders, ${totalTransfersIn} pieces`);
    
    if (transfersIn.length > 0) {
      console.log('Transfer details:');
      transfersIn.forEach(transfer => {
        const totalQty = transfer.lineItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        console.log(`- ${transfer.transferOrderNumber}: +${totalQty} pieces from ${transfer.sourceWarehouse} (${transfer.date?.toDateString()})`);
      });
    }

    // Step 4: Check TRANSFERS OUT from Grooms Trivandrum
    console.log('\n📤 Step 4: Checking TRANSFERS OUT from Grooms Trivandrum...');
    
    const transfersOut = await TransferOrder.find({
      sourceWarehouse: /grooms.*trivandrum/i,
      status: 'transferred',
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalTransfersOut = 0;
    transfersOut.forEach(transfer => {
      if (transfer.lineItems && Array.isArray(transfer.lineItems)) {
        transfer.lineItems.forEach(lineItem => {
          totalTransfersOut += lineItem.quantity || 0;
        });
      }
    });

    console.log(`Transfers OUT: ${transfersOut.length} orders, ${totalTransfersOut} pieces`);
    
    if (transfersOut.length > 0) {
      console.log('Transfer details:');
      transfersOut.forEach(transfer => {
        const totalQty = transfer.lineItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        console.log(`- ${transfer.transferOrderNumber}: -${totalQty} pieces to ${transfer.destinationWarehouse} (${transfer.date?.toDateString()})`);
      });
    }

    // Step 5: Check INVENTORY ADJUSTMENTS
    console.log('\n⚖️ Step 5: Checking INVENTORY ADJUSTMENTS...');
    
    const adjustments = await InventoryAdjustment.find({
      branch: /grooms.*trivandrum/i,
      date: {
        $gte: new Date('2026-01-01'),
        $lt: new Date('2026-02-01')
      }
    }).lean();

    let totalAdjustments = 0;
    adjustments.forEach(adj => {
      if (adj.lineItems && Array.isArray(adj.lineItems)) {
        adj.lineItems.forEach(lineItem => {
          const currentQty = lineItem.currentQuantity || 0;
          const adjustedQty = lineItem.adjustedQuantity || 0;
          const adjustment = adjustedQty - currentQty;
          totalAdjustments += adjustment;
        });
      }
    });

    console.log(`Inventory Adjustments: ${adjustments.length} adjustments, ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);
    
    if (adjustments.length > 0) {
      console.log('Adjustment details:');
      adjustments.forEach(adj => {
        const totalAdj = adj.lineItems?.reduce((sum, item) => {
          return sum + ((item.adjustedQuantity || 0) - (item.currentQuantity || 0));
        }, 0) || 0;
        console.log(`- ${adj.referenceNumber}: ${totalAdj > 0 ? '+' : ''}${totalAdj} pieces (${adj.date?.toDateString()})`);
      });
    }

    // Step 6: COMPLETE STOCK RECONCILIATION
    console.log('\n🧮 Step 6: COMPLETE STOCK RECONCILIATION');
    console.log('========================================');
    
    const calculatedStock = totalOpeningStock + totalTransfersIn - totalSalesQuantity - totalTransfersOut + totalAdjustments;
    
    console.log(`Opening Stock (Total):     ${totalOpeningStock} pieces`);
    console.log(`+ Transfers IN:            ${totalTransfersIn} pieces`);
    console.log(`- Sales (${januaryInvoices.length} invoices):        ${totalSalesQuantity} pieces`);
    console.log(`- Transfers OUT:           ${totalTransfersOut} pieces`);
    console.log(`+/- Adjustments:           ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);
    console.log(`-----------------------------------`);
    console.log(`CALCULATED Stock:          ${calculatedStock} pieces`);
    console.log(`ACTUAL System Stock:       ${totalCurrentStock} pieces`);
    console.log(`MANUAL Count:              80 pieces`);
    console.log(`-----------------------------------`);
    
    const systemVsCalculated = totalCurrentStock - calculatedStock;
    const systemVsManual = totalCurrentStock - 80;
    const expectedVsActual = totalCurrentStock - 74; // Your expected 74
    
    console.log(`System vs Calculated:      ${systemVsCalculated > 0 ? '+' : ''}${systemVsCalculated} pieces`);
    console.log(`System vs Manual:          ${systemVsManual > 0 ? '+' : ''}${systemVsManual} pieces`);
    console.log(`System vs Expected (74):   ${expectedVsActual > 0 ? '+' : ''}${expectedVsActual} pieces`);

    // Step 7: IDENTIFY THE EXACT ROOT CAUSE
    console.log('\n🔍 Step 7: ROOT CAUSE ANALYSIS');
    console.log('==============================');
    
    console.log(`\n🎯 DISCREPANCY BREAKDOWN:`);
    console.log(`Expected (103 - 29):       74 pieces`);
    console.log(`Actual System:             ${totalCurrentStock} pieces`);
    console.log(`Difference:                ${totalCurrentStock - 74 > 0 ? '+' : ''}${totalCurrentStock - 74} pieces`);
    
    console.log(`\n🔍 CAUSES OF THE +${totalCurrentStock - 74} DISCREPANCY:`);
    
    // Cause 1: Opening stock difference
    if (totalOpeningStock !== 103) {
      const openingDiff = totalOpeningStock - 103;
      console.log(`❌ CAUSE 1: Opening stock is ${totalOpeningStock}, not 103 (${openingDiff > 0 ? '+' : ''}${openingDiff} difference)`);
      if (Math.abs(openingDiff) >= 10) {
        console.log(`   *** MAJOR CONTRIBUTOR: ${Math.abs(openingDiff)} pieces ***`);
      }
    } else {
      console.log(`✅ Opening stock is correct: ${totalOpeningStock} pieces`);
    }
    
    // Cause 2: Sales difference
    if (totalSalesQuantity !== 29) {
      const salesDiff = 29 - totalSalesQuantity;
      console.log(`❌ CAUSE 2: Sales are ${totalSalesQuantity} pieces, not 29 (${salesDiff > 0 ? '+' : ''}${salesDiff} difference in deduction)`);
      if (Math.abs(salesDiff) >= 10) {
        console.log(`   *** MAJOR CONTRIBUTOR: ${Math.abs(salesDiff)} pieces ***`);
      }
    } else {
      console.log(`✅ Sales quantity is correct: ${totalSalesQuantity} pieces`);
    }
    
    // Cause 3: Unexpected transfers IN
    if (totalTransfersIn > 0) {
      console.log(`❌ CAUSE 3: Unexpected transfers IN: +${totalTransfersIn} pieces`);
      if (totalTransfersIn >= 10) {
        console.log(`   *** MAJOR CONTRIBUTOR: +${totalTransfersIn} pieces ***`);
      }
    } else {
      console.log(`✅ No unexpected transfers IN`);
    }
    
    // Cause 4: Transfers OUT
    if (totalTransfersOut > 0) {
      console.log(`❌ CAUSE 4: Transfers OUT: -${totalTransfersOut} pieces (reduces stock)`);
    } else {
      console.log(`✅ No transfers OUT`);
    }
    
    // Cause 5: Inventory adjustments
    if (totalAdjustments !== 0) {
      console.log(`❌ CAUSE 5: Inventory adjustments: ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);
      if (Math.abs(totalAdjustments) >= 10) {
        console.log(`   *** MAJOR CONTRIBUTOR: ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces ***`);
      }
    } else {
      console.log(`✅ No inventory adjustments`);
    }

    // Cause 6: Stock calculation error
    if (Math.abs(systemVsCalculated) > 0) {
      console.log(`❌ CAUSE 6: Stock calculation error: System shows ${totalCurrentStock} but should be ${calculatedStock} (${systemVsCalculated > 0 ? '+' : ''}${systemVsCalculated} difference)`);
      if (Math.abs(systemVsCalculated) >= 10) {
        console.log(`   *** MAJOR CONTRIBUTOR: Stock update function error ***`);
      }
    } else {
      console.log(`✅ Stock calculation is correct`);
    }

    // Step 8: PROVIDE SPECIFIC SOLUTION
    console.log('\n💡 Step 8: SPECIFIC SOLUTION');
    console.log('============================');
    
    const mainCauses = [];
    
    if (Math.abs(totalOpeningStock - 103) >= 10) {
      mainCauses.push(`Opening stock: ${totalOpeningStock} vs 103 (${totalOpeningStock - 103 > 0 ? '+' : ''}${totalOpeningStock - 103})`);
    }
    
    if (Math.abs(totalSalesQuantity - 29) >= 10) {
      mainCauses.push(`Sales quantity: ${totalSalesQuantity} vs 29 (${29 - totalSalesQuantity > 0 ? '+' : ''}${29 - totalSalesQuantity} less deducted)`);
    }
    
    if (totalTransfersIn >= 10) {
      mainCauses.push(`Transfers IN: +${totalTransfersIn} unexpected pieces`);
    }
    
    if (Math.abs(totalAdjustments) >= 10) {
      mainCauses.push(`Adjustments: ${totalAdjustments > 0 ? '+' : ''}${totalAdjustments} pieces`);
    }
    
    if (Math.abs(systemVsCalculated) >= 10) {
      mainCauses.push(`Stock calculation error: ${systemVsCalculated > 0 ? '+' : ''}${systemVsCalculated} pieces`);
    }

    if (mainCauses.length > 0) {
      console.log('🎯 MAIN CAUSES OF THE DISCREPANCY:');
      mainCauses.forEach((cause, index) => {
        console.log(`${index + 1}. ${cause}`);
      });
    } else {
      console.log('✅ No major discrepancies found in the calculation logic');
    }

    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('1. Verify the actual opening stock for January 1st');
    console.log('2. Double-check that all 29 invoices properly deducted stock');
    console.log('3. Review any transfers or adjustments in January');
    console.log('4. Create inventory adjustment to align with manual count (80 pieces)');
    console.log(`5. Current adjustment needed: ${80 - totalCurrentStock} pieces`);

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

findRootCauseStockDiscrepancy();