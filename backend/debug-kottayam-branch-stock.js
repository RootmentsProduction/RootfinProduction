import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function analyzeKottayamBranchStock() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('admin');
        
        // Based on warehouse mapping, Kottayam variations include:
        const kottayamVariations = [
            'G.Kottayam',
            'GKottayam', 
            'Kottayam Branch',
            'Kottayam',
            'kottayam'
        ];
        
        console.log('Searching for Kottayam branch with variations:', kottayamVariations);
        
        // First, let's see what collections exist
        const collections = await db.listCollections().toArray();
        console.log('\nAvailable collections:');
        collections.forEach(col => console.log(`- ${col.name}`));
        
        // Check if shoeitems collection exists and get sample data
        try {
            const sampleItems = await db.collection('shoeitems').find({}).limit(5).toArray();
            console.log(`\nFound ${sampleItems.length} sample items in shoeitems collection`);
            
            if (sampleItems.length > 0) {
                console.log('\nSample item structure:');
                const sample = sampleItems[0];
                console.log('Item Code:', sample.itemCode);
                console.log('SKU:', sample.sku);
                console.log('Size:', sample.size);
                console.log('Color:', sample.color);
                
                if (sample.stock) {
                    console.log('Stock locations:');
                    Object.keys(sample.stock).forEach(location => {
                        console.log(`  - ${location}: ${sample.stock[location]}`);
                    });
                }
                
                // Now search for Kottayam stock specifically
                console.log('\n=== SEARCHING FOR KOTTAYAM STOCK ===\n');
                
                // Get all unique stock locations first
                const allItems = await db.collection('shoeitems').find({}).limit(1000).toArray();
                const allStockLocations = new Set();
                
                allItems.forEach(item => {
                    if (item.stock) {
                        Object.keys(item.stock).forEach(location => {
                            allStockLocations.add(location);
                        });
                    }
                });
                
                console.log('All stock locations found:');
                Array.from(allStockLocations).sort().forEach(location => {
                    console.log(`- ${location}`);
                });
                
                // Find Kottayam-related locations
                const kottayamLocations = Array.from(allStockLocations).filter(location => 
                    location.toLowerCase().includes('kottayam') || 
                    kottayamVariations.some(variation => 
                        location.toLowerCase() === variation.toLowerCase()
                    )
                );
                
                console.log('\nKottayam-related locations found:');
                kottayamLocations.forEach(location => {
                    console.log(`- ${location}`);
                });
                
                // Get stock for each Kottayam location
                for (const location of kottayamLocations) {
                    console.log(`\n=== STOCK FOR ${location} ===\n`);
                    
                    const itemsWithStock = await db.collection('shoeitems').find({
                        [`stock.${location}`]: { $exists: true, $gt: 0 }
                    }).toArray();
                    
                    console.log(`Found ${itemsWithStock.length} items with stock in ${location}`);
                    
                    // Group by item code
                    const stockByItemCode = {};
                    itemsWithStock.forEach(item => {
                        const itemCode = item.itemCode;
                        const stock = item.stock[location] || 0;
                        
                        if (!stockByItemCode[itemCode]) {
                            stockByItemCode[itemCode] = {
                                totalStock: 0,
                                variants: []
                            };
                        }
                        
                        stockByItemCode[itemCode].totalStock += stock;
                        stockByItemCode[itemCode].variants.push({
                            sku: item.sku,
                            size: item.size,
                            color: item.color,
                            stock: stock
                        });
                    });
                    
                    // Display stock analysis
                    Object.keys(stockByItemCode).sort().forEach(itemCode => {
                        const analysis = stockByItemCode[itemCode];
                        console.log(`${itemCode}: Total = ${analysis.totalStock}`);
                        
                        analysis.variants.forEach(variant => {
                            console.log(`  - Size ${variant.size}, Color ${variant.color}: ${variant.stock} units`);
                        });
                    });
                }
                
            } else {
                console.log('No items found in shoeitems collection');
            }
            
        } catch (error) {
            console.log('Error accessing shoeitems collection:', error.message);
        }
        
    } catch (error) {
        console.error('Error analyzing Kottayam stock:', error);
    } finally {
        await client.close();
    }
}

analyzeKottayamBranchStock();