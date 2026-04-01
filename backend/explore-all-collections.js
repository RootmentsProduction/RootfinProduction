import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function exploreAllCollections() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('admin');
    const collections = await db.listCollections().toArray();
    
    console.log('\n=== EXPLORING ALL COLLECTIONS ===');
    
    for (const collection of collections) {
      const colName = collection.name;
      const count = await db.collection(colName).countDocuments();
      
      console.log(`\n📁 Collection: ${colName} (${count} documents)`);
      
      if (count > 0) {
        const sample = await db.collection(colName).findOne({});
        
        // Check if this might be items or stores
        if (colName.toLowerCase().includes('item') || 
            colName.toLowerCase().includes('shoe') ||
            colName.toLowerCase().includes('product') ||
            sample.sku || 
            sample.itemName ||
            sample.warehouseStocks) {
          console.log('🔍 This looks like an ITEMS collection!');
          console.log('Sample document:');
          console.log(JSON.stringify(sample, null, 2));
        }
        
        if (colName.toLowerCase().includes('store') || 
            colName.toLowerCase().includes('warehouse') ||
            colName.toLowerCase().includes('branch') ||
            sample.storeName ||
            sample.warehouseName ||
            (sample.name && sample.address)) {
          console.log('🏪 This looks like a STORES collection!');
          console.log('Sample document:');
          console.log(JSON.stringify(sample, null, 2));
        }
        
        // For other collections, just show basic info
        if (!colName.toLowerCase().includes('item') && 
            !colName.toLowerCase().includes('store') &&
            !colName.toLowerCase().includes('shoe')) {
          console.log('Sample keys:', Object.keys(sample).slice(0, 10).join(', '));
        }
      }
    }
    
    // Also check the rootments database
    console.log('\n\n=== CHECKING ROOTMENTS DATABASE ===');
    const rootmentsDb = client.db('rootments');
    const rootmentsCollections = await rootmentsDb.listCollections().toArray();
    
    for (const collection of rootmentsCollections) {
      const colName = collection.name;
      const count = await rootmentsDb.collection(colName).countDocuments();
      
      console.log(`\n📁 Collection: ${colName} (${count} documents)`);
      
      if (count > 0) {
        const sample = await rootmentsDb.collection(colName).findOne({});
        
        // Check if this might be items or stores
        if (colName.toLowerCase().includes('item') || 
            colName.toLowerCase().includes('shoe') ||
            colName.toLowerCase().includes('product') ||
            sample.sku || 
            sample.itemName ||
            sample.warehouseStocks) {
          console.log('🔍 This looks like an ITEMS collection!');
          console.log('Sample document:');
          console.log(JSON.stringify(sample, null, 2));
        }
        
        if (colName.toLowerCase().includes('store') || 
            colName.toLowerCase().includes('warehouse') ||
            colName.toLowerCase().includes('branch') ||
            sample.storeName ||
            sample.warehouseName ||
            (sample.name && sample.address)) {
          console.log('🏪 This looks like a STORES collection!');
          console.log('Sample document:');
          console.log(JSON.stringify(sample, null, 2));
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

exploreAllCollections();