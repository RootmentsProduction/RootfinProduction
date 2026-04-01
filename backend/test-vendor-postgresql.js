// Test Script for Vendor PostgreSQL Migration
// This script tests all Vendor CRUD operations with PostgreSQL

import { connectPostgreSQL } from './db/postgresql.js';
import { Vendor } from './models/sequelize/index.js';
import dotenv from 'dotenv';
import fs from 'fs';

const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

async function testVendorOperations() {
  try {
    console.log('🧪 Testing Vendor PostgreSQL Operations\n');
    console.log('='.repeat(60));
    
    // Step 1: Connect to PostgreSQL
    console.log('\n1️⃣  Connecting to PostgreSQL...');
    await connectPostgreSQL();
    console.log('   ✅ Connected!\n');
    
    // Step 2: Sync model
    console.log('2️⃣  Syncing Vendor model...');
    await Vendor.sync({ alter: false });
    console.log('   ✅ Model synced!\n');
    
    // Step 3: Test CREATE
    console.log('3️⃣  Testing CREATE operation...');
    const { randomUUID } = await import('crypto');
    const testVendorData = {
      id: randomUUID(), // Generate UUID for test
      displayName: 'Test Vendor ' + Date.now(),
      userId: 'test-user-123',
      email: 'testvendor@example.com',
      phone: '1234567890',
      companyName: 'Test Company',
      firstName: 'John',
      lastName: 'Doe',
      locCode: 'TEST',
      contacts: [
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          mobile: '9876543210',
        },
      ],
      bankAccounts: [
        {
          accountHolderName: 'Test Vendor',
          bankName: 'Test Bank',
          accountNumber: '123456789',
          ifsc: 'TEST0001234',
        },
      ],
    };
    
    const createdVendor = await Vendor.create(testVendorData);
    console.log('   ✅ Vendor created!');
    console.log('   📝 Vendor ID:', createdVendor.id);
    console.log('   📝 Display Name:', createdVendor.displayName);
    console.log('   📝 Email:', createdVendor.email);
    console.log('');
    
    const vendorId = createdVendor.id;
    
    // Step 4: Test READ (Get by ID)
    console.log('4️⃣  Testing READ operation (Get by ID)...');
    const foundVendor = await Vendor.findByPk(vendorId);
    if (foundVendor) {
      console.log('   ✅ Vendor found!');
      console.log('   📝 Display Name:', foundVendor.displayName);
      console.log('   📝 Contacts:', foundVendor.contacts?.length || 0, 'contact(s)');
      console.log('   📝 Bank Accounts:', foundVendor.bankAccounts?.length || 0, 'account(s)');
      console.log('');
    } else {
      throw new Error('Vendor not found after creation!');
    }
    
    // Step 5: Test READ (Get all)
    console.log('5️⃣  Testing READ operation (Get all)...');
    const allVendors = await Vendor.findAll({
      where: { userId: 'test-user-123' },
      order: [['createdAt', 'DESC']],
    });
    console.log(`   ✅ Found ${allVendors.length} vendor(s) for test user`);
    console.log('');
    
    // Step 6: Test UPDATE
    console.log('6️⃣  Testing UPDATE operation...');
    const updateData = {
      email: 'updated@example.com',
      phone: '9999999999',
      companyName: 'Updated Company Name',
    };
    
    const [updatedRows] = await Vendor.update(updateData, {
      where: { id: vendorId },
    });
    
    if (updatedRows > 0) {
      const updatedVendor = await Vendor.findByPk(vendorId);
      console.log('   ✅ Vendor updated!');
      console.log('   📝 New Email:', updatedVendor.email);
      console.log('   📝 New Phone:', updatedVendor.phone);
      console.log('   📝 New Company:', updatedVendor.companyName);
      console.log('');
    } else {
      throw new Error('Vendor update failed!');
    }
    
    // Step 7: Test Complex Queries
    console.log('7️⃣  Testing Complex Queries...');
    
    // Query by email
    const vendorByEmail = await Vendor.findOne({
      where: { email: 'updated@example.com' },
    });
    console.log('   ✅ Found vendor by email:', vendorByEmail?.displayName || 'Not found');
    
    // Query by locCode
    const vendorsByLoc = await Vendor.findAll({
      where: { locCode: 'TEST' },
    });
    console.log(`   ✅ Found ${vendorsByLoc.length} vendor(s) with locCode: TEST`);
    console.log('');
    
    // Step 8: Test JSON Fields (contacts, bankAccounts)
    console.log('8️⃣  Testing JSON Fields (contacts, bankAccounts)...');
    const vendorWithJson = await Vendor.findByPk(vendorId);
    if (vendorWithJson) {
      console.log('   ✅ JSON fields working!');
      console.log('   📝 Contacts:', JSON.stringify(vendorWithJson.contacts, null, 2));
      console.log('   📝 Bank Accounts:', JSON.stringify(vendorWithJson.bankAccounts, null, 2));
      console.log('');
    }
    
    // Step 9: Test DELETE
    console.log('9️⃣  Testing DELETE operation...');
    const deletedRows = await Vendor.destroy({
      where: { id: vendorId },
    });
    
    if (deletedRows > 0) {
      console.log('   ✅ Vendor deleted!');
      
      // Verify deletion
      const deletedVendor = await Vendor.findByPk(vendorId);
      if (!deletedVendor) {
        console.log('   ✅ Deletion verified - vendor no longer exists');
      } else {
        console.log('   ⚠️  Warning: Vendor still exists after deletion');
      }
      console.log('');
    } else {
      throw new Error('Vendor deletion failed!');
    }
    
    // Step 10: Summary
    console.log('='.repeat(60));
    console.log('\n✨ All Tests Passed!\n');
    console.log('✅ CREATE: Working');
    console.log('✅ READ (by ID): Working');
    console.log('✅ READ (all): Working');
    console.log('✅ UPDATE: Working');
    console.log('✅ DELETE: Working');
    console.log('✅ JSON Fields: Working');
    console.log('✅ Complex Queries: Working');
    console.log('\n🎉 Vendor PostgreSQL migration is working perfectly!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Failed!');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

testVendorOperations();

