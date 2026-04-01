import mongoose from 'mongoose';
import SalesInvoice from './model/SalesInvoice.js';
import Transaction from './model/Transaction.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rootfin');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkSubcategories = async () => {
  await connectDB();
  
  console.log('\n=== SALES INVOICES SUBCATEGORIES ===');
  const invoices = await SalesInvoice.find({}, { subCategory: 1, category: 1, invoiceNumber: 1 }).limit(10);
  invoices.forEach(invoice => {
    console.log(`Invoice ${invoice.invoiceNumber}: Category="${invoice.category}", SubCategory="${invoice.subCategory}"`);
  });
  
  console.log('\n=== TRANSACTIONS SUBCATEGORIES ===');
  const transactions = await Transaction.find({}, { subCategory: 1, category: 1, invoiceNo: 1 }).limit(10);
  transactions.forEach(transaction => {
    console.log(`Transaction ${transaction.invoiceNo}: Category="${transaction.category}", SubCategory="${transaction.subCategory}"`);
  });
  
  console.log('\n=== UNIQUE SUBCATEGORIES IN INVOICES ===');
  const uniqueInvoiceSubcategories = await SalesInvoice.distinct('subCategory');
  console.log(uniqueInvoiceSubcategories);
  
  console.log('\n=== UNIQUE SUBCATEGORIES IN TRANSACTIONS ===');
  const uniqueTransactionSubcategories = await Transaction.distinct('subCategory');
  console.log(uniqueTransactionSubcategories);
  
  mongoose.disconnect();
};

checkSubcategories().catch(console.error);