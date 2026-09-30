import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || "mongodb+srv://rootfin002:Rootfin123@cluster0.zox2e.mongodb.net/Brynnex?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
    const CloseTransaction = mongoose.connection.collection('closetransactions');
    const docs = await CloseTransaction.find().sort({createdAt: -1}).limit(5).toArray();
    console.log(JSON.stringify(docs.map(d => ({locCode: d.locCode, date: d.date, createdAt: d.createdAt})), null, 2));
    process.exit(0);
});
