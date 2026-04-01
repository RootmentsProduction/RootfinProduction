import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function checkAllStores() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('shoe_inventory');
        
        // Get all stores
        const stores = await db.collection('stores').find({}).toArray();
        
        console.log('\n=== ALL STORES ===\n');
        stores.forEach(store => {
            console.log(`Name: ${store.name}`);
            console.log(`Store Code: ${store.storeCode}`);
            console.log(`Location: ${store.location || 'N/A'}`);
            console.log(`Address: ${store.address || 'N/A'}`);
            console.log('---');
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkAllStores();