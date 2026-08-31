import dotenv from 'dotenv';
import fs from 'fs';
import { getSequelize, connectPostgreSQL } from '../db/postgresql.js';

const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

async function testPostgresConnection() {
  console.log('--------------------------------------------------');
  console.log('🔍 Testing AWS RDS PostgreSQL Connection...');
  console.log('--------------------------------------------------');
  console.log(`📌 Environment : ${env}`);
  console.log(`📌 DB Host     : ${process.env.DB_HOST || process.env.POSTGRES_HOST_DEV || 'localhost'}`);
  console.log(`📌 DB Port     : ${process.env.DB_PORT || process.env.POSTGRES_PORT_DEV || 5432}`);
  console.log(`📌 DB Name     : ${process.env.DB_NAME || process.env.POSTGRES_DB_DEV || 'postgres'}`);
  console.log(`📌 DB User     : ${process.env.DB_USER || process.env.POSTGRES_USER_DEV || 'postgres'}`);
  console.log(`📌 SSL Enabled : ${process.env.DB_SSL || process.env.POSTGRES_SSL || 'false'}`);
  console.log('--------------------------------------------------');

  const startTime = Date.now();
  try {
    const sequelize = await connectPostgreSQL();
    if (!sequelize) {
      throw new Error('Sequelize instance could not be created.');
    }
    const duration = Date.now() - startTime;
    console.log(`\n🎉 SUCCESS! Connected to PostgreSQL successfully in ${duration}ms!`);
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED!');
    console.error(`Error message: ${error.message}`);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Tip: DNS lookup failed for host endpoint. Verify your RDS Endpoint hostname spelling or internet connection.');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: Timeout/Refused. Check your AWS RDS Security Group inbound rule to ensure Port 5432 is open.');
    } else if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Tip: Incorrect DB User or Password.');
    }
  }
  process.exit(0);
}

testPostgresConnection();
