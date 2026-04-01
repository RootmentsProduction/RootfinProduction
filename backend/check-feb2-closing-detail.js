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

async function checkFeb2Closing() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const mgRoadLocCode = "718"; // G.MG Road
        
        // Create Feb 2, 2026 date range
        const feb2Start = new Date('2026-02-02T00:00:00.000Z');
        const feb2End = new Date('2026-02-02T23:59:59.999Z');
        
        console.log('🔍 Searching for closing record on February 2, 2026...');
        console.log(`   Date range: ${feb2Start.toISOString()} to ${feb2End.toISOString()}\n`);

        const feb2Record = await CloseTransaction.findOne({
            locCode: mgRoadLocCode,
            date: {
                $gte: feb2Start,
                $lte: feb2End
            }
        }).lean();

        if (!feb2Record) {
            console.log('❌ No closing record found for February 2, 2026');
            
            // Check what's the most recent record
            const latestRecord = await CloseTransaction.findOne({ locCode: mgRoadLocCode })
                .sort({ date: -1 })
                .lean();
            
            if (latestRecord) {
                console.log('\n📊 Most recent closing record:');
                console.log(`   Date: ${new Date(latestRecord.date).toISOString()}`);
                console.log(`   Local Date: ${new Date(latestRecord.date).toLocaleString()}`);
                console.log(`   Closecash: ₹${latestRecord.Closecash.toLocaleString()}`);
            }
        } else {
            console.log('✅ Found closing record for February 2, 2026\n');
            console.log('═══════════════════════════════════════════════════════════════════════════════');
            console.log('📅 FEBRUARY 2, 2026 CLOSING DETAILS:');
            console.log('═══════════════════════════════════════════════════════════════════════════════');
            console.log(`\n🏪 Store: G.MG Road (${feb2Record.locCode})`);
            console.log(`\n📆 Date Information:`);
            console.log(`   Stored Date (UTC):     ${new Date(feb2Record.date).toISOString()}`);
            console.log(`   Stored Date (Local):   ${new Date(feb2Record.date).toLocaleString()}`);
            console.log(`   Date String:           ${new Date(feb2Record.date).toDateString()}`);
            console.log(`   YYYY-MM-DD:            ${new Date(feb2Record.date).toISOString().split('T')[0]}`);
            
            console.log(`\n💰 Financial Data:`);
            console.log(`   Cash (Day's Trans):    ₹${feb2Record.cash.toLocaleString()}`);
            console.log(`   Closecash (Physical):  ₹${feb2Record.Closecash.toLocaleString()}`);
            console.log(`   RBL:                   ₹${(feb2Record.rbl || 0).toLocaleString()}`);
            console.log(`   Bank:                  ₹${feb2Record.bank.toLocaleString()}`);
            console.log(`   Difference:            ₹${(feb2Record.Closecash - feb2Record.cash).toLocaleString()}`);
            
            console.log(`\n📧 Other Info:`);
            console.log(`   Email:                 ${feb2Record.email || 'N/A'}`);
            console.log(`   Created At:            ${new Date(feb2Record.createdAt).toLocaleString()}`);
            console.log(`   Updated At:            ${new Date(feb2Record.updatedAt).toLocaleString()}`);
            console.log(`   MongoDB _id:           ${feb2Record._id}`);
            
            console.log('\n═══════════════════════════════════════════════════════════════════════════════');
            
            // Check what this means for Feb 3 opening balance
            const feb3Start = new Date('2026-02-03T00:00:00.000Z');
            const feb3End = new Date('2026-02-03T23:59:59.999Z');
            
            const feb3Record = await CloseTransaction.findOne({
                locCode: mgRoadLocCode,
                date: {
                    $gte: feb3Start,
                    $lte: feb3End
                }
            }).lean();
            
            console.log('\n\n🔮 IMPACT ON FUTURE DATES:');
            console.log('═══════════════════════════════════════════════════════════════════════════════');
            console.log(`\n📅 February 3, 2026 (Tomorrow):`);
            if (feb3Record) {
                console.log(`   ✅ Closing already saved`);
                console.log(`   Opening Balance: ₹${feb2Record.Closecash.toLocaleString()} (from Feb 2)`);
                console.log(`   Closecash: ₹${feb3Record.Closecash.toLocaleString()}`);
            } else {
                console.log(`   ❌ No closing saved yet`);
                console.log(`   Opening Balance will be: ₹${feb2Record.Closecash.toLocaleString()} (from Feb 2)`);
            }
            
            console.log('\n═══════════════════════════════════════════════════════════════════════════════');
            
            // Verify the date components
            const dateObj = new Date(feb2Record.date);
            console.log('\n\n🔍 DATE VERIFICATION:');
            console.log('═══════════════════════════════════════════════════════════════════════════════');
            console.log(`   Year:   ${dateObj.getUTCFullYear()}`);
            console.log(`   Month:  ${dateObj.getUTCMonth() + 1} (February)`);
            console.log(`   Day:    ${dateObj.getUTCDate()}`);
            console.log(`   Hour:   ${dateObj.getUTCHours()}`);
            console.log(`   Minute: ${dateObj.getUTCMinutes()}`);
            console.log(`   Second: ${dateObj.getUTCSeconds()}`);
            console.log('\n   ✅ Confirmed: This is February 2, 2026');
            console.log('═══════════════════════════════════════════════════════════════════════════════');
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkFeb2Closing();
