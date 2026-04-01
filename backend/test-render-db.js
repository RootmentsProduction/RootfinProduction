import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

// Load production environment
process.env.NODE_ENV = 'production';
dotenv.config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URI_PROD;

if (!DATABASE_URL) {
  console.error('❌ No DATABASE_URL found in .env file');
  console.log('💡 Add your Render PostgreSQL URL to .env:');
  console.log('   DATABASE_URL=postgresql://user:password@host/database');
  process.exit(1);
}

console.log('🔍 Testing Render PostgreSQL connection...');
console.log('📍 URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Hide password

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection successful!');
    console.log('📊 Database:', sequelize.getDatabaseName());
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT version()');
    console.log('🐘 PostgreSQL version:', results[0].version);
    
    await sequelize.close();
    console.log('✅ Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check your DATABASE_URL in .env');
    console.error('   2. Verify Render database is running');
    console.error('   3. Check if your IP is whitelisted (if required)');
    process.exit(1);
  }
}

testConnection();
