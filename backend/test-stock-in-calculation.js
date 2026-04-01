import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function testStockInCalculation() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(process.env.DB_NAME);
        
        // Test for Edapally Branch specifically
        const warehouse = 'Edapally Branch';
        const endDate = new Date('2026-03-02'); // Today
        const startDate = new Date('2026-01-01'); // Start of year
        
        console.log('\n=== TESTING STOCK IN CALCULATION ===');
        console.log(`Warehouse: ${warehouse}`);
        console.log(`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
        
        // Check for inventory adjustments in the period
        const inventoryAdjustments = await db.collection('inventoryadjustments').find({
            warehouse: warehouse,
            createdAt: { 
                $gte: startDate,
                $lte: endDate 
            }
        }).toArray();
        
        console.log(`\n📊 Found ${inventoryAdjustments.length} inventory adjustments:`);
        inventoryAdjustments.forEach(adj => {
            console.log(`- Adjustment ${adj.adjustmentNumber}: ${adj.items?.length || 0} items`);
            adj.items?.forEach(item => {
                const adjustmentQty = parseFloat(item.adjustmentQuantity) || 0;
                if (adjustmentQty > 0) {
                    console.log(`  ➕ ${item.itemName}: +${adjustmentQty} units`);
                } else if (adjustmentQty < 0) {
                    console.log(`  ➖ ${item.itemName}: ${adjustmentQty} units`);
                }
            });
        });
        
        // Check for transfer orders received in the period
        const transferOrdersReceived = await db.collection('transferorders').find({
            toWarehouse: warehouse,
            status: 'completed',
            createdAt: { 
                $gte: startDate,
                $lte: endDate 
            }
        }).toArray();
        
        console.log(`\n🔄 Found ${transferOrdersReceived.length} transfer orders received:`);
        transferOrdersReceived.forEach(to => {
            console.log(`- Transfer ${to.transferOrderNumber}: ${to.items?.length || 0} items from ${to.fromWarehouse}`);
            to.items?.forEach(item => {
                const qty = parseFloat(item.quantity) || 0;
                console.log(`  ➕ ${item.itemName}: +${qty} units`);
            });
        });
        
        // Check for purchase receives in the period
        const purchaseReceives = await db.collection('purchasereceives').find({
            toWarehouse: warehouse,
            status: 'completed',
            createdAt: { 
                $gte: startDate,
                $lte: endDate 
            }
        }).toArray();
        
        console.log(`\n📦 Found ${purchaseReceives.length} purchase receives:`);
        purchaseReceives.forEach(pr => {
            console.log(`- Purchase Receive ${pr.receiveNumber}: ${pr.items?.length || 0} items`);
            pr.items?.forEach(item => {
                const qty = parseFloat(item.receivedQuantity) || parseFloat(item.quantity) || 0;
                console.log(`  ➕ ${item.itemName}: +${qty} units`);
            });
        });
        
        // Calculate total stock in
        let totalStockIn = 0;
        
        // From inventory adjustments (positive only)
        inventoryAdjustments.forEach(adj => {
            adj.items?.forEach(item => {
                const adjustmentQty = parseFloat(item.adjustmentQuantity) || 0;
                if (adjustmentQty > 0) {
                    totalStockIn += adjustmentQty;
                }
            });
        });
        
        // From transfer orders
        transferOrdersReceived.forEach(to => {
            to.items?.forEach(item => {
                const qty = parseFloat(item.quantity) || 0;
                totalStockIn += qty;
            });
        });
        
        // From purchase receives
        purchaseReceives.forEach(pr => {
            pr.items?.forEach(item => {
                const qty = parseFloat(item.receivedQuantity) || parseFloat(item.quantity) || 0;
                totalStockIn += qty;
            });
        });
        
        console.log(`\n📊 TOTAL STOCK IN: ${totalStockIn} units`);
        
        if (totalStockIn === 0) {
            console.log('\n⚠️  No stock movements found. This could be why Stock In shows 0.');
            console.log('   Possible reasons:');
            console.log('   1. No inventory adjustments, transfers, or purchases in the selected period');
            console.log('   2. Warehouse name mismatch (check exact spelling)');
            console.log('   3. Date range issues');
            console.log('   4. Status field not set to "completed"');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

testStockInCalculation();