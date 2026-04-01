// Check TVM Items and Stock Structure
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ShoeItem from './model/ShoeItem.js';
import SalesInvoice from './model/SalesInvoice.js';
import Store from './model/Store.js';

dotenv.config();

async function checkTVMStructure() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Check stores first
    console.log('🏪 Step 1: Checking stores...');
    const stores = await Store.find().lean();
    console.log(`Found ${stores.length} stores:`);
    stores.forEach(store => {
      console.log(`- ${store.name} (${store.locCode}) - ${store.storeType}`);
    });

    // Check TVM/Trivandrum store
    const tvmStore = stores.find(store => 
      store.name.toLowerCase().includes('trivandrum') || 
      store.name.toLowerCase().includes('tvm') ||
      store.locCode === '702'
    );
    
    if (tvmStore) {
      console.log(`\n🎯 Found TVM store: ${tvmStore.name} (${tvmStore.locCode})`);
    } else {
      console.log('\n❌ No TVM/Trivandrum store found');
    }

    // Check item structure
    console.log('\n📦 Step 2: Checking item structure...');
    const sampleItems = await ShoeItem.find().limit(3).lean();
    
    if (sampleItems.length > 0) {
      console.log('Sample item structure:');
      console.log(JSON.stringify(sampleItems[0], null, 2));
      
      // Check what stock fields exist
      const stockFields = Object.keys(sampleItems[0]).filter(key => 
        key.toLowerCase().includes('stock') || 
        key.toLowerCase().includes('quantity')
      );
      console.log('\nStock-related fields found:', stockFields);
    }

    // Check for items with any stock
    console.log('\n📊 Step 3: Checking items with stock...');
    const itemsWithStock = await ShoeItem.find({
      $or: [
        { stock: { $gt: 0 } },
        { quantity: { $gt: 0 } },
        { currentStock: { $gt: 0 } },
        { warehouseStock: { $gt: 0 } },
        { tvmStock: { $gt: 0 } },
        { kottayamStock: { $gt: 0 } },
        { edapallyStock: { $gt: 0 } }
      ]
    }).limit(10).lean();

    console.log(`Found ${itemsWithStock.length} items with stock:`);
    itemsWithStock.forEach(item => {
      console.log(`- ${item.itemCode}: ${item.itemName}`);
      console.log(`  Stock fields:`, {
        stock: item.stock,
        quantity: item.quantity,
        currentStock: item.currentStock,
        warehouseStock: item.warehouseStock,
        tvmStock: item.tvmStock,
        kottayamStock: item.kottayamStock,
        edapallyStock: item.edapallyStock
      });
    });

    // Check recent sales invoices
    console.log('\n📋 Step 4: Checking recent sales invoices...');
    const recentInvoices = await SalesInvoice.find()
      .sort({ invoiceDate: -1 })
      .limit(5)
      .lean();

    console.log(`Found ${recentInvoices.length} recent invoices:`);
    recentInvoices.forEach(invoice => {
      console.log(`- ${invoice.invoiceNumber}: ${invoice.customer} (${invoice.branch}) - ${invoice.invoiceDate?.toDateString()}`);
      if (invoice.lineItems && invoice.lineItems.length > 0) {
        console.log(`  Items: ${invoice.lineItems.length} line items`);
        invoice.lineItems.slice(0, 2).forEach(item => {
          console.log(`    - ${item.itemCode}: ${item.quantity} pieces`);
        });
      }
    });

    // Search for Grooms items more broadly
    console.log('\n🔍 Step 5: Searching for Grooms items (broad search)...');
    const gromsItems = await ShoeItem.find({
      $or: [
        { itemName: /groom/i },
        { itemCode: /groom/i },
        { category: /groom/i },
        { brand: /groom/i },
        { itemName: /GRM/i },
        { itemCode: /GRM/i }
      ]
    }).lean();

    console.log(`Found ${gromsItems.length} potential Grooms items:`);
    gromsItems.forEach(item => {
      console.log(`- ${item.itemCode}: ${item.itemName} (${item.category || 'No category'})`);
    });

    // Check January invoices in TVM
    console.log('\n📅 Step 6: Checking January invoices in TVM...');
    const januaryInvoices = await SalesInvoice.find({
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

    console.log(`Found ${januaryInvoices.length} January invoices in TVM`);
    
    if (januaryInvoices.length > 0) {
      console.log('Sample January invoices:');
      januaryInvoices.slice(0, 3).forEach(invoice => {
        console.log(`- ${invoice.invoiceNumber}: ${invoice.customer} (${invoice.invoiceDate?.toDateString()})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

checkTVMStructure();