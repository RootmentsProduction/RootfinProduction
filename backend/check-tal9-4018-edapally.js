// Check specifically for TAL9-4018 (Tan Loafer size 9) in Edapally branch
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
const matchesEdapally = (warehouseName) => {
  if (!warehouseName) return false;
  const name = warehouseName.toLowerCase().trim();
  return name.includes('edapally') || name.includes('edappally') ||
         name.includes('g.edapally') || name.includes('g.edappally') ||
         name.includes('gedapally') || name.includes('gedappally') ||
         name === 'edapally branch' || name === 'edappally branch';
};

// Check for TAL9-4018 specifically
const checkTAL9InEdapally = async () => {
  console.log('\n=== CHECKING TAL9-4018 (Tan Loafer Size 9) in EDAPALLY ===\n');
  
  try {
    // Search in standalone items
    console.log('🔍 Searching in standalone items...');
    const standaloneItems = await ShoeItem.find({
      sku: 'TAL9-4018'
    });
    
    console.log(`Found ${standaloneItems.length} standalone items with SKU TAL9-4018`);
    
    if (standaloneItems.length > 0) {
      standaloneItems.forEach(item => {
        console.log(`\n📦 Standalone Item: ${item.itemName || 'N/A'}`);
        console.log(`   SKU: ${item.sku}`);
        console.log(`   Active: ${item.isActive !== false ? 'Yes' : 'No'}`);
        
        if (item.warehouseStocks && item.warehouseStocks.length > 0) {
          console.log('   Warehouse Stocks:');
          item.warehouseStocks.forEach(ws => {
            if (matchesEdapally(ws.warehouse)) {
              console.log(`   🏢 ${ws.warehouse}:`);
              console.log(`      Opening Stock: ${ws.openingStock || 0}`);
              console.log(`      Stock On Hand: ${ws.stockOnHand || 0}`);
              console.log(`      Available for Sale: ${ws.availableForSale || 0}`);
            }
          });
        } else {
          console.log('   ❌ No warehouse stocks found');
        }
      });
    }
    
    // Search in item groups
    console.log('\n🔍 Searching in item groups...');
    const itemGroups = await ItemGroup.find({
      'items.sku': 'TAL9-4018'
    });
    
    console.log(`Found ${itemGroups.length} item groups containing SKU TAL9-4018`);
    
    if (itemGroups.length > 0) {
      itemGroups.forEach(group => {
        console.log(`\n📦 Item Group: ${group.name || group.itemName || 'N/A'}`);
        console.log(`   Item Code: ${group.itemCode}`);
        console.log(`   Active: ${group.isActive !== false ? 'Yes' : 'No'}`);
        
        // Find the specific item within the group
        const targetItem = group.items.find(item => item.sku === 'TAL9-4018');
        if (targetItem) {
          console.log(`\n   🎯 Found TAL9-4018 in this group:`);
          console.log(`      Name: ${targetItem.name || 'N/A'}`);
          console.log(`      SKU: ${targetItem.sku}`);
          console.log(`      Active: ${targetItem.isActive !== false ? 'Yes' : 'No'}`);
          console.log(`      Cost Price: ₹${targetItem.costPrice || 0}`);
          console.log(`      Selling Price: ₹${targetItem.sellingPrice || 0}`);
          
          if (targetItem.warehouseStocks && targetItem.warehouseStocks.length > 0) {
            console.log('\n   📊 Warehouse Stocks:');
            let edapallyFound = false;
            
            targetItem.warehouseStocks.forEach(ws => {
              if (matchesEdapally(ws.warehouse)) {
                edapallyFound = true;
                console.log(`   🏢 ${ws.warehouse}:`);
                console.log(`      Opening Stock: ${ws.openingStock || 0}`);
                console.log(`      Stock On Hand: ${ws.stockOnHand || 0}`);
                console.log(`      Available for Sale: ${ws.availableForSale || 0}`);
                console.log(`      Committed Stock: ${ws.committedStock || 0}`);
              }
            });
            
            if (!edapallyFound) {
              console.log('   ❌ No Edapally warehouse stock found for this item');
              console.log('   📋 Available warehouses:');
              targetItem.warehouseStocks.forEach(ws => {
                console.log(`      - ${ws.warehouse}: ${ws.stockOnHand || 0} units`);
              });
            }
          } else {
            console.log('   ❌ No warehouse stocks found for this item');
          }
        }
      });
    }
    
    // Search for similar SKUs (in case of typo)
    console.log('\n🔍 Searching for similar TAL SKUs in size 9...');
    const similarItems = await ItemGroup.find({
      'items.sku': { $regex: /TAL.*9/i }
    });
    
    if (similarItems.length > 0) {
      console.log('\n📋 Found similar TAL size 9 SKUs:');
      similarItems.forEach(group => {
        group.items.forEach(item => {
          if (item.sku && item.sku.match(/TAL.*9/i)) {
            console.log(`   - ${item.sku}: ${item.name || 'N/A'}`);
          }
        });
      });
    }
    
    // Check all TAL items in Edapally to see what's available
    console.log('\n🔍 All TAL (Tan Loafer) items in Edapally:');
    const allTALGroups = await ItemGroup.find({
      'items.sku': { $regex: /^TAL/i },
      'items.warehouseStocks.warehouse': { $regex: /edapally|edappally/i }
    });
    
    if (allTALGroups.length > 0) {
      console.log('\n📋 TAL items found in Edapally:');
      allTALGroups.forEach(group => {
        group.items.forEach(item => {
          if (item.sku && item.sku.match(/^TAL/i)) {
            const edapallyStock = item.warehouseStocks?.find(ws => matchesEdapally(ws.warehouse));
            if (edapallyStock) {
              console.log(`   - ${item.sku}: ${edapallyStock.stockOnHand || 0} units (${item.name || 'N/A'})`);
            }
          }
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking TAL9-4018:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkTAL9InEdapally();
  
  console.log('\n=== TAL9-4018 CHECK COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);