import mongoose from 'mongoose';
import User from './model/UserModel.js';
import Transaction from './model/Transaction.js';
import SalesInvoice from './model/SalesInvoice.js';
import dotenv from 'dotenv';

dotenv.config();

const debugMGRoadUserLocCode = async () => {
  try {
    // Connect to the production database
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_DEV;
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find MG Road users
    console.log('\n=== MG Road Users ===');
    const mgRoadUsers = await User.find({
      $or: [
        { username: /mg.*road/i },
        { locCode: '729' },
        { locCode: '718' }
      ]
    });
    
    console.log(`Found ${mgRoadUsers.length} MG Road related users:`);
    mgRoadUsers.forEach(user => {
      console.log(`👤 ${user.username} | Email: ${user.email} | LocCode: ${user.locCode} | Power: ${user.power}`);
    });
    
    // Check recent transactions with location code 729
    console.log('\n=== Recent Transactions with LocCode 729 ===');
    const recentTransactions729 = await Transaction.find({ locCode: '729' })
      .sort({ date: -1 })
      .limit(5);
    
    console.log(`Found ${recentTransactions729.length} transactions with locCode 729:`);
    recentTransactions729.forEach(txn => {
      console.log(`💰 ${txn.invoiceNo} | ${txn.type} | ${txn.amount} | ${txn.date} | LocCode: ${txn.locCode}`);
    });
    
    // Check recent transactions with location code 718 (old code)
    console.log('\n=== Recent Transactions with LocCode 718 (old) ===');
    const recentTransactions718 = await Transaction.find({ locCode: '718' })
      .sort({ date: -1 })
      .limit(5);
    
    console.log(`Found ${recentTransactions718.length} transactions with locCode 718:`);
    recentTransactions718.forEach(txn => {
      console.log(`💰 ${txn.invoiceNo} | ${txn.type} | ${txn.amount} | ${txn.date} | LocCode: ${txn.locCode}`);
    });
    
    // Check recent invoices for MG Road
    console.log('\n=== Recent MG Road Invoices ===');
    const mgRoadInvoices = await SalesInvoice.find({
      $or: [
        { branch: /mg.*road/i },
        { warehouse: /mg.*road/i },
        { locCode: '729' },
        { locCode: '718' }
      ]
    }).sort({ createdAt: -1 }).limit(5);
    
    console.log(`Found ${mgRoadInvoices.length} MG Road invoices:`);
    mgRoadInvoices.forEach(inv => {
      console.log(`📄 ${inv.invoiceNumber} | Branch: "${inv.branch}" | Warehouse: "${inv.warehouse}" | LocCode: "${inv.locCode}" | Date: ${inv.createdAt}`);
    });
    
    // Check if there are any transactions today for location code 729
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    console.log('\n=== Today\'s Transactions for LocCode 729 ===');
    const todayTransactions = await Transaction.find({
      locCode: '729',
      date: { $gte: todayStart, $lte: todayEnd }
    });
    
    console.log(`Found ${todayTransactions.length} transactions today for locCode 729:`);
    todayTransactions.forEach(txn => {
      console.log(`💰 ${txn.invoiceNo} | ${txn.type} | ${txn.amount} | ${txn.customerName || 'N/A'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

debugMGRoadUserLocCode();