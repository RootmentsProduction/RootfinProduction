import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import SalesInvoice from './model/SalesInvoice.js';
import ShoeItem from './model/ShoeItem.js';
import ItemGroup from './model/ItemGroup.js';

dotenv.config();

async function debugStockReductionIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rootments');
    console.log("✅ Connected to MongoDB");

    console.log("🔍 DEBUGGING STOCK REDUCTION ISSUES\n");

    // 1. Get a recent Trivandrum invoice to analyze
    console.log("1️⃣ ANALYZING RECENT TRIVANDRUM INVOICE:");
    console.log("=".repeat(60));

    const recentInvoice = await SalesInvoice.findOne({
      warehouse: { $regex: /trivandrum|trivandum/i }
    }).sort({ createdAt: -1 });

    if (!recentInvoice) {
      console.log("❌ No Trivandrum invoices found");
      return;
    }

    console.log(`📄 Invoice: ${recentInvoice.invoiceNo || 'No Number'}`);
    console.log(`📅 Date: ${recentInvoice.createdAt.toLocaleDateString()}`);
    console.log(`🏢 Warehouse: "${recentInvoice.warehouse}"`);
    console.log(`🏢 Branch: "${recentInvoice.branch || 'N/A'}"`);
    console.log(`📂 Category: "${recentInvoice.category}"`);
    console.log(`💰 Total Amount: ₹${recentInvoice.totalAmount || 0}`);
    console.log(`📦 Line Items: ${recentInvoice.lineItems?.length || 0}`);

    if (recentInvoice.lineItems && recentInvoice.lineItems.length > 0) {
      console.log(`\n📋 LINE ITEMS DETAILS:`);
      recentInvoice.lineItems.forEach((item, idx) => {
        console.log(`${idx + 1}. Item: "${item.item}"`);
        console.log(`   Quantity: ${item.quantity}`);
        console.log(`   Price: ₹${item.price || 0}`);
        console.log(`   Total: ₹${item.total || 0}`);
        console.log(`   Item Data: ${JSON.stringify(item.itemData)}`);
        console.log(`   Item Group ID: ${item.itemData?.itemGroupId || 'N/A'}`);
        console.log(`   Item ID: ${item.itemData?._id || 'N/A'}`);
      });

      // 2. Check if the items in this invoice actually exist and have stock
      console.log(`\n2️⃣ CHECKING ITEM EXISTENCE AND STOCK:`);
      console.log("=".repeat(60));

      for (const [idx, lineItem] of recentInvoice.lineItems.entries()) {
        console.log(`\n📦 Checking Line Item ${idx + 1}: "${lineItem.item}"`);
        
        const itemGroupId = lineItem.itemData?.itemGroupId;
        const itemId = lineItem.itemData?._id;

        if (itemGroupId) {
          // Check in item group
          console.log(`   Looking in ItemGroup: ${itemGroupId}`);
          const group = await ItemGroup.findById(itemGroupId);
          
          if (!group) {
            console.log(`   ❌ ItemGroup not found: ${itemGroupId}`);
            continue;
          }

          console.log(`   ✅ Group found: "${group.groupName}"`);
          console.log(`   Items in group: ${group.items?.length || 0}`);

          // Find the specific item in the group
          const groupItem = group.items?.find(gi => 
            gi._id?.toString() === itemId?.toString() ||
            gi.name === lineItem.item ||
            gi.sku === lineItem.itemData?.sku
          );

          if (!groupItem) {
            console.log(`   ❌ Item not found in group`);
            continue;
          }

          console.log(`   ✅ Item found in group: "${groupItem.name}"`);
          console.log(`   SKU: ${groupItem.sku || 'N/A'}`);

          // Check warehouse stocks
          if (groupItem.warehouseStocks) {
            console.log(`   Warehouse stocks (${groupItem.warehouseStocks.length}):`);
            groupItem.warehouseStocks.forEach((ws, wsIdx) => {
              console.log(`     ${wsIdx + 1}. "${ws.warehouse}": Opening=${ws.openingStock || 0}, Current=${ws.stockOnHand || ws.stock || 0}`);
            });

            // Check for Trivandrum variations
            const trivandrumStock = groupItem.warehouseStocks.find(ws => 
              ws.warehouse && ws.warehouse.toLowerCase().includes('trivandrum') ||
              ws.warehouse && ws.warehouse.toLowerCase().includes('trivandum')
            );

            if (trivandrumStock) {
              console.log(`   ✅ Trivandrum stock found: "${trivandrumStock.warehouse}"`);
              console.log(`      Opening: ${trivandrumStock.openingStock || 0}`);
              console.log(`      Current: ${trivandrumStock.stockOnHand || trivandrumStock.stock || 0}`);
            } else {
              console.log(`   ❌ No Trivandrum stock found for this item`);
            }
          } else {
            console.log(`   ❌ No warehouse stocks found`);
          }

        } else if (itemId) {
          // Check standalone item
          console.log(`   Looking for standalone item: ${itemId}`);
          const item = await ShoeItem.findById(itemId);
          
          if (!item) {
            console.log(`   ❌ Standalone item not found: ${itemId}`);
            continue;
          }

          console.log(`   ✅ Standalone item found: "${item.itemName}"`);
          console.log(`   SKU: ${item.sku || 'N/A'}`);

          // Check warehouse stocks
          if (item.warehouseStocks) {
            console.log(`   Warehouse stocks (${item.warehouseStocks.length}):`);
            item.warehouseStocks.forEach((ws, wsIdx) => {
              console.log(`     ${wsIdx + 1}. "${ws.warehouse}": Opening=${ws.openingStock || 0}, Current=${ws.stockOnHand || ws.stock || 0}`);
            });

            // Check for Trivandrum variations
            const trivandrumStock = item.warehouseStocks.find(ws => 
              ws.warehouse && ws.warehouse.toLowerCase().includes('trivandrum') ||
              ws.warehouse && ws.warehouse.toLowerCase().includes('trivandum')
            );

            if (trivandrumStock) {
              console.log(`   ✅ Trivandrum stock found: "${trivandrumStock.warehouse}"`);
              console.log(`      Opening: ${trivandrumStock.openingStock || 0}`);
              console.log(`      Current: ${trivandrumStock.stockOnHand || trivandrumStock.stock || 0}`);
            } else {
              console.log(`   ❌ No Trivandrum stock found for this item`);
            }
          } else {
            console.log(`   ❌ No warehouse stocks found`);
          }

        } else {
          console.log(`   ❌ No itemGroupId or itemId found in lineItem`);
        }
      }
    }

    // 3. Check stock reduction logic compatibility
    console.log(`\n3️⃣ STOCK REDUCTION LOGIC CHECK:`);
    console.log("=".repeat(60));

    const categoryLower = (recentInvoice.category || "").toLowerCase().trim();
    const reverseStockCategories = ["return", "refund", "cancel"];
    const shouldReverseStock = reverseStockCategories.includes(categoryLower);

    console.log(`Invoice category: "${categoryLower}"`);
    console.log(`Should reverse stock: ${shouldReverseStock}`);
    console.log(`Should reduce stock: ${!shouldReverseStock}`);

    if (categoryLower === "income") {
      console.log(`✅ "income" category should REDUCE stock (normal sale)`);
    } else {
      console.log(`⚠️  Category "${categoryLower}" - check if this should reduce stock`);
    }

    // 4. Check warehouse name matching
    console.log(`\n4️⃣ WAREHOUSE NAME MATCHING:`);
    console.log("=".repeat(60));

    const invoiceWarehouse = recentInvoice.warehouse || recentInvoice.branch || "Warehouse";
    console.log(`Invoice warehouse: "${invoiceWarehouse}"`);

    // Test warehouse matching logic from stockManagement.js
    const warehouseVariations = {
      trivandrum: ["grooms trivandrum", "grooms trivandum", "trivandrum branch", "sg-trivandrum", "sg.trivandrum"],
    };

    const warehouseLower = invoiceWarehouse.toLowerCase().trim();
    let matchedCategory = null;
    
    for (const [category, variations] of Object.entries(warehouseVariations)) {
      if (variations.includes(warehouseLower)) {
        matchedCategory = category;
        break;
      }
    }

    if (matchedCategory) {
      console.log(`✅ Warehouse matches category: ${matchedCategory}`);
      console.log(`   Variations: ${warehouseVariations[matchedCategory].join(", ")}`);
    } else {
      console.log(`❌ Warehouse "${invoiceWarehouse}" doesn't match any predefined variations`);
      console.log(`   This could cause stock reduction to fail!`);
    }

    console.log("\n✅ Debug completed!");

  } catch (error) {
    console.error("❌ Error in debug:", error);
  } finally {
    await mongoose.connection.close();
  }
}

debugStockReductionIssue();