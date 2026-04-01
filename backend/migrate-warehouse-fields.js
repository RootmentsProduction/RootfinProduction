import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function migrateWarehouseFields() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(process.env.DB_NAME);
        
        console.log('\n=== MIGRATING WAREHOUSE FIELDS ===');
        
        // 1. Update existing TransferOrders to add fromWarehouse and toWarehouse fields
        // (Keep existing sourceWarehouse and destinationWarehouse for backward compatibility)
        console.log('\n1. Updating TransferOrders...');
        
        const transferOrders = await db.collection('transferorders').find({}).toArray();
        console.log(`Found ${transferOrders.length} transfer orders`);
        
        let transferUpdated = 0;
        for (const to of transferOrders) {
            const updates = {};
            
            // Add fromWarehouse and toWarehouse based on existing fields
            if (to.sourceWarehouse && !to.fromWarehouse) {
                updates.fromWarehouse = to.sourceWarehouse;
            }
            if (to.destinationWarehouse && !to.toWarehouse) {
                updates.toWarehouse = to.destinationWarehouse;
            }
            
            if (Object.keys(updates).length > 0) {
                await db.collection('transferorders').updateOne(
                    { _id: to._id },
                    { $set: updates }
                );
                transferUpdated++;
                console.log(`  Updated transfer order ${to.transferOrderNumber || to._id}: ${JSON.stringify(updates)}`);
            }
        }
        console.log(`✅ Updated ${transferUpdated} transfer orders`);
        
        // 2. Update existing PurchaseReceives to add toWarehouse field
        console.log('\n2. Updating PurchaseReceives...');
        
        const purchaseReceives = await db.collection('purchasereceives').find({}).toArray();
        console.log(`Found ${purchaseReceives.length} purchase receives`);
        
        // Warehouse mapping based on locCode
        const warehouseMapping = {
            "858": "Warehouse",
            "702": "Edapally Branch", 
            "759": "HEAD OFFICE01",
            "700": "Grooms Trivandrum",
            "144": "Edapally Branch",
            "100": "Edappal Branch",
            "133": "Perinthalmanna Branch",
            "122": "Kottakkal Branch",
            "701": "Kottayam Branch",
            "703": "Perumbavoor Branch",
            "704": "Thrissur Branch",
            "706": "Chavakkad Branch",
            "712": "Calicut Branch",
            "708": "Vadakara Branch",
            "707": "Edappal Branch",
            "709": "Perinthalmanna Branch",
            "711": "Kottakkal Branch",
            "710": "Manjeri Branch",
            "705": "Palakkad Branch",
            "717": "Kalpetta Branch",
            "716": "Kannur Branch",
            "718": "Mg Road Branch",
            "101": "Production",
            "102": "Office"
        };
        
        let purchaseUpdated = 0;
        for (const pr of purchaseReceives) {
            if (!pr.toWarehouse) {
                let targetWarehouse = "Warehouse"; // Default
                
                // Check if userId is admin email
                const adminEmails = ['officerootments@gmail.com'];
                const isAdminEmail = pr.userId && adminEmails.some(email => 
                    pr.userId.toLowerCase() === email.toLowerCase()
                );
                
                if (isAdminEmail) {
                    targetWarehouse = "Warehouse";
                } else if (pr.locCode && warehouseMapping[pr.locCode]) {
                    targetWarehouse = warehouseMapping[pr.locCode];
                }
                
                await db.collection('purchasereceives').updateOne(
                    { _id: pr._id },
                    { $set: { toWarehouse: targetWarehouse } }
                );
                purchaseUpdated++;
                console.log(`  Updated purchase receive ${pr.receiveNumber || pr._id}: toWarehouse = "${targetWarehouse}" (locCode: ${pr.locCode})`);
            }
        }
        console.log(`✅ Updated ${purchaseUpdated} purchase receives`);
        
        // 3. Verify the updates
        console.log('\n3. Verifying updates...');
        
        const updatedTransfers = await db.collection('transferorders').find({
            $or: [
                { fromWarehouse: { $exists: true } },
                { toWarehouse: { $exists: true } }
            ]
        }).count();
        
        const updatedPurchases = await db.collection('purchasereceives').find({
            toWarehouse: { $exists: true, $ne: "" }
        }).count();
        
        console.log(`✅ Verification complete:`);
        console.log(`  - Transfer orders with warehouse fields: ${updatedTransfers}`);
        console.log(`  - Purchase receives with toWarehouse: ${updatedPurchases}`);
        
        // 4. Show sample of updated records
        console.log('\n4. Sample updated records:');
        
        const sampleTransfer = await db.collection('transferorders').findOne({
            fromWarehouse: { $exists: true }
        });
        if (sampleTransfer) {
            console.log(`  Transfer Order sample:`, {
                transferOrderNumber: sampleTransfer.transferOrderNumber,
                sourceWarehouse: sampleTransfer.sourceWarehouse,
                destinationWarehouse: sampleTransfer.destinationWarehouse,
                fromWarehouse: sampleTransfer.fromWarehouse,
                toWarehouse: sampleTransfer.toWarehouse
            });
        }
        
        const samplePurchase = await db.collection('purchasereceives').findOne({
            toWarehouse: { $exists: true }
        });
        if (samplePurchase) {
            console.log(`  Purchase Receive sample:`, {
                receiveNumber: samplePurchase.receiveNumber,
                locCode: samplePurchase.locCode,
                toWarehouse: samplePurchase.toWarehouse
            });
        }
        
        console.log('\n✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await client.close();
    }
}

migrateWarehouseFields();