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

  // Use try/catch per collection to avoid auth errors on system collections
  const collections = await db.listCollections().toArray();
  const userCollections = collections.filter(c => !c.name.startsWith('system.'));

  console.log('Collections in database:');
  for (const col of userCollections) {
    try {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  - ${col.name.padEnd(35)} (${count} docs)`);
    } catch (e) {
      console.log(`  - ${col.name.padEnd(35)} (error: ${e.message})`);
    }
  }

  await mongoose.disconnect();
}

checkCollections().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
