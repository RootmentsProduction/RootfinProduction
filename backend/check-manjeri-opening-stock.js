// Check Manjeri opening stock - compare image data (156 total) with backend database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Helper function to match warehouse names
const matchesManjeri = (warehouseName) => {
  if (!warehouseName) return false;
  const name = warehouseName.toLowerCase().trim();
  return name.includes('manjeri') || name.includes('manjery') || 
         name.includes('g.manjeri') || name.includes('g.manjery') ||
         name.includes('gmanjeri') || name.includes('gmanjery');
};

// Check Manjeri opening stock discrepancy
const checkManjeriOpeningStock = async () => {
  console.log('\n=== CHECKING MANJERI OPENING STOCK (Image vs Database) ===\n');
  
  // Data from your images (MANJERY 010-02-2026) - Total should be 156
  const imageData = {
    'BLF6-1010': 4, 'BLF7-1010': 2, 'BLF8-1010': 1, 'BLF9-1010': 2, 'BLF10-1010': 3,
    'BRF6-1010': 2, 'BRF7-1010': 2, 'BRF8-1010': 3, 'BRF9-1010': 1, 'BRF10-1010': 3,
    'BRF6-1002': 2, 'BRF7-1002': 2, 'BRF8-1002': 0, 'BRF9-1002': 1, 'BRF10-1002': 0,
    'BLF6-1003': 3, 'BLF7-1003': 2, 'BLF8-1003': 2, 'BLF9-1003': 1, 'BLF10-1003': 2,
    'BRF6-1003': 2, 'BRF7-1003': 3, 'BRF8-1003': 3, 'BRF9-1003': 2, 'BRF10-1003': 2,
    'BRL6-4020': 3, 'BRL7-4020': 3, 'BRL8-4020': 1, 'BRL9-4020': 3, 'BRL10-4020': 2,
    'BLL6-4020': 3, 'BLL7-4020': 2, 'BLL8-4020': 3, 'BLL9-4020': 2, 'BLL10-4020': 2,
    'TAL6-4018': 2, 'TAL7-4018': 1, 'TAL8-4018': 1, 'TAL9-4018': 2, 'TAL10-4018': 2,
    'BRL6-4018': 3, 'BRL7-4018': 2, 'BRL8-4018': 3, 'BRL9-4018': 2, 'BRL10-4018': 2,
    'BLL6-1410': 2, 'BLL7-1410': 2, 'BLL8-1410': 0, 'BLL9-1410': 3, 'BLL10-1410': 3,
    'BRL6-1410': 4, 'BRL7-1410': 5, 'BRL8-1410': 2, 'BRL9-1410': 2, 'BRL10-1410': 2,
    'BLF6-1607': 2, 'BLF7-1607': 4, 'BLF8-1607': 4, 'BLF9-1607': 3, 'BLF10-1607': 1,
    'BRF6-1901': 3, 'BRF7-1901': 6, 'BRF8-1901': 4, 'BRF9-1901': 7, 'BRF10-1901': 3
  };
  
  // Calculate total from image
  const imageTotal = Object.values(imageData).reduce((sum, qty) => sum + qty, 0);
  console.log(`📊 Image total: ${imageTotal} units`);
  
  try {
    // Get all items with Manjeri opening stock from database
    const standaloneItems = await ShoeItem.find({
      isActive: { $ne: false },
      warehouseStocks: {
        $elemMatch: {
          warehouse: { $regex: /manjeri|manjery/i },
          openingStock: { $gt: 0 }
        }
      }
    });
    
    const itemGroups = await ItemGroup.find({
      isActive: { $ne: false },
      'items.warehouseStocks': {
        $elemMatch: {
          warehouse: { $regex: /manjeri|manjery/i },
          openingStock: { $gt: 0 }
        }
      }
    });
    
    let databaseItems = {};
    let databaseTotal = 0;
    
    // Process standalone items
    for (const item of standaloneItems) {
      for (const ws of item.warehouseStocks) {
        if (matchesManjeri(ws.warehouse) && ws.openingStock > 0) {
          const sku = item.sku || 'N/A';
          databaseItems[sku] = {
            openingStock: ws.openingStock,
            name: item.itemName,
            type: 'standalone',
            warehouse: ws.warehouse
          };
          databaseTotal += ws.openingStock;
        }
      }
    }
    
    // Process item groups
    for (const group of itemGroups) {
      for (const item of group.items) {
        if (item.warehouseStocks) {
          for (const ws of item.warehouseStocks) {
            if (matchesManjeri(ws.warehouse) && ws.openingStock > 0) {
              const sku = item.sku || 'N/A';
              databaseItems[sku] = {
                openingStock: ws.openingStock,
                name: item.name,
                groupName: group.name,
                type: 'group',
                warehouse: ws.warehouse
              };
              databaseTotal += ws.openingStock;
            }
          }
        }
      }
    }
    
    console.log(`📊 Database total: ${databaseTotal} units`);
    console.log(`📊 Difference: ${databaseTotal - imageTotal} units`);
    
    // Find warehouse name variations
    const uniqueWarehouses = [...new Set(Object.values(databaseItems).map(item => item.warehouse))];
    console.log(`\n🏢 Warehouse names found in database:`);
    uniqueWarehouses.forEach(warehouse => {
      console.log(`   "${warehouse}"`);
    });
    
    // Compare each SKU
    console.log(`\n🔍 DETAILED COMPARISON:`);
    console.log(`${'SKU'.padEnd(15)} | ${'Image'.padEnd(8)} | ${'Database'.padEnd(10)} | ${'Diff'.padEnd(6)} | Status`);
    console.log(`${'-'.repeat(15)} | ${'-'.repeat(8)} | ${'-'.repeat(10)} | ${'-'.repeat(6)} | ${'-'.repeat(10)}`);
    
    let totalDifferences = 0;
    let itemsWithDifferences = [];
    
    // Check all SKUs from image
    for (const [sku, imageQty] of Object.entries(imageData)) {
      const dbItem = databaseItems[sku];
      const dbQty = dbItem ? dbItem.openingStock : 0;
      const diff = dbQty - imageQty;
      
      let status = '✅ Match';
      if (diff > 0) {
        status = `❌ +${diff} extra`;
        totalDifferences += diff;
        itemsWithDifferences.push({ sku, imageQty, dbQty, diff, type: 'extra' });
      } else if (diff < 0) {
        status = `⚠️ ${diff} missing`;
        totalDifferences += diff;
        itemsWithDifferences.push({ sku, imageQty, dbQty, diff, type: 'missing' });
      }
      
      console.log(`${sku.padEnd(15)} | ${imageQty.toString().padEnd(8)} | ${dbQty.toString().padEnd(10)} | ${diff.toString().padEnd(6)} | ${status}`);
    }
    
    // Check for SKUs in database but not in image
    console.log(`\n🔍 EXTRA SKUs IN DATABASE (not in image):`);
    let extraSkusFound = false;
    for (const [sku, dbItem] of Object.entries(databaseItems)) {
      if (!imageData.hasOwnProperty(sku)) {
        console.log(`   ❌ ${sku}: ${dbItem.openingStock} units - ${dbItem.name}`);
        if (dbItem.groupName) {
          console.log(`      Group: ${dbItem.groupName}`);
        }
        totalDifferences += dbItem.openingStock;
        itemsWithDifferences.push({ 
          sku, 
          imageQty: 0, 
          dbQty: dbItem.openingStock, 
          diff: dbItem.openingStock, 
          type: 'extra_sku',
          name: dbItem.name 
        });
        extraSkusFound = true;
      }
    }
    if (!extraSkusFound) {
      console.log(`   ✅ No extra SKUs found`);
    }
    
    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Image Total: ${imageTotal} units`);
    console.log(`   Database Total: ${databaseTotal} units`);
    console.log(`   Net Difference: ${databaseTotal - imageTotal} units`);
    
    if (itemsWithDifferences.length > 0) {
      console.log(`\n🚨 ITEMS WITH DIFFERENCES (${itemsWithDifferences.length} items):`);
      
      const extraItems = itemsWithDifferences.filter(item => item.diff > 0);
      const missingItems = itemsWithDifferences.filter(item => item.diff < 0);
      
      if (extraItems.length > 0) {
        console.log(`\n   📈 EXTRA IN DATABASE:`);
        extraItems.forEach(item => {
          console.log(`      ${item.sku}: +${item.diff} units (DB: ${item.dbQty}, Image: ${item.imageQty})`);
        });
      }
      
      if (missingItems.length > 0) {
        console.log(`\n   📉 MISSING FROM DATABASE:`);
        missingItems.forEach(item => {
          console.log(`      ${item.sku}: ${item.diff} units (DB: ${item.dbQty}, Image: ${item.imageQty})`);
        });
      }
    } else {
      console.log(`\n✅ ALL SKUs MATCH PERFECTLY!`);
    }
    
    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    if (databaseTotal === imageTotal) {
      console.log(`✅ Database matches image perfectly (${databaseTotal} units)`);
    } else if (databaseTotal > imageTotal) {
      console.log(`⚠️ Database has ${databaseTotal - imageTotal} extra units`);
      console.log(`   Check if these items were added incorrectly or if image is missing items`);
    } else {
      console.log(`⚠️ Database is missing ${imageTotal - databaseTotal} units`);
      console.log(`   Some items from the image may not have been added to the database`);
    }
    
  } catch (error) {
    console.error('❌ Error checking Manjeri stock:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkManjeriOpeningStock();
  
  console.log('\n=== MANJERI STOCK CHECK COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);