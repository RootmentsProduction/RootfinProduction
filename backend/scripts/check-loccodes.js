import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SalesInvoice from '../model/SalesInvoice.js';

dotenv.config({ path: '.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }
};

const checkLocCodes = async () => {
  try {
    // Get all unique locCodes
    const locCodes = await SalesInvoice.distinct('locCode', { status: { $ne: 'draft' } });
    console.log('\n📍 All locCodes in database (non-draft invoices):');
    console.log(locCodes);

    // Get count by locCode
    const counts = await SalesInvoice.aggregate([
      { $match: { status: { $ne: 'draft' } } },
      { $group: { _id: '$locCode', count: { $sum: 1 }, items: { $sum: { $size: '$lineItems' } } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Invoice count by locCode:');
    counts.forEach(c => {
      console.log(`  ${c._id || 'NULL'}: ${c.count} invoices, ${c.items} items`);
    });

    // Check G-Edapally specifically
    console.log('\n🔍 Checking for G-Edapally variations:');
    const variations = ['702', 'G-Edapally', 'G-edapally', 'G_Edapally', 'G_edapally'];
    for (const loc of variations) {
      const count = await SalesInvoice.countDocuments({ locCode: loc, status: { $ne: 'draft' } });
      if (count > 0) {
        console.log(`  ✅ Found ${count} invoices with locCode: "${loc}"`);
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Done');
  }
};

connectDB().then(checkLocCodes);
