import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;

async function checkKalpetta() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;

  // Check stores for Kalpetta
  console.log('=== STORES ===');
  const stores = await db.collection('stores').find({}).toArray();
  stores.forEach(s => {
    console.log(`  Store: ${JSON.stringify({ name: s.name, locationCode: s.locationCode, _id: s._id })}`);
  });

  // Check a sample salesinvoice to understand structure
  console.log('\n=== SAMPLE SALES INVOICE (1 doc) ===');
  const sampleInvoice = await db.collection('salesinvoices').findOne({});
  if (sampleInvoice) {
    console.log('Keys:', Object.keys(sampleInvoice));
    if (sampleInvoice.items) console.log('Sample item keys:', Object.keys(sampleInvoice.items[0] || {}));
  }

  // Check a sample transaction
  console.log('\n=== SAMPLE TRANSACTION (1 doc) ===');
  const sampleTx = await db.collection('transactions').findOne({});
  if (sampleTx) {
    console.log('Keys:', Object.keys(sampleTx));
  }

  await mongoose.disconnect();
}

checkKalpetta().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
