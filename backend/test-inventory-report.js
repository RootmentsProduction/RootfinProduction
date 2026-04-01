import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Copy the normalization functions from InventoryReportController
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
  "Thrissur Branch": "Thrissur Branch",
  "G.Perumbavoor": "Perumbavoor Branch",
  "GPerumbavoor": "Perumbavoor Branch",
  "Perumbavoor Branch": "Perumbavoor Branch",
  "G.Kottayam": "Kottayam Branch",
  "GKottayam": "Kottayam Branch",
  "Kottayam Branch": "Kottayam Branch",
  "G.Kottayam Branch": "Kottayam Branch",
  "G.MG Road": "MG Road Branch",
  "G.Mg Road": "MG Road Branch",
  "GMG Road": "MG Road Branch",
  "GMg Road": "MG Road Branch",
  "MG Road": "MG Road Branch",
  "SuitorGuy MG Road": "MG Road Branch",
  "MG Road Branch": "MG Road Branch",
  "HEAD OFFICE01": "Head Office",
  "Head Office": "Head Office",
  "Z-Edapally1": "Warehouse",
  "Z- Edappal": "Warehouse",
  "Production": "Warehouse",
  "Office": "Warehouse",
  "G.Vadakara": "Vadakara Branch",
  "GVadakara": "Vadakara Branch",
  "Vadakara Branch": "Vadakara Branch",
  "arehouse Branch": "Warehouse",
  "-Kalpetta Branch": "Kalpetta Branch",
  "-Kannur Branch": "Kannur Branch",
};

const normalizeWarehouseName = (warehouseName) => {
  if (!warehouseName) return null;
  const trimmed = warehouseName.toString().trim();
  if (WAREHOUSE_NAME_MAPPING[trimmed]) {
    return WAREHOUSE_NAME_MAPPING[trimmed];
  }
  const lowerName = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(WAREHOUSE_NAME_MAPPING)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  return trimmed;
};

const getWarehouseNameVariations = (warehouseName) => {
  if (!warehouseName) return [];
  
  const normalized = normalizeWarehouseName(warehouseName);
  const variations = [warehouseName, normalized];
  
  // Add all keys from mapping that map to the normalized name
  for (const [key, value] of Object.entries(WAREHOUSE_NAME_MAPPING)) {
    if (value === normalized && !variations.includes(key)) {
      variations.push(key);
    }
  }
  
  // Also add case-insensitive variations
  const lowerNormalized = normalized.toLowerCase();
  for (const [key, value] of Object.entries(WAREHOUSE_NAME_MAPPING)) {
    if (value.toLowerCase() === lowerNormalized && !variations.includes(key)) {
      variations.push(key);
    }
  }
  
  return [...new Set(variations)];
};

async function testInventoryReport() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const warehouse = "Perinthalmanna Branch";
    const normalizedWarehouse = normalizeWarehouseName(warehouse);
    const warehouseVariations = getWarehouseNameVariations(warehouse);
    
    console.log(`\nTesting warehouse: ${warehouse}`);
    console.log(`Normalized: ${normalizedWarehouse}`);
    console.log(`Variations: ${JSON.stringify(warehouseVariations)}`);
    
    // Helper function to check if warehouse matches
    const warehouseMatches = (wsWarehouse) => {
      if (!wsWarehouse) return false;
      const wsWarehouseStr = wsWarehouse.toString().trim();
      const normalizedWs = normalizeWarehouseName(wsWarehouseStr);
      
      return warehouseVariations.includes(wsWarehouseStr) || 
             warehouseVariations.includes(normalizedWs) ||
             normalizedWs === normalizedWarehouse;
    };
    
    // Fetch standalone items (simulating the inventory report logic)
    const standaloneItems = await ShoeItem.find({});
    const filteredStandaloneItems = standaloneItems.filter(item => {
      return (item.warehouseStocks || []).some(ws => {
        if (!ws || !ws.warehouse) return false;
        return warehouseMatches(ws.warehouse);
      });
    });
    
    console.log(`\n=== STANDALONE ITEMS (Filtered) ===`);
    console.log(`Total standalone items in DB: ${standaloneItems.length}`);
    console.log(`Filtered standalone items: ${filteredStandaloneItems.length}`);
    
    filteredStandaloneItems.forEach(item => {
      const matchingWs = item.warehouseStocks.find(ws => warehouseMatches(ws.warehouse));
      console.log(`Item: ${item.itemName} (${item.sku})`);
      console.log(`  Warehouse: ${matchingWs.warehouse}`);
      console.log(`  Stock: ${matchingWs.stockOnHand}`);
    });
    
    // Fetch items from item groups
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    let groupItems = [];
    
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item, index) => {
          const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
            item.warehouseStocks.some(ws => {
              if (!ws || !ws.warehouse) return false;
              return warehouseMatches(ws.warehouse);
            });
          
          if (hasStock) {
            const standaloneItem = {
              _id: item._id || `${group._id}_${index}`,
              itemName: item.name || "",
              sku: item.sku || "",
              costPrice: item.costPrice || 0,
              category: group.category || "",
              warehouseStocks: item.warehouseStocks || [],
              itemGroupId: group._id,
              itemGroupName: group.name,
              isFromGroup: true,
              createdAt: group.createdAt,
            };
            groupItems.push(standaloneItem);
          }
        });
      }
    });
    
    console.log(`\n=== GROUP ITEMS (Filtered) ===`);
    console.log(`Total item groups in DB: ${itemGroups.length}`);
    console.log(`Filtered group items: ${groupItems.length}`);
    
    groupItems.forEach(item => {
      const matchingWs = item.warehouseStocks.find(ws => warehouseMatches(ws.warehouse));
      console.log(`Group: ${item.itemGroupName}`);
      console.log(`Item: ${item.itemName} (${item.sku})`);
      console.log(`  Warehouse: ${matchingWs.warehouse}`);
      console.log(`  Stock: ${matchingWs.stockOnHand}`);
    });
    
    const allItems = [...filteredStandaloneItems.map(item => ({ ...item.toObject(), isFromGroup: false })), ...groupItems];
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total items that should appear in report: ${allItems.length}`);
    
    // Now simulate the stock calculation for each item
    console.log(`\n=== STOCK CALCULATION SIMULATION ===`);
    const stockOnHandData = [];
    
    for (const item of allItems) {
      // Determine which warehouse stocks to process
      let warehouseStocksToProcess = item.warehouseStocks || [];
      
      warehouseStocksToProcess = warehouseStocksToProcess.filter(ws => {
        if (!ws || !ws.warehouse) return false;
        return warehouseMatches(ws.warehouse);
      });
      
      for (const warehouseStock of warehouseStocksToProcess) {
        const warehouseName = normalizeWarehouseName(warehouseStock.warehouse);
        
        // Use the original opening stock for now (simplified)
        const openingStock = parseFloat(warehouseStock.openingStock) || 0;
        let stockOnHand = openingStock;
        
        // For this test, we'll just use the current stockOnHand value
        stockOnHand = parseFloat(warehouseStock.stockOnHand) || 0;
        
        const itemCost = parseFloat(item.costPrice) || 0;
        const closingStock = Math.max(0, stockOnHand);
        const stockValue = closingStock * itemCost;
        
        // Only include items with stock > 0 or if showing all
        if (closingStock > 0 || openingStock > 0) {
          stockOnHandData.push({
            itemId: item._id,
            itemName: item.itemName || item.name,
            sku: item.sku,
            category: item.category,
            warehouse: warehouseName,
            openingStock: Math.max(0, openingStock),
            stockIn: 0, // Simplified for this test
            stockOut: 0, // Simplified for this test
            closingStock: closingStock,
            costPrice: itemCost,
            stockValue: Math.max(0, stockValue),
            itemGroupId: item.itemGroupId || null,
            itemGroupName: item.itemGroupName || null,
            isFromGroup: item.isFromGroup || false
          });
        }
      }
    }
    
    console.log(`Items that would appear in final report: ${stockOnHandData.length}`);
    stockOnHandData.forEach(item => {
      console.log(`${item.itemName} (${item.sku}) - Stock: ${item.closingStock}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testInventoryReport();