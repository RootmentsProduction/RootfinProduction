/**
 * Debug script to check stock calculation logic
 * Run this to see how stock calculations work
 */

console.log("=== STOCK CALCULATION DEBUG ===\n");

// Test Case 1: Full quantity reduction
console.log("TEST 1: Full Quantity Reduction");
console.log("--------------------------------");
const stock1 = 20;
const quantity1 = 20;
const result1 = Math.max(0, stock1 - quantity1);
console.log(`Stock: ${stock1}, Quantity: ${quantity1}`);
console.log(`Calculation: Math.max(0, ${stock1} - ${quantity1}) = ${result1}`);
console.log(`Expected: 0, Got: ${result1}`);
console.log(`Status: ${result1 === 0 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test Case 2: Partial quantity reduction
console.log("TEST 2: Partial Quantity Reduction");
console.log("-----------------------------------");
const stock2 = 20;
const quantity2 = 5;
const result2 = Math.max(0, stock2 - quantity2);
console.log(`Stock: ${stock2}, Quantity: ${quantity2}`);
console.log(`Calculation: Math.max(0, ${stock2} - ${quantity2}) = ${result2}`);
console.log(`Expected: 15, Got: ${result2}`);
console.log(`Status: ${result2 === 15 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test Case 3: Over-reduction (should not go negative)
console.log("TEST 3: Over-Reduction Protection");
console.log("----------------------------------");
const stock3 = 20;
const quantity3 = 25;
const result3 = Math.max(0, stock3 - quantity3);
console.log(`Stock: ${stock3}, Quantity: ${quantity3}`);
console.log(`Calculation: Math.max(0, ${stock3} - ${quantity3}) = ${result3}`);
console.log(`Expected: 0, Got: ${result3}`);
console.log(`Status: ${result3 === 0 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test Case 4: Type coercion issues
console.log("TEST 4: Type Coercion (String vs Number)");
console.log("-----------------------------------------");
const stock4String = "20";
const quantity4String = "20";
const result4Wrong = stock4String - quantity4String; // JavaScript allows this
const result4Right = Math.max(0, parseFloat(stock4String) - parseFloat(quantity4String));
console.log(`Stock: "${stock4String}" (string), Quantity: "${quantity4String}" (string)`);
console.log(`Without parseFloat: "${stock4String}" - "${quantity4String}" = ${result4Wrong} (type: ${typeof result4Wrong})`);
console.log(`With parseFloat: parseFloat("${stock4String}") - parseFloat("${quantity4String}") = ${result4Right} (type: ${typeof result4Right})`);
console.log(`Status: ${result4Right === 0 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test Case 5: Null/undefined handling
console.log("TEST 5: Null/Undefined Handling");
console.log("--------------------------------");
const stock5 = null;
const quantity5 = 20;
const result5Wrong = Math.max(0, stock5 - quantity5); // NaN or unexpected
const result5Right = Math.max(0, (parseFloat(stock5) || 0) - parseFloat(quantity5));
console.log(`Stock: ${stock5}, Quantity: ${quantity5}`);
console.log(`Without fallback: Math.max(0, ${stock5} - ${quantity5}) = ${result5Wrong}`);
console.log(`With fallback: Math.max(0, (parseFloat(${stock5}) || 0) - parseFloat(${quantity5})) = ${result5Right}`);
console.log(`Status: ${result5Right === 0 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test Case 6: Warehouse name matching
console.log("TEST 6: Warehouse Name Matching");
console.log("--------------------------------");
const warehouseName = "Perinthalmanna Branch";
const variations = [
  "perinthalmanna branch",
  "Perinthalmanna Branch",
  "PERINTHALMANNA BRANCH",
  "G.Perinthalmanna",
  "g.perinthalmanna",
  "Z.Perinthalmanna"
];

console.log(`Target warehouse: "${warehouseName}"`);
console.log(`Testing variations:\n`);

variations.forEach(variant => {
  const warehouseLower = warehouseName.toLowerCase().trim();
  const variantLower = variant.toLowerCase().trim();
  
  // Exact match
  const exactMatch = warehouseLower === variantLower;
  
  // Partial match
  const partialMatch = warehouseLower.includes(variantLower) || variantLower.includes(warehouseLower);
  
  // Check if it contains "perinthalmanna"
  const containsPerinthalmanna = variantLower.includes("perinthalmanna");
  
  console.log(`  "${variant}"`);
  console.log(`    Exact match: ${exactMatch ? '✅' : '❌'}`);
  console.log(`    Partial match: ${partialMatch ? '✅' : '❌'}`);
  console.log(`    Contains "perinthalmanna": ${containsPerinthalmanna ? '✅' : '❌'}`);
});

console.log("\n=== DEBUG COMPLETE ===");
console.log("\n💡 Key Takeaways:");
console.log("1. Math.max(0, stock - quantity) correctly handles full quantity reduction");
console.log("2. parseFloat() is essential to avoid type coercion issues");
console.log("3. Fallback to 0 for null/undefined prevents NaN");
console.log("4. Warehouse matching needs case-insensitive comparison");
console.log("\n✅ All basic calculations work correctly!");
console.log("🔍 If stock is still wrong, the issue is likely in:");
console.log("   - Database save operation");
console.log("   - Mongoose markModified() not being called");
console.log("   - Race condition with multiple simultaneous updates");
console.log("   - Frontend caching old values");
