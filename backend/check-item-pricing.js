import mongoose from "mongoose";
import ShoeItem from "./model/ShoeItem.js";
import ItemGroup from "./model/ItemGroup.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/rootfin";

async function checkItemPricing() {
  try {
    console.log("🔍 Checking Item Pricing Issues");
    console.log("================================");
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    
    // Check standalone items
    console.log("\n📦 STANDALONE ITEMS ANALYSIS");
    console.log("============================");
    
    const standaloneItems = await ShoeItem.find({ isActive: { $ne: false } });
    console.log(`Total active standalone items: ${standaloneItems.length}`);
    
    let zeroSellingPrice = 0;
    let zeroCostPrice = 0;
    let bothZero = 0;
    let hasValidPricing = 0;
    
    const itemsWithZeroPricing = [];
    
    standaloneItems.forEach(item => {
      const sellingPrice = item.sellingPrice || 0;
      const costPrice = item.costPrice || 0;
      
      if (sellingPrice === 0 && costPrice === 0) {
        bothZero++;
        itemsWithZeroPricing.push({
          type: 'standalone',
          name: item.itemName,
          sku: item.sku,
          sellingPrice,
          costPrice,
          id: item._id
        });
      } else if (sellingPrice === 0) {
        zeroSellingPrice++;
        itemsWithZeroPricing.push({
          type: 'standalone',
          name: item.itemName,
          sku: item.sku,
          sellingPrice,
          costPrice,
          id: item._id
        });
      } else if (costPrice === 0) {
        zeroCostPrice++;
      } else {
        hasValidPricing++;
      }
    });
    
    console.log(`✅ Items with valid pricing: ${hasValidPricing}`);
    console.log(`⚠️  Items with zero selling price: ${zeroSellingPrice}`);
    console.log(`⚠️  Items with zero cost price: ${zeroCostPrice}`);
    console.log(`❌ Items with both prices zero: ${bothZero}`);
    
    // Check items in groups
    console.log("\n📦 ITEM GROUPS ANALYSIS");
    console.log("=======================");
    
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    console.log(`Total active item groups: ${itemGroups.length}`);
    
    let groupItemsTotal = 0;
    let groupItemsZeroSellingPrice = 0;
    let groupItemsZeroCostPrice = 0;
    let groupItemsBothZero = 0;
    let groupItemsValidPricing = 0;
    
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach(item => {
          if (item.isActive !== false) {
            groupItemsTotal++;
            
            const sellingPrice = item.sellingPrice || 0;
            const costPrice = item.costPrice || 0;
            
            if (sellingPrice === 0 && costPrice === 0) {
              groupItemsBothZero++;
              itemsWithZeroPricing.push({
                type: 'group',
                groupName: group.name,
                name: item.name,
                sku: item.sku,
                sellingPrice,
                costPrice,
                groupId: group._id,
                itemId: item._id
              });
            } else if (sellingPrice === 0) {
              groupItemsZeroSellingPrice++;
              itemsWithZeroPricing.push({
                type: 'group',
                groupName: group.name,
                name: item.name,
                sku: item.sku,
                sellingPrice,
                costPrice,
                groupId: group._id,
                itemId: item._id
              });
            } else if (costPrice === 0) {
              groupItemsZeroCostPrice++;
            } else {
              groupItemsValidPricing++;
            }
          }
        });
      }
    });
    
    console.log(`Total active items in groups: ${groupItemsTotal}`);
    console.log(`✅ Group items with valid pricing: ${groupItemsValidPricing}`);
    console.log(`⚠️  Group items with zero selling price: ${groupItemsZeroSellingPrice}`);
    console.log(`⚠️  Group items with zero cost price: ${groupItemsZeroCostPrice}`);
    console.log(`❌ Group items with both prices zero: ${groupItemsBothZero}`);
    
    // Show problematic items
    console.log("\n❌ ITEMS WITH PRICING ISSUES (showing first 20)");
    console.log("===============================================");
    
    const problemItems = itemsWithZeroPricing.slice(0, 20);
    problemItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.type === 'group' ? `[${item.groupName}] ` : ''}${item.name}`);
      console.log(`   SKU: ${item.sku || 'N/A'}`);
      console.log(`   Selling Price: ₹${item.sellingPrice}`);
      console.log(`   Cost Price: ₹${item.costPrice}`);
      console.log(`   ID: ${item.id || item.itemId}`);
      console.log('');
    });
    
    if (itemsWithZeroPricing.length > 20) {
      console.log(`... and ${itemsWithZeroPricing.length - 20} more items with pricing issues`);
    }
    
    // Summary
    console.log("\n📊 SUMMARY");
    console.log("==========");
    console.log(`Total items analyzed: ${standaloneItems.length + groupItemsTotal}`);
    console.log(`Items with pricing issues: ${itemsWithZeroPricing.length}`);
    console.log(`Percentage with issues: ${((itemsWithZeroPricing.length / (standaloneItems.length + groupItemsTotal)) * 100).toFixed(1)}%`);
    
    if (itemsWithZeroPricing.length > 0) {
      console.log("\n💡 RECOMMENDATIONS");
      console.log("==================");
      console.log("1. Update item prices in the item management section");
      console.log("2. Set default selling prices when creating new items");
      console.log("3. Consider implementing price validation in the frontend");
      console.log("4. Add price alerts when creating invoices with zero-priced items");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

checkItemPricing();