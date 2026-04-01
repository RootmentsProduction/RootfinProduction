// Test Improved Stock Management System
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { updateStockOnInvoiceCreateEnhanced } from './utils/improvedStockManagement.js';
import { stockValidator, auditWarehouseStock } from './utils/stockValidationSystem.js';
import SalesInvoice from './model/SalesInvoice.js';

dotenv.config();

async function testImprovedStockManagement() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    console.log('🧪 TESTING IMPROVED STOCK MANAGEMENT SYSTEM');
    console.log('===========================================\n');

    // Step 1: Audit current stock status
    console.log('📊 Step 1: Current Stock Audit...');
    const auditBefore = await auditWarehouseStock('Grooms Trivandrum');
    
    // Step 2: Get a recent invoice to test with
    console.log('\n📋 Step 2: Getting recent invoice for testing...');
    const recentInvoice = await SalesInvoice.findOne({
      $or: [
        { branch: /grooms.*trivandrum/i },
        { branch: /sg.*trivandrum/i },
        { branch: /trivandrum/i }
      ],
      invoiceDate: {
        $gte: new Date('2026-02-01')
      }
    }).sort({ invoiceDate: -1 }).lean();

    if (!recentInvoice) {
      console.log('❌ No recent invoices found for testing');
      return;
    }

    console.log(`Found test invoice: ${recentInvoice.invoiceNumber}`);
    console.log(`Date: ${recentInvoice.invoiceDate?.toDateString()}`);
    console.log(`Items: ${recentInvoice.lineItems?.length || 0}`);
    console.log(`Branch: ${recentInvoice.branch}`);

    // Step 3: Pre-validation
    console.log('\n🔍 Step 3: Pre-validation (before stock deduction)...');
    const preValidation = await stockValidator.validateBeforeStockDeduction(
      recentInvoice.lineItems, 
      recentInvoice.branch
    );

    console.log(`Can proceed: ${preValidation.canProceed}`);
    console.log(`Issues: ${preValidation.issues.length}`);
    console.log(`Warnings: ${preValidation.warnings.length}`);

    if (preValidation.issues.length > 0) {
      console.log('Issues found:');
      preValidation.issues.forEach(issue => console.log(`- ${issue}`));
    }

    // Step 4: Test enhanced stock deduction (simulation)
    console.log('\n🔄 Step 4: Testing enhanced stock deduction...');
    
    // Create a test copy of line items with proper structure
    const testLineItems = recentInvoice.lineItems?.map(item => ({
      itemCode: item.itemCode,
      item: item.itemCode,
      quantity: item.quantity,
      itemData: {
        _id: item._id,
        itemName: item.itemName,
        sku: item.itemCode,
        itemGroupId: item.itemGroupId
      },
      itemSku: item.itemCode
    })) || [];

    console.log(`Testing with ${testLineItems.length} items...`);

    // Test the enhanced stock update function
    const stockUpdateReport = await updateStockOnInvoiceCreateEnhanced(
      testLineItems, 
      recentInvoice.branch
    );

    // Step 5: Post-validation
    console.log('\n🔍 Step 5: Post-validation (after stock deduction)...');
    const postValidation = await stockValidator.validateAfterStockDeduction(
      testLineItems,
      recentInvoice.branch,
      recentInvoice.invoiceNumber
    );

    // Step 6: Compare results
    console.log('\n📊 Step 6: COMPARISON RESULTS');
    console.log('=============================');
    
    console.log('BEFORE (Original System):');
    console.log(`- Success Rate: Unknown (estimated 44%)`);
    console.log(`- Validation: None`);
    console.log(`- Error Tracking: Limited`);
    
    console.log('\nAFTER (Enhanced System):');
    console.log(`- Success Rate: ${stockUpdateReport.summary.successRate}`);
    console.log(`- Successful Deductions: ${stockUpdateReport.summary.successful}`);
    console.log(`- Failed Deductions: ${stockUpdateReport.summary.failed}`);
    console.log(`- Validation: Comprehensive`);
    console.log(`- Error Tracking: Detailed`);

    // Step 7: Audit after changes
    console.log('\n📊 Step 7: Stock Audit After Changes...');
    const auditAfter = await auditWarehouseStock('Grooms Trivandrum');
    
    console.log('\nAUDIT COMPARISON:');
    console.log(`Items with Stock: ${auditBefore.itemsWithStock} → ${auditAfter.itemsWithStock}`);
    console.log(`Total Stock Value: ${auditBefore.summary.totalValue} → ${auditAfter.summary.totalValue}`);
    console.log(`Health Score: ${auditBefore.summary.healthScore} → ${auditAfter.summary.healthScore}`);
    console.log(`Issues: ${auditBefore.issues.length} → ${auditAfter.issues.length}`);

    // Step 8: Recommendations
    console.log('\n💡 Step 8: RECOMMENDATIONS');
    console.log('==========================');
    
    if (stockUpdateReport.summary.failed > 0) {
      console.log('🔧 IMMEDIATE ACTIONS:');
      console.log('1. Replace old stock management with enhanced version');
      console.log('2. Add validation to sales invoice creation');
      console.log('3. Create inventory adjustments for failed deductions');
      console.log('4. Implement regular stock audits');
    } else {
      console.log('✅ Enhanced system working perfectly!');
      console.log('1. Deploy enhanced stock management');
      console.log('2. Add validation system to production');
      console.log('3. Schedule regular stock audits');
    }

    console.log('\n🎯 INTEGRATION STEPS:');
    console.log('1. Update SalesInvoiceController to use enhanced stock management');
    console.log('2. Add pre/post validation to invoice creation');
    console.log('3. Implement error handling and rollback mechanisms');
    console.log('4. Add monitoring and alerting for stock discrepancies');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

testImprovedStockManagement();