import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function analyzeKottayamStock() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('shoe_inventory');
        
        // Get Kottayam store info
        const kottayamStore = await db.collection('stores').findOne({ name: /kottayam/i });
        console.log('Kottayam Store:', kottayamStore);
        
        if (!kottayamStore) {
            console.log('Kottayam store not found');
            return;
        }
        
        const storeCode = kottayamStore.storeCode;
        console.log(`\nAnalyzing stock for Kottayam (${storeCode})...\n`);
        
        // Get all items with stock for Kottayam
        const items = await db.collection('shoeitems').find({
            [`stock.${storeCode}`]: { $exists: true, $gt: 0 }
        }).toArray();
        
        console.log(`Found ${items.length} items with stock in Kottayam\n`);
        
        // Group by item code and analyze
        const stockAnalysis = {};
        
        items.forEach(item => {
            const itemCode = item.itemCode;
            const stock = item.stock[storeCode] || 0;
            
            if (!stockAnalysis[itemCode]) {
                stockAnalysis[itemCode] = {
                    totalStock: 0,
                    variants: []
                };
            }
            
            stockAnalysis[itemCode].totalStock += stock;
            stockAnalysis[itemCode].variants.push({
                sku: item.sku,
                size: item.size,
                color: item.color,
                stock: stock,
                _id: item._id
            });
        });
        
        // Display analysis
        console.log('=== KOTTAYAM STOCK ANALYSIS ===\n');
        
        Object.keys(stockAnalysis).sort().forEach(itemCode => {
            const analysis = stockAnalysis[itemCode];
            console.log(`${itemCode}: Total Stock = ${analysis.totalStock}`);
            
            analysis.variants.forEach(variant => {
                console.log(`  - Size ${variant.size}, Color ${variant.color}: ${variant.stock} units (SKU: ${variant.sku})`);
            });
            console.log('');
        });
        
        // Check for any anomalies
        console.log('\n=== ANOMALY CHECK ===\n');
        
        // Check for items with unusually high stock
        const highStockItems = Object.keys(stockAnalysis).filter(itemCode => 
            stockAnalysis[itemCode].totalStock > 10
        );
        
        if (highStockItems.length > 0) {
            console.log('Items with high stock (>10):');
            highStockItems.forEach(itemCode => {
                console.log(`- ${itemCode}: ${stockAnalysis[itemCode].totalStock} units`);
            });
        }
        
        // Check for duplicate SKUs
        const allSkus = [];
        items.forEach(item => {
            if (allSkus.includes(item.sku)) {
                console.log(`DUPLICATE SKU FOUND: ${item.sku}`);
            }
            allSkus.push(item.sku);
        });
        
        // Check recent transactions for Kottayam
        console.log('\n=== RECENT TRANSACTIONS ===\n');
        
        const recentTransactions = await db.collection('transactions').find({
            storeCode: storeCode,
            date: { $gte: new Date('2024-01-01') }
        }).sort({ date: -1 }).limit(10).toArray();
        
        console.log(`Found ${recentTransactions.length} recent transactions:`);
        recentTransactions.forEach(txn => {
            console.log(`- ${txn.date.toISOString().split('T')[0]}: ${txn.type} - ${txn.itemCode} (${txn.quantity} units)`);
        });
        
        // Check transfer orders involving Kottayam
        console.log('\n=== TRANSFER ORDERS ===\n');
        
        const transferOrders = await db.collection('transferorders').find({
            $or: [
                { fromStore: storeCode },
                { toStore: storeCode }
            ],
            createdAt: { $gte: new Date('2024-01-01') }
        }).sort({ createdAt: -1 }).limit(10).toArray();
        
        console.log(`Found ${transferOrders.length} recent transfer orders:`);
        transferOrders.forEach(order => {
            const direction = order.fromStore === storeCode ? 'OUT' : 'IN';
            console.log(`- ${order.createdAt.toISOString().split('T')[0]}: ${direction} - Order #${order.orderNumber} (${order.status})`);
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    console.log(`  * ${item.itemCode}: ${item.quantity} units`);
                });
            }
        });
        
    } catch (error) {
        console.error('Error analyzing Kottayam stock:', error);
    } finally {
        await client.close();
    }
}

analyzeKottayamStock();