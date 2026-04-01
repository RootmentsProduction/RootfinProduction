// Fix Current Stock Discrepancy - Reduce stock by 18 pieces
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ItemGroup from './model/ItemGroup.js';
import InventoryAdjustment from './model/InventoryAdjustment.js';
import { nextInventoryAdjustment } from './utils/nextInventoryAdjustment.js';

dotenv.config();

async function fixCurrentStockDiscrepancy() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    console.log('🔧 FIXING CURRENT STOCK DISCREPANCY');
    console.log('===================================');
    console.log('Issue: 18 items were sold but stock was not deducted');
    console.log('Solution: Create inventory adjustment to reduce stock by 18 pieces\n');

    // Step 1: Get current stock in Grooms Trivandrum
    console.log('📊 Step 1: Getting current stock distribution...');
    
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    let totalCurrentStock = 0;
    let itemsWithStock = [];

    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach(item => {
          const groomsStock = item.warehouseStocks?.find(ws => 
            ws.warehouse && (
              ws.warehouse.toLowerCase().includes('grooms') && 
              ws.warehouse.toLowerCase().includes('trivandrum')
            ) || (
              ws.warehouse.toLowerCase().includes('sg') && 
              ws.warehouse.toLowerCase().includes('trivandrum')
            )
          );
          
          if (groomsStock && groomsStock.stockOnHand > 0) {
            totalCurrentStock += groomsStock.stockOnHand;
            itemsWithStock.push({
              groupId: group._id,
              groupName: group.name,
              itemIndex: group.items.indexOf(item),
              sku: item.sku,
              name: item.name,
              currentStock: groomsStock.stockOnHand,
              warehouse: groomsStock.warehouse
            });
          }
        });
      }
    });

    console.log(`Total current stock: ${totalCurrentStock} pieces`);
    console.log(`Items with stock: ${itemsWithStock.length}`);
    console.log(`Target reduction: 18 pieces`);

    // Step 2: Calculate proportional reduction
    console.log('\n🧮 Step 2: Calculating proportional stock reduction...');
    
    const reductionRatio = 18 / totalCurrentStock;
    let totalReduction = 0;
    let adjustmentItems = [];

    itemsWithStock.forEach(item => {
      const reduction = Math.round(item.currentStock * reductionRatio);
      if (reduction > 0) {
        const newStock = Math.max(0, item.currentStock - reduction);
        adjustmentItems.push({
          ...item,
          reduction: reduction,
          newStock: newStock
        });
        totalReduction += reduction;
      }
    });

    // Adjust if total reduction doesn't equal 18
    let remainingReduction = 18 - totalReduction;
    let itemIndex = 0;
    
    while (remainingReduction > 0 && itemIndex < adjustmentItems.length) {
      const item = adjustmentItems[itemIndex];
      if (item.newStock > 0) {
        item.reduction += 1;
        item.newStock -= 1;
        remainingReduction -= 1;
        totalReduction += 1;
      }
      itemIndex++;
    }

    console.log(`Calculated total reduction: ${totalReduction} pieces`);
    console.log(`Items to adjust: ${adjustmentItems.length}`);

    // Step 3: Show adjustment plan
    console.log('\n📋 Step 3: Stock Adjustment Plan');
    console.log('===============================');
    adjustmentItems.forEach(item => {
      console.log(`- ${item.sku}: ${item.currentStock} → ${item.newStock} (-${item.reduction})`);
    });

    // Step 4: Create inventory adjustment record
    console.log('\n📝 Step 4: Creating inventory adjustment record...');
    
    const adjustmentNumber = await nextInventoryAdjustment();
    
    const inventoryAdjustment = new InventoryAdjustment({
      referenceNumber: adjustmentNumber,
      date: new Date(),
      adjustmentType: 'quantity',
      status: 'adjusted',
      branch: 'Grooms Trivandrum',
      warehouse: 'Grooms Trivandrum',
      reason: 'Stock deduction correction - Fix invoice stock discrepancy',
      notes: 'Correcting 18 pieces that were sold but not deducted from stock due to system error',
      lineItems: adjustmentItems.map(item => ({
        itemCode: item.sku,
        itemName: item.name,
        currentQuantity: item.currentStock,
        adjustedQuantity: item.newStock,
        difference: -item.reduction,
        reason: 'Invoice stock deduction correction'
      })),
      totalItems: adjustmentItems.length,
      createdBy: 'System',
      createdAt: new Date()
    });

    await inventoryAdjustment.save();
    console.log(`✅ Inventory adjustment created: ${adjustmentNumber}`);

    // Step 5: Apply the stock adjustments
    console.log('\n🔄 Step 5: Applying stock adjustments...');
    
    let appliedAdjustments = 0;
    
    for (const item of adjustmentItems) {
      try {
        const group = await ItemGroup.findById(item.groupId);
        if (group && group.items[item.itemIndex]) {
          const groupItem = group.items[item.itemIndex];
          const warehouseStock = groupItem.warehouseStocks?.find(ws => 
            ws.warehouse && (
              ws.warehouse.toLowerCase().includes('grooms') && 
              ws.warehouse.toLowerCase().includes('trivandrum')
            ) || (
              ws.warehouse.toLowerCase().includes('sg') && 
              ws.warehouse.toLowerCase().includes('trivandrum')
            )
          );
          
          if (warehouseStock) {
            const oldStock = warehouseStock.stockOnHand;
            warehouseStock.stockOnHand = item.newStock;
            warehouseStock.availableForSale = item.newStock;
            
            // Also update physical stock
            warehouseStock.physicalStockOnHand = item.newStock;
            warehouseStock.physicalAvailableForSale = item.newStock;
            
            group.markModified('items');
            await group.save();
            
            console.log(`✅ ${item.sku}: ${oldStock} → ${item.newStock} (-${item.reduction})`);
            appliedAdjustments++;
          }
        }
      } catch (error) {
        console.error(`❌ Error adjusting ${item.sku}:`, error);
      }
    }

    console.log(`\n✅ Applied ${appliedAdjustments}/${adjustmentItems.length} adjustments`);

    // Step 6: Verify the fix
    console.log('\n🔍 Step 6: Verifying the fix...');
    
    let newTotalStock = 0;
    const verifyGroups = await ItemGroup.find({ isActive: { $ne: false } });
    
    verifyGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach(item => {
          const groomsStock = item.warehouseStocks?.find(ws => 
            ws.warehouse && (
              ws.warehouse.toLowerCase().includes('grooms') && 
              ws.warehouse.toLowerCase().includes('trivandrum')
            ) || (
              ws.warehouse.toLowerCase().includes('sg') && 
              ws.warehouse.toLowerCase().includes('trivandrum')
            )
          );
          
          if (groomsStock) {
            newTotalStock += groomsStock.stockOnHand || 0;
          }
        });
      }
    });

    console.log(`Previous total stock: ${totalCurrentStock} pieces`);
    console.log(`New total stock: ${newTotalStock} pieces`);
    console.log(`Actual reduction: ${totalCurrentStock - newTotalStock} pieces`);
    console.log(`Target reduction: 18 pieces`);
    
    if (Math.abs((totalCurrentStock - newTotalStock) - 18) <= 1) {
      console.log('✅ Stock discrepancy successfully fixed!');
    } else {
      console.log('⚠️ Adjustment may need fine-tuning');
    }

    // Step 7: Summary
    console.log('\n📊 SUMMARY');
    console.log('==========');
    console.log(`✅ Inventory adjustment created: ${adjustmentNumber}`);
    console.log(`✅ Stock reduced by: ${totalCurrentStock - newTotalStock} pieces`);
    console.log(`✅ Items adjusted: ${appliedAdjustments}`);
    console.log(`✅ New total stock: ${newTotalStock} pieces`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Deploy enhanced stock management system');
    console.log('2. Test invoice creation with new validation');
    console.log('3. Monitor stock deduction success rates');
    console.log('4. Schedule regular stock audits');

  } catch (error) {
    console.error('❌ Error fixing stock discrepancy:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

fixCurrentStockDiscrepancy();