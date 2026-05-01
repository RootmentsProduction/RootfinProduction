import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;

async function checkWarehouseNames() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;

  // Find all distinct warehouse names across all items
  const result = await db.collection('shoeitems').aggregate([
    { $unwind: '$warehouseStocks' },
    { $group: { _id: '$warehouseStocks.warehouse' } },
    { $sort: { _id: 1 } }
  ]).toArray();

  console.log('All warehouse names in database:');
  result.forEach(r => console.log(' -', JSON.stringify(r._id)));

  await mongoose.disconnect();
}

checkWarehouseNames().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
