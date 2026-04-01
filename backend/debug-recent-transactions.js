import mongoose from 'mongoose';
import Transaction from './model/Transaction.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI_DEV || process.env.MONGODB_URI;
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

const debugRecentTransactions = async () => {
  await connectDB();
  
  console.log('\n=== RECENT TRANSACTIONS DEBUG ===');
  
  try {
    // Get the 5 most recent transactions
    const recentTransactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('invoiceNo category subCategory remark createdAt');
    
    console.log(`Found ${recentTransactions.length} recent transactions:`);
    
    recentTransactions.forEach((transaction, index) => {
      console.log(`\n${index + 1}. Transaction ${transaction.invoiceNo}:`);
      console.log(`   Category: "${transaction.category}"`);
      console.log(`   SubCategory: "${transaction.subCategory}"`);
      console.log(`   Remark: "${transaction.remark}"`);
      console.log(`   Created: ${transaction.createdAt}`);
    });
    
    // Check for any transactions with "booking" category
    const bookingTransactions = await Transaction.find({ 
      $or: [
        { category: "booking" },
        { subCategory: "booking" }
      ]
    }).sort({ createdAt: -1 }).limit(3);
    
    console.log(`\n=== BOOKING TRANSACTIONS ===`);
    console.log(`Found ${bookingTransactions.length} transactions with "booking":`);
    
    bookingTransactions.forEach((transaction, index) => {
      console.log(`\n${index + 1}. Transaction ${transaction.invoiceNo}:`);
      console.log(`   Category: "${transaction.category}"`);
      console.log(`   SubCategory: "${transaction.subCategory}"`);
      console.log(`   Remark: "${transaction.remark}"`);
      console.log(`   Created: ${transaction.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error fetching transactions:', error.message);
  }
  
  await mongoose.disconnect();
  console.log('\n✅ Database disconnected');
};

debugRecentTransactions().catch(console.error);