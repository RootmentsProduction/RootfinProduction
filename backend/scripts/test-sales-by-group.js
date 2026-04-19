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

const testGroupLogic = async () => {
  try {
    const dateFrom = '2026-04-18';
    const dateTo = '2026-04-18';
    const locCode = '702';

    const query = {
      invoiceDate: {
        $gte: new Date(dateFrom + "T00:00:00.000Z"),
        $lte: new Date(dateTo + "T23:59:59.999Z"),
      },
      status: { $ne: "draft" },
      locCode: locCode
    };

    const invoices = await SalesInvoice.find(query).lean();
    console.log(`\n📊 Found ${invoices.length} invoices for ${locCode} on ${dateFrom}`);

    const pivot = {};
    const sizeSet = new Set();

    for (const inv of invoices) {
      for (const li of inv.lineItems || []) {
        const rawName = li.item || "";
        const groupName =
          li.itemData?.itemGroupName ||
          li.itemData?.groupName ||
          rawName.replace(/[\s\/\-]+\d+$/, "").trim() ||
          rawName;

        // Extract size from item name
        const size =
          li.size ||
          li.itemData?.size ||
          (() => {
            const m = rawName.match(/[\s\/\-](\d+)$/);
            return m ? m[1] : null;
          })() ||
          "N/A";

        const qty = Number(li.quantity) || 0;
        if (qty === 0) continue;

        console.log(`\n  Item: ${rawName}`);
        console.log(`    Group: ${groupName}`);
        console.log(`    Size: ${size}`);
        console.log(`    Qty: ${qty}`);

        if (!pivot[groupName]) pivot[groupName] = {};
        pivot[groupName][size] = (pivot[groupName][size] || 0) + qty;
        sizeSet.add(size);
      }
    }

    console.log(`\n\n📈 RESULTS:`);
    console.log(`Groups: ${Object.keys(pivot).length}`);
    console.log(`Sizes: ${[...sizeSet].join(', ')}`);
    
    console.log(`\n📋 Pivot Table:`);
    Object.entries(pivot).forEach(([group, sizes]) => {
      const total = Object.values(sizes).reduce((s, v) => s + v, 0);
      console.log(`  ${group}: ${JSON.stringify(sizes)} (Total: ${total})`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Done');
  }
};

connectDB().then(testGroupLogic);
