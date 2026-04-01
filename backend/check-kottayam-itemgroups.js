import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function checkKottayamItemGroups() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('admin');
        
        // Check itemgroups collection
        console.log('=== ITEMGROUPS COLLECTION ===\n');
        
        const itemGroupCount = await db.collection('itemgroups').countDocuments();
        console.log(`Total item groups: ${itemGroupCount}`);
        
        if (itemGroupCount > 0) {
            // Get a sample item group to see structure
            const sampleGroup = await db.collection('itemgroups').findOne({});
            console.log('\nSample item group structure:');
            console.log(JSON.stringify(sampleGroup, null, 2));
            
            // Get all item groups and check for stock information
            const allGroups = await db.collection('itemgroups').find({}).toArray();
            
            // Look for Kottayam-related stock locations
            const kottayamVariations = [
                'G.Kottayam',
                'GKottayam', 
                'Kottayam Branch',
                'Kottayam',
                'kottayam'
            ];
            
            console.log('\n=== SEARCHING FOR KOTTAYAM STOCK IN ITEM GROUPS ===\n');
            
            // Collect all stock locations from all groups
            const allStockLocations = new Set();
            
            allGroups.forEach(group => {
                if (group.stock) {
                    Object.keys(group.stock).forEach(location => {
                        allStockLocations.add(location);
                    });
                }
            });
            
            console.log('All stock locations found in item groups:');
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
                
                const groupsWithStock = await db.collection('itemgroups').find({
                    [`stock.${location}`]: { $exists: true, $gt: 0 }
                }).toArray();
                
                console.log(`Found ${groupsWithStock.length} item groups with stock in ${location}`);
                
                // Display stock details
                groupsWithStock.forEach(group => {
                    const stock = group.stock[location] || 0;
                    console.log(`${group.itemCode}: ${stock} units`);
                    
                    // Show additional details if available
                    if (group.itemName) {
                        console.log(`  Name: ${group.itemName}`);
                    }
                    if (group.category) {
                        console.log(`  Category: ${group.category}`);
                    }
                    if (group.brand) {
                        console.log(`  Brand: ${group.brand}`);
                    }
                    console.log('---');
                });
                
                // Calculate total stock for this location
                const totalStock = groupsWithStock.reduce((sum, group) => {
                    return sum + (group.stock[location] || 0);
                }, 0);
                
                console.log(`\nTotal stock in ${location}: ${totalStock} units`);
            }
            
            // If no Kottayam locations found, show some sample stock data
            if (kottayamLocations.length === 0) {
                console.log('\nNo Kottayam locations found. Showing sample stock data:');
                
                const groupsWithAnyStock = allGroups.filter(group => 
                    group.stock && Object.keys(group.stock).length > 0
                ).slice(0, 5);
                
                groupsWithAnyStock.forEach(group => {
                    console.log(`\n${group.itemCode}:`);
                    Object.keys(group.stock).forEach(location => {
                        if (group.stock[location] > 0) {
                            console.log(`  - ${location}: ${group.stock[location]} units`);
                        }
                    });
                });
            }
        }
        
    } catch (error) {
        console.error('Error checking item groups:', error);
    } finally {
        await client.close();
    }
}

checkKottayamItemGroups();