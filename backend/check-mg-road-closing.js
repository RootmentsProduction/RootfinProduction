import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const CloseSchema = new mongoose.Schema(
    {
        cash: { type: Number, required: true },
        Closecash: { type: Number, required: true },
        bank: { type: Number, required: true },
        rbl: { type: Number, default: 0 },
        date: { type: Date, required: true },
        locCode: { type: String, required: true },
        email: { type: String, default: "" }
    },
    { timestamps: true }
);

const CloseTransaction = mongoose.model("Close", CloseSchema);

async function checkMGRoadClosing() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const mgRoadLocCode = "718"; // G.MG Road

        console.log('📊 Fetching Close Report data for G.MG Road (locCode: 718)...\n');

        // Get all closing records for MG Road, sorted by date (most recent first)
        const closingRecords = await CloseTransaction.find({ locCode: mgRoadLocCode })
            .sort({ date: -1 })
            .limit(10)
            .lean();

        if (closingRecords.length === 0) {
            console.log('❌ No closing records found for G.MG Road (locCode: 718)');
        } else {
            console.log(`✅ Found ${closingRecords.length} closing records for G.MG Road:\n`);
            console.log('═══════════════════════════════════════════════════════════════════════════════');
            
            closingRecords.forEach((record, index) => {
                const dateStr = new Date(record.date).toISOString().split('T')[0];
                console.log(`\n📅 Record #${index + 1} - Date: ${dateStr}`);
                console.log('───────────────────────────────────────────────────────────────────────────────');
                console.log(`   LocCode:        ${record.locCode}`);
                console.log(`   Cash (Day):     ₹${record.cash.toLocaleString()}`);
                console.log(`   Closecash:      ₹${record.Closecash.toLocaleString()} (Physical Cash Entered)`);
                console.log(`   RBL:            ₹${(record.rbl || 0).toLocaleString()}`);
                console.log(`   Bank:           ₹${record.bank.toLocaleString()}`);
                console.log(`   Difference:     ₹${(record.Closecash - record.cash).toLocaleString()}`);
                console.log(`   Email:          ${record.email || 'N/A'}`);
                console.log(`   Created:        ${new Date(record.createdAt).toLocaleString()}`);
                console.log(`   Updated:        ${new Date(record.updatedAt).toLocaleString()}`);
            });
            
            console.log('\n═══════════════════════════════════════════════════════════════════════════════');
            
            // Show today's and yesterday's specifically
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            console.log('\n\n🔍 SPECIFIC DATE CHECKS:');
            console.log('═══════════════════════════════════════════════════════════════════════════════');
            
            const todayRecord = await CloseTransaction.findOne({
                locCode: mgRoadLocCode,
                date: {
                    $gte: today,
                    $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            }).lean();
            
            const yesterdayRecord = await CloseTransaction.findOne({
                locCode: mgRoadLocCode,
                date: {
                    $gte: yesterday,
                    $lt: today
                }
            }).lean();
            
            console.log(`\n📅 TODAY (${today.toISOString().split('T')[0]}):`);
            if (todayRecord) {
                console.log(`   ✅ Closing saved`);
                console.log(`   Cash (Day):     ₹${todayRecord.cash.toLocaleString()}`);
                console.log(`   Closecash:      ₹${todayRecord.Closecash.toLocaleString()}`);
                console.log(`   RBL:            ₹${(todayRecord.rbl || 0).toLocaleString()}`);
            } else {
                console.log(`   ❌ No closing saved yet`);
            }
            
            console.log(`\n📅 YESTERDAY (${yesterday.toISOString().split('T')[0]}):`);
            if (yesterdayRecord) {
                console.log(`   ✅ Closing saved`);
                console.log(`   Cash (Day):     ₹${yesterdayRecord.cash.toLocaleString()}`);
                console.log(`   Closecash:      ₹${yesterdayRecord.Closecash.toLocaleString()}`);
                console.log(`   RBL:            ₹${(yesterdayRecord.rbl || 0).toLocaleString()}`);
                console.log(`\n   ⚠️  This Closecash (₹${yesterdayRecord.Closecash.toLocaleString()}) will be used as TODAY'S opening balance`);
            } else {
                console.log(`   ❌ No closing saved`);
                console.log(`   ⚠️  Today's opening balance will be ₹0`);
            }
            
            console.log('\n═══════════════════════════════════════════════════════════════════════════════');
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkMGRoadClosing();
