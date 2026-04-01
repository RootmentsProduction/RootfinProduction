const { MongoClient } = require('mongodb');
require('dotenv').config();

// Excel data from the user
const excelData = {
  'BLF6-1010': 3,
  'BLF7-1010': 3,
  'BLF8-1010': 0,
  'BLF9-1010': 0,
  'BLF10-1010': 0,
  'BRF6-1010': 3,
  'BRF7-1010': 3,
  'BRF8-1010': 2,
  'BRF9-1010': 2,
  'BRF10-1010': 0,
  'BRF6-1002': 0,
  'BRF7-1002': 1,
  'BRF8-1002': 0,
  'BRF9-1002': 0,
  'BRF10-1002': 0,
  'BLF6-1003': 1,
  'BLF7-1003': 3,
  'BLF8-1003': 2,
  'BLF9-1003': 1,
  'BLF10-1003': 0,
  'BRF6-1003': 4,
  'BRF7-1003': 3,
  'BRF8-1003': 2,
  'BRF9-1003': 1,
  'BRF10-1003': 1,
  'BRL6-4020': 1,
  'BRL7-4020': 3,
  'BRL8-4020': 1,
  'BRL9-4020': 0,
  'BRL10-4020': 1,
  'BLL6-4020': 3,
  'BLL7-4020': 1,
  'BLL8-4020': 0,
  'BLL9-4020': 0,
  'BLL10-4020': 1,
  'TAL6-4018': 2,
  'TAL7-4018': 2,
  'TAL8-4018': 1,
  'TAL9-4018': 0,
  'TAL10-4018': 1,
  'BRL6-4018': 2,
  'BRL7-4018': 2,
  'BRL8-4018': 1,
  'BRL9-4018': 2,
  'BRL10-4018': 2,
  'BLL6-1410': 0,
  'BLL7-1410': 2,
  'BLL8-1410': 2,
  'BLL9-1410': 3,
  'BLL10-1410': 0,
  'BRL6-1410': 1,
  'BRL7-1410': 2,
  'BRL8-1410': 1,
  'BRL9-1410': 1,
  'BRL10-1410': 3,
  'BLF6-1607': 3,
  'BLF7-1607': 0,
  'BLF8-1607': 0,
  'BLF9-1607': 1,
  'BLF10-1607': 2,
  'BRF6-1301': 0,
  'BRF7-1301': 1,
  'BRF8-1301': 3,
  'BRF9-1301': 2,
  'BRF10-1301': 3
};

async function compareEdappallyStock() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('shoe_inventory');
    
    // Get all items from database
    const items = await db.collection('shoeitems').find({}).toArray();
    console.log(`Found ${items.length} items in database`);
    
    // Find Edappally store
    const stores = await db.collection('stores').find({}).toArray();
    const edappallyStore = stores.find(store => 
      store.name && store.name.toLowerCase().includes('edappally')
    );
    
    if (!edappallyStore) {
      console.log('Available stores:');
      stores.forEach(store => console.log(`- ${store.name} (${store._id})`));
      throw new Error('Edappally store not found');
    }
    
    console.log(`Found Edappally store: ${edappallyStore.name} (ID: ${edappallyStore._id})`);
    
    const differences = [];
    const notFoundInDB = [];
    const notFoundInExcel = [];
    
    // Check each Excel item against database
    for (const [sku, excelStock] of Object.entries(excelData)) {
      const item = items.find(item => item.sku === sku);
      
      if (!item) {
        notFoundInDB.push({ sku, excelStock });
        continue;
      }
      
      // Find stock for Edappally store
      const storeStock = item.stock && item.stock.find(s => 
        s.storeId && s.storeId.toString() === edappallyStore._id.toString()
      );
      
      const dbStock = storeStock ? storeStock.quantity : 0;
      
      if (dbStock !== excelStock) {
        differences.push({
          sku,
          excelStock,
          dbStock,
          difference: excelStock - dbStock,
          itemName: item.name || 'N/A'
        });
      }
    }
    
    // Check for items in DB but not in Excel (for Edappally)
    const edappallyItems = items.filter(item => {
      const storeStock = item.stock && item.stock.find(s => 
        s.storeId && s.storeId.toString() === edappallyStore._id.toString()
      );
      return storeStock && storeStock.quantity > 0;
    });
    
    edappallyItems.forEach(item => {
      if (!excelData.hasOwnProperty(item.sku)) {
        const storeStock = item.stock.find(s => 
          s.storeId && s.storeId.toString() === edappallyStore._id.toString()
        );
        notFoundInExcel.push({
          sku: item.sku,
          dbStock: storeStock.quantity,
          itemName: item.name || 'N/A'
        });
      }
    });
    
    // Print results
    console.log('\n=== STOCK COMPARISON RESULTS ===\n');
    
    if (differences.length > 0) {
      console.log('🔍 STOCK DIFFERENCES FOUND:');
      console.log('SKU\t\tExcel\tDB\tDiff\tItem Name');
      console.log('-'.repeat(80));
      differences.forEach(diff => {
        console.log(`${diff.sku}\t${diff.excelStock}\t${diff.dbStock}\t${diff.difference > 0 ? '+' : ''}${diff.difference}\t${diff.itemName}`);
      });
      console.log(`\nTotal differences: ${differences.length}`);
    } else {
      console.log('✅ All Excel items match database stock!');
    }
    
    if (notFoundInDB.length > 0) {
      console.log('\n❌ ITEMS IN EXCEL BUT NOT IN DATABASE:');
      console.log('SKU\t\tExcel Stock');
      console.log('-'.repeat(30));
      notFoundInDB.forEach(item => {
        console.log(`${item.sku}\t${item.excelStock}`);
      });
      console.log(`\nTotal missing from DB: ${notFoundInDB.length}`);
    }
    
    if (notFoundInExcel.length > 0) {
      console.log('\n📋 ITEMS IN DATABASE BUT NOT IN EXCEL:');
      console.log('SKU\t\tDB Stock\tItem Name');
      console.log('-'.repeat(50));
      notFoundInExcel.forEach(item => {
        console.log(`${item.sku}\t${item.dbStock}\t\t${item.itemName}`);
      });
      console.log(`\nTotal missing from Excel: ${notFoundInExcel.length}`);
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Excel items: ${Object.keys(excelData).length}`);
    console.log(`Items with differences: ${differences.length}`);
    console.log(`Items missing from DB: ${notFoundInDB.length}`);
    console.log(`Items missing from Excel: ${notFoundInExcel.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

compareEdappallyStock();