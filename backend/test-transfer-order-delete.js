// Test script to verify transfer order deletion works
// Usage: node test-transfer-order-delete.js <transfer-order-id>

import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import TransferOrder from './model/TransferOrder.js';
import { TransferOrder as TransferOrderPostgres } from './models/sequelize/index.js';

// Load environment variables
dotenv.config();

const testTransferOrderId = process.argv[2];

if (!testTransferOrderId) {
  console.error('❌ Please provide a transfer order ID as argument');
  console.log('Usage: node test-transfer-order-delete.js <transfer-order-id>');
  process.exit(1);
}

async function testDeletion() {
  try {
    console.log('\n🧪 TESTING TRANSFER ORDER DELETION');
    console.log('=====================================\n');
    console.log(`Transfer Order ID: ${testTransferOrderId}\n`);
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');
    
    // Connect to PostgreSQL
    console.log('📡 Connecting to PostgreSQL...');
    const sequelize = new Sequelize(
      process.env.POSTGRES_DATABASE,
      process.env.POSTGRES_USER,
      process.env.POSTGRES_PASSWORD,
      {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT || 5432,
        dialect: 'postgres',
        logging: false,
      }
    );
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected\n');
    
    // Check PostgreSQL
    console.log('🔍 Checking PostgreSQL...');
    const pgOrder = await TransferOrderPostgres.findByPk(testTransferOrderId);
    if (pgOrder) {
      console.log(`✅ Found in PostgreSQL:`);
      console.log(`   Order Number: ${pgOrder.transferOrderNumber}`);
      console.log(`   Status: ${pgOrder.status}`);
      console.log(`   Source: ${pgOrder.sourceWarehouse}`);
      console.log(`   Destination: ${pgOrder.destinationWarehouse}`);
      console.log(`   Items: ${pgOrder.items?.length || 0}`);
      console.log(`   Created: ${pgOrder.createdAt}`);
    } else {
      console.log('❌ Not found in PostgreSQL');
    }
    console.log('');
    
    // Check MongoDB
    console.log('🔍 Checking MongoDB...');
    let mongoOrder = null;
    
    // Try as ObjectId first
    if (mongoose.Types.ObjectId.isValid(testTransferOrderId)) {
      mongoOrder = await TransferOrder.findById(testTransferOrderId);
    }
    
    // If not found, try finding by postgresId
    if (!mongoOrder) {
      mongoOrder = await TransferOrder.findOne({ postgresId: testTransferOrderId });
    }
    
    if (mongoOrder) {
      console.log(`✅ Found in MongoDB:`);
      console.log(`   MongoDB ID: ${mongoOrder._id}`);
      console.log(`   Order Number: ${mongoOrder.transferOrderNumber}`);
      console.log(`   Status: ${mongoOrder.status}`);
      console.log(`   Source: ${mongoOrder.sourceWarehouse}`);
      console.log(`   Destination: ${mongoOrder.destinationWarehouse}`);
      console.log(`   Items: ${mongoOrder.items?.length || 0}`);
      console.log(`   PostgreSQL ID: ${mongoOrder.postgresId || 'N/A'}`);
      console.log(`   Created: ${mongoOrder.createdAt}`);
    } else {
      console.log('❌ Not found in MongoDB');
    }
    console.log('');
    
    // Summary
    console.log('📊 SUMMARY');
    console.log('=====================================');
    if (pgOrder && mongoOrder) {
      console.log('✅ Transfer order exists in BOTH databases');
      console.log('   Deletion will remove from both PostgreSQL and MongoDB');
    } else if (pgOrder) {
      console.log('✅ Transfer order exists in PostgreSQL only');
      console.log('   Deletion will remove from PostgreSQL');
    } else if (mongoOrder) {
      console.log('✅ Transfer order exists in MongoDB only');
      console.log('   Deletion will remove from MongoDB');
    } else {
      console.log('❌ Transfer order NOT FOUND in either database');
      console.log('   Deletion will return 404 error');
    }
    console.log('');
    
    // Stock reversal warning
    if ((pgOrder && pgOrder.status === 'transferred') || (mongoOrder && mongoOrder.status === 'transferred')) {
      console.log('⚠️  WARNING: Status is "transferred"');
      console.log('   Stock will be reversed before deletion:');
      console.log('   - Items will be added back to source warehouse');
      console.log('   - Items will be subtracted from destination warehouse');
      console.log('');
    }
    
    console.log('✅ Test completed successfully\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Close connections
    await mongoose.connection.close();
    process.exit(0);
  }
}

testDeletion();
