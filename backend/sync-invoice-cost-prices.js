/**
 * Sync Invoice Cost Prices
 * 
 * This script updates the cost prices in existing invoice line items
 * to match the current cost prices in the ShoeItem collection.
 * 
 * Use this when:
 * - Cost prices have been updated in items but existing invoices show old prices
 * - You need to refresh purchase cost calculations in reports
 * 
 * Usage: node sync-invoice-cost-prices.js
 */

import SalesInvoice from "./model/SalesInvoice.js";
import ShoeItem from "./model/ShoeItem.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const syncInvoiceCostPrices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rootfin');
    console.log("Connected to MongoDB");

    // Get all invoices with line items that have itemData
    const invoices = await SalesInvoice.find({
      'lineItems.itemData': { $exists: true, $ne: null }
    });

    console.log(`Found ${invoices.length} invoices with itemData`);

    let updatedInvoices = 0;
    let updatedLineItems = 0;

    for (const invoice of invoices) {
      let invoiceUpdated = false;
      
      for (let i = 0; i < invoice.lineItems.length; i++) {
        const lineItem = invoice.lineItems[i];
        
        if (lineItem.itemData && lineItem.itemData._id) {
          // Find the current ShoeItem data
          const currentItem = await ShoeItem.findById(lineItem.itemData._id);
          
          if (currentItem && currentItem.costPrice !== lineItem.itemData.costPrice) {
            console.log(`📝 Updating ${invoice.invoiceNumber} - ${lineItem.item}: ₹${lineItem.itemData.costPrice} → ₹${currentItem.costPrice}`);
            
            // Update the cost price in the invoice's itemData using direct assignment
            invoice.lineItems[i].itemData.costPrice = currentItem.costPrice;
            
            // Also update selling price if it has changed
            if (currentItem.sellingPrice !== lineItem.itemData.sellingPrice) {
              invoice.lineItems[i].itemData.sellingPrice = currentItem.sellingPrice;
            }
            
            invoiceUpdated = true;
            updatedLineItems++;
          }
        }
      }
      
      if (invoiceUpdated) {
        // Mark the document as modified to ensure Mongoose saves it
        invoice.markModified('lineItems');
        await invoice.save();
        updatedInvoices++;
        console.log(`✅ Saved ${invoice.invoiceNumber}`);
      }
    }

    console.log(`\n✅ Sync completed:`);
    console.log(`   Updated invoices: ${updatedInvoices}`);
    console.log(`   Updated line items: ${updatedLineItems}`);
    console.log(`\n🎉 All invoice cost prices are now synced with current ShoeItem data!`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

syncInvoiceCostPrices();