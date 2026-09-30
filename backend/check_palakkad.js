import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const closeSchema = new mongoose.Schema({}, { strict: false, collection: 'closingtransactions' });
const CloseTransaction = mongoose.model('closingtransactions', closeSchema);

mongoose.connect(process.env.MONGODB_URL).then(async () => {
    console.log("Connected to MongoDB");
    const closes = await CloseTransaction.find({ locCode: "705" }).sort({ createdAt: -1 }).limit(5);
    console.log(closes.map(c => ({ 
      locCode: c.locCode, 
      date: c.date, 
      status: c.status, 
      createdAt: c.createdAt 
    })));
    process.exit(0);
});
