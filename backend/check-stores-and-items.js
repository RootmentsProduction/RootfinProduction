import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function checkStoresAndItems() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('admin');
    
    // Check stores collection
    console.log('\n=== CHECKING STORES ===');
    const stores = await db.collection('stores').find({}).toArray();
    console.log(`Found ${stores.length} stores:`);
    stores.forEach((store, index) => {
      console.log(`${index + 1}. Name: "${store.name || store.storeName || 'Unnamed'}" | ID: ${store._id}`);
      if (store.address) console.log(`   Address: ${store.address}`);
      if (store.location) console.log(`   Location: ${store.location}`);
      console.log(`   Full object:`, JSON.stringify(store, null, 2));
      console.log('---');
    });
    
    // Check shoeitems collection
    console.log('\n=== CHECKING SHOE ITEMS ===');
    const items = await db.collection('shoeitems').find({}).toArray();
    console.log(`Found ${items.length} shoe items`);
    
    if (items.length > 0) {
      console.log('\nSample item structure:');
      console.log(JSON.stringify(items[0], null, 2));
      
      // Check if any items have stock data
      const itemsWithStock = items.filter(item => item.stock && item.stock.length > 0);
      console.log(`\nItems with stock data: ${itemsWithStock.length}`);
      
      if (itemsWithStock.length > 0) {
        console.log('\nSample item with stock:');
        console.log(JSON.stringify(itemsWithStock[0], null, 2));
      }
      
      // Check for items with warehouseStocks
      const itemsWithWarehouseStocks = items.filter(item => item.warehouseStocks && item.warehouseStocks.length > 0);
      console.log(`\nItems with warehouseStocks: ${itemsWithWarehouseStocks.length}`);
      
      if (itemsWithWarehouseStocks.length > 0) {
        console.log('\nSample item with warehouseStocks:');
        console.log(JSON.stringify(itemsWithWarehouseStocks[0], null, 2));
        
        // Show all warehouse names
        const warehouseNames = new Set();
        itemsWithWarehouseStocks.forEach(item => {
          item.warehouseStocks.forEach(ws => {
            if (ws.warehouse) warehouseNames.add(ws.warehouse);
          });
        });
        
        console.log('\nAll warehouse names found:');
        Array.from(warehouseNames).forEach(name => console.log(`- "${name}"`));
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkStoresAndItems();