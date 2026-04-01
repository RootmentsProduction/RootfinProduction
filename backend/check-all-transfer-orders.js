// Check all recent transfer orders to identify any issues
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TransferOrder from './model/TransferOrder.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check all recent transfer orders
const checkAllTransferOrders = async () => {
  console.log('\n=== CHECKING ALL RECENT TRANSFER ORDERS ===\n');
  
  try {
    // Get all transfer orders from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = await TransferOrder.find({
      createdAt: { $gte: thirtyDaysAgo }
    })
    .sort({ createdAt: -1 })
    .limit(20);
    
    console.log(`Found ${recentOrders.length} transfer orders in the last 30 days:`);
    
    const statusCounts = {};
    const warehousePairs = {};
    
    for (const order of recentOrders) {
      // Count statuses
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      
      // Count warehouse pairs
      const pair = `${order.sourceWarehouse} → ${order.destinationWarehouse}`;
      warehousePairs[pair] = (warehousePairs[pair] || 0) + 1;
      
      console.log(`\n📦 ${order.transferOrderNumber}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   ${order.sourceWarehouse} → ${order.destinationWarehouse}`);
      console.log(`   Date: ${order.date?.toDateString() || 'N/A'}`);
      console.log(`   Created: ${order.createdAt?.toDateString() || 'N/A'}`);
      console.log(`   Items: ${order.items?.length || 0}`);
      
      // Check for potential issues
      if (order.status === 'in_transit') {
        const daysSinceCreated = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24));
        if (daysSinceCreated > 7) {
          console.log(`   ⚠️ WARNING: In transit for ${daysSinceCreated} days - may need attention`);
        }
      }
      
      if (order.status === 'draft') {
        const daysSinceCreated = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24));
        if (daysSinceCreated > 3) {
          console.log(`   ⚠️ WARNING: Draft for ${daysSinceCreated} days - may need to be sent`);
        }
      }
    }
    
    console.log(`\n📊 STATUS SUMMARY:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} orders`);
    });
    
    console.log(`\n🏢 WAREHOUSE PAIRS:`);
    Object.entries(warehousePairs)
      .sort(([,a], [,b]) => b - a)
      .forEach(([pair, count]) => {
        console.log(`   ${pair}: ${count} orders`);
      });
    
    // Check for orders that might need attention
    console.log(`\n🔍 CHECKING FOR ORDERS THAT NEED ATTENTION:`);
    
    const inTransitOrders = await TransferOrder.find({
      status: 'in_transit',
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    const draftOrders = await TransferOrder.find({
      status: 'draft',
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    console.log(`\n📋 IN-TRANSIT ORDERS (${inTransitOrders.length}):`);
    for (const order of inTransitOrders) {
      const daysSinceCreated = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24));
      console.log(`   ${order.transferOrderNumber}: ${order.sourceWarehouse} → ${order.destinationWarehouse} (${daysSinceCreated} days)`);
    }
    
    console.log(`\n📝 DRAFT ORDERS (${draftOrders.length}):`);
    for (const order of draftOrders) {
      const daysSinceCreated = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24));
      console.log(`   ${order.transferOrderNumber}: ${order.sourceWarehouse} → ${order.destinationWarehouse} (${daysSinceCreated} days)`);
    }
    
  } catch (error) {
    console.error('❌ Error checking transfer orders:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkAllTransferOrders();
  
  console.log('\n=== ANALYSIS COMPLETED ===');
  console.log('\n💡 KEY POINTS:');
  console.log('1. "draft" orders: Stock has NOT been moved yet');
  console.log('2. "in_transit" orders: Stock has NOT been moved yet');
  console.log('3. "transferred" orders: Stock HAS been moved');
  console.log('\n🔧 ACTION REQUIRED:');
  console.log('1. Review any long-standing "in_transit" orders');
  console.log('2. Complete transfers by clicking "Receive" button');
  console.log('3. Send draft orders by changing status to "in_transit"');
  
  process.exit(0);
};

main().catch(console.error);