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

async function checkAjayBooking() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Search for Ajay's transactions
    console.log('🔍 Searching for transactions with customer name "Ajay"...\n');
    
    const ajayTransactions = await Transaction.find({
      customerName: { $regex: /ajay/i }
    }).sort({ date: -1 });

    console.log(`📊 Found ${ajayTransactions.length} transaction(s) for Ajay:\n`);

    if (ajayTransactions.length > 0) {
      ajayTransactions.forEach((tx, index) => {
        console.log(`\n--- Transaction ${index + 1} ---`);
        console.log(`Invoice No: ${tx.invoiceNo}`);
        console.log(`Customer Name: ${tx.customerName}`);
        console.log(`Type/Category: ${tx.type} / ${tx.category}`);
        console.log(`Date: ${tx.date}`);
        console.log(`Location Code: ${tx.locCode}`);
        console.log(`Amount: ${tx.amount}`);
        console.log(`Cash: ${tx.cash}`);
        console.log(`RBL: ${tx.rbl}`);
        console.log(`Bank: ${tx.bank}`);
        console.log(`UPI: ${tx.upi}`);
        console.log(`Bill Value: ${tx.billValue}`);
        console.log(`Security Amount: ${tx.securityAmount}`);
        console.log(`Balance: ${tx.Balance}`);
        console.log(`Total Transaction: ${tx.totalTransaction}`);
        console.log(`Created At: ${tx.createdAt}`);
        console.log(`Updated At: ${tx.updatedAt}`);
        console.log(`_id: ${tx._id}`);
      });
    } else {
      console.log('❌ No transactions found for Ajay in MongoDB');
    }

    // Also check for the specific invoice number from your logs
    console.log('\n\n🔍 Searching for invoice number "202601200140004"...\n');
    
    const invoiceTransaction = await Transaction.findOne({
      invoiceNo: '202601200140004'
    });

    if (invoiceTransaction) {
      console.log('✅ Found transaction with invoice 202601200140004:');
      console.log(JSON.stringify(invoiceTransaction, null, 2));
    } else {
      console.log('❌ No transaction found with invoice 202601200140004 in MongoDB');
      console.log('\n💡 This means the booking data is coming from the external TWS API');
      console.log('   (https://rentalapi.rootments.live/api/GetBooking/GetBookingList)');
      console.log('   but has NOT been synced to your MongoDB database yet.');
    }

    // Check all transactions for locCode 708 in the date range
    console.log('\n\n🔍 Checking all transactions for locCode 708 between 2026-01-19 and 2026-01-25...\n');
    
    const dateTransactions = await Transaction.find({
      locCode: '708',
      date: {
        $gte: new Date('2026-01-19'),
        $lte: new Date('2026-01-25T23:59:59')
      }
    }).sort({ date: -1 });

    console.log(`📊 Found ${dateTransactions.length} transaction(s) for locCode 708 in this date range:\n`);
    
    if (dateTransactions.length > 0) {
      dateTransactions.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.invoiceNo} - ${tx.customerName} - ${tx.type}/${tx.category} - ${tx.date.toISOString().split('T')[0]}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n\n🔌 Disconnected from MongoDB');
  }
}

checkAjayBooking();
