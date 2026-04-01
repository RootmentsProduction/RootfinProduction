// Comprehensive check for BRL8-1410 - stock, transactions, and movement history
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

// Comprehensive analysis for BRL8-1410
const checkBRL8FullHistory = async () => {
  console.log('\n=== COMPREHENSIVE ANALYSIS FOR BRL8-1410 ===\n');
  
  const targetSKU = 'BRL8-1410';
  const targetItemName = 'Shoes Loafer-1410 - BROWN/8';
  
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
    
    let tvmStock = null;
    
    if (targetItem.warehouseStocks && targetItem.warehouseStocks.length > 0) {
      console.log(`${'Warehouse'.padEnd(25)} | ${'Opening'.padEnd(8)} | ${'Current'.padEnd(8)} | ${'Available'.padEnd(10)} | ${'Committed'.padEnd(10)}`);
      console.log(`${'-'.repeat(25)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(10)} | ${'-'.repeat(10)}`);
      
      let totalOpening = 0;
      let totalCurrent = 0;
      let totalAvailable = 0;
      
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
        console.log(`   Image shows: 4 units`);
        console.log(`   Database shows: ${tvmStock.openingStock || 0} units`);
        console.log(`   Difference: ${(tvmStock.openingStock || 0) - 4} units`);
        
        if ((tvmStock.openingStock || 0) < 4) {
          console.log(`   🚨 Database is missing ${4 - (tvmStock.openingStock || 0)} unit(s) - BIGGEST DISCREPANCY!`);
        }
      } else {
        console.log(`\n❌ No Trivandrum warehouse stock found for this item`);
      }
      
    } else {
      console.log(`❌ No warehouse stocks found for this item`);
    }
    
    // 3. Check for any sales invoices
    console.log(`\n💰 SALES INVOICE ANALYSIS:\n`);
    
    const allInvoicesWithItem = await SalesInvoice.find({
      'items.sku': targetSKU
    }).sort({ invoiceDate: -1 });
    
    console.log(`📊 Total invoices containing ${targetSKU}: ${allInvoicesWithItem.length}`);
    
    if (allInvoicesWithItem.length > 0) {
      // Filter for Trivandrum invoices
      const tvmInvoices = allInvoicesWithItem.filter(invoice => 
        matchesTrivandrum(invoice.location) || 
        matchesTrivandrum(invoice.branch) ||
        matchesTrivandrum(invoice.store)
      );
      
      console.log(`📍 Invoices from Trivandrum: ${tvmInvoices.length}`);
      
      if (tvmInvoices.length > 0) {
        console.log(`\n📋 TRIVANDRUM SALES DETAILS:`);
        console.log(`${'Invoice #'.padEnd(15)} | ${'Date'.padEnd(12)} | ${'Qty'.padEnd(5)} | ${'Price'.padEnd(8)} | ${'Total'.padEnd(8)} | Customer`);
        console.log(`${'-'.repeat(15)} | ${'-'.repeat(12)} | ${'-'.repeat(5)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(20)}`);
        
        let totalSoldInTVM = 0;
        let totalRevenueInTVM = 0;
        
        tvmInvoices.forEach(invoice => {
          const targetItem = invoice.items.find(item => item.sku === targetSKU);
          
          if (targetItem) {
            const quantity = targetItem.quantity || 0;
            const price = targetItem.sellingPrice || targetItem.price || 0;
            const itemTotal = quantity * price;
            
            totalSoldInTVM += quantity;
            totalRevenueInTVM += itemTotal;
            
            const invoiceDate = invoice.invoiceDate ? 
              new Date(invoice.invoiceDate).toLocaleDateString('en-GB') : 
              'N/A';
            
            const customerName = invoice.customerName || 
              invoice.customer?.name || 
              invoice.customer || 
              'Walk-in Customer';
            
            console.log(`${(invoice.invoiceNumber || 'N/A').toString().padEnd(15)} | ${invoiceDate.padEnd(12)} | ${quantity.toString().padEnd(5)} | ₹${price.toString().padEnd(7)} | ₹${itemTotal.toString().padEnd(7)} | ${customerName.substring(0, 18)}`);
          }
        });
        
        console.log(`\n📊 TRIVANDRUM SALES SUMMARY:`);
        console.log(`   Total Sold in TVM: ${totalSoldInTVM} units`);
        console.log(`   Total Revenue in TVM: ₹${totalRevenueInTVM.toLocaleString()}`);
        console.log(`   Average Price: ₹${totalSoldInTVM > 0 ? (totalRevenueInTVM / totalSoldInTVM).toFixed(2) : 0}`);
      }
      
      // Show all locations
      console.log(`\n📋 All invoice locations:`);
      const locationCounts = {};
      let totalQuantityAllLocations = 0;
      
      allInvoicesWithItem.forEach(invoice => {
        const location = invoice.location || invoice.branch || invoice.store || 'Unknown';
        const targetItem = invoice.items.find(item => item.sku === targetSKU);
        const quantity = targetItem ? (targetItem.quantity || 0) : 0;
        
        if (!locationCounts[location]) {
          locationCounts[location] = { invoices: 0, quantity: 0 };
        }
        locationCounts[location].invoices += 1;
        locationCounts[location].quantity += quantity;
        totalQuantityAllLocations += quantity;
      });
      
      Object.entries(locationCounts).forEach(([location, data]) => {
        console.log(`   - ${location}: ${data.invoices} invoices, ${data.quantity} units sold`);
      });
      
      console.log(`\n📊 TOTAL SALES ACROSS ALL LOCATIONS: ${totalQuantityAllLocations} units`);
      
    } else {
      console.log(`✅ No sales invoices found - item has not been sold yet`);
    }
    
    // 4. Check transactions
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
        console.log(`\n📋 Transfer orders (focusing on Trivandrum):`);
        
        let tvmTransfers = 0;
        
        transferOrders.forEach(order => {
          const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : 'N/A';
          const fromStore = order.fromStore || 'Unknown';
          const toStore = order.toStore || 'Unknown';
          const status = order.status || 'Unknown';
          
          // Find the specific item in the order
          const orderItem = order.items?.find(item => item.sku === targetSKU);
          const quantity = orderItem?.quantity || 0;
          
          const isTvmRelated = matchesTrivandrum(fromStore) || matchesTrivandrum(toStore);
          
          if (isTvmRelated) {
            tvmTransfers++;
            console.log(`   🎯 ${date}: ${fromStore} → ${toStore} | Qty: ${quantity} | Status: ${status}`);
          } else {
            console.log(`   - ${date}: ${fromStore} → ${toStore} | Qty: ${quantity} | Status: ${status}`);
          }
        });
        
        console.log(`\n📊 Trivandrum-related transfers: ${tvmTransfers}`);
        
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
      const currentStock = tvmStock.stockOnHand || 0;
      const imageStock = 4;
      
      console.log(`🚨 CRITICAL DISCREPANCY ANALYSIS:`);
      console.log(`   - Image shows: ${imageStock} units (Physical count)`);
      console.log(`   - Database opening stock: ${dbStock} units`);
      console.log(`   - Database current stock: ${currentStock} units`);
      console.log(`   - Missing from database: ${imageStock - dbStock} units`);
      
      if (dbStock < imageStock) {
        console.log(`\n🔧 IMMEDIATE ACTIONS REQUIRED:`);
        console.log(`   1. 🚨 Update opening stock for BRL8-1410 in Trivandrum from ${dbStock} to ${imageStock}`);
        console.log(`   2. 🔍 Investigate why 2 units are missing from database`);
        console.log(`   3. 📋 Check if recent transfers to Trivandrum were not recorded`);
        console.log(`   4. 🔄 Verify current stock levels after correction`);
      }
      
      // Analyze stock movement
      const stockMovement = dbStock - currentStock;
      if (stockMovement > 0) {
        console.log(`\n📈 STOCK MOVEMENT ANALYSIS:`);
        console.log(`   - ${stockMovement} units moved from opening to current stock`);
        console.log(`   - This could be due to sales or transfers`);
      }
      
    } else {
      console.log(`❌ No Trivandrum stock data found - this is a critical issue!`);
    }
    
    console.log(`\n📊 BUSINESS IMPACT:`);
    console.log(`   - This is the LARGEST discrepancy in TVM analysis (-2 units)`);
    console.log(`   - Affects inventory accuracy and stock management`);
    console.log(`   - May impact sales if actual stock is higher than system shows`);
    
  } catch (error) {
    console.error('❌ Error in comprehensive analysis:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkBRL8FullHistory();
  
  console.log('\n=== BRL8-1410 COMPREHENSIVE ANALYSIS COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);