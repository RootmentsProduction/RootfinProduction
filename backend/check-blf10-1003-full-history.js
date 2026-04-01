// Comprehensive check for BLF10-1003 - stock, transactions, and movement history
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SalesInvoice from './model/SalesInvoice.js';
import ItemGroup from './model/ItemGroup.js';
import ShoeItem from './model/ShoeItem.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Helper function to match Trivandrum branch names
const matchesTrivandrum = (locationName) => {
  if (!locationName) return false;
  const name = locationName.toLowerCase().trim();
  return name.includes('trivandrum') || name.includes('trivandum') ||
         name.includes('sg-trivandrum') || name.includes('sg.tvm') ||
         name.includes('sg-tvm') || name.includes('sg.trivandrum') ||
         name.includes('grooms trivandrum') || name === 'trivandrum branch' ||
         name.includes('grooms trivandum');
};

// Comprehensive analysis for BLF10-1003
const checkBLF10FullHistory = async () => {
  console.log('\n=== COMPREHENSIVE ANALYSIS FOR BLF10-1003 ===\n');
  
  const targetSKU = 'BLF10-1003';
  const targetItemName = 'Shoe Formal-1003 - BLACK/10';
  
  console.log(`🔍 Analyzing: ${targetSKU} (${targetItemName})\n`);
  
  try {
    // 1. Check item existence and current stock
    console.log('📦 ITEM STOCK ANALYSIS:\n');
    
    const itemGroup = await ItemGroup.findOne({
      'items.sku': targetSKU
    });
    
    if (!itemGroup) {
      console.log(`❌ Item ${targetSKU} not found in database`);
      return;
    }
    
    const targetItem = itemGroup.items.find(item => item.sku === targetSKU);
    
    if (!targetItem) {
      console.log(`❌ Item ${targetSKU} not found in item group`);
      return;
    }
    
    console.log(`✅ Item found in group: ${itemGroup.name || itemGroup.itemName}`);
    console.log(`   Item Name: ${targetItem.name}`);
    console.log(`   SKU: ${targetItem.sku}`);
    console.log(`   Cost Price: ₹${targetItem.costPrice || 0}`);
    console.log(`   Selling Price: ₹${targetItem.sellingPrice || 0}`);
    console.log(`   Active: ${targetItem.isActive !== false ? 'Yes' : 'No'}`);
    console.log(`   Returnable: ${targetItem.returnable ? 'Yes' : 'No'}`);
    
    // 2. Warehouse stock analysis
    console.log(`\n🏢 WAREHOUSE STOCK BREAKDOWN:\n`);
    
    if (targetItem.warehouseStocks && targetItem.warehouseStocks.length > 0) {
      console.log(`${'Warehouse'.padEnd(25)} | ${'Opening'.padEnd(8)} | ${'Current'.padEnd(8)} | ${'Available'.padEnd(10)} | ${'Committed'.padEnd(10)}`);
      console.log(`${'-'.repeat(25)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(10)} | ${'-'.repeat(10)}`);
      
      let totalOpening = 0;
      let totalCurrent = 0;
      let totalAvailable = 0;
      let tvmStock = null;
      
      targetItem.warehouseStocks.forEach(ws => {
        const opening = ws.openingStock || 0;
        const current = ws.stockOnHand || 0;
        const available = ws.availableForSale || 0;
        const committed = ws.committedStock || 0;
        
        totalOpening += opening;
        totalCurrent += current;
        totalAvailable += available;
        
        if (matchesTrivandrum(ws.warehouse)) {
          tvmStock = ws;
        }
        
        console.log(`${ws.warehouse.padEnd(25)} | ${opening.toString().padEnd(8)} | ${current.toString().padEnd(8)} | ${available.toString().padEnd(10)} | ${committed.toString().padEnd(10)}`);
      });
      
      console.log(`${'-'.repeat(25)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(10)} | ${'-'.repeat(10)}`);
      console.log(`${'TOTAL'.padEnd(25)} | ${totalOpening.toString().padEnd(8)} | ${totalCurrent.toString().padEnd(8)} | ${totalAvailable.toString().padEnd(10)} | -`);
      
      // Highlight Trivandrum stock
      if (tvmStock) {
        console.log(`\n🎯 TRIVANDRUM STOCK DETAILS:`);
        console.log(`   Warehouse: ${tvmStock.warehouse}`);
        console.log(`   Opening Stock: ${tvmStock.openingStock || 0} units`);
        console.log(`   Current Stock: ${tvmStock.stockOnHand || 0} units`);
        console.log(`   Available for Sale: ${tvmStock.availableForSale || 0} units`);
        console.log(`   Committed Stock: ${tvmStock.committedStock || 0} units`);
        console.log(`   Physical Stock: ${tvmStock.physicalStockOnHand || 0} units`);
        
        // Compare with image data
        console.log(`\n📊 COMPARISON WITH IMAGE DATA (21-01-2026):`);
        console.log(`   Image shows: 2 units`);
        console.log(`   Database shows: ${tvmStock.openingStock || 0} units`);
        console.log(`   Difference: ${(tvmStock.openingStock || 0) - 2} units`);
        
        if ((tvmStock.openingStock || 0) < 2) {
          console.log(`   ⚠️ Database is missing ${2 - (tvmStock.openingStock || 0)} unit(s)`);
        }
      } else {
        console.log(`\n❌ No Trivandrum warehouse stock found for this item`);
      }
      
    } else {
      console.log(`❌ No warehouse stocks found for this item`);
    }
    
    // 3. Check for any sales invoices (broader search)
    console.log(`\n💰 SALES INVOICE ANALYSIS:\n`);
    
    const allInvoicesWithItem = await SalesInvoice.find({
      'items.sku': targetSKU
    }).sort({ invoiceDate: -1 });
    
    console.log(`📊 Total invoices containing ${targetSKU}: ${allInvoicesWithItem.length}`);
    
    if (allInvoicesWithItem.length > 0) {
      console.log(`\n📋 Invoice locations:`);
      const locationCounts = {};
      allInvoicesWithItem.forEach(invoice => {
        const location = invoice.location || invoice.branch || invoice.store || 'Unknown';
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      });
      
      Object.entries(locationCounts).forEach(([location, count]) => {
        console.log(`   - ${location}: ${count} invoices`);
      });
    } else {
      console.log(`✅ No sales invoices found - item has not been sold yet`);
    }
    
    // 4. Check transactions collection if it exists
    console.log(`\n📝 TRANSACTION HISTORY:\n`);
    
    try {
      const db = mongoose.connection.db;
      const transactionCollection = db.collection('transactions');
      
      const transactions = await transactionCollection.find({
        $or: [
          { itemCode: targetSKU },
          { sku: targetSKU },
          { 'items.sku': targetSKU }
        ]
      }).sort({ date: -1 }).toArray();
      
      console.log(`📊 Total transactions found: ${transactions.length}`);
      
      if (transactions.length > 0) {
        console.log(`\n📋 Recent transactions:`);
        transactions.slice(0, 10).forEach(txn => {
          const date = txn.date ? new Date(txn.date).toLocaleDateString('en-GB') : 'N/A';
          const type = txn.type || txn.transactionType || 'Unknown';
          const quantity = txn.quantity || 0;
          const location = txn.storeCode || txn.location || txn.branch || 'Unknown';
          
          console.log(`   - ${date}: ${type} | Qty: ${quantity} | Location: ${location}`);
        });
      } else {
        console.log(`✅ No transactions found for this item`);
      }
      
    } catch (error) {
      console.log(`⚠️ Could not check transactions: ${error.message}`);
    }
    
    // 5. Check transfer orders
    console.log(`\n🚚 TRANSFER ORDER ANALYSIS:\n`);
    
    try {
      const db = mongoose.connection.db;
      const transferOrderCollection = db.collection('transferorders');
      
      const transferOrders = await transferOrderCollection.find({
        'items.sku': targetSKU
      }).sort({ createdAt: -1 }).toArray();
      
      console.log(`📊 Total transfer orders containing ${targetSKU}: ${transferOrders.length}`);
      
      if (transferOrders.length > 0) {
        console.log(`\n📋 Transfer orders:`);
        transferOrders.forEach(order => {
          const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'N/A';
          const fromStore = order.fromStore || 'Unknown';
          const toStore = order.toStore || 'Unknown';
          const status = order.status || 'Unknown';
          
          // Find the specific item in the order
          const orderItem = order.items?.find(item => item.sku === targetSKU);
          const quantity = orderItem?.quantity || 0;
          
          console.log(`   - ${date}: ${fromStore} → ${toStore} | Qty: ${quantity} | Status: ${status}`);
        });
      } else {
        console.log(`✅ No transfer orders found for this item`);
      }
      
    } catch (error) {
      console.log(`⚠️ Could not check transfer orders: ${error.message}`);
    }
    
    // 6. Summary and recommendations
    console.log(`\n💡 SUMMARY & RECOMMENDATIONS:\n`);
    
    if (tvmStock) {
      const dbStock = tvmStock.openingStock || 0;
      const imageStock = 2;
      
      if (dbStock < imageStock) {
        console.log(`🚨 ISSUE IDENTIFIED:`);
        console.log(`   - Database shows ${dbStock} units in Trivandrum`);
        console.log(`   - Physical count shows ${imageStock} units`);
        console.log(`   - Missing ${imageStock - dbStock} unit(s) in database`);
        console.log(`\n🔧 RECOMMENDED ACTIONS:`);
        console.log(`   1. Update opening stock for BLF10-1003 in Trivandrum from ${dbStock} to ${imageStock}`);
        console.log(`   2. Check if there were any recent stock adjustments not recorded`);
        console.log(`   3. Verify if this item was recently transferred to Trivandrum`);
      } else if (dbStock === imageStock) {
        console.log(`✅ Stock levels match between database and physical count`);
      } else {
        console.log(`⚠️ Database shows more stock than physical count`);
      }
      
      if (allInvoicesWithItem.length === 0) {
        console.log(`\n📈 BUSINESS INSIGHTS:`);
        console.log(`   - This item has never been sold (no invoices found)`);
        console.log(`   - Consider promotional activities or price adjustments`);
        console.log(`   - Monitor demand patterns for this size/color combination`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in comprehensive analysis:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkBLF10FullHistory();
  
  console.log('\n=== COMPREHENSIVE ANALYSIS COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);