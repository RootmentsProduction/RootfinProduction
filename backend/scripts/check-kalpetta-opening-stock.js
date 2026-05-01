import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;

async function checkKalpettaOpeningStock() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;

  const KALPETTA_LOC = 'G-Kalpetta';

  // Check itemhistories for Kalpetta
  console.log('=== ITEM HISTORIES (Kalpetta) ===');
  const histories = await db.collection('itemhistories').find({
    $or: [
      { locCode: { $regex: /kalpetta/i } },
      { warehouse: { $regex: /kalpetta/i } },
      { store: { $regex: /kalpetta/i } }
    ]
  }).toArray();
  console.log(`Found ${histories.length} item history records for Kalpetta`);
  if (histories.length > 0) {
    console.log('Sample keys:', Object.keys(histories[0]));
    console.log('Sample:', JSON.stringify(histories[0], null, 2));
  }

  // Check all itemhistory keys
  console.log('\n=== ALL ITEM HISTORY SAMPLE ===');
  const allHistory = await db.collection('itemhistories').findOne({});
  if (allHistory) console.log('Keys:', Object.keys(allHistory));

  // Check salesinvoices for Kalpetta - look at lineItems structure
  console.log('\n=== KALPETTA SALES INVOICES - lineItems sample ===');
  const kalpettaInvoice = await db.collection('salesinvoices').findOne({
    $or: [
      { locCode: { $regex: /kalpetta/i } },
      { warehouse: { $regex: /kalpetta/i } },
      { branch: { $regex: /kalpetta/i } }
    ]
  });
  if (kalpettaInvoice) {
    console.log('locCode:', kalpettaInvoice.locCode);
    console.log('warehouse:', kalpettaInvoice.warehouse);
    console.log('branch:', kalpettaInvoice.branch);
    console.log('lineItems sample:', JSON.stringify(kalpettaInvoice.lineItems?.[0], null, 2));
  } else {
    console.log('No Kalpetta invoices found with those fields');
    // Try to find what locCodes exist
    const locCodes = await db.collection('salesinvoices').distinct('locCode');
    console.log('Distinct locCodes in salesinvoices:', locCodes.slice(0, 20));
  }

  await mongoose.disconnect();
}

checkKalpettaOpeningStock().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
