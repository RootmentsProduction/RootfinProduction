import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';

dotenv.config();

const WAREHOUSE_NAME_MAPPING = {
  "Grooms Trivandum": "Grooms Trivandrum",
  "Grooms Trivandrum": "Grooms Trivandrum",
  "SG-Trivandrum": "Grooms Trivandrum",
  "G.Palakkad": "Palakkad Branch",
  "G.Palakkad ": "Palakkad Branch",
  "GPalakkad": "Palakkad Branch",
  "Palakkad Branch": "Palakkad Branch",
  "Warehouse": "Warehouse",
  "warehouse": "Warehouse",
  "WAREHOUSE": "Warehouse",
  "G.Calicut": "Calicut",
  "G.Calicut ": "Calicut",
  "GCalicut": "Calicut",
  "Calicut": "Calicut",
  "G.Manjeri": "Manjery Branch",
  "G.Manjery": "Manjery Branch",
  "GManjeri": "Manjery Branch",
  "GManjery": "Manjery Branch",
  "Manjery Branch": "Manjery Branch",
  "G.Kannur": "Kannur Branch",
  "GKannur": "Kannur Branch",
  "Kannur Branch": "Kannur Branch",
  "G.Edappal": "Edappal Branch",
  "GEdappal": "Edappal Branch",
  "Edappal Branch": "Edappal Branch",
  "G.Edappally": "Edapally Branch",
  "G-Edappally": "Edapally Branch",
  "GEdappally": "Edapally Branch",
  "Edapally Branch": "Edapally Branch",
  "G.Kalpetta": "Kalpetta Branch",
  "GKalpetta": "Kalpetta Branch",
  "Kalpetta Branch": "Kalpetta Branch",
  "G.Kottakkal": "Kottakkal Branch",
  "GKottakkal": "Kottakkal Branch",
  "Kottakkal Branch": "Kottakkal Branch",
  "Z.Kottakkal": "Kottakkal Branch",
  "G.Perinthalmanna": "Perinthalmanna Branch",
  "GPerinthalmanna": "Perinthalmanna Branch",
  "Perinthalmanna Branch": "Perinthalmanna Branch",
  "Z.Perinthalmanna": "Perinthalmanna Branch",
  "G.Chavakkad": "Chavakkad Branch",
  "GChavakkad": "Chavakkad Branch",
  "Chavakkad Branch": "Chavakkad Branch",
  "G.Thrissur": "Thrissur Branch",
  "GThrissur": "Thrissur Branch",
  "Thrissur Branch": "Thrissur Branch"
};

async function testPerinthalmannaFilter() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rootments');
    console.log("✅ Connected to MongoDB");

    console.log("🧪 TESTING PERINTHALMANNA FILTER LOGIC\n");

    // Simulate the exact same logic as the opening stock report
    const warehouse = "G.Perinthalmanna"; // This is what comes from frontend
    const month = "2026-01"; // January 2026

    console.log(`Input warehouse: "${warehouse}"`);
    console.log(`Input month: "${month}"`);

    // Helper function to normalize warehouse names (same as backend)
    const normalizeWarehouseName = (name) => {
      if (!name) return "Warehouse";
      const normalized = WAREHOUSE_NAME_MAPPING[name.trim()] || name.trim();
      return normalized;
    };

    const targetWarehouse = normalizeWarehouseName(warehouse);
    console.log(`Normalized warehouse: "${targetWarehouse}"`);

    // Date range setup (same as backend)
    const [year, monthNum] = month.split('-');
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);
    
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const dateFilter = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Get items (same as backend)
    const standaloneItems = await ShoeItem.find({
      'warehouseStocks.openingStock': { $gt: 0 },
      ...dateFilter
    }).select('itemName sku warehouseStocks createdAt');

    const itemGroups = await ItemGroup.find({
      'items.warehouseStocks.openingStock': { $gt: 0 },
      ...dateFilter
    }).select('groupName items.name items.sku items.warehouseStocks createdAt');

    console.log(`\nFound ${standaloneItems.length} standalone items with opening stock in January 2026`);
    console.log(`Found ${itemGroups.length} item groups with opening stock in January 2026`);

    // Process items (same as backend)
    const itemDetails = [];
    let totalOpeningStock = 0;

    // Process standalone items
    standaloneItems.forEach(item => {
      item.warehouseStocks.forEach(stock => {
        if (stock.openingStock > 0) {
          const storeName = normalizeWarehouseName(stock.warehouse);
          const stockQty = stock.openingStock || 0;
          
          itemDetails.push({
            itemName: item.itemName,
            sku: item.sku,
            store: storeName,
            openingStock: stockQty,
            createdAt: item.createdAt,
            type: 'standalone',
            originalWarehouse: stock.warehouse
          });
          
          totalOpeningStock += stockQty;
        }
      });
    });

    // Process item groups
    itemGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.warehouseStocks) {
          item.warehouseStocks.forEach(stock => {
            if (stock.openingStock > 0) {
              const storeName = normalizeWarehouseName(stock.warehouse);
              const stockQty = stock.openingStock || 0;
              
              itemDetails.push({
                itemName: item.name,
                sku: item.sku,
                store: storeName,
                openingStock: stockQty,
                createdAt: group.createdAt,
                type: 'grouped',
                groupName: group.groupName,
                originalWarehouse: stock.warehouse
              });
              
              totalOpeningStock += stockQty;
            }
          });
        }
      });
    });

    console.log(`\nTotal items before filtering: ${itemDetails.length}`);
    console.log(`Total opening stock before filtering: ${totalOpeningStock}`);

    // Filter by warehouse (same as backend)
    let filteredItemDetails = itemDetails;
    if (warehouse && warehouse !== 'all' && warehouse !== 'Warehouse') {
      console.log(`\nFiltering by warehouse: "${targetWarehouse}"`);
      filteredItemDetails = itemDetails.filter(item => item.store === targetWarehouse);
      
      console.log(`Items matching "${targetWarehouse}":`);
      filteredItemDetails.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.itemName} - Original: "${item.originalWarehouse}" → Normalized: "${item.store}" - Stock: ${item.openingStock}`);
      });
    }

    const filteredTotalStock = filteredItemDetails.reduce((sum, item) => sum + item.openingStock, 0);

    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`Total items after filtering: ${filteredItemDetails.length}`);
    console.log(`Total opening stock after filtering: ${filteredTotalStock}`);

    if (filteredItemDetails.length === 155) {
      console.log(`✅ MATCHES FRONTEND! Found exactly 155 items.`);
    } else {
      console.log(`⚠️  DISCREPANCY: Expected 155, found ${filteredItemDetails.length}`);
    }

    console.log("\n✅ Test completed!");

  } catch (error) {
    console.error("❌ Error in test:", error);
  } finally {
    await mongoose.connection.close();
  }
}

testPerinthalmannaFilter();