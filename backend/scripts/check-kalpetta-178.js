import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;

async function checkKalpetta178() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;

  // The UI uses January 2026 date filter on createdAt of the ItemGroup document
  // and sums ALL warehouseStocks[].openingStock for Kalpetta Branch across ALL items in matching groups
  // Date range: Jan 1 2026 - Jan 31 2026
  const startDate = new Date(2026, 0, 1);  // Jan 1 2026
  const endDate = new Date(2026, 1, 0);    // Jan 31 2026

  console.log(`Date filter: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);

  // Query ItemGroups created in January 2026 that have Kalpetta opening stock
  const itemGroups = await db.collection('itemgroups').find({
    'items.warehouseStocks.openingStock': { $gt: 0 },
    createdAt: { $gte: startDate, $lte: endDate }
  }).toArray();

  console.log(`ItemGroups created in Jan 2026 with opening stock > 0: ${itemGroups.length}`);

  let totalFromGroups = 0;
  let kalpettaItemCount = 0;

  itemGroups.forEach(group => {
    let groupKalpettaTotal = 0;
    (group.items || []).forEach(item => {
      (item.warehouseStocks || []).forEach(ws => {
        if (ws.warehouse && ws.warehouse.toLowerCase().includes('kalpetta') && (ws.openingStock || 0) > 0) {
          groupKalpettaTotal += ws.openingStock;
          kalpettaItemCount++;
        }
      });
    });
    if (groupKalpettaTotal > 0) {
      console.log(`  Group: "${group.groupName || group.name}" | Kalpetta Opening Stock: ${groupKalpettaTotal} | Created: ${group.createdAt}`);
      totalFromGroups += groupKalpettaTotal;
    }
  });

  // Also check standalone ShoeItems created in Jan 2026
  const standaloneItems = await db.collection('shoeitems').find({
    'warehouseStocks.openingStock': { $gt: 0 },
    createdAt: { $gte: startDate, $lte: endDate }
  }).toArray();

  console.log(`\nStandalone ShoeItems created in Jan 2026 with opening stock > 0: ${standaloneItems.length}`);
  let totalFromStandalone = 0;
  standaloneItems.forEach(item => {
    (item.warehouseStocks || []).forEach(ws => {
      if (ws.warehouse && ws.warehouse.toLowerCase().includes('kalpetta') && (ws.openingStock || 0) > 0) {
        totalFromStandalone += ws.openingStock;
        console.log(`  Item: "${item.itemName}" SKU: ${item.sku} | Kalpetta Opening: ${ws.openingStock}`);
      }
    });
  });

  console.log('\n==========================================');
  console.log(`FROM ITEM GROUPS (Jan 2026):    ${totalFromGroups}`);
  console.log(`FROM STANDALONE ITEMS (Jan 2026): ${totalFromStandalone}`);
  console.log(`TOTAL (what UI shows as 178):   ${totalFromGroups + totalFromStandalone}`);
  console.log('==========================================\n');

  // Now also check what the UI actually queries - ALL items regardless of date
  // but filtered to Kalpetta Branch
  console.log('--- CHECKING ALL TIME (no date filter) ---');
  const allGroups = await db.collection('itemgroups').find({
    'items.warehouseStocks.openingStock': { $gt: 0 }
  }).toArray();

  let allTimeTotal = 0;
  allGroups.forEach(group => {
    (group.items || []).forEach(item => {
      (item.warehouseStocks || []).forEach(ws => {
        if (ws.warehouse && ws.warehouse.toLowerCase().includes('kalpetta') && (ws.openingStock || 0) > 0) {
          allTimeTotal += ws.openingStock;
        }
      });
    });
  });

  const allStandalone = await db.collection('shoeitems').find({
    'warehouseStocks.openingStock': { $gt: 0 }
  }).toArray();
  allStandalone.forEach(item => {
    (item.warehouseStocks || []).forEach(ws => {
      if (ws.warehouse && ws.warehouse.toLowerCase().includes('kalpetta') && (ws.openingStock || 0) > 0) {
        allTimeTotal += ws.openingStock;
      }
    });
  });

  console.log(`ALL TIME Kalpetta opening stock (from ItemGroups + ShoeItems): ${allTimeTotal}`);

  await mongoose.disconnect();
}

checkKalpetta178().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
