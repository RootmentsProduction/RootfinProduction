import mongoose from 'mongoose';
import SalesInvoice from './model/SalesInvoice.js';
import ItemGroup from './model/ItemGroup.js';
import dotenv from 'dotenv';

dotenv.config();

const checkMGRoadInvoices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rootments');
    console.log('Connected to MongoDB');
    
    // Find recent invoices for MG Road
    const recentInvoices = await SalesInvoice.find({
      $or: [
        { warehouse: /mg road/i },
        { branch: /mg road/i }
      ]
    }).sort({ createdAt: -1 }).limit(5);
    
    console.log('\n=== Recent MG Road invoices ===');
    for (const inv of recentInvoices) {
      console.log(`\n📄 Invoice: ${inv.invoiceNumber}`);
      console.log(`   Warehouse: ${inv.warehouse || inv.branch}`);
      console.log(`   Date: ${inv.createdAt}`);
      console.log(`   Items: ${inv.lineItems?.length || 0}`);
      console.log(`   Category: ${inv.category || 'N/A'}`);
      
      if (inv.lineItems?.length > 0) {
        for (const item of inv.lineItems) {
          console.log(`   📦 Item: ${item.item}`);
          console.log(`      Qty: ${item.quantity}`);
          console.log(`      ItemData: ${JSON.stringify(item.itemData, null, 6)}`);
          
          // Check if this is the TAN LOAFER item
          if (item.itemData?.itemName?.includes('TAN LOAFER 4018 - 6')) {
            console.log(`      🎯 FOUND TAN LOAFER ITEM!`);
            
            // Check the item group
            if (item.itemData?.itemGroupId) {
              const group = await ItemGroup.findById(item.itemData.itemGroupId);
              if (group) {
                console.log(`      📁 Group: ${group.name}`);
                const groupItem = group.items.find(gi => 
                  gi.name?.includes('TAN LOAFER 4018 - 6') || 
                  gi._id?.toString() === item.itemData._id?.toString()
                );
                if (groupItem) {
                  console.log(`      📊 Current stock in group:`);
                  groupItem.warehouseStocks?.forEach(ws => {
                    console.log(`         ${ws.warehouse}: ${ws.stockOnHand}`);
                  });
                }
              }
            }
          }
        }
      }
    }
    
    // Also check the specific item group for TAN LOAFER
    console.log('\n=== Checking TAN LOAFER item group ===');
    const tanLoaferGroup = await ItemGroup.findById('696b2e22e65f1480a303eae2');
    if (tanLoaferGroup) {
      console.log(`Group: ${tanLoaferGroup.name}`);
      const tanLoaferItem = tanLoaferGroup.items.find(item => 
        item._id?.toString() === '696b2ea8e65f1480a303ebae' ||
        item.name?.includes('TAN LOAFER 4018 - 6')
      );
      
      if (tanLoaferItem) {
        console.log(`Item: ${tanLoaferItem.name}`);
        console.log(`Current warehouse stocks:`);
        tanLoaferItem.warehouseStocks?.forEach(ws => {
          console.log(`  ${ws.warehouse}: ${ws.stockOnHand} (available: ${ws.availableForSale})`);
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkMGRoadInvoices();