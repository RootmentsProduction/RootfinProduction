import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;

async function checkKalpettaFirstAdded() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;

  // Get all unique items with Kalpetta Branch stock
  // and find the _id of the warehouseStocks entry (which has a timestamp in ObjectId)
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
        stockOnHand: { $first: '$warehouseStocks.stockOnHand' },
        warehouseId: { $first: '$warehouseStocks._id' },
        itemCreatedAt: { $first: '$createdAt' },
        itemUpdatedAt: { $first: '$updatedAt' }
      }
    },
    { $sort: { itemCreatedAt: 1 } }
  ]).toArray();

  console.log(`Total SKUs with Kalpetta Branch: ${result.length}\n`);

  // Extract timestamps from warehouseStocks ObjectId
  // ObjectId first 4 bytes = unix timestamp
  let earliestDate = null;
  let latestDate = null;
  const itemDates = [];

  result.forEach(r => {
    let warehouseAddedDate = null;
    if (r.warehouseId) {
      const hexStr = r.warehouseId.toString();
      const timestamp = parseInt(hexStr.substring(0, 8), 16);
      warehouseAddedDate = new Date(timestamp * 1000);
    }

    itemDates.push({
      sku: r._id,
      openingStock: r.openingStock,
      itemCreatedAt: r.itemCreatedAt,
      warehouseAddedDate
    });

    if (warehouseAddedDate) {
      if (!earliestDate || warehouseAddedDate < earliestDate) earliestDate = warehouseAddedDate;
      if (!latestDate || warehouseAddedDate > latestDate) latestDate = warehouseAddedDate;
    }
  });

  // Sort by warehouse added date
  itemDates.sort((a, b) => (a.warehouseAddedDate || 0) - (b.warehouseAddedDate || 0));

  console.log('SKU                  | Opening | Item Created At          | Kalpetta Stock Added At');
  console.log('---------------------|---------|--------------------------|-------------------------');
  itemDates.forEach(r => {
    console.log(
      `${(r.sku || 'N/A').padEnd(20)} | ${String(r.openingStock || 0).padEnd(7)} | ${r.itemCreatedAt?.toISOString?.() || 'N/A'} | ${r.warehouseAddedDate?.toISOString() || 'N/A'}`
    );
  });

  const totalOpeningStock = result.reduce((sum, r) => sum + (r.openingStock || 0), 0);

  console.log('\n==========================================');
  console.log(`TOTAL OPENING STOCK:            ${totalOpeningStock}`);
  console.log(`EARLIEST KALPETTA STOCK DATE:   ${earliestDate?.toISOString() || 'N/A'}`);
  console.log(`LATEST KALPETTA STOCK DATE:     ${latestDate?.toISOString() || 'N/A'}`);
  console.log('==========================================\n');

  await mongoose.disconnect();
}

checkKalpettaFirstAdded().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
