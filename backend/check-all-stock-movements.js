import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function checkAllStockMovements() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(process.env.DB_NAME);
        
        console.log('\n=== CHECKING ALL STOCK MOVEMENTS ===');
        
        // Check all inventory adjustments
        const allAdjustments = await db.collection('inventoryadjustments').find({}).sort({ createdAt: -1 }).limit(10).toArray();
        console.log(`\n📊 Recent Inventory Adjustments (${allAdjustments.length}):`);
        allAdjustments.forEach(adj => {
            console.log(`- ${adj.adjustmentNumber || adj._id}: ${adj.warehouse} (${new Date(adj.createdAt).toLocaleDateString()})`);
            console.log(`  Items: ${adj.items?.length || 0}`);
            if (adj.items?.length > 0) {
                adj.items.slice(0, 3).forEach(item => {
                    const adjustmentQty = parseFloat(item.adjustmentQuantity) || 0;
                    console.log(`    ${item.itemName}: ${adjustmentQty > 0 ? '+' : ''}${adjustmentQty}`);
                });
            }
        });
        
        // Check all transfer orders
        const allTransfers = await db.collection('transferorders').find({}).sort({ createdAt: -1 }).limit(10).toArray();
        console.log(`\n🔄 Recent Transfer Orders (${allTransfers.length}):`);
        allTransfers.forEach(to => {
            console.log(`- ${to.transferOrderNumber || to._id}: ${to.fromWarehouse} → ${to.toWarehouse} (${new Date(to.createdAt).toLocaleDateString()})`);
            console.log(`  Status: ${to.status}, Items: ${to.items?.length || 0}`);
        });
        
        // Check all purchase receives
        const allPurchases = await db.collection('purchasereceives').find({}).sort({ createdAt: -1 }).limit(10).toArray();
        console.log(`\n📦 Recent Purchase Receives (${allPurchases.length}):`);
        allPurchases.forEach(pr => {
            console.log(`- ${pr.receiveNumber || pr._id}: → ${pr.toWarehouse} (${new Date(pr.createdAt).toLocaleDateString()})`);
            console.log(`  Status: ${pr.status}, Items: ${pr.items?.length || 0}`);
        });
        
        // Check for Edapally variations
        console.log('\n🔍 Checking for Edapally warehouse name variations:');
        
        const edapallyAdjustments = await db.collection('inventoryadjustments').find({
            warehouse: { $regex: /edapally/i }
        }).toArray();
        console.log(`Inventory adjustments with "edapally": ${edapallyAdjustments.length}`);
        
        const edapallyTransfers = await db.collection('transferorders').find({
            $or: [
                { toWarehouse: { $regex: /edapally/i } },
                { fromWarehouse: { $regex: /edapally/i } }
            ]
        }).toArray();
        console.log(`Transfer orders with "edapally": ${edapallyTransfers.length}`);
        
        const edapallyPurchases = await db.collection('purchasereceives').find({
            toWarehouse: { $regex: /edapally/i }
        }).toArray();
        console.log(`Purchase receives with "edapally": ${edapallyPurchases.length}`);
        
        // Show unique warehouse names
        const uniqueWarehouses = new Set();
        
        allAdjustments.forEach(adj => {
            if (adj.warehouse) uniqueWarehouses.add(adj.warehouse);
        });
        
        allTransfers.forEach(to => {
            if (to.toWarehouse) uniqueWarehouses.add(to.toWarehouse);
            if (to.fromWarehouse) uniqueWarehouses.add(to.fromWarehouse);
        });
        
        allPurchases.forEach(pr => {
            if (pr.toWarehouse) uniqueWarehouses.add(pr.toWarehouse);
        });
        
        console.log('\n🏪 Unique warehouse names found:');
        Array.from(uniqueWarehouses).sort().forEach(warehouse => {
            console.log(`- "${warehouse}"`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkAllStockMovements();