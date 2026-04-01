import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function analyzeKottayamStockDetailed() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('admin');
        
        // Get all item groups
        const allGroups = await db.collection('itemgroups').find({}).toArray();
        console.log(`Found ${allGroups.length} total item groups`);
        
        // Extract Kottayam Branch stock data
        console.log('\n=== KOTTAYAM BRANCH STOCK ANALYSIS ===\n');
        
        const kottayamStockData = [];
        
        allGroups.forEach(group => {
            if (group.items && group.items.length > 0) {
                group.items.forEach(item => {
                    if (item.warehouseStocks && item.warehouseStocks.length > 0) {
                        const kottayamStock = item.warehouseStocks.find(ws => 
                            ws.warehouse === 'Kottayam Branch'
                        );
                        
                        if (kottayamStock && kottayamStock.stockOnHand > 0) {
                            kottayamStockData.push({
                                itemCode: group.itemCode,
                                itemName: group.itemName,
                                sku: item.sku,
                                size: item.attributeCombination ? item.attributeCombination[1] : 'N/A',
                                color: item.attributeCombination ? item.attributeCombination[0] : 'N/A',
                                stockOnHand: kottayamStock.stockOnHand,
                                availableForSale: kottayamStock.availableForSale,
                                costPrice: item.costPrice,
                                sellingPrice: item.sellingPrice
                            });
                        }
                    }
                });
            }
        });
        
        // Sort by item code
        kottayamStockData.sort((a, b) => {
            const aCode = a.itemCode || '';
            const bCode = b.itemCode || '';
            return aCode.localeCompare(bCode);
        });
        
        console.log(`Found ${kottayamStockData.length} items with stock in Kottayam Branch:\n`);
        
        // Display the stock data in a table format similar to your image
        console.log('ITEM CODE\t\tSTOCK');
        console.log('─'.repeat(40));
        
        kottayamStockData.forEach(item => {
            console.log(`${item.sku}\t\t${item.stockOnHand}`);
        });
        
        console.log('\n=== DETAILED BREAKDOWN ===\n');
        
        // Group by item code for detailed analysis
        const groupedByItemCode = {};
        
        kottayamStockData.forEach(item => {
            const baseItemCode = item.itemCode;
            if (!groupedByItemCode[baseItemCode]) {
                groupedByItemCode[baseItemCode] = {
                    itemName: item.itemName,
                    totalStock: 0,
                    variants: []
                };
            }
            
            groupedByItemCode[baseItemCode].totalStock += item.stockOnHand;
            groupedByItemCode[baseItemCode].variants.push(item);
        });
        
        // Display detailed breakdown
        Object.keys(groupedByItemCode).sort().forEach(itemCode => {
            const group = groupedByItemCode[itemCode];
            console.log(`${itemCode} (${group.itemName}): Total Stock = ${group.totalStock}`);
            
            group.variants.forEach(variant => {
                console.log(`  - ${variant.sku} (Size ${variant.size}, ${variant.color}): ${variant.stockOnHand} units`);
            });
            console.log('');
        });
        
        // Calculate totals
        const totalItems = kottayamStockData.length;
        const totalStock = kottayamStockData.reduce((sum, item) => sum + item.stockOnHand, 0);
        const totalValue = kottayamStockData.reduce((sum, item) => sum + (item.stockOnHand * item.costPrice), 0);
        
        console.log('=== SUMMARY ===');
        console.log(`Total unique SKUs: ${totalItems}`);
        console.log(`Total stock quantity: ${totalStock} units`);
        console.log(`Total stock value: ₹${totalValue.toLocaleString()}`);
        
        // Compare with the data from your image
        console.log('\n=== COMPARISON WITH PROVIDED DATA ===\n');
        
        const providedData = [
            { sku: 'BLL10-4020', expectedStock: 1 },
            { sku: 'TAL6-4018', expectedStock: 1 },
            { sku: 'TAL7-4018', expectedStock: 2 },
            { sku: 'TAL8-4018', expectedStock: 2 },
            { sku: 'TAL9-4018', expectedStock: 1 },
            { sku: 'TAL10-4018', expectedStock: 0 },
            { sku: 'BRL6-4018', expectedStock: 2 },
            { sku: 'BRL7-4018', expectedStock: 1 },
            { sku: 'BRL8-4018', expectedStock: 0 },
            { sku: 'BRL9-4018', expectedStock: 1 },
            { sku: 'BRL10-4018', expectedStock: 2 },
            { sku: 'BLL7-1410', expectedStock: 0 },
            { sku: 'BLL8-1410', expectedStock: 1 },
            { sku: 'BLL9-1410', expectedStock: 1 },
            { sku: 'BLL10-1410', expectedStock: 0 },
            { sku: 'BRL6-1410', expectedStock: 2 },
            { sku: 'BRL7-1410', expectedStock: 3 },
            { sku: 'BRL8-1410', expectedStock: 0 },
            { sku: 'BRL9-1410', expectedStock: 3 },
            { sku: 'BRL10-1410', expectedStock: 2 },
            { sku: 'BLF6-1607', expectedStock: 3 },
            { sku: 'BLF7-1607', expectedStock: 0 },
            { sku: 'BLF8-1607', expectedStock: 0 },
            { sku: 'BLF9-1607', expectedStock: 0 },
            { sku: 'BLF10-1607', expectedStock: 0 },
            { sku: 'BRF6-1901', expectedStock: 4 },
            { sku: 'BRF7-1901', expectedStock: 1 },
            { sku: 'BRF8-1901', expectedStock: 0 },
            { sku: 'BRF9-1901', expectedStock: 2 },
            { sku: 'BRF10-1901', expectedStock: 3 }
        ];
        
        console.log('SKU\t\tExpected\tActual\t\tDifference');
        console.log('─'.repeat(60));
        
        let totalDifferences = 0;
        
        providedData.forEach(expected => {
            const actualItem = kottayamStockData.find(item => item.sku === expected.sku);
            const actualStock = actualItem ? actualItem.stockOnHand : 0;
            const difference = actualStock - expected.expectedStock;
            
            if (difference !== 0) {
                totalDifferences++;
            }
            
            const status = difference === 0 ? '✓' : (difference > 0 ? '+' : '-');
            console.log(`${expected.sku}\t\t${expected.expectedStock}\t\t${actualStock}\t\t${difference} ${status}`);
        });
        
        console.log(`\nTotal discrepancies found: ${totalDifferences}`);
        
    } catch (error) {
        console.error('Error analyzing Kottayam stock:', error);
    } finally {
        await client.close();
    }
}

analyzeKottayamStockDetailed();