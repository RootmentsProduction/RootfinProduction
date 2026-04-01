// Verify Stock Deduction Failure - Find invoices that didn't deduct stock
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SalesInvoice from './model/SalesInvoice.js';
import ItemGroup from './model/ItemGroup.js';

dotenv.config();

async function verifyStockDeductionFailure() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    console.log('🔍 VERIFYING STOCK DEDUCTION FAILURE');
    console.log('===================================');
    console.log('User Analysis:');
    console.log('- Current Stock: 89 pieces');
    console.log('- Items Sold: 32 pieces');
    console.log('- Reverse Calculation: 89 + 32 = 121 pieces');
    console.log('- Opening Stock: 103 pieces');
    console.log('- Discrepancy: 121 - 103 = +18 pieces ERROR\n');

    // Get the exact date range from the invoice report (01-12-2025 to 26-02-2026)
    console.log('📋 Step 1: Getting invoices from SG-Trivandrum (01-12-2025 to 26-02-2026)...');
    
    const invoices = await SalesInvoice.find({
      invoiceDate: {
        $gte: new Date('2025-12-01'),
        $lte: new Date('2026-02-26')
      },
      $or: [
        { branch: /sg.*trivandrum/i },
        { branch: /grooms.*trivandrum/i },
        { branch: /trivandrum/i },
        { branch: /tvm/i }
      ]
    }).sort({ invoiceDate: 1 }).lean();

    console.log(`Found ${invoices.length} invoices in the date range`);

    // Count total items sold
    let totalItemsSold = 0;
    let invoiceDetails = [];

    invoices.forEach(invoice => {
      let invoiceItemCount = 0;
      if (invoice.lineItems && Array.isArray(invoice.lineItems)) {
        invoice.lineItems.forEach(lineItem => {
          const quantity = lineItem.quantity || 0;
          totalItemsSold += quantity;
          invoiceItemCount += quantity;
        });
      }
      
      invoiceDetails.push({
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.invoiceDate,
        customer: invoice.customer,
        itemCount: invoiceItemCount,
        lineItems: invoice.lineItems?.length || 0
      });
    });

    console.log(`Total items sold: ${totalItemsSold} pieces`);
    console.log(`Expected from report: 32 pieces`);
    
    if (totalItemsSold !== 32) {
      console.log(`❌ MISMATCH: Database shows ${totalItemsSold} but report shows 32`);
    }

    // Show recent invoices
    console.log('\n📋 Recent invoices (last 10):');
    invoiceDetails.slice(-10).forEach(invoice => {
      console.log(`- ${invoice.invoiceNumber}: ${invoice.itemCount} items (${invoice.date?.toDateString()}) - ${invoice.customer}`);
    });

    // Step 2: Check current stock in Grooms Trivandrum
    console.log('\n📊 Step 2: Checking current stock in Grooms Trivandrum...');
    
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    let totalCurrentStock = 0;
    let totalOpeningStock = 0;
    let itemsWithStock = [];

    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach(item => {
          const groomsStock = item.warehouseStocks?.find(ws => 
            ws.warehouse && (
              ws.warehouse.toLowerCase().includes('grooms') && 
              ws.warehouse.toLowerCase().includes('trivandrum')
            ) || (
              ws.warehouse.toLowerCase().includes('sg') && 
              ws.warehouse.toLowerCase().includes('trivandrum')
            )
          );
          
          if (groomsStock) {
            const openingStock = groomsStock.openingStock || 0;
            const currentStock = groomsStock.stockOnHand || 0;
            
            totalOpeningStock += openingStock;
            totalCurrentStock += currentStock;
            
            if (openingStock > 0 || currentStock > 0) {
              itemsWithStock.push({
                sku: item.sku,
                name: item.name,
                groupName: group.name,
                openingStock: openingStock,
                currentStock: currentStock,
                stockReduced: openingStock - currentStock,
                warehouse: groomsStock.warehouse
              });
            }
          }
        });
      }
    });

    console.log(`Total Opening Stock: ${totalOpeningStock} pieces`);
    console.log(`Total Current Stock: ${totalCurrentStock} pieces`);
    console.log(`Total Stock Reduced: ${totalOpeningStock - totalCurrentStock} pieces`);

    // Step 3: CRITICAL ANALYSIS
    console.log('\n🔍 Step 3: CRITICAL STOCK DEDUCTION ANALYSIS');
    console.log('============================================');
    
    const actualStockReduced = totalOpeningStock - totalCurrentStock;
    const itemsSold = totalItemsSold;
    const stockDeductionError = itemsSold - actualStockReduced;
    
    console.log(`Opening Stock:           ${totalOpeningStock} pieces`);
    console.log(`Current Stock:           ${totalCurrentStock} pieces`);
    console.log(`Stock Actually Reduced:  ${actualStockReduced} pieces`);
    console.log(`Items Sold (Invoices):   ${itemsSold} pieces`);
    console.log(`Stock Deduction Error:   ${stockDeductionError > 0 ? '+' : ''}${stockDeductionError} pieces`);
    
    if (stockDeductionError > 0) {
      console.log(`\n❌ CRITICAL ERROR: ${stockDeductionError} items were sold but stock was NOT deducted!`);
      console.log(`This means the updateStockOnInvoiceCreate function is failing.`);
    } else if (stockDeductionError < 0) {
      console.log(`\n❌ OVER-DEDUCTION: Stock was reduced by ${Math.abs(stockDeductionError)} more pieces than sold!`);
    } else {
      console.log(`\n✅ Stock deduction is working correctly`);
    }

    // Step 4: Verify user's reverse calculation
    console.log('\n🧮 Step 4: VERIFYING USER\'S REVERSE CALCULATION');
    console.log('===============================================');
    
    const userCurrentStock = 89; // From user's observation
    const userItemsSold = 32; // From invoice report
    const userReverseTotal = userCurrentStock + userItemsSold;
    const userOpeningStock = 103; // From user's data
    const userDiscrepancy = userReverseTotal - userOpeningStock;
    
    console.log(`User's Analysis:`);
    console.log(`Current Stock:           ${userCurrentStock} pieces`);
    console.log(`+ Items Sold:            ${userItemsSold} pieces`);
    console.log(`= Reverse Total:         ${userReverseTotal} pieces`);
    console.log(`Opening Stock:           ${userOpeningStock} pieces`);
    console.log(`Discrepancy:             ${userDiscrepancy > 0 ? '+' : ''}${userDiscrepancy} pieces`);
    
    console.log(`\nDatabase Analysis:`);
    console.log(`Current Stock:           ${totalCurrentStock} pieces`);
    console.log(`+ Items Sold:            ${itemsSold} pieces`);
    console.log(`= Reverse Total:         ${totalCurrentStock + itemsSold} pieces`);
    console.log(`Opening Stock:           ${totalOpeningStock} pieces`);
    console.log(`Discrepancy:             ${(totalCurrentStock + itemsSold) - totalOpeningStock > 0 ? '+' : ''}${(totalCurrentStock + itemsSold) - totalOpeningStock} pieces`);

    // Step 5: Find specific items where stock wasn't deducted
    console.log('\n🔍 Step 5: ITEMS WHERE STOCK DEDUCTION MAY HAVE FAILED');
    console.log('====================================================');
    
    // Show items that have the same opening and current stock (no reduction)
    const itemsWithNoReduction = itemsWithStock.filter(item => item.stockReduced === 0 && item.openingStock > 0);
    
    if (itemsWithNoReduction.length > 0) {
      console.log(`Found ${itemsWithNoReduction.length} items with no stock reduction despite having opening stock:`);
      itemsWithNoReduction.forEach(item => {
        console.log(`- ${item.sku}: Opening=${item.openingStock}, Current=${item.currentStock} (No reduction)`);
      });
    }

    // Show items with minimal reduction
    const itemsWithMinimalReduction = itemsWithStock.filter(item => 
      item.openingStock > 2 && item.stockReduced <= 1
    );
    
    if (itemsWithMinimalReduction.length > 0) {
      console.log(`\nItems with minimal stock reduction (may have missed some sales):`);
      itemsWithMinimalReduction.forEach(item => {
        console.log(`- ${item.sku}: Opening=${item.openingStock}, Current=${item.currentStock}, Reduced=${item.stockReduced}`);
      });
    }

    // Step 6: SOLUTION
    console.log('\n💡 Step 6: SOLUTION TO FIX THE ISSUE');
    console.log('===================================');
    
    if (stockDeductionError > 0) {
      console.log(`🔧 IMMEDIATE ACTIONS NEEDED:`);
      console.log(`1. ❌ Stock deduction function is failing for ${stockDeductionError} items`);
      console.log(`2. 🔍 Check the updateStockOnInvoiceCreate function in stockManagement.js`);
      console.log(`3. 🔧 Debug why stock is not being deducted when invoices are created`);
      console.log(`4. ⚖️ Create inventory adjustment to reduce stock by ${stockDeductionError} pieces`);
      console.log(`5. 🔄 Fix the stock deduction logic to prevent future issues`);
      
      console.log(`\n🎯 ROOT CAUSE: The stock management system is not properly deducting stock when invoices are created.`);
      console.log(`This is why you have ${userDiscrepancy} extra pieces in the system.`);
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

verifyStockDeductionFailure();