import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function checkEdapallyWarehouseNames() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(process.env.DB_NAME);
        
        console.log('\n=== CHECKING EDAPALLY WAREHOUSE NAMES ===');
        
        // Check all unique warehouse names in different collections
        console.log('\n1. Transfer Orders - Warehouse Names:');
        const transferWarehouses = await db.collection('transferorders').distinct('toWarehouse');
        transferWarehouses.forEach(wh => {
            if (wh && wh.toLowerCase().includes('edapally')) {
                console.log(`  ✅ "${wh}"`);
            } else if (wh) {
                console.log(`  - "${wh}"`);
            }
        });
        
        console.log('\n2. Purchase Receives - Warehouse Names:');
        const purchaseWarehouses = await db.collection('purchasereceives').distinct('toWarehouse');
        purchaseWarehouses.forEach(wh => {
            if (wh && wh.toLowerCase().includes('edapally')) {
                console.log(`  ✅ "${wh}"`);
            } else if (wh) {
                console.log(`  - "${wh}"`);
            }
        });
        
        console.log('\n3. Inventory Adjustments - Warehouse Names:');
        const adjustmentWarehouses = await db.collection('inventoryadjustments').distinct('warehouse');
        adjustmentWarehouses.forEach(wh => {
            if (wh && wh.toLowerCase().includes('edapally')) {
                console.log(`  ✅ "${wh}"`);
            } else if (wh) {
                console.log(`  - "${wh}"`);
            }
        });
        
        console.log('\n4. Item Groups - Warehouse Stock Names:');
        const itemGroups = await db.collection('itemgroups').find({}).toArray();
        const warehouseStockNames = new Set();
        
        itemGroups.forEach(group => {
            if (group.items && Array.isArray(group.items)) {
                group.items.forEach(item => {
                    if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
                        item.warehouseStocks.forEach(ws => {
                            if (ws.warehouse) {
                                warehouseStockNames.add(ws.warehouse);
                            }
                        });
                    }
                });
            }
        });
        
        Array.from(warehouseStockNames).sort().forEach(wh => {
            if (wh.toLowerCase().includes('edapally')) {
                console.log(`  ✅ "${wh}"`);
            } else {
                console.log(`  - "${wh}"`);
            }
        });
        
        // Check for any records that might have Edapally-related data
        console.log('\n5. Looking for Edapally-related records:');
        
        const edapallyTransfers = await db.collection('transferorders').find({
            $or: [
                { toWarehouse: { $regex: /edapally/i } },
                { fromWarehouse: { $regex: /edapally/i } },
                { sourceWarehouse: { $regex: /edapally/i } },
                { destinationWarehouse: { $regex: /edapally/i } }
            ]
        }).toArray();
        
        console.log(`  Transfer orders with Edapally: ${edapallyTransfers.length}`);
        edapallyTransfers.forEach(to => {
            console.log(`    ${to.transferOrderNumber}: ${to.fromWarehouse || to.sourceWarehouse} → ${to.toWarehouse || to.destinationWarehouse}`);
        });
        
        const edapallyPurchases = await db.collection('purchasereceives').find({
            toWarehouse: { $regex: /edapally/i }
        }).toArray();
        
        console.log(`  Purchase receives to Edapally: ${edapallyPurchases.length}`);
        edapallyPurchases.forEach(pr => {
            console.log(`    ${pr.receiveNumber}: → ${pr.toWarehouse}`);
        });
        
        const edapallyAdjustments = await db.collection('inventoryadjustments').find({
            warehouse: { $regex: /edapally/i }
        }).toArray();
        
        console.log(`  Inventory adjustments for Edapally: ${edapallyAdjustments.length}`);
        edapallyAdjustments.forEach(adj => {
            console.log(`    ${adj.adjustmentNumber || adj._id}: ${adj.warehouse}`);
        });
        
        // Check what the current stock shows for Edapally
        console.log('\n6. Current Stock in Item Groups for Edapally:');
        let totalEdapallyStock = 0;
        let itemsWithEdapallyStock = 0;
        
        itemGroups.forEach(group => {
            if (group.items && Array.isArray(group.items)) {
                group.items.forEach(item => {
                    if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
                        const edapallyStock = item.warehouseStocks.find(ws => 
                            ws.warehouse && ws.warehouse.toLowerCase().includes('edapally')
                        );
                        if (edapallyStock && edapallyStock.stockOnHand > 0) {
                            totalEdapallyStock += edapallyStock.stockOnHand;
                            itemsWithEdapallyStock++;
                            console.log(`    ${item.name}: ${edapallyStock.stockOnHand} units in "${edapallyStock.warehouse}"`);
                        }
                    }
                });
            }
        });
        
        console.log(`\n📊 Summary:`);
        console.log(`  Total Edapally stock: ${totalEdapallyStock} units`);
        console.log(`  Items with Edapally stock: ${itemsWithEdapallyStock}`);
        
        if (totalEdapallyStock > 0 && edapallyTransfers.length === 0 && edapallyPurchases.length === 0 && edapallyAdjustments.length === 0) {
            console.log(`\n⚠️  ISSUE FOUND:`);
            console.log(`  - Current stock exists (${totalEdapallyStock} units)`);
            console.log(`  - But no stock movements recorded`);
            console.log(`  - This suggests stock was added directly to warehouseStocks`);
            console.log(`  - Without corresponding transaction records`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkEdapallyWarehouseNames();