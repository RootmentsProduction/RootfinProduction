import mongoose from 'mongoose';
import ItemGroup from './model/ItemGroup.js';
import { updateStockOnInvoiceCreate } from './utils/stockManagement.js';
import dotenv from 'dotenv';

dotenv.config();

const testStockUpdate = async () => {
  try {
    // Connect to the production database
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_DEV;
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find the TAN LOAFER item group
    console.log('\n=== Finding TAN LOAFER item group ===');
    const tanLoaferGroup = await ItemGroup.findById('696b2e22e65f1480a303eae2');
    
    if (!tanLoaferGroup) {
      console.log('❌ TAN LOAFER group not found');
      process.exit(1);
    }
    
    console.log(`✅ Found group: ${tanLoaferGroup.name}`);
    
    // Find the specific item
    const tanLoaferItem = tanLoaferGroup.items.find(item => 
      item._id?.toString() === '696b2ea8e65f1480a303ebae'
    );
    
    if (!tanLoaferItem) {
      console.log('❌ TAN LOAFER item not found in group');
      console.log('Available items:');
      tanLoaferGroup.items.forEach((item, index) => {
        console.log(`  ${index}: ${item.name} (ID: ${item._id?.toString()})`);
      });
      process.exit(1);
    }
    
    console.log(`✅ Found item: ${tanLoaferItem.name}`);
    
    // Show current stock
    console.log('\n=== Current Stock ===');
    tanLoaferItem.warehouseStocks?.forEach(ws => {
      console.log(`  ${ws.warehouse}: stockOnHand=${ws.stockOnHand}, available=${ws.availableForSale}`);
    });
    
    // Test stock update with a mock invoice line item
    console.log('\n=== Testing Stock Update ===');
    const mockLineItems = [
      {
        item: 'TAN LOAFER 4018 - 6',
        quantity: 1,
        itemData: {
          _id: '696b2ea8e65f1480a303ebae',
          itemGroupId: '696b2e22e65f1480a303eae2',
          itemName: 'TAN LOAFER 4018 - 6',
          name: 'TAN LOAFER 4018 - 6'
        }
      }
    ];
    
    console.log('Mock line items:', JSON.stringify(mockLineItems, null, 2));
    
    // Test with MG Road warehouse
    await updateStockOnInvoiceCreate(mockLineItems, 'MG Road');
    
    // Check stock after update
    console.log('\n=== Stock After Update ===');
    const updatedGroup = await ItemGroup.findById('696b2e22e65f1480a303eae2');
    const updatedItem = updatedGroup.items.find(item => 
      item._id?.toString() === '696b2ea8e65f1480a303ebae'
    );
    
    updatedItem.warehouseStocks?.forEach(ws => {
      console.log(`  ${ws.warehouse}: stockOnHand=${ws.stockOnHand}, available=${ws.availableForSale}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testStockUpdate();