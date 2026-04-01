// Check for missing data in G.Edapally store - comprehensive analysis
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

// Check for missing data in Edapally
const checkEdapallyMissingData = async () => {
  console.log('\n=== CHECKING FOR MISSING DATA IN G.EDAPALLY STORE ===\n');
  
  try {
    // Get all active item groups
    const allItemGroups = await ItemGroup.find({
      isActive: { $ne: false }
    });
    
    console.log(`📊 Total active item groups: ${allItemGroups.length}`);
    
    let totalItems = 0;
    let itemsWithEdapallyStock = 0;
    let itemsMissingEdapallyStock = [];
    let edapallyItems = [];
    
    // Analyze each item group
    for (const group of allItemGroups) {
      if (group.items && group.items.length > 0) {
        for (const item of group.items) {
          if (item.isActive !== false) {
            totalItems++;
            
            // Check if this item has Edapally warehouse stock
            let hasEdapallyStock = false;
            let edapallyStockInfo = null;
            
            if (item.warehouseStocks && item.warehouseStocks.length > 0) {
              const edapallyStock = item.warehouseStocks.find(ws => matchesEdapally(ws.warehouse));
              if (edapallyStock) {
                hasEdapallyStock = true;
                edapallyStockInfo = edapallyStock;
                itemsWithEdapallyStock++;
                
                edapallyItems.push({
                  sku: item.sku,
                  name: item.name,
                  groupName: group.name || group.itemName,
                  openingStock: edapallyStock.openingStock || 0,
                  stockOnHand: edapallyStock.stockOnHand || 0,
                  availableForSale: edapallyStock.availableForSale || 0
                });
              }
            }
            
            if (!hasEdapallyStock) {
              // Check if this item has stock in other warehouses (to see if it should have Edapally stock)
              const hasOtherWarehouseStock = item.warehouseStocks && item.warehouseStocks.length > 0;
              
              itemsMissingEdapallyStock.push({
                sku: item.sku,
                name: item.name,
                groupName: group.name || group.itemName,
                hasOtherWarehouses: hasOtherWarehouseStock,
                otherWarehouses: hasOtherWarehouseStock ? 
                  item.warehouseStocks.map(ws => `${ws.warehouse}: ${ws.stockOnHand || 0}`).join(', ') : 
                  'No warehouse stocks'
              });
            }
          }
        }
      }
    }
    
    console.log(`📊 Analysis Results:`);
    console.log(`   Total active items: ${totalItems}`);
    console.log(`   Items with Edapally stock: ${itemsWithEdapallyStock}`);
    console.log(`   Items missing Edapally stock: ${itemsMissingEdapallyStock.length}`);
    console.log(`   Coverage: ${((itemsWithEdapallyStock / totalItems) * 100).toFixed(1)}%`);
    
    // Show items missing Edapally stock
    if (itemsMissingEdapallyStock.length > 0) {
      console.log(`\n❌ ITEMS MISSING EDAPALLY WAREHOUSE STOCK (${itemsMissingEdapallyStock.length} items):`);
      console.log(`${'SKU'.padEnd(15)} | ${'Name'.padEnd(30)} | ${'Group'.padEnd(20)} | Other Warehouses`);
      console.log(`${'-'.repeat(15)} | ${'-'.repeat(30)} | ${'-'.repeat(20)} | ${'-'.repeat(30)}`);
      
      itemsMissingEdapallyStock.slice(0, 20).forEach(item => {
        const name = (item.name || 'N/A').substring(0, 28);
        const group = (item.groupName || 'N/A').substring(0, 18);
        const warehouses = item.hasOtherWarehouses ? '✅ Yes' : '❌ No';
        console.log(`${(item.sku || 'N/A').padEnd(15)} | ${name.padEnd(30)} | ${group.padEnd(20)} | ${warehouses}`);
      });
      
      if (itemsMissingEdapallyStock.length > 20) {
        console.log(`... and ${itemsMissingEdapallyStock.length - 20} more items`);
      }
    }
    
    // Show current Edapally items
    console.log(`\n✅ ITEMS WITH EDAPALLY STOCK (${edapallyItems.length} items):`);
    console.log(`${'SKU'.padEnd(15)} | ${'Opening'.padEnd(8)} | ${'Current'.padEnd(8)} | ${'Available'.padEnd(10)} | Name`);
    console.log(`${'-'.repeat(15)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(10)} | ${'-'.repeat(30)}`);
    
    edapallyItems.slice(0, 20).forEach(item => {
      const name = (item.name || 'N/A').substring(0, 28);
      console.log(`${(item.sku || 'N/A').padEnd(15)} | ${item.openingStock.toString().padEnd(8)} | ${item.stockOnHand.toString().padEnd(8)} | ${item.availableForSale.toString().padEnd(10)} | ${name}`);
    });
    
    if (edapallyItems.length > 20) {
      console.log(`... and ${edapallyItems.length - 20} more items`);
    }
    
    // Check for specific missing items that should be in Edapally
    console.log(`\n🔍 CHECKING FOR SPECIFIC MISSING ITEMS:`);
    
    // Items that exist in other branches but missing in Edapally
    const commonItems = ['TAL9-4018', 'BRF8-1010', 'BRF9-1010']; // Add more as needed
    
    for (const sku of commonItems) {
      const itemGroup = await ItemGroup.findOne({
        'items.sku': sku
      });
      
      if (itemGroup) {
        const item = itemGroup.items.find(i => i.sku === sku);
        if (item) {
          const edapallyStock = item.warehouseStocks?.find(ws => matchesEdapally(ws.warehouse));
          
          if (!edapallyStock) {
            console.log(`❌ ${sku} (${item.name}) - Missing from Edapally`);
            console.log(`   Available in: ${item.warehouseStocks?.map(ws => `${ws.warehouse}(${ws.stockOnHand || 0})`).join(', ') || 'No warehouses'}`);
          } else {
            console.log(`✅ ${sku} (${item.name}) - Present in Edapally: ${edapallyStock.stockOnHand || 0} units`);
          }
        }
      } else {
        console.log(`❓ ${sku} - Item not found in database`);
      }
    }
    
    // Summary and recommendations
    console.log(`\n💡 SUMMARY & RECOMMENDATIONS:`);
    
    if (itemsMissingEdapallyStock.length === 0) {
      console.log(`✅ Perfect! All items have Edapally warehouse stock entries.`);
    } else {
      const missingPercentage = ((itemsMissingEdapallyStock.length / totalItems) * 100).toFixed(1);
      console.log(`⚠️ ${itemsMissingEdapallyStock.length} items (${missingPercentage}%) are missing Edapally warehouse stock entries.`);
      
      // Count items that have other warehouse stocks but missing Edapally
      const shouldHaveEdapally = itemsMissingEdapallyStock.filter(item => item.hasOtherWarehouses).length;
      
      if (shouldHaveEdapally > 0) {
        console.log(`🚨 ${shouldHaveEdapally} items have stock in other warehouses but missing Edapally entries.`);
        console.log(`   These items should likely have Edapally warehouse stock entries added.`);
      }
      
      const noWarehouseStock = itemsMissingEdapallyStock.filter(item => !item.hasOtherWarehouses).length;
      if (noWarehouseStock > 0) {
        console.log(`📝 ${noWarehouseStock} items have no warehouse stock entries at all.`);
        console.log(`   These might be inactive or discontinued items.`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking Edapally missing data:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkEdapallyMissingData();
  
  console.log('\n=== EDAPALLY MISSING DATA CHECK COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);