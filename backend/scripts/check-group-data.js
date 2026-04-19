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

const checkGroupData = async () => {
  try {
    // Get sample invoices from 702 (G-Edapally)
    const invoices = await SalesInvoice.find({ 
      locCode: '702', 
      status: { $ne: 'draft' } 
    }).limit(3).lean();

    console.log('\n📋 Sample invoices from G-Edapally (702):');
    invoices.forEach((inv, idx) => {
      console.log(`\n--- Invoice ${idx + 1}: ${inv.invoiceNumber} ---`);
      console.log(`Date: ${inv.invoiceDate}`);
      console.log(`Status: ${inv.status}`);
      console.log(`Line Items: ${inv.lineItems?.length || 0}`);
      
      if (inv.lineItems && inv.lineItems.length > 0) {
        inv.lineItems.slice(0, 2).forEach((li, i) => {
          console.log(`\n  Item ${i + 1}:`);
          console.log(`    - item: ${li.item}`);
          console.log(`    - size: ${li.size}`);
          console.log(`    - quantity: ${li.quantity}`);
          console.log(`    - itemData.itemGroupName: ${li.itemData?.itemGroupName}`);
          console.log(`    - itemData.groupName: ${li.itemData?.groupName}`);
          console.log(`    - itemData: ${JSON.stringify(li.itemData).substring(0, 100)}...`);
        });
      }
    });

    // Check if itemGroupName is populated
    const withGroupName = await SalesInvoice.countDocuments({
      locCode: '702',
      status: { $ne: 'draft' },
      'lineItems.itemData.itemGroupName': { $exists: true, $ne: null }
    });

    const withoutGroupName = await SalesInvoice.countDocuments({
      locCode: '702',
      status: { $ne: 'draft' },
      'lineItems.itemData.itemGroupName': { $exists: false }
    });

    console.log(`\n\n📊 Group Name Status for 702:`);
    console.log(`  ✅ With itemGroupName: ${withGroupName}`);
    console.log(`  ❌ Without itemGroupName: ${withoutGroupName}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Done');
  }
};

connectDB().then(checkGroupData);
