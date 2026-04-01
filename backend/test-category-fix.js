import mongoose from 'mongoose';
import SalesInvoice from './model/SalesInvoice.js';
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

const testCategoryFix = async () => {
  await connectDB();
  
  console.log('\n=== TESTING CATEGORY AND REMARK FIX ===');
  
  // Test data with proper category, subcategory, and remark
  const testInvoiceData = {
    invoiceNumber: 'TEST-001',
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    customer: 'Test Customer',
    customerPhone: '1234567890',
    category: 'Sales', // This should appear in transaction
    subCategory: 'shoe sale', // This should appear in transaction
    remark: 'Custom remark for shoe sale', // This should appear in transaction
    paymentMethod: 'Cash',
    finalTotal: 1000,
    userId: 'test-user',
    lineItems: [
      {
        item: 'Test Shoe',
        quantity: 1,
        rate: 1000,
        amount: 1000
      }
    ]
  };
  
  try {
    // Import the controller function
    const { createSalesInvoice } = await import('./controllers/SalesInvoiceController.js');
    
    // Mock request and response objects
    const req = { body: testInvoiceData };
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log(`Response ${code}:`, data);
          return data;
        }
      })
    };
    
    // Call the controller function
    await createSalesInvoice(req, res);
    
    // Find the created invoice
    const invoice = await SalesInvoice.findOne({ invoiceNumber: testInvoiceData.invoiceNumber });
    if (invoice) {
      console.log('✅ Test invoice created:', invoice.invoiceNumber);
      console.log('   Category:', invoice.category);
      console.log('   SubCategory:', invoice.subCategory);
      console.log('   Remark:', invoice.remark);
    }
    
    // Check if transaction was created
    const transaction = await Transaction.findOne({ invoiceNo: invoice.invoiceNumber });
    if (transaction) {
      console.log('✅ Transaction found:');
      console.log('   Category:', transaction.category);
      console.log('   SubCategory:', transaction.subCategory);
      console.log('   Remark:', transaction.remark);
      
      // Verify the fix
      if (transaction.category === 'Sales' && 
          transaction.subCategory === 'shoe sale' && 
          transaction.remark === 'Custom remark for shoe sale') {
        console.log('🎉 FIX VERIFIED: Categories and remark are correct!');
      } else {
        console.log('❌ FIX FAILED: Categories or remark are incorrect');
        console.log('Expected: Category=Sales, SubCategory=shoe sale, Remark=Custom remark for shoe sale');
        console.log(`Got: Category=${transaction.category}, SubCategory=${transaction.subCategory}, Remark=${transaction.remark}`);
      }
    } else {
      console.log('❌ No transaction found for invoice');
    }
    
    // Clean up test data
    await SalesInvoice.deleteOne({ invoiceNumber: 'TEST-001' });
    await Transaction.deleteOne({ invoiceNo: 'TEST-001' });
    console.log('🧹 Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await mongoose.disconnect();
  console.log('✅ Database disconnected');
};

testCategoryFix().catch(console.error);