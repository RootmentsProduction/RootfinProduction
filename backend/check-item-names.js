import mongoose from 'mongoose';
import ItemGroup from './model/ItemGroup.js';

async function checkItemNames() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rootfin');
    console.log('Connected to MongoDB');
    
    const itemGroups = await ItemGroup.find({});
    console.log(`Found ${itemGroups.length} item groups`);
    
    let itemsWithoutNames = [];
    let totalItems = 0;
    
    itemGroups.forEach((group, groupIndex) => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item, itemIndex) => {
          totalItems++;
          if (!item.name || item.name.trim() === '') {
            itemsWithoutNames.push({
              groupId: group._id,
              groupName: group.name,
              itemIndex: itemIndex,
              itemId: item._id,
              itemSku: item.sku,
              itemName: item.name
            });
          }
        });
      }
    });
    
    console.log(`Total items in groups: ${totalItems}`);
    console.log(`Items without names: ${itemsWithoutNames.length}`);
    
    if (itemsWithoutNames.length > 0) {
      console.log('Items without names:');
      itemsWithoutNames.forEach(item => {
        console.log(`  Group: ${item.groupName} (${item.groupId})`);
        console.log(`  Item Index: ${item.itemIndex}`);
        console.log(`  Item ID: ${item.itemId}`);
        console.log(`  Item SKU: ${item.itemSku}`);
        console.log(`  Item Name: '${item.itemName}'`);
        console.log('  ---');
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkItemNames();