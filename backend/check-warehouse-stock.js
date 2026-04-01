import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';

dotenv.config();

async function checkWarehouseStock() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const targetWarehouses = [
      "G.Perumbavoor",
      "Perumbavoor Branch",
      "GPerumbavoor",
      "G.Kottakkal",
      "Kottakkal Branch",
      "GKottakkal"
    ];

    console.log('🔍 Checking for stock in these warehouse variations:');
    targetWarehouses.forEach(w => console.log(`   - ${w}`));
    console.log('');

    // Check standalone items
    console.log('📦 Checking Standalone Items...\n');
    const standaloneItems = await ShoeItem.find({});
    
    let foundInStandalone = false;
    standaloneItems.forEach(item => {
      if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
        item.warehouseStocks.forEach(ws => {
          if (targetWarehouses.some(tw => ws.warehouse?.includes(tw) || tw.includes(ws.warehouse))) {
            foundInStandalone = true;
            console.log(`✅ Found in standalone item: ${item.itemName}`);
            console.log(`   Warehouse: "${ws.warehouse}"`);
            console.log(`   Stock: ${ws.stockOnHand || ws.stock || 0}`);
            console.log('');
          }
        });
      }
    });

    if (!foundInStandalone) {
      console.log('❌ No stock found in standalone items for these warehouses\n');
    }

    // Check item groups
    console.log('📦 Checking Item Groups...\n');
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    
    let foundInGroups = false;
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach(item => {
          if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
            item.warehouseStocks.forEach(ws => {
              if (targetWarehouses.some(tw => ws.warehouse?.includes(tw) || tw.includes(ws.warehouse))) {
                foundInGroups = true;
                console.log(`✅ Found in item group: ${group.name} -> ${item.name}`);
                console.log(`   Warehouse: "${ws.warehouse}"`);
                console.log(`   Stock: ${ws.stockOnHand || ws.stock || 0}`);
                console.log('');
              }
            });
          }
        });
      }
    });

    if (!foundInGroups) {
      console.log('❌ No stock found in item groups for these warehouses\n');
    }

    // Show all unique warehouse names in the database
    console.log('\n' + '='.repeat(60));
    console.log('📊 All unique warehouse names in database:');
    console.log('='.repeat(60) + '\n');
    
    const allWarehouses = new Set();
    
    standaloneItems.forEach(item => {
      if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
        item.warehouseStocks.forEach(ws => {
          if (ws.warehouse) allWarehouses.add(ws.warehouse);
        });
      }
    });
    
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach(item => {
          if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
            item.warehouseStocks.forEach(ws => {
              if (ws.warehouse) allWarehouses.add(ws.warehouse);
            });
          }
        });
      }
    });

    const sortedWarehouses = Array.from(allWarehouses).sort();
    sortedWarehouses.forEach((wh, idx) => {
      console.log(`${idx + 1}. "${wh}"`);
    });

    console.log(`\n📊 Total unique warehouses: ${sortedWarehouses.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkWarehouseStock();
