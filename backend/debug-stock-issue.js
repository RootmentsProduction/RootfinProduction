import mongoose from 'mongoose';
import SalesInvoice from './model/SalesInvoice.js';
import ItemGroup from './model/ItemGroup.js';
import Transaction from './model/Transaction.js';
import dotenv from 'dotenv';

dotenv.config();

const debugStockIssue = async () => {
  try {
    // Connect to the production database
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_DEV || 'mongodb://localhost:27017/rootments';
    console.log('Connecting to:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Check database stats
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n=== Database Collections ===');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // Check total counts
    const invoiceCount = await SalesInvoice.countDocuments();
    const itemGroupCount = await ItemGroup.countDocuments();
    const transactionCount = await Transaction.countDocuments();
    
    console.log('\n=== Document Counts ===');
    console.log(`Invoices: ${invoiceCount}`);
    console.log(`Item Groups: ${itemGroupCount}`);
    console.log(`Transactions: ${transactionCount}`);
    
    if (invoiceCount === 0) {
      console.log('\n❌ No invoices found in database!');
      console.log('This suggests either:');
      console.log('1. Wrong database connection');
      console.log('2. Database is empty');
      console.log('3. Collection name mismatch');
      
      // Check if there are any collections with similar names
      const similarCollections = collections.filter(col => 
        col.name.toLowerCase().includes('invoice') || 
        col.name.toLowerCase().includes('sales')
      );
      
      if (similarCollections.length > 0) {
        console.log('\nFound similar collections:');
        similarCollections.forEach(col => console.log(`- ${col.name}`));
      }
      
      process.exit(1);
    }
    
    // Check recent invoices
    console.log('\n=== Recent Invoices ===');
    const recentInvoices = await SalesInvoice.find({}).sort({ createdAt: -1 }).limit(5);
    
    recentInvoices.forEach(inv => {
      console.log(`📄 ${inv.invoiceNumber} | ${inv.warehouse || inv.branch || 'No warehouse'} | ${inv.createdAt} | Items: ${inv.lineItems?.length || 0}`);
    });
    
    // Look for the specific item group
    console.log('\n=== Searching for TAN LOAFER Group ===');
    
    // Try different ways to find the group
    const groupById = await ItemGroup.findById('696b2e22e65f1480a303eae2');
    console.log(`By ID: ${groupById ? '✅ Found' : '❌ Not found'}`);
    
    const groupByName = await ItemGroup.findOne({ name: /TAN LOAFER/i });
    console.log(`By name: ${groupByName ? '✅ Found' : '❌ Not found'}`);
    
    // List some item groups
    const someGroups = await ItemGroup.find({}).limit(5);
    console.log('\n=== Sample Item Groups ===');
    someGroups.forEach(group => {
      console.log(`📁 ${group.name} (ID: ${group._id}) | Items: ${group.items?.length || 0}`);
    });
    
    // Check for any invoices with MG Road
    console.log('\n=== Searching for MG Road Invoices ===');
    const mgRoadInvoices = await SalesInvoice.find({
      $or: [
        { warehouse: { $regex: /mg.*road/i } },
        { branch: { $regex: /mg.*road/i } },
        { warehouse: { $regex: /road/i } },
        { branch: { $regex: /road/i } }
      ]
    }).sort({ createdAt: -1 }).limit(10);
    
    console.log(`Found ${mgRoadInvoices.length} MG Road related invoices`);
    mgRoadInvoices.forEach(inv => {
      console.log(`📄 ${inv.invoiceNumber} | W: "${inv.warehouse}" | B: "${inv.branch}" | ${inv.createdAt}`);
      if (inv.lineItems?.length > 0) {
        inv.lineItems.forEach(item => {
          console.log(`   📦 ${item.item} | Qty: ${item.quantity}`);
        });
      }
    });
    
    // Check recent transactions
    console.log('\n=== Recent Transactions ===');
    const recentTransactions = await Transaction.find({}).sort({ date: -1 }).limit(5);
    recentTransactions.forEach(txn => {
      console.log(`💰 ${txn.invoiceNo} | ${txn.type} | ${txn.amount} | ${txn.date}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

debugStockIssue();