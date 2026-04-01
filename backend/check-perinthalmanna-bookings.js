import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  type: String,
  invoiceNo: String,
  category: String,
  subCategory: String,
  remark: String,
  billValue: Number,
  amount: String,
  cash: String,
  rbl: String,
  bank: String,
  upi: String,
  paymentMethod: String,
  date: Date,
  locCode: String,
  quantity: String,
  customerName: String,
  securityAmount: Number,
  Balance: Number,
  subCategory1: String,
  totalTransaction: Number,
  editedBy: String,
  editedAt: Date,
  editReason: String,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'transactions' });

const Transaction = mongoose.model('Transaction', transactionSchema);

async function checkPerinthalmannaBookings() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const perinthalmanaStores = [
      { name: 'G.Perinthalmanna', locCode: '709' },
      { name: 'Z.Perinthalmanna', locCode: '133' }
    ];

    for (const store of perinthalmanaStores) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📍 Checking ${store.name} (locCode: ${store.locCode})`);
      console.log('='.repeat(60));

      // Check for edited transactions in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const editedTransactions = await Transaction.find({
        locCode: store.locCode,
        editedAt: { $exists: true, $ne: null },
        date: { $gte: thirtyDaysAgo }
      }).sort({ date: -1 });

      console.log(`\n📝 Found ${editedTransactions.length} edited transaction(s) in the last 30 days\n`);

      if (editedTransactions.length > 0) {
        // Group by invoice number
        const invoiceGroups = {};
        editedTransactions.forEach(tx => {
          const inv = tx.invoiceNo;
          if (!invoiceGroups[inv]) {
            invoiceGroups[inv] = [];
          }
          invoiceGroups[inv].push(tx);
        });

        console.log(`📊 Grouped into ${Object.keys(invoiceGroups).length} unique invoice(s)\n`);

        // Check each invoice for potential booking/rentout conflicts
        for (const [invoiceNo, transactions] of Object.entries(invoiceGroups)) {
          if (transactions.length > 0) {
            console.log(`\n--- Invoice: ${invoiceNo} ---`);
            console.log(`   Edited transactions: ${transactions.length}`);
            
            transactions.forEach((tx, idx) => {
              console.log(`   ${idx + 1}. Type: ${tx.type}, Date: ${tx.date.toISOString().split('T')[0]}, Customer: ${tx.customerName}`);
              console.log(`      Amount: ${tx.amount}, Cash: ${tx.cash}, RBL: ${tx.rbl}, Bank: ${tx.bank}, UPI: ${tx.upi}`);
              console.log(`      Edited At: ${tx.editedAt?.toISOString()}`);
            });

            // Check if this invoice has both booking and rentout in TWS
            console.log(`\n   ⚠️  This invoice was edited. Check if booking data is missing when querying date ranges.`);
          }
        }
      }

      // Check for all RentOut transactions in the last 30 days
      const rentoutTransactions = await Transaction.find({
        locCode: store.locCode,
        type: 'RentOut',
        date: { $gte: thirtyDaysAgo }
      }).sort({ date: -1 });

      console.log(`\n\n📦 Found ${rentoutTransactions.length} RentOut transaction(s) in the last 30 days`);
      
      if (rentoutTransactions.length > 0) {
        console.log('\nInvoices with RentOut transactions:');
        rentoutTransactions.forEach((tx, idx) => {
          console.log(`${idx + 1}. ${tx.invoiceNo} - ${tx.customerName} - ${tx.date.toISOString().split('T')[0]} - Amount: ${tx.amount}`);
        });
      }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ Check complete!');
    console.log('='.repeat(60));
    console.log('\n💡 If you see edited RentOut transactions, those invoices may have');
    console.log('   missing booking data when querying date ranges that include both');
    console.log('   the booking date and rentout date.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkPerinthalmannaBookings();
