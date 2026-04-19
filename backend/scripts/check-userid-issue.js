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

const checkUserIdIssue = async () => {
  try {
    const dateFrom = '2026-04-18';
    const dateTo = '2026-04-18';
    const locCode = '702';

    // Query WITHOUT userId filter
    const queryWithoutUser = {
      invoiceDate: {
        $gte: new Date(dateFrom + "T00:00:00.000Z"),
        $lte: new Date(dateTo + "T23:59:59.999Z"),
      },
      status: { $ne: "draft" },
      locCode: locCode
    };

    const invoicesWithoutUser = await SalesInvoice.find(queryWithoutUser).lean();
    console.log(`\n✅ WITHOUT userId filter: ${invoicesWithoutUser.length} invoices`);

    // Get unique userIds for this store
    const userIds = await SalesInvoice.distinct('userId', queryWithoutUser);
    console.log(`\n📧 UserIds in these invoices:`);
    userIds.forEach(uid => console.log(`  - ${uid}`));

    // Test WITH a userId filter (simulate what frontend sends)
    console.log(`\n\n🧪 Testing WITH userId filter:`);
    for (const userId of userIds.slice(0, 3)) {
      const queryWithUser = { ...queryWithoutUser, userId };
      const count = await SalesInvoice.countDocuments(queryWithUser);
      console.log(`  userId="${userId}": ${count} invoices`);
    }

    // Check if any invoices have empty userId
    const emptyUserId = await SalesInvoice.countDocuments({
      ...queryWithoutUser,
      $or: [{ userId: '' }, { userId: null }, { userId: { $exists: false } }]
    });
    console.log(`\n⚠️  Invoices with empty/null userId: ${emptyUserId}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Done');
  }
};

connectDB().then(checkUserIdIssue);
