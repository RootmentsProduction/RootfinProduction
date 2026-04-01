import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function checkStoresAndData() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('admin');
        
        // Check stores collection
        console.log('=== STORES COLLECTION ===\n');
        const stores = await db.collection('stores').find({}).toArray();
        console.log(`Found ${stores.length} stores:`);
        stores.forEach(store => {
            console.log(`- Name: ${store.name || 'N/A'}`);
            console.log(`  Code: ${store.storeCode || 'N/A'}`);
            console.log(`  Location: ${store.location || 'N/A'}`);
            console.log(`  Address: ${store.address || 'N/A'}`);
            console.log('---');
        });
        
        // Check shoeitems collection count
        console.log('\n=== SHOEITEMS COLLECTION ===\n');
        const itemCount = await db.collection('shoeitems').countDocuments();
        console.log(`Total items in shoeitems: ${itemCount}`);
        
        if (itemCount > 0) {
            // Get a few sample items
            const sampleItems = await db.collection('shoeitems').find({}).limit(3).toArray();
            console.log('\nSample items:');
            sampleItems.forEach((item, index) => {
                console.log(`\nItem ${index + 1}:`);
                console.log(`- Item Code: ${item.itemCode}`);
                console.log(`- SKU: ${item.sku}`);
                console.log(`- Size: ${item.size}`);
                console.log(`- Color: ${item.color}`);
                if (item.stock) {
                    console.log('- Stock:');
                    Object.keys(item.stock).forEach(location => {
                        if (item.stock[location] > 0) {
                            console.log(`  * ${location}: ${item.stock[location]}`);
                        }
                    });
                }
            });
        }
        
        // Check transactions for recent activity
        console.log('\n=== RECENT TRANSACTIONS ===\n');
        const recentTransactions = await db.collection('transactions').find({})
            .sort({ date: -1 })
            .limit(5)
            .toArray();
        
        console.log(`Found ${recentTransactions.length} recent transactions:`);
        recentTransactions.forEach(txn => {
            console.log(`- ${txn.date}: ${txn.type} - ${txn.itemCode} (Store: ${txn.storeCode})`);
        });
        
        // Check transfer orders
        console.log('\n=== RECENT TRANSFER ORDERS ===\n');
        const transferOrders = await db.collection('transferorders').find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();
        
        console.log(`Found ${transferOrders.length} recent transfer orders:`);
        transferOrders.forEach(order => {
            console.log(`- Order #${order.orderNumber}: ${order.fromStore} → ${order.toStore} (${order.status})`);
        });
        
        // Check if there are any items with Kottayam in any field
        console.log('\n=== SEARCHING FOR KOTTAYAM REFERENCES ===\n');
        
        // Search in various collections for Kottayam
        const collections = ['stores', 'transactions', 'transferorders', 'shoeitems'];
        
        for (const collectionName of collections) {
            try {
                const kottayamRefs = await db.collection(collectionName).find({
                    $or: [
                        { name: /kottayam/i },
                        { location: /kottayam/i },
                        { storeCode: /kottayam/i },
                        { fromStore: /kottayam/i },
                        { toStore: /kottayam/i }
                    ]
                }).limit(10).toArray();
                
                if (kottayamRefs.length > 0) {
                    console.log(`Found ${kottayamRefs.length} Kottayam references in ${collectionName}:`);
                    kottayamRefs.forEach(ref => {
                        console.log(`- ${JSON.stringify(ref, null, 2)}`);
                    });
                }
            } catch (error) {
                console.log(`Error searching ${collectionName}:`, error.message);
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkStoresAndData();