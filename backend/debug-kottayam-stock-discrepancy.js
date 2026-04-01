// Debug script to check Kottayam stock discrepancy between opening stock (91) and current report (90)
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

// Analyze Kottayam stock discrepancy
const analyzeKottayamStock = async () => {
  console.log('\n=== ANALYZING KOTTAYAM STOCK DISCREPANCY ===\n');
  
  try {
    // Get all items with Kottayam stock
    const standaloneItems = await ShoeItem.find({
      isActive: { $ne: false },
      warehouseStocks: {
        $elemMatch: {
          warehouse: { $regex: /kottayam/i }
        }
      }
    });
    
    const itemGroups = await ItemGroup.find({
      isActive: { $ne: false },
      'items.warehouseStocks': {
        $elemMatch: {
          warehouse: { $regex: /kottayam/i }
        }
      }
    });
    
    console.log(`📦 Found ${standaloneItems.length} standalone items with Kottayam stock`);
    console.log(`📦 Found ${itemGroups.length} item groups with Kottayam stock`);
    
    let totalOpeningStock = 0;
    let totalCurrentStock = 0;
    let itemDetails = [];
    
    // Process standalone items
    console.log(`\n🔍 STANDALONE ITEMS:`);
    for (const item of standaloneItems) {
      for (const ws of item.warehouseStocks) {
        if (matchesKottayam(ws.warehouse)) {
          const openingStock = parseFloat(ws.openingStock) || 0;
          const currentStock = parseFloat(ws.stockOnHand) || 0;
          
          totalOpeningStock += openingStock;
          totalCurrentStock += currentStock;
          
          if (openingStock > 0 || currentStock > 0) {
            itemDetails.push({
              type: 'standalone',
              name: item.itemName,
              sku: item.sku || 'N/A',
              warehouse: ws.warehouse,
              openingStock,
              currentStock,
              difference: currentStock - openingStock
            });
            
            console.log(`   ${item.itemName} (${item.sku || 'N/A'}): Opening=${openingStock}, Current=${currentStock}, Diff=${currentStock - openingStock}`);
          }
        }
      }
    }
    
    // Process item groups
    console.log(`\n🔍 ITEM GROUP ITEMS:`);
    for (const group of itemGroups) {
      for (const item of group.items) {
        if (item.warehouseStocks) {
          for (const ws of item.warehouseStocks) {
            if (matchesKottayam(ws.warehouse)) {
              const openingStock = parseFloat(ws.openingStock) || 0;
              const currentStock = parseFloat(ws.stockOnHand) || 0;
              
              totalOpeningStock += openingStock;
              totalCurrentStock += currentStock;
              
              if (openingStock > 0 || currentStock > 0) {
                itemDetails.push({
                  type: 'group',
                  groupName: group.name,
                  name: item.name,
                  sku: item.sku || 'N/A',
                  warehouse: ws.warehouse,
                  openingStock,
                  currentStock,
                  difference: currentStock - openingStock
                });
                
                console.log(`   ${group.name} - ${item.name} (${item.sku || 'N/A'}): Opening=${openingStock}, Current=${currentStock}, Diff=${currentStock - openingStock}`);
              }
            }
          }
        }
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Opening Stock: ${totalOpeningStock}`);
    console.log(`   Total Current Stock: ${totalCurrentStock}`);
    console.log(`   Difference: ${totalCurrentStock - totalOpeningStock}`);
    
    console.log(`\n🔍 ANALYSIS:`);
    if (totalOpeningStock === 91 && totalCurrentStock === 90) {
      console.log(`✅ Confirmed discrepancy: Opening Stock (91) vs Current Stock (90)`);
      console.log(`📉 Net difference: -1 unit (1 unit missing from current stock)`);
    } else if (totalOpeningStock === 91) {
      console.log(`✅ Opening Stock matches report: ${totalOpeningStock}`);
      console.log(`⚠️ Current Stock calculation: ${totalCurrentStock} (expected 90)`);
    } else if (totalCurrentStock === 90) {
      console.log(`✅ Current Stock matches report: ${totalCurrentStock}`);
      console.log(`⚠️ Opening Stock calculation: ${totalOpeningStock} (expected 91)`);
    } else {
      console.log(`⚠️ Neither total matches the reports:`);
      console.log(`   Database Opening Stock: ${totalOpeningStock} (report says 91)`);
      console.log(`   Database Current Stock: ${totalCurrentStock} (report says 90)`);
    }
    
    // Find items with differences
    const itemsWithDifferences = itemDetails.filter(item => item.difference !== 0);
    if (itemsWithDifferences.length > 0) {
      console.log(`\n📋 ITEMS WITH STOCK MOVEMENTS (${itemsWithDifferences.length} items):`);
      itemsWithDifferences.forEach(item => {
        const sign = item.difference > 0 ? '+' : '';
        console.log(`   ${item.name} (${item.sku}): ${sign}${item.difference} units`);
      });
    }
    
    // Find potential issues
    console.log(`\n🔧 POTENTIAL CAUSES OF DISCREPANCY:`);
    console.log(`1. Sales transactions that reduced stock`);
    console.log(`2. Transfer orders that moved stock out`);
    console.log(`3. Inventory adjustments (negative)`);
    console.log(`4. Data entry errors`);
    console.log(`5. Warehouse name variations causing miscounting`);
    
    // Check for warehouse name variations
    const uniqueWarehouses = [...new Set(itemDetails.map(item => item.warehouse))];
    console.log(`\n🏢 WAREHOUSE NAME VARIATIONS FOUND:`);
    uniqueWarehouses.forEach(warehouse => {
      console.log(`   "${warehouse}"`);
    });
    
    if (uniqueWarehouses.length > 1) {
      console.log(`⚠️ Multiple warehouse name variations detected!`);
      console.log(`   This could cause items to be counted separately in different reports`);
    }
    
  } catch (error) {
    console.error('❌ Error analyzing Kottayam stock:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await analyzeKottayamStock();
  
  console.log('\n=== ANALYSIS COMPLETED ===');
  console.log('\n💡 RECOMMENDATION:');
  console.log('1. Check if the opening stock report and inventory report use the same warehouse name matching logic');
  console.log('2. Verify if there were any sales, transfers, or adjustments that reduced stock by 1 unit');
  console.log('3. Ensure both reports are filtering by the same date range');
  console.log('4. Check for any recent transactions that might explain the 1-unit difference');
  
  process.exit(0);
};

main().catch(console.error);