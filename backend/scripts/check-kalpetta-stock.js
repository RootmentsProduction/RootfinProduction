import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;

const ShoeItemSchema = new mongoose.Schema({
  itemName: String,
  sku: String,
  warehouseStocks: [{
    warehouse: String,
    openingStock: Number,
    stockOnHand: Number,
  }]
}, { strict: false });

const ShoeItem = mongoose.model('ShoeItem', ShoeItemSchema);

async function checkKalpettaStock() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // Get all items that have a Kalpetta warehouse entry
  const items = await ShoeItem.find({
    'warehouseStocks.warehouse': { $regex: /kalpetta/i }
  }, { itemName: 1, sku: 1, warehouseStocks: 1 });

  console.log(`Total items with Kalpetta warehouse: ${items.length}\n`);

  let totalOpeningStock = 0;
  let totalStockOnHand = 0;
  const breakdown = [];

  for (const item of items) {
    const kalpettaStock = item.warehouseStocks.find(w =>
      w.warehouse && w.warehouse.toLowerCase().includes('kalpetta')
    );
    if (kalpettaStock) {
      totalOpeningStock += kalpettaStock.openingStock || 0;
      totalStockOnHand += kalpettaStock.stockOnHand || 0;
      if ((kalpettaStock.openingStock || 0) > 0) {
        breakdown.push({
          item: item.itemName || item.sku || 'Unknown',
          openingStock: kalpettaStock.openingStock,
          stockOnHand: kalpettaStock.stockOnHand
        });
      }
    }
  }

  console.log('Items with opening stock > 0 in Kalpetta:');
  console.log('------------------------------------------');
  breakdown.forEach(b => {
    console.log(`  ${b.item.padEnd(20)} | Opening: ${b.openingStock} | On Hand: ${b.stockOnHand}`);
  });

  console.log('\n==========================================');
  console.log(`TOTAL ITEMS WITH OPENING STOCK: ${breakdown.length}`);
  console.log(`TOTAL OPENING STOCK (sum):      ${totalOpeningStock}`);
  console.log(`TOTAL STOCK ON HAND (sum):      ${totalStockOnHand}`);
  console.log('==========================================\n');

  await mongoose.disconnect();
}

checkKalpettaStock().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
