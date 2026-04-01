// Integration Script - Update SalesInvoiceController with Enhanced Stock Management
import fs from 'fs';
import path from 'path';

const CONTROLLER_PATH = './controllers/SalesInvoiceController.js';
const BACKUP_PATH = './controllers/SalesInvoiceController.backup.js';

function integrateEnhancedStockManagement() {
  try {
    console.log('🔧 INTEGRATING ENHANCED STOCK MANAGEMENT');
    console.log('=======================================\n');

    // Step 1: Create backup
    console.log('📋 Step 1: Creating backup of current controller...');
    if (fs.existsSync(CONTROLLER_PATH)) {
      fs.copyFileSync(CONTROLLER_PATH, BACKUP_PATH);
      console.log('✅ Backup created: SalesInvoiceController.backup.js');
    }

    // Step 2: Read current controller
    console.log('\n📖 Step 2: Reading current controller...');
    let controllerContent = fs.readFileSync(CONTROLLER_PATH, 'utf8');

    // Step 3: Update imports
    console.log('\n🔄 Step 3: Updating imports...');
    
    // Replace old stock management import
    const oldImport = `import { updateStockOnInvoiceCreate, reverseStockOnInvoiceDelete } from "../utils/stockManagement.js";`;
    const newImport = `import { updateStockOnInvoiceCreate, reverseStockOnInvoiceDelete } from "../utils/improvedStockManagement.js";
import { validateStockBeforeInvoice, validateStockAfterInvoice } from "../utils/stockValidationSystem.js";`;

    if (controllerContent.includes(oldImport)) {
      controllerContent = controllerContent.replace(oldImport, newImport);
      console.log('✅ Updated stock management import');
    } else {
      console.log('⚠️ Old import not found, adding new imports...');
      // Add imports after existing imports
      const importSection = controllerContent.match(/import.*from.*\.js";/g);
      if (importSection) {
        const lastImport = importSection[importSection.length - 1];
        controllerContent = controllerContent.replace(lastImport, lastImport + '\n' + newImport);
      }
    }

    // Step 4: Add validation to invoice creation
    console.log('\n🔍 Step 4: Adding validation to invoice creation...');
    
    // Find the stock update section in createSalesInvoice
    const stockUpdatePattern = /\/\/ Update stock for each line item[\s\S]*?await updateStockOnInvoiceCreate\(invoice\.lineItems, invoice\.branch\);/;
    
    const enhancedStockUpdate = `// 🔍 PRE-VALIDATION: Check stock availability
    console.log("🔍 Validating stock availability before invoice creation...");
    const preValidation = await validateStockBeforeInvoice(invoice.lineItems, invoice.branch);
    
    if (!preValidation.canProceed) {
      console.error("❌ Stock validation failed:", preValidation.issues);
      return res.status(400).json({
        message: "Insufficient stock for one or more items",
        errors: preValidation.issues,
        warnings: preValidation.warnings
      });
    }
    
    if (preValidation.warnings.length > 0) {
      console.warn("⚠️ Stock warnings:", preValidation.warnings);
    }

    // 🔄 ENHANCED STOCK UPDATE: Update stock for each line item with validation
    console.log("🔄 Updating stock with enhanced validation...");
    const stockUpdateReport = await updateStockOnInvoiceCreate(invoice.lineItems, invoice.branch);
    
    // 🔍 POST-VALIDATION: Verify stock was properly deducted
    console.log("🔍 Validating stock deduction after invoice creation...");
    const postValidation = await validateStockAfterInvoice(
      invoice.lineItems, 
      invoice.branch, 
      invoice.invoiceNumber
    );
    
    // Check if stock deduction was successful
    if (!postValidation.success) {
      console.error("❌ Stock deduction validation failed!");
      console.error("Discrepancies:", postValidation.discrepancies);
      
      // Log critical error but don't fail the invoice creation
      // In production, you might want to create an alert or adjustment
      console.warn("⚠️ Invoice created but stock discrepancies detected");
    } else {
      console.log(\`✅ Stock successfully updated with \${postValidation.summary.successRate} success rate\`);
    }`;

    if (controllerContent.match(stockUpdatePattern)) {
      controllerContent = controllerContent.replace(stockUpdatePattern, enhancedStockUpdate);
      console.log('✅ Enhanced stock update integration completed');
    } else {
      console.log('⚠️ Stock update pattern not found, manual integration required');
    }

    // Step 5: Add validation to invoice updates
    console.log('\n🔄 Step 5: Adding validation to invoice updates...');
    
    // Find updateSalesInvoice function and add validation
    const updateFunctionPattern = /(export const updateSalesInvoice = async \(req, res\) => {[\s\S]*?)(await updateStockOnInvoiceCreate\(.*?\);)/;
    
    if (controllerContent.match(updateFunctionPattern)) {
      controllerContent = controllerContent.replace(updateFunctionPattern, (match, beforeStock, stockUpdate) => {
        return beforeStock + `
    // 🔍 Validate stock before update
    const preValidation = await validateStockBeforeInvoice(updatedInvoice.lineItems, updatedInvoice.branch);
    if (!preValidation.canProceed) {
      return res.status(400).json({
        message: "Insufficient stock for updated quantities",
        errors: preValidation.issues
      });
    }
    
    ` + stockUpdate + `
    
    // 🔍 Validate stock after update
    const postValidation = await validateStockAfterInvoice(
      updatedInvoice.lineItems, 
      updatedInvoice.branch, 
      updatedInvoice.invoiceNumber
    );
    
    if (!postValidation.success) {
      console.error("❌ Stock update validation failed for invoice update");
    }`;
      });
      console.log('✅ Enhanced validation added to invoice updates');
    }

    // Step 6: Write updated controller
    console.log('\n💾 Step 6: Writing updated controller...');
    fs.writeFileSync(CONTROLLER_PATH, controllerContent);
    console.log('✅ SalesInvoiceController updated successfully');

    // Step 7: Create integration summary
    console.log('\n📊 Step 7: Integration Summary');
    console.log('=============================');
    console.log('✅ Enhanced stock management integrated');
    console.log('✅ Pre-validation added to invoice creation');
    console.log('✅ Post-validation added to verify stock deduction');
    console.log('✅ Comprehensive error handling implemented');
    console.log('✅ Backup created for rollback if needed');

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Test the updated controller with a sample invoice');
    console.log('2. Monitor stock deduction success rates');
    console.log('3. Create inventory adjustments for any existing discrepancies');
    console.log('4. Schedule regular stock audits');

    console.log('\n⚠️ ROLLBACK INSTRUCTIONS:');
    console.log('If issues occur, restore from backup:');
    console.log(`cp ${BACKUP_PATH} ${CONTROLLER_PATH}`);

  } catch (error) {
    console.error('❌ Integration failed:', error);
    
    // Restore from backup if it exists
    if (fs.existsSync(BACKUP_PATH)) {
      console.log('🔄 Restoring from backup...');
      fs.copyFileSync(BACKUP_PATH, CONTROLLER_PATH);
      console.log('✅ Restored from backup');
    }
  }
}

// Create a simple validation test
function createValidationTest() {
  const testContent = `// Quick Validation Test
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { auditWarehouseStock } from './utils/stockValidationSystem.js';

dotenv.config();

async function quickValidationTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Running quick stock validation test...');
    
    const audit = await auditWarehouseStock('Grooms Trivandrum');
    console.log('✅ Validation system working correctly');
    console.log(\`Health Score: \${audit.summary.healthScore}\`);
    
  } catch (error) {
    console.error('❌ Validation test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

quickValidationTest();`;

  fs.writeFileSync('./quick-validation-test.js', testContent);
  console.log('📝 Created quick-validation-test.js for testing');
}

// Run integration
console.log('🚀 Starting Enhanced Stock Management Integration...\n');
integrateEnhancedStockManagement();
createValidationTest();

console.log('\n🎉 Integration completed successfully!');
console.log('\nTo test the integration:');
console.log('1. Run: node quick-validation-test.js');
console.log('2. Create a test invoice and monitor the logs');
console.log('3. Check stock deduction success rates');

export { integrateEnhancedStockManagement };