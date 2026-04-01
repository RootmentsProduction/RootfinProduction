// Find Grooms Trivandrum Stock Issue
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';
import SalesInvoice from './model/SalesInvoice.js';

dotenv.config();

async function findGroomsTrivandumStockIssue() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    console.log('🔍 FINDING GROOMS TRIVANDRUM STOCK ISSUE');
    console.log('========================================\n');

    // Step 1: Find all items with Grooms Trivandrum stock
    console.log('📋 Step 1: Finding items with Grooms Trivandrum stock...');
    
    // Check standalone items
    const standaloneItems = await ShoeItem.find({
      'warehouseStocks.warehouse': /grooms.*trivandrum/i
    }).lean();

    console.log(`Found ${standaloneItems.length} standalone items with Grooms Trivandrum stock:`);
    standaloneItems.forEach(item => {
      const groomsStock = item.warehouseStocks?.find(ws => 
        ws.warehouse && ws.warehouse.toLowerCase().includes('grooms') && 
        ws.warehouse.toLowerCase().includes('trivandrum')
      );
      if (groomsStock) {
        console.log(`- ${item.itemCode || item.sku}: ${item.itemName}`);
        console.log(`  Stock: ${groomsStock.stockOnHand || 0}, Opening: ${groomsStock.openingStock || 0}`);
      }
    });

    // Check item groups
    const itemGroups = await ItemGroup.find({
      'items.warehouseStocks.warehouse': /grooms.*trivandrum/i
    }).lean();

    console.log(`\nFound ${itemGroups.length} item groups with Grooms Trivandrum stock:`);
    
    let candidateItems = [];
    
    itemGroups.forEach(group => {
      console.log(`\n- Group: ${group.name} (${group.items?.length || 0} items)`);
      
      if (group.items) {
        group.items.forEach(item => {
          const groomsStock = item.warehouseStocks?.find(ws => 
            ws.warehouse && ws.warehouse.toLowerCase().includes('grooms') && 
            ws.warehouse.toLowerCase().includes('trivandrum')
          );
          
          if (groomsStock) {
            const stockOnHand = groomsStock.stockOnHand || 0;
            const openingStock = groomsStock.openingStock || 0;
            
            console.log(`  - ${item.sku}: ${item.name}`);
            console.log(`    Current Stock: ${stockOnHand}, Opening Stock: ${openingStock}`);
            
            // Look for items that might match the described issue
            // Opening stock around 103, current stock around 89
            if (openingStock >= 90 || stockOnHand >= 80) {
              candidateItems.push({
                ...item,
                groupName: group.name,
                groupId: group._id,
                groomsStock: groomsStock
              });
            }
          }
        });
      }
    });

    // Step 2: Analyze candidate items
    if (candidateItems.length > 0) {
      console.log(`\n🎯 Step 2: Found ${candidateItems.length} candidate items with significant stock:`);
      
      for (const item of candidateItems) {
        console.log(`\n📊 Analyzing: ${item.sku} - ${item.name}`);
        console.log(`Group: ${item.groupName}`);
        console.log(`Current Stock: ${item.groomsStock.stockOnHand || 0}`);
        console.log(`Opening Stock: ${item.groomsStock.openingStock || 0}`);
        
        // Check January sales for this item
        const januarySales = await SalesInvoice.find({
          'lineItems.itemCode': item.sku,
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

        let totalSold = 0;
        januarySales.forEach(invoice => {
          const lineItem = invoice.lineItems.find(li => li.itemCode === item.sku);
          if (lineItem) {
            totalSold += lineItem.quantity || 0;
          }
        });

        console.log(`January Sales: ${januarySales.length} invoices, ${totalSold} pieces sold`);
        
        const openingStock = item.groomsStock.openingStock || 0;
        const currentStock = item.groomsStock.stockOnHand || 0;
        const expectedStock = openingStock - totalSold;
        
        console.log(`Expected Stock: ${openingStock} - ${totalSold} = ${expectedStock}`);
        console.log(`Actual Stock: ${currentStock}`);
        console.log(`Discrepancy: ${currentStock - expectedStock > 0 ? '+' : ''}${currentStock - expectedStock}`);
        
        // Check if this matches the described issue
        if (openingStock >= 100 && januarySales.length >= 25 && Math.abs(currentStock - 89) <= 5) {
          console.log(`🎯 *** POTENTIAL MATCH FOR DESCRIBED ISSUE ***`);
          console.log(`This item has:`);
          console.log(`- Opening stock around 103: ${openingStock}`);
          console.log(`- Around 29 invoices: ${januarySales.length}`);
          console.log(`- Current stock around 89: ${currentStock}`);
          console.log(`- Expected vs Manual (80): ${expectedStock} vs 80 = ${expectedStock - 80} difference`);
        }
      }
    } else {
      console.log('\n❌ No candidate items found with significant stock');
    }

    // Step 3: Check all January invoices in Grooms Trivandrum
    console.log(`\n📋 Step 3: Checking all January invoices in Grooms Trivandrum...`);
    
    const allJanuaryInvoices = await SalesInvoice.find({
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

    console.log(`Found ${allJanuaryInvoices.length} total January invoices in Grooms Trivandrum`);
    
    // Count items sold
    const itemSalesCount = {};
    allJanuaryInvoices.forEach(invoice => {
      if (invoice.lineItems) {
        invoice.lineItems.forEach(lineItem => {
          const itemCode = lineItem.itemCode;
          if (itemCode) {
            if (!itemSalesCount[itemCode]) {
              itemSalesCount[itemCode] = { invoices: 0, totalQuantity: 0 };
            }
            itemSalesCount[itemCode].invoices++;
            itemSalesCount[itemCode].totalQuantity += lineItem.quantity || 0;
          }
        });
      }
    });

    console.log(`\nTop items sold in January (by invoice count):`);
    const sortedItems = Object.entries(itemSalesCount)
      .sort((a, b) => b[1].invoices - a[1].invoices)
      .slice(0, 10);
    
    sortedItems.forEach(([itemCode, data]) => {
      console.log(`- ${itemCode}: ${data.invoices} invoices, ${data.totalQuantity} pieces`);
    });

    // Look for items with exactly 29 invoices or close to it
    console.log(`\nItems with around 29 invoices:`);
    Object.entries(itemSalesCount).forEach(([itemCode, data]) => {
      if (data.invoices >= 25 && data.invoices <= 35) {
        console.log(`- ${itemCode}: ${data.invoices} invoices, ${data.totalQuantity} pieces`);
      }
    });

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

findGroomsTrivandumStockIssue();