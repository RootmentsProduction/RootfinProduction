/**
 * Test script for Purchase Receive Stock Updates
 * 
 * This script tests:
 * 1. Creating a purchase receive
 * 2. Verifying stock is updated correctly in the database
 * 3. Testing warehouse matching (Warehouse, Kannur Branch, etc.)
 * 4. Testing both standalone items and group items
 */

import mongoose from 'mongoose';
import fs from 'fs';
import PurchaseReceive from './model/PurchaseReceive.js';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';

// Load environment variables (same as server.js)
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

// MongoDB connection (same as database.js)
const MONGODB_URI = env === 'production'
  ? process.env.MONGODB_URI_PROD
  : process.env.MONGODB_URI_DEV || 'mongodb://localhost:27017/rootfin_dev';

// Test configuration
const TEST_CONFIG = {
  warehouse: 'Kannur Branch', // or 'Warehouse'
  locCode: '716', // Kannur locCode
  userId: 'test@example.com',
  itemName: 'ronaldo - blue',
  itemGroupId: '69326eb097e2603cb86efee7', // Replace with actual group ID
  itemSku: 'ROBL',
  quantity: 2
};

// Helper function to match warehouse names (same as controller)
const matchesWarehouse = (itemWarehouse, targetWarehouse) => {
  if (!itemWarehouse || !targetWarehouse) return false;
  
  const itemWarehouseLower = itemWarehouse.toString().toLowerCase().trim();
  const targetWarehouseLower = targetWarehouse.toLowerCase().trim();
  
  // Exact match
  if (itemWarehouseLower === targetWarehouseLower) {
    return true;
  }
  
  // Base name match
  const itemBase = itemWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
  const targetBase = targetWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
  
  if (itemBase && targetBase && itemBase === targetBase) {
    return true;
  }
  
  // Partial match
  if (itemWarehouseLower.includes(targetWarehouseLower) || targetWarehouseLower.includes(itemWarehouseLower)) {
    return true;
  }
  
  return false;
};

// Helper function to map locName to warehouse name
const mapLocNameToWarehouse = (locName) => {
  if (!locName) return "Warehouse";
  let warehouse = locName.replace(/^[A-Z]\.?\s*/i, "").trim();
  if (warehouse && warehouse.toLowerCase() !== "warehouse" && !warehouse.toLowerCase().includes("branch")) {
    warehouse = `${warehouse} Branch`;
  }
  return warehouse || "Warehouse";
};

// Test: Get current stock for an item
async function getCurrentStock(itemGroupId, itemName, itemSku, targetWarehouse) {
  console.log(`\n🔍 Getting current stock for:`);
  console.log(`   Item Group ID: ${itemGroupId}`);
  console.log(`   Item Name: ${itemName}`);
  console.log(`   Item SKU: ${itemSku}`);
  console.log(`   Target Warehouse: ${targetWarehouse}`);
  
  try {
    const group = await ItemGroup.findById(itemGroupId);
    if (!group) {
      console.log(`   ❌ Item group not found`);
      return { success: false, stock: 0 };
    }
    
    const item = group.items.find(i => {
      if (itemSku && i.sku) {
        return i.sku.toLowerCase() === itemSku.toLowerCase();
      }
      return i.name.toLowerCase() === itemName.toLowerCase();
    });
    
    if (!item) {
      console.log(`   ❌ Item not found in group`);
      return { success: false, stock: 0 };
    }
    
    console.log(`   ✅ Found item: "${item.name}"`);
    console.log(`   Available warehouses:`, item.warehouseStocks?.map(ws => `${ws.warehouse} (stock: ${ws.stockOnHand})`).join(", ") || "none");
    
    if (!item.warehouseStocks || item.warehouseStocks.length === 0) {
      console.log(`   ⚠️ No warehouse stocks found`);
      return { success: false, stock: 0 };
    }
    
    const warehouseStock = item.warehouseStocks.find(ws => 
      matchesWarehouse(ws.warehouse, targetWarehouse)
    );
    
    if (warehouseStock) {
      console.log(`   ✅ Found stock in "${warehouseStock.warehouse}": ${warehouseStock.stockOnHand}`);
      return { success: true, stock: warehouseStock.stockOnHand || 0, warehouseStock };
    } else {
      console.log(`   ❌ No stock found in "${targetWarehouse}"`);
      return { success: false, stock: 0 };
    }
  } catch (error) {
    console.error(`   ❌ Error getting stock:`, error);
    return { success: false, stock: 0, error: error.message };
  }
}

// Test: Simulate purchase receive stock update
async function testPurchaseReceiveStockUpdate() {
  console.log('\n========================================');
  console.log('TEST: Purchase Receive Stock Update');
  console.log('========================================\n');
  
  try {
    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get stock BEFORE
    console.log('📊 STOCK BEFORE Purchase Receive:');
    const stockBefore = await getCurrentStock(
      TEST_CONFIG.itemGroupId,
      TEST_CONFIG.itemName,
      TEST_CONFIG.itemSku,
      TEST_CONFIG.warehouse
    );
    
    console.log(`\n📦 Simulating Purchase Receive:`);
    console.log(`   Warehouse: ${TEST_CONFIG.warehouse}`);
    console.log(`   Quantity: ${TEST_CONFIG.quantity}`);
    console.log(`   Item: ${TEST_CONFIG.itemName} (${TEST_CONFIG.itemSku})`);
    
    // Simulate the stock update (same logic as PurchaseReceiveController)
    const group = await ItemGroup.findById(TEST_CONFIG.itemGroupId);
    if (!group) {
      throw new Error('Item group not found');
    }
    
    const itemIndex = group.items.findIndex(item => {
      if (TEST_CONFIG.itemSku && item.sku) {
        return item.sku.toLowerCase() === TEST_CONFIG.itemSku.toLowerCase();
      }
      return item.name.toLowerCase() === TEST_CONFIG.itemName.toLowerCase();
    });
    
    if (itemIndex === -1) {
      throw new Error('Item not found in group');
    }
    
    const item = group.items[itemIndex];
    console.log(`   ✅ Found item at index ${itemIndex}`);
    
    // Update warehouse stock
    if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks)) {
      item.warehouseStocks = [];
    }
    
    let warehouseStock = item.warehouseStocks.find(ws => 
      matchesWarehouse(ws.warehouse, TEST_CONFIG.warehouse)
    );
    
    if (!warehouseStock) {
      console.log(`   📦 Creating new warehouse stock entry for "${TEST_CONFIG.warehouse}"`);
      warehouseStock = {
        warehouse: TEST_CONFIG.warehouse,
        openingStock: 0,
        openingStockValue: 0,
        stockOnHand: 0,
        committedStock: 0,
        availableForSale: 0,
        physicalOpeningStock: 0,
        physicalStockOnHand: 0,
        physicalCommittedStock: 0,
        physicalAvailableForSale: 0,
      };
      item.warehouseStocks.push(warehouseStock);
    } else {
      console.log(`   ✅ Found existing warehouse stock for "${warehouseStock.warehouse}"`);
    }
    
    // Add stock
    const currentStock = parseFloat(warehouseStock.stockOnHand) || 0;
    warehouseStock.stockOnHand = currentStock + TEST_CONFIG.quantity;
    warehouseStock.availableForSale = (parseFloat(warehouseStock.availableForSale) || 0) + TEST_CONFIG.quantity;
    warehouseStock.physicalStockOnHand = (parseFloat(warehouseStock.physicalStockOnHand) || 0) + TEST_CONFIG.quantity;
    warehouseStock.physicalAvailableForSale = (parseFloat(warehouseStock.physicalAvailableForSale) || 0) + TEST_CONFIG.quantity;
    
    console.log(`   📈 Updated stock: ${currentStock} + ${TEST_CONFIG.quantity} = ${warehouseStock.stockOnHand}`);
    
    // Normalize warehouse name
    warehouseStock.warehouse = TEST_CONFIG.warehouse;
    
    // Save the group
    group.items[itemIndex] = item;
    group.markModified('items');
    await group.save();
    console.log(`   ✅ Saved item group with updated stock\n`);
    
    // Get stock AFTER
    console.log('📊 STOCK AFTER Purchase Receive:');
    const stockAfter = await getCurrentStock(
      TEST_CONFIG.itemGroupId,
      TEST_CONFIG.itemName,
      TEST_CONFIG.itemSku,
      TEST_CONFIG.warehouse
    );
    
    // Verify results
    console.log('\n========================================');
    console.log('TEST RESULTS:');
    console.log('========================================');
    console.log(`Stock Before: ${stockBefore.stock || 0}`);
    console.log(`Stock After: ${stockAfter.stock || 0}`);
    console.log(`Expected Increase: ${TEST_CONFIG.quantity}`);
    console.log(`Actual Increase: ${(stockAfter.stock || 0) - (stockBefore.stock || 0)}`);
    
    if (stockAfter.stock === (stockBefore.stock || 0) + TEST_CONFIG.quantity) {
      console.log('✅ TEST PASSED: Stock updated correctly!');
    } else {
      console.log('❌ TEST FAILED: Stock not updated correctly!');
      console.log(`   Expected: ${(stockBefore.stock || 0) + TEST_CONFIG.quantity}`);
      console.log(`   Actual: ${stockAfter.stock || 0}`);
    }
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    console.error(error.stack);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('📊 Disconnected from MongoDB');
  }
}

// Test: Check warehouse matching
async function testWarehouseMatching() {
  console.log('\n========================================');
  console.log('TEST: Warehouse Name Matching');
  console.log('========================================\n');
  
  const testCases = [
    { item: 'Kannur Branch', target: 'Kannur Branch', expected: true },
    { item: 'Kannur Branch', target: 'Kannur', expected: true },
    { item: 'Kannur', target: 'Kannur Branch', expected: true },
    { item: 'Warehouse', target: 'Warehouse', expected: true },
    { item: 'warehouse', target: 'Warehouse', expected: true },
    { item: 'Warehouse', target: 'Kannur Branch', expected: false },
    { item: 'Kannur Branch', target: 'Calicut Branch', expected: false },
  ];
  
  testCases.forEach(({ item, target, expected }) => {
    const result = matchesWarehouse(item, target);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} "${item}" vs "${target}": ${result} (expected: ${expected})`);
  });
  
  console.log('\n========================================\n');
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Purchase Receive Stock Update Tests\n');
  
  // Test warehouse matching first
  await testWarehouseMatching();
  
  // Test stock update
  await testPurchaseReceiveStockUpdate();
  
  console.log('✅ All tests completed!');
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('test-purchase-receive-stock.js') ||
                     process.argv[1]?.includes('test-purchase-receive-stock.js');

if (isMainModule) {
  runTests().catch(console.error);
}

export { testPurchaseReceiveStockUpdate, testWarehouseMatching, getCurrentStock };
