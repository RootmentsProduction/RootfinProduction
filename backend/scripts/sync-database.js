import dotenv from 'dotenv';
import fs from 'fs';
import { connectPostgreSQL } from '../db/postgresql.js';
import models, { sequelize } from '../models/sequelize/index.js';

const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

async function syncDatabase() {
  console.log('--------------------------------------------------');
  console.log('🔄 Initializing PostgreSQL Tables in AWS RDS...');
  console.log('--------------------------------------------------');

  try {
    await connectPostgreSQL();
    
    console.log('\n📦 Creating database tables for all Sequelize models...');
    await sequelize.sync({ force: false, alter: false });
    
    console.log('✅ Success! The following tables are now ready in AWS RDS:');
    Object.keys(models).forEach(name => {
      if (name !== 'sequelize') {
        console.log(`   - ${name}`);
      }
    });

    console.log('\n🎉 Database table setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database sync failed:', error);
    process.exit(1);
  }
}

syncDatabase();
