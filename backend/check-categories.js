import { MongoClient } from 'mongodb';
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rootments';

async function checkCategories() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    
    // Check standalone items categories
    console.log('=== STANDALONE ITEMS CATEGORIES ===');
    const standaloneItems = await db.collection('shoeitems').find({}).limit(10).toArray();
    standaloneItems.forEach(item => {
      console.log(`Item: ${item.itemName}, Category: '${item.category || 'NO CATEGORY'}'`);
    });
    
    // Check item groups categories
    console.log('\n=== ITEM GROUPS CATEGORIES ===');
    const itemGroups = await db.collection('itemgroups').find({}).limit(5).toArray();
    itemGroups.forEach(group => {
      console.log(`Group: ${group.name}, Category: '${group.category || 'NO CATEGORY'}'`);
      if (group.items && group.items.length > 0) {
        group.items.slice(0, 3).forEach(item => {
          console.log(`  - Item: ${item.name}, Category: '${item.category || 'NO CATEGORY'}'`);
        });
      }
    });
    
    // Get unique categories
    console.log('\n=== UNIQUE CATEGORIES ===');
    const uniqueStandaloneCategories = await db.collection('shoeitems').distinct('category');
    const uniqueGroupCategories = await db.collection('itemgroups').distinct('category');
    
    console.log('Standalone categories:', uniqueStandaloneCategories);
    console.log('Group categories:', uniqueGroupCategories);
    
  } finally {
    await client.close();
  }
}

checkCategories().catch(console.error);