import mongoose from 'mongoose';
import User from './model/UserModel.js';
import dotenv from 'dotenv';

dotenv.config();

const fixMGRoadUserLocCode = async () => {
  try {
    // Connect to the production database
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_DEV;
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find MG Road users with old location code
    console.log('\n=== Finding MG Road Users with Old LocCode ===');
    const mgRoadUsersOld = await User.find({
      $or: [
        { username: /mg.*road/i },
        { locCode: '718' }
      ]
    });
    
    console.log(`Found ${mgRoadUsersOld.length} users that might need updating:`);
    mgRoadUsersOld.forEach(user => {
      console.log(`👤 ${user.username} | Email: ${user.email} | Current LocCode: ${user.locCode}`);
    });
    
    // Update users with MG Road in username or old location code 718 to new location code 729
    const updateResult = await User.updateMany(
      {
        $or: [
          { username: /mg.*road/i },
          { locCode: '718' }
        ]
      },
      {
        $set: { locCode: '729' }
      }
    );
    
    console.log(`\n✅ Update Result:`);
    console.log(`   Matched: ${updateResult.matchedCount} users`);
    console.log(`   Modified: ${updateResult.modifiedCount} users`);
    
    // Verify the update
    console.log('\n=== Verification - MG Road Users After Update ===');
    const mgRoadUsersUpdated = await User.find({
      $or: [
        { username: /mg.*road/i },
        { locCode: '729' }
      ]
    });
    
    console.log(`Found ${mgRoadUsersUpdated.length} MG Road users after update:`);
    mgRoadUsersUpdated.forEach(user => {
      console.log(`👤 ${user.username} | Email: ${user.email} | LocCode: ${user.locCode}`);
    });
    
    console.log('\n🎉 MG Road user location codes have been updated to 729!');
    console.log('📋 Users should now see their invoices in the daybook and financial summary.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixMGRoadUserLocCode();