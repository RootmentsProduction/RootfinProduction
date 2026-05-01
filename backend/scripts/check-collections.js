import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;

async function checkCollections() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  console.log('Collections in database:');
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  - ${col.name.padEnd(35)} (${count} docs)`);
  }

  await mongoose.disconnect();
}

checkCollections().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
