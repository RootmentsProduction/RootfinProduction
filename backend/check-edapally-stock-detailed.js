import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function checkEdapallyStockDetailed() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(process.env.DB_NAME);
        
        console.log('\n=== DETAILED EDAPALLY STOCK CHECK ===');
        
        // Check all possible Edapally variations
        const edapallyVariations = [
            'Edapally Branch',
            'G-Edappally', 
            'Edappally Branch',
            'G.Edappally',
            'Edapally',
            'Edappally'
        ];
        
        console.log('\n1. Checking all Edapally variations in Item Groups:');
        
        const itemGroups = await db.collection('itemgroups').find({}).toArray();
        let totalStockByWarehouse = {};
        
        itemGroups.forEach(group => {
            if (group.items && Array.isArray(group.items)) {
                group.items.forEach(item => {
                    if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
                        item.warehouseStocks.forEach(ws => {
                            if (ws.warehouse) {
                                const warehouseName = ws.warehouse;
                                const stockOnHand = ws.stockOnHand || 0;
                                
                                if (!totalStockByWarehouse[warehouseName]) {
                                    totalStockByWarehouse[warehouseName] = 0;
                                }
                                totalStockByWarehouse[warehouseName] += stockOnHand;
                                
                                // Check if this matches any Edapally variation
                                const isEdapally = edapallyVariations.some(variation => 
                                    warehouseName.toLowerCase().includes(variation.toLowerCase()) ||
                                    variation.toLowerCase().includes(warehouseName.toLowerCase())
                                );
                                
                                if (isEdapally && stockOnHand > 0) {
                                    console.log(`  ✅ Found stock: ${item.name} - ${stockOnHand} units in "${warehouseName}"`);
                                }
                            }
                        });
                    }
                });
            }
        });
        
        console.log('\n2. Stock Summary by Warehouse:');
        Object.entries(totalStockByWarehouse)
            .filter(([warehouse, stock]) => stock > 0)
            .sort(([,a], [,b]) => b - a)
            .forEach(([warehouse, stock]) => {
                const isEdapally = edapallyVariations.some(variation => 
                    warehouse.toLowerCase().includes(variation.toLowerCase()) ||
                    variation.toLowerCase().includes(warehouse.toLowerCase())
                );
                console.log(`  ${isEdapally ? '✅' : '  '} ${warehouse}: ${stock} units`);
            });
        
        // Check the specific warehouse name from our earlier test
        console.log('\n3. Checking specific warehouse names from earlier test:');
        
        const testWarehouses = ['Edapally Branch', 'G-Edappally', 'Edappally', 'G.Edappally'];
        
        for (const testWarehouse of testWarehouses) {
            let warehouseStock = 0;
            let itemCount = 0;
            
            itemGroups.forEach(group => {
                if (group.items && Array.isArray(group.items)) {
                    group.items.forEach(item => {
                        if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
                            const ws = item.warehouseStocks.find(stock => 
                                stock.warehouse === testWarehouse
                            );
                            if (ws) {
                                warehouseStock += ws.stockOnHand || 0;
                                if (ws.stockOnHand > 0) {
                                    itemCount++;
                                }
                            }
                        }
                    });
                }
            });
            
            if (warehouseStock > 0) {
                console.log(`  ✅ "${testWarehouse}": ${warehouseStock} units (${itemCount} items)`);
            } else {
                console.log(`  ❌ "${testWarehouse}": 0 units`);
            }
        }
        
        // Check if there are any warehouse names that contain "702" (the locCode)
        console.log('\n4. Checking for locCode-based warehouse names:');
        
        const locCodeWarehouses = Object.keys(totalStockByWarehouse).filter(wh => 
            wh.includes('702') || wh.toLowerCase().includes('edap')
        );
        
        locCodeWarehouses.forEach(wh => {
            console.log(`  Found: "${wh}" with ${totalStockByWarehouse[wh]} units`);
        });
        
        // Let's also check what the warehouseMapping.js file suggests
        console.log('\n5. Checking warehouse mapping logic:');
        
        // Simulate the mapping logic from the controller
        const warehouseMapping = {
            "G-Edappally": "Edapally Branch",
            "G.Edappally": "Edapally Branch", 
            "Edappally": "Edapally Branch",
            "Edapally": "Edapally Branch"
        };
        
        Object.entries(warehouseMapping).forEach(([source, target]) => {
            const sourceStock = totalStockByWarehouse[source] || 0;
            const targetStock = totalStockByWarehouse[target] || 0;
            console.log(`  Mapping: "${source}" → "${target}" (Source: ${sourceStock}, Target: ${targetStock})`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkEdapallyStockDetailed();