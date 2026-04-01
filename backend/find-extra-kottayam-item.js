// Find which SKU is causing the extra 1 item in Kottayam opening stock (91 vs 90)
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
const matchesKottayam = (warehouseName) => {
  if (!warehouseName) return false;
  const name = warehouseName.toLowerCase().trim();
  return name.includes('kottayam') || name.includes('g.kottayam') || name.includes('gkottayam');
};

// Find the extra item causing 91 vs 90 discrepancy
const findExtraKottayamItem = async () => {
  console.log('\n=== FINDING EXTRA KOTTAYAM ITEM (91 vs 90) ===\n');
  
  // List of SKUs from your image (total = 90)
  const imageSkus = [
    'BLF6-1010', 'BLF7-1010', 'BLF8-1010', 'BLF9-1010', 'BLF10-1010',
    'BRF6-1010', 'BRF7-1010', 'BRF8-1010', 'BRF9-1010', 'BRF10-1010',
    'BRF6-1002', 'BRF7-1002', 'BRF8-1002', 'BRF9-1002', 'BRF10-1002',
    'BLF6-1003', 'BLF7-1003', 'BLF8-1003', 'BLF9-1003', 'BLF10-1003',
    'BRF6-1003', 'BRF7-1003', 'BRF8-1003', 'BRF9-1003', 'BRF10-1003',
    'BRL6-4020', 'BRL7-4020', 'BRL8-4020', 'BRL9-4020', 'BRL10-4020',
    'BLL6-4020', 'BLL7-4020', 'BLL8-4020', 'BLL9-4020', 'BLL10-4020',
    'TAL6-4018', 'TAL7-4018', 'TAL8-4018', 'TAL9-4018', 'TAL10-4018',
    'BRL6-4018', 'BRL7-4018', 'BRL8-4018', 'BRL9-4018', 'BRL10-4018',
    'BLL7-1410', 'BLL8-1410', 'BLL9-1410', 'BLL10-1410',
    'BRL6-1410', 'BRL7-1410', 'BRL8-1410', 'BRL9-1410', 'BRL10-1410',
    'BLF6-1607', 'BLF7-1607', 'BLF8-1607', 'BLF9-1607', 'BLF10-1607',
    'BRF6-1901', 'BRF7-1901', 'BRF8-1901', 'BRF9-1901', 'BRF10-1901'
  ];
  
  // Calculate total from image
  const imageQuantities = [
    3, 5, 2, 2, 1,  // BLF6-1010 to BLF10-1010
    3, 2, 0, 0, 1,  // BRF6-1010 to BRF10-1010
    0, 0, 1, 0, 0,  // BRF6-1002 to BRF10-1002
    2, 4, 2, 0, 3,  // BLF6-1003 to BLF10-1003
    2, 1, 3, 1, 1,  // BRF6-1003 to BRF10-1003
    1, 1, 2, 1, 0,  // BRL6-4020 to BRL10-4020
    1, 2, 2, 0, 1,  // BLL6-4020 to BLL10-4020
    1, 2, 2, 1, 0,  // TAL6-4018 to TAL10-4018
    2, 1, 0, 1, 2,  // BRL6-4018 to BRL10-4018
    0, 1, 1, 0,     // BLL7-1410 to BLL10-1410 (missing BLL6-1410)
    2, 3, 0, 3, 2,  // BRL6-1410 to BRL10-1410
    3, 0, 0, 0, 0,  // BLF6-1607 to BLF10-1607
    4, 1, 0, 2, 3   // BRF6-1901 to BRF10-1901
  ];
  
  const imageTotal = imageQuantities.reduce((sum, qty) => sum + qty, 0);
  console.log(`📊 Image total: ${imageTotal} units`);
  
  try {
    // Get all items with Kottayam opening stock from database
    const standaloneItems = await ShoeItem.find({
      isActive: { $ne: false },
      warehouseStocks: {
        $elemMatch: {
          warehouse: { $regex: /kottayam/i },
          openingStock: { $gt: 0 }
        }
      }
    });
    
    const itemGroups = await ItemGroup.find({
      isActive: { $ne: false },
      'items.warehouseStocks': {
        $elemMatch: {
          warehouse: { $regex: /kottayam/i },
          openingStock: { $gt: 0 }
        }
      }
    });
    
    let databaseItems = [];
    let databaseTotal = 0;
    
    // Process standalone items
    for (const item of standaloneItems) {
      for (const ws of item.warehouseStocks) {
        if (matchesKottayam(ws.warehouse) && ws.openingStock > 0) {
          databaseItems.push({
            sku: item.sku || 'N/A',
            name: item.itemName,
            openingStock: ws.openingStock,
            type: 'standalone'
          });
          databaseTotal += ws.openingStock;
        }
      }
    }
    
    // Process item groups
    for (const group of itemGroups) {
      for (const item of group.items) {
        if (item.warehouseStocks) {
          for (const ws of item.warehouseStocks) {
            if (matchesKottayam(ws.warehouse) && ws.openingStock > 0) {
              databaseItems.push({
                sku: item.sku || 'N/A',
                name: item.name,
                groupName: group.name,
                openingStock: ws.openingStock,
                type: 'group'
              });
              databaseTotal += ws.openingStock;
            }
          }
        }
      }
    }
    
    console.log(`📊 Database total: ${databaseTotal} units`);
    console.log(`📊 Difference: ${databaseTotal - imageTotal} units`);
    
    // Find items in database but not in image
    console.log(`\n🔍 ALL DATABASE ITEMS WITH OPENING STOCK:`);
    databaseItems.forEach(item => {
      const inImage = imageSkus.includes(item.sku);
      const marker = inImage ? '✅' : '❌';
      console.log(`   ${marker} ${item.sku}: ${item.openingStock} units - ${item.name}`);
    });
    
    // Find extra items (in database but not in image)
    const extraItems = databaseItems.filter(item => !imageSkus.includes(item.sku));
    
    if (extraItems.length > 0) {
      console.log(`\n🚨 EXTRA ITEMS IN DATABASE (not in image):`);
      extraItems.forEach(item => {
        console.log(`   ❌ ${item.sku}: ${item.openingStock} units - ${item.name}`);
        if (item.groupName) {
          console.log(`      Group: ${item.groupName}`);
        }
      });
    }
    
    // Find missing items (in image but not in database)
    const databaseSkus = databaseItems.map(item => item.sku);
    const missingItems = imageSkus.filter(sku => !databaseSkus.includes(sku));
    
    if (missingItems.length > 0) {
      console.log(`\n⚠️ MISSING ITEMS FROM DATABASE (in image but not in database):`);
      missingItems.forEach(sku => {
        console.log(`   ⚠️ ${sku}: Missing from database`);
      });
    }
    
    // Check for quantity differences
    console.log(`\n🔍 QUANTITY DIFFERENCES:`);
    for (const dbItem of databaseItems) {
      if (imageSkus.includes(dbItem.sku)) {
        const imageIndex = imageSkus.indexOf(dbItem.sku);
        const imageQty = imageQuantities[imageIndex];
        if (dbItem.openingStock !== imageQty) {
          console.log(`   📊 ${dbItem.sku}: Database=${dbItem.openingStock}, Image=${imageQty}, Diff=${dbItem.openingStock - imageQty}`);
        }
      }
    }
    
    console.log(`\n💡 SUMMARY:`);
    if (databaseTotal === 91 && imageTotal === 90) {
      console.log(`✅ Confirmed: Database shows 91, Image shows 90 (difference: +1)`);
      if (extraItems.length > 0) {
        console.log(`🎯 The extra item(s) causing +1 difference:`);
        extraItems.forEach(item => {
          console.log(`   • ${item.sku}: +${item.openingStock} units`);
        });
      }
    } else {
      console.log(`⚠️ Totals don't match expected values:`);
      console.log(`   Database: ${databaseTotal} (expected 91)`);
      console.log(`   Image: ${imageTotal} (expected 90)`);
    }
    
  } catch (error) {
    console.error('❌ Error finding extra item:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await findExtraKottayamItem();
  
  console.log('\n=== ANALYSIS COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);