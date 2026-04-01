/**
 * Comprehensive Test for Purchase Receive Stock Updates
 * 
 * This test:
 * 1. Tests the actual createPurchaseReceive function
 * 2. Verifies admin email detection
 * 3. Tests warehouse determination
 * 4. Verifies stock is updated correctly
 * 5. Tests both admin and non-admin scenarios
 * 
 * HOW TO USE:
 * 1. Update TEST_CONFIG below with your actual item data:
 *    - itemName: The exact name of an item in your database
 *    - itemGroupId: The MongoDB _id of the item group
 *    - itemSku: The SKU (optional, can be empty string)
 *    - quantity: How many items to add to stock
 * 
 * 2. Make sure MongoDB is running
 * 
 * 3. Run the test:
 *    node backend/test-purchase-receive-full.js
 * 
 * 4. Check the output to see:
 *    - Stock before and after
 *    - Whether stock was updated correctly
 *    - Which warehouse was used
 *    - Any errors
 */

import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import PurchaseReceive from './model/PurchaseReceive.js';
import PurchaseOrder from './model/PurchaseOrder.js';
import ItemGroup from './model/ItemGroup.js';
import ShoeItem from './model/ShoeItem.js';

// Load environment variables
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

// MongoDB connection
const MONGODB_URI = env === 'production'
  ? process.env.MONGODB_URI_PROD
  : process.env.MONGODB_URI_DEV || 'mongodb://localhost:27017/rootfin_dev';

// Import the controller functions
import { createPurchaseReceive } from './controllers/PurchaseReceiveController.js';

// Test configuration - UPDATE THESE WITH YOUR ACTUAL DATA
const TEST_CONFIG = {
  // Test with admin email (from your logs)
  adminTest: {
    userId: 'officerootments@gmail.com',
    locCode: '144', // This should be ignored for admin - should use "Warehouse"
    expectedWarehouse: 'Warehouse',
    itemName: 'leks - 9', // From your logs
    itemGroupId: '6933b6b2b747e38f77df106b', // From your logs
    itemSku: '', // Update if you know the SKU
    quantity: 5, // Test quantity
    purchaseOrderId: null // Will need to create or use existing PO
  },
  // Test with regular user (example - update if needed)
  regularTest: {
    userId: 'kannur@gmail.com',
    locCode: '716', // Kannur
    expectedWarehouse: 'Kannur Branch',
    itemName: 'ronaldo - blue',
    itemGroupId: '69326eb097e2603cb86efee7',
    itemSku: 'ROBL',
    quantity: 2,
    purchaseOrderId: null
  }
};

// Helper function to get current stock
async function getCurrentStock(itemGroupId, itemName, itemSku, targetWarehouse) {
  try {
    const group = await ItemGroup.findById(itemGroupId);
    if (!group) {
      return { success: false, stock: 0, error: 'Group not found' };
    }
    
    const item = group.items.find(i => {
      if (itemSku && i.sku) {
        return i.sku.toLowerCase() === itemSku.toLowerCase() && 
               i.name.toLowerCase() === itemName.toLowerCase();
      }
      return i.name.toLowerCase() === itemName.toLowerCase();
    });
    
    if (!item || !item.warehouseStocks || item.warehouseStocks.length === 0) {
      return { success: false, stock: 0, error: 'Item or stock not found' };
    }
    
    // Find matching warehouse stock
    const warehouseStock = item.warehouseStocks.find(ws => {
      const wsLower = (ws.warehouse || '').toLowerCase().trim();
      const targetLower = targetWarehouse.toLowerCase().trim();
      return wsLower === targetLower || 
             wsLower.includes(targetLower) || 
             targetLower.includes(wsLower);
    });
    
    if (warehouseStock) {
      return { 
        success: true, 
        stock: parseFloat(warehouseStock.stockOnHand) || 0,
        warehouse: warehouseStock.warehouse,
        allWarehouses: item.warehouseStocks.map(ws => ({
          warehouse: ws.warehouse,
          stock: parseFloat(ws.stockOnHand) || 0
        }))
      };
    }
    
    return { success: false, stock: 0, error: 'Warehouse not found', allWarehouses: item.warehouseStocks.map(ws => ws.warehouse) };
  } catch (error) {
    return { success: false, stock: 0, error: error.message };
  }
}

// Test: Create purchase receive and verify stock update
async function testPurchaseReceiveCreation(testConfig, testName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testName}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    // Get stock BEFORE
    console.log('📊 STOCK BEFORE Purchase Receive:');
    const stockBefore = await getCurrentStock(
      testConfig.itemGroupId,
      testConfig.itemName,
      testConfig.itemSku,
      testConfig.expectedWarehouse
    );
    
    if (stockBefore.success) {
      console.log(`   ✅ Found stock in "${stockBefore.warehouse}": ${stockBefore.stock}`);
      console.log(`   All warehouses:`, stockBefore.allWarehouses);
    } else {
      console.log(`   ⚠️ ${stockBefore.error || 'Stock not found'}`);
      if (stockBefore.allWarehouses) {
        console.log(`   Available warehouses:`, stockBefore.allWarehouses);
      }
    }
    
    // Get or create a test purchase order ID
    // Try to find an existing purchase order, or use a test ID
    let purchaseOrderId = testConfig.purchaseOrderId;
    let purchaseOrderNumber = null;
    
    if (!purchaseOrderId) {
      // Try to find any existing purchase order
      const existingPO = await PurchaseOrder.findOne().limit(1);
      if (existingPO) {
        purchaseOrderId = existingPO._id.toString();
        purchaseOrderNumber = existingPO.orderNumber;
        console.log(`   Using existing Purchase Order: ${purchaseOrderId} (${purchaseOrderNumber})`);
      } else {
        // Create a dummy ID (this might fail validation, but let's try)
        purchaseOrderId = '000000000000000000000000'; // Dummy ObjectId
        purchaseOrderNumber = 'TEST-PO-001';
        console.log(`   ⚠️ No existing Purchase Order found, using dummy ID (may fail validation)`);
      }
    } else {
      // Fetch the purchase order to get its orderNumber
      const po = await PurchaseOrder.findById(purchaseOrderId);
      if (po) {
        purchaseOrderNumber = po.orderNumber;
        console.log(`   Using Purchase Order: ${purchaseOrderId} (${purchaseOrderNumber})`);
      } else {
        purchaseOrderNumber = 'TEST-PO-001';
        console.log(`   ⚠️ Purchase Order not found, using dummy orderNumber`);
      }
    }
    
    // Create mock request object
    const mockReq = {
      body: {
        receiveNumber: `TEST-${Date.now()}`,
        purchaseOrderId: purchaseOrderId,
        purchaseOrderNumber: purchaseOrderNumber, // Required field
        vendorId: 'test-vendor-id',
        vendorName: 'Test Vendor',
        receivedDate: new Date(),
        items: [{
          itemId: null, // Group item
          itemName: testConfig.itemName,
          itemSku: testConfig.itemSku,
          itemGroupId: testConfig.itemGroupId,
          ordered: testConfig.quantity,
          received: testConfig.quantity,
          inTransit: 0,
          quantityToReceive: 0
        }],
        notes: 'Test purchase receive',
        userId: testConfig.userId,
        locCode: testConfig.locCode,
        status: 'received' // IMPORTANT: Must be "received" to update stock
      }
    };
    
    // Store response data
    let responseData = null;
    let responseStatus = null;
    
    const mockRes = {
      status: (code) => {
        responseStatus = code;
        return {
          json: (data) => {
            responseData = data;
            console.log(`\n📦 Purchase Receive Response (Status ${code}):`);
            console.log(`   Receive Number: ${data.receiveNumber || data.receiveNumber}`);
            console.log(`   Status: ${data.status}`);
            if (data.stockUpdateSummary) {
              console.log(`   Stock Update Summary:`);
              console.log(`     - Status: ${data.stockUpdateSummary.status}`);
              console.log(`     - Processed: ${data.stockUpdateSummary.processed}`);
              console.log(`     - Skipped: ${data.stockUpdateSummary.skipped}`);
              console.log(`     - Warehouse: ${data.stockUpdateSummary.warehouse}`);
              if (data.stockUpdateSummary.reason) {
                console.log(`     - Reason: ${data.stockUpdateSummary.reason}`);
              }
            }
            return { statusCode: code, data };
          }
        };
      },
      json: (data) => {
        responseData = data;
        responseStatus = 200;
        console.log(`\n📦 Purchase Receive Response:`);
        console.log(`   Receive Number: ${data.receiveNumber || data.receiveNumber}`);
        console.log(`   Status: ${data.status}`);
        if (data.stockUpdateSummary) {
          console.log(`   Stock Update Summary:`, data.stockUpdateSummary);
        }
        return data;
      }
    };
    
    console.log(`\n📦 Creating Purchase Receive:`);
    console.log(`   User ID: ${testConfig.userId}`);
    console.log(`   LocCode: ${testConfig.locCode}`);
    console.log(`   Expected Warehouse: ${testConfig.expectedWarehouse}`);
    console.log(`   Item: ${testConfig.itemName}`);
    console.log(`   Quantity: ${testConfig.quantity}`);
    console.log(`   Status: "received"`);
    
    // Call the actual createPurchaseReceive function
    await createPurchaseReceive(mockReq, mockRes);
    
    // Check response
    if (responseStatus && responseStatus >= 400) {
      console.log(`\n❌ Purchase Receive creation failed with status ${responseStatus}`);
      return { success: false, error: 'Purchase receive creation failed' };
    }
    
    if (responseData && responseData.stockUpdateSummary) {
      const summary = responseData.stockUpdateSummary;
      if (summary.status === 'skipped') {
        console.log(`\n⚠️ WARNING: Stock update was skipped!`);
        console.log(`   Reason: ${summary.reason || 'Unknown'}`);
      } else if (summary.processed === 0) {
        console.log(`\n⚠️ WARNING: No items were processed for stock update!`);
        console.log(`   Skipped: ${summary.skipped}`);
      }
    }
    
    // Wait a bit for database to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get stock AFTER
    console.log(`\n📊 STOCK AFTER Purchase Receive:`);
    const stockAfter = await getCurrentStock(
      testConfig.itemGroupId,
      testConfig.itemName,
      testConfig.itemSku,
      testConfig.expectedWarehouse
    );
    
    if (stockAfter.success) {
      console.log(`   ✅ Found stock in "${stockAfter.warehouse}": ${stockAfter.stock}`);
      console.log(`   All warehouses:`, stockAfter.allWarehouses);
    } else {
      console.log(`   ⚠️ ${stockAfter.error || 'Stock not found'}`);
      if (stockAfter.allWarehouses) {
        console.log(`   Available warehouses:`, stockAfter.allWarehouses);
      }
    }
    
    // Verify results
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST RESULTS: ${testName}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Stock Before: ${stockBefore.stock || 0}`);
    console.log(`Stock After: ${stockAfter.stock || 0}`);
    console.log(`Expected Increase: ${testConfig.quantity}`);
    console.log(`Actual Increase: ${(stockAfter.stock || 0) - (stockBefore.stock || 0)}`);
    console.log(`Expected Warehouse: ${testConfig.expectedWarehouse}`);
    console.log(`Actual Warehouse: ${stockAfter.warehouse || 'N/A'}`);
    
    const stockIncreased = (stockAfter.stock || 0) === (stockBefore.stock || 0) + testConfig.quantity;
    const warehouseCorrect = !stockAfter.warehouse || 
                             stockAfter.warehouse.toLowerCase() === testConfig.expectedWarehouse.toLowerCase() ||
                             stockAfter.warehouse.toLowerCase().includes(testConfig.expectedWarehouse.toLowerCase()) ||
                             testConfig.expectedWarehouse.toLowerCase().includes(stockAfter.warehouse.toLowerCase());
    
    if (stockIncreased && warehouseCorrect) {
      console.log(`\n✅ TEST PASSED: Stock updated correctly in correct warehouse!`);
      return { success: true };
    } else {
      console.log(`\n❌ TEST FAILED:`);
      if (!stockIncreased) {
        console.log(`   - Stock not increased correctly`);
        console.log(`     Expected: ${(stockBefore.stock || 0) + testConfig.quantity}`);
        console.log(`     Actual: ${stockAfter.stock || 0}`);
      }
      if (!warehouseCorrect) {
        console.log(`   - Warehouse mismatch`);
        console.log(`     Expected: ${testConfig.expectedWarehouse}`);
        console.log(`     Actual: ${stockAfter.warehouse || 'N/A'}`);
      }
      return { success: false, stockIncreased, warehouseCorrect };
    }
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    console.error(`\n❌ TEST ERROR:`, error);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runTests() {
  console.log('\n🚀 Starting Comprehensive Purchase Receive Stock Update Tests');
  console.log('='.repeat(60));
  
  try {
    // Connect to MongoDB
    console.log('\n📊 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Admin email (should use "Warehouse")
    console.log('\n🧪 TEST 1: Admin Email (officerootments@gmail.com)');
    console.log('   Expected: Should use "Warehouse" regardless of locCode');
    const adminResult = await testPurchaseReceiveCreation(
      TEST_CONFIG.adminTest,
      'Admin Email Test'
    );
    
    // Test 2: Regular user (should use warehouse from locCode)
    console.log('\n🧪 TEST 2: Regular User (kannur@gmail.com)');
    console.log('   Expected: Should use "Kannur Branch" from locCode 716');
    const regularResult = await testPurchaseReceiveCreation(
      TEST_CONFIG.regularTest,
      'Regular User Test'
    );
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('TEST SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Admin Test: ${adminResult.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Regular Test: ${regularResult.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    console.error(error.stack);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('📊 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run tests
runTests().catch(console.error);

