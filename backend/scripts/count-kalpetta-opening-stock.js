import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;

async function countKalpettaOpeningStock() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;

  // The item data is embedded in salesinvoices lineItems.itemData
  // But the canonical stock is in the itemData.warehouseStocks
  // We need to get unique items and their Kalpetta Branch opening stock
  // Best approach: aggregate from salesinvoices, get unique SKUs with Kalpetta opening stock

  const result = await db.collection('salesinvoices').aggregate([
    { $unwind: '$lineItems' },
    { $match: { 'lineItems.itemData': { $ne: null }, 'lineItems.itemData.warehouseStocks': { $exists: true } } },
    { $replaceRoot: { newRoot: '$lineItems.itemData' } },
    { $unwind: '$warehouseStocks' },
    { $match: { 'warehouseStocks.warehouse': 'Kalpetta Branch' } },
    {
      $group: {
        _id: '$sku',
        itemName: { $first: '$itemName' },
        openingStock: { $first: '$warehouseStocks.openingStock' },
        stockOnHand: { $first: '$warehouseStocks.stockOnHand' }
      }
    },
    { $sort: { _id: 1 } }
  ]).toArray();

  console.log(`Unique SKUs with Kalpetta Branch data: ${result.length}\n`);

  let totalOpeningStock = 0;
  let itemsWithStock = 0;

  console.log('SKU                  | Opening Stock | Stock On Hand');
  console.log('---------------------|---------------|---------------');

  result.forEach(r => {
    const os = r.openingStock || 0;
    totalOpeningStock += os;
    if (os > 0) itemsWithStock++;
    console.log(`${(r._id || 'N/A').padEnd(20)} | ${String(os).padEnd(13)} | ${r.stockOnHand || 0}`);
  });

  console.log('\n==========================================');
  console.log(`TOTAL UNIQUE SKUs FOUND:        ${result.length}`);
  console.log(`SKUs WITH OPENING STOCK > 0:    ${itemsWithStock}`);
  console.log(`TOTAL OPENING STOCK (sum):      ${totalOpeningStock}`);
  console.log('==========================================\n');
  console.log('📋 IMAGE COUNT (from Excel):    148');
  console.log(`📊 DATABASE COUNT:              ${totalOpeningStock}`);
  console.log(`${totalOpeningStock === 148 ? '✅ MATCH!' : '❌ MISMATCH - Difference: ' + (totalOpeningStock - 148)}`);

  await mongoose.disconnect();
}

countKalpettaOpeningStock().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
