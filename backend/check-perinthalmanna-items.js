import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkPerinthalmannaItems() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check items in Perinthalmanna
    const [standaloneItems, itemGroups] = await Promise.all([
      ShoeItem.find({
        'warehouseStocks.warehouse': { $regex: /perinthalmanna/i }
      }),
      ItemGroup.find({
        'items.warehouseStocks.warehouse': { $regex: /perinthalmanna/i }
      })
    ]);
    
    console.log('\n=== STANDALONE ITEMS IN PERINTHALMANNA ===');
    standaloneItems.forEach(item => {
      const perinthalmanna = item.warehouseStocks.find(ws => 
        ws.warehouse && ws.warehouse.toString().toLowerCase().includes('perinthalmanna')
      );
      if (perinthalmanna) {
        console.log(`Item: ${item.itemName}`);
        console.log(`  SKU: ${item.sku}`);
        console.log(`  Warehouse: ${perinthalmanna.warehouse}`);
        console.log(`  Stock: ${perinthalmanna.stockOnHand}`);
        console.log('');
      }
    });
    
    console.log('\n=== GROUP ITEMS IN PERINTHALMANNA ===');
    let groupItemCount = 0;
    itemGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.warehouseStocks) {
          const perinthalmanna = item.warehouseStocks.find(ws => 
            ws.warehouse && ws.warehouse.toString().toLowerCase().includes('perinthalmanna')
          );
          if (perinthalmanna) {
            groupItemCount++;
            console.log(`Group: ${group.name}`);
            console.log(`Item: ${item.name}`);
            console.log(`  SKU: ${item.sku}`);
            console.log(`  Warehouse: ${perinthalmanna.warehouse}`);
            console.log(`  Stock: ${perinthalmanna.stockOnHand}`);
            console.log('');
          }
        }
      });
    });
    
    console.log(`\nSUMMARY:`);
    console.log(`Standalone items: ${standaloneItems.length}`);
    console.log(`Group items: ${groupItemCount}`);
    console.log(`Total items: ${standaloneItems.length + groupItemCount}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkPerinthalmannaItems();