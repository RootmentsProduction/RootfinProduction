import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function exploreDatabase() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('admin');
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('\n=== ALL COLLECTIONS ===\n');
        collections.forEach(collection => {
            console.log(`- ${collection.name}`);
        });
        
        // Check if there are any items with stock information
        console.log('\n=== SAMPLE SHOE ITEM ===\n');
        const sampleItem = await db.collection('shoeitems').findOne({});
        if (sampleItem) {
            console.log('Sample item structure:');
            console.log(JSON.stringify(sampleItem, null, 2));
            
            // Check what store codes are used in stock
            if (sampleItem.stock) {
                console.log('\nStore codes found in stock:');
                Object.keys(sampleItem.stock).forEach(storeCode => {
                    console.log(`- ${storeCode}: ${sampleItem.stock[storeCode]}`);
                });
            }
        }
        
        // Get all unique store codes from items
        console.log('\n=== ALL STORE CODES IN ITEMS ===\n');
        const items = await db.collection('shoeitems').find({}).limit(100).toArray();
        const allStoreCodes = new Set();
        
        items.forEach(item => {
            if (item.stock) {
                Object.keys(item.stock).forEach(storeCode => {
                    allStoreCodes.add(storeCode);
                });
            }
        });
        
        console.log('Unique store codes found:');
        Array.from(allStoreCodes).sort().forEach(code => {
            console.log(`- ${code}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

exploreDatabase();