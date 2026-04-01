import mongoose from 'mongoose';
import SalesInvoice from './model/SalesInvoice.js';
import ItemGroup from './model/ItemGroup.js';
import dotenv from 'dotenv';

dotenv.config();

const checkDetailedInfo = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rootments');
    console.log('Connected to MongoDB');
    
    // Check all recent invoices
    console.log('\n=== All recent invoices (last 10) ===');
    const allRecentInvoices = await SalesInvoice.find({}).sort({ createdAt: -1 }).limit(10);
    
    allRecentInvoices.forEach(inv => {
      console.log(`📄 ${inv.invoiceNumber} | ${inv.warehouse || inv.branch || 'No warehouse'} | ${inv.createdAt}`);
    });
    
    // Check for any MG Road related invoices with different variations
    console.log('\n=== Searching for MG Road variations ===');
    const mgRoadVariations = await SalesInvoice.find({
      $or: [
        { warehouse: /mg/i },
        { branch: /mg/i },
        { warehouse: /road/i },
        { branch: /road/i }
      ]
    }).sort({ createdAt: -1 }).limit(5);
    
    console.log(`Found ${mgRoadVariations.length} invoices with MG/Road in warehouse/branch`);
    mgRoadVariations.forEach(inv => {
      console.log(`📄 ${inv.invoiceNumber} | W: ${inv.warehouse} | B: ${inv.branch} | ${inv.createdAt}`);
    });
    
    // Check the specific TAN LOAFER item group
    console.log('\n=== Checking TAN LOAFER item group ===');
    const tanLoaferGroup = await ItemGroup.findById('696b2e22e65f1480a303eae2');
    if (tanLoaferGroup) {
      console.log(`✅ Group found: ${tanLoaferGroup.name}`);
      console.log(`   Items count: ${tanLoaferGroup.items?.length || 0}`);
      
      // Find the specific item
      const tanLoaferItem = tanLoaferGroup.items.find(item => 
        item._id?.toString() === '696b2ea8e65f1480a303ebae'
      );
      
      if (tanLoaferItem) {
        console.log(`✅ Item found: ${tanLoaferItem.name}`);
        console.log(`   SKU: ${tanLoaferItem.sku}`);
        console.log(`   Warehouse stocks:`);
        tanLoaferItem.warehouseStocks?.forEach(ws => {
          console.log(`      ${ws.warehouse}: stockOnHand=${ws.stockOnHand}, available=${ws.availableForSale}, committed=${ws.committedStock || 0}`);
        });
      } else {
        console.log(`❌ Item with ID 696b2ea8e65f1480a303ebae not found in group`);
        console.log(`   Available items in group:`);
        tanLoaferGroup.items?.forEach((item, index) => {
          console.log(`      ${index}: ${item.name} (ID: ${item._id?.toString()})`);
        });
      }
    } else {
      console.log(`❌ Group with ID 696b2e22e65f1480a303eae2 not found`);
    }
    
    // Check if there are any invoices with this specific item
    console.log('\n=== Searching for invoices with TAN LOAFER item ===');
    const invoicesWithTanLoafer = await SalesInvoice.find({
      'lineItems.itemData.itemName': /TAN LOAFER 4018.*6/i
    }).sort({ createdAt: -1 }).limit(5);
    
    console.log(`Found ${invoicesWithTanLoafer.length} invoices with TAN LOAFER item`);
    invoicesWithTanLoafer.forEach(inv => {
      console.log(`📄 ${inv.invoiceNumber} | ${inv.warehouse || inv.branch} | ${inv.createdAt}`);
      inv.lineItems?.forEach(item => {
        if (item.itemData?.itemName?.includes('TAN LOAFER')) {
          console.log(`   📦 ${item.itemData.itemName} | Qty: ${item.quantity}`);
        }
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkDetailedInfo();