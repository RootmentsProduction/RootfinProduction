// Quick test to verify warehouse matching logic
const WAREHOUSE_NAME_MAPPING = {
  "G.Edappally": "Edapally Branch",
  "G-Edappally": "Edapally Branch",
  "GEdappally": "Edapally Branch",
  "Edapally Branch": "Edapally Branch",
};

const normalizeWarehouseName = (warehouseName) => {
  if (!warehouseName) return null;
  const trimmed = warehouseName.toString().trim();
  if (WAREHOUSE_NAME_MAPPING[trimmed]) {
    return WAREHOUSE_NAME_MAPPING[trimmed];
  }
  return trimmed;
};

const getWarehouseNameVariations = (warehouseName) => {
  if (!warehouseName) return [];
  const normalized = normalizeWarehouseName(warehouseName);
  const variations = [normalized, warehouseName];
  
  for (const [key, value] of Object.entries(WAREHOUSE_NAME_MAPPING)) {
    if (value === normalized && !variations.includes(key)) {
      variations.push(key);
    }
  }
  
  return [...new Set(variations)];
};

// Test with "G-Edappally"
const warehouse = "G-Edappally";
const normalizedWarehouse = normalizeWarehouseName(warehouse);
const warehouseVariations = getWarehouseNameVariations(warehouse);

console.log("Testing warehouse:", warehouse);
console.log("Normalized:", normalizedWarehouse);
console.log("Variations:", warehouseVariations);
console.log("");

// Test matching function
const warehouseMatches = (wsWarehouse) => {
  if (!wsWarehouse) return false;
  const wsWarehouseStr = wsWarehouse.toString().trim();
  const normalizedWs = normalizeWarehouseName(wsWarehouseStr);
  
  const matches = warehouseVariations.includes(wsWarehouseStr) || 
         warehouseVariations.includes(normalizedWs) ||
         normalizedWs === normalizedWarehouse;
  
  console.log(`  Testing "${wsWarehouse}": normalized="${normalizedWs}", matches=${matches}`);
  return matches;
};

// Test various warehouse names
console.log("Should MATCH:");
warehouseMatches("Edapally Branch");
warehouseMatches("G-Edappally");
warehouseMatches("G.Edappally");
warehouseMatches("GEdappally");

console.log("\nShould NOT match:");
warehouseMatches("Warehouse");
warehouseMatches("MG Road");
warehouseMatches("SuitorGuy MG Road");
warehouseMatches("Palakkad Branch");
