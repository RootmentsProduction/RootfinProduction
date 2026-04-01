// Test PostgreSQL connection
import dotenv from 'dotenv';
import { connectPostgreSQL } from './db/postgresql.js';

// Load environment variables
dotenv.config();

const testPostgresConnection = async () => {
  console.log('🔍 Testing PostgreSQL connection...');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Host: ${process.env.POSTGRES_HOST || 'localhost'}`);
  console.log(`Port: ${process.env.POSTGRES_PORT || 5432}`);
  console.log(`Database: ${process.env.POSTGRES_DB || 'rootfin_dev'}`);
  console.log(`User: ${process.env.POSTGRES_USER || 'postgres'}`);
  
  try {
    const sequelize = await connectPostgreSQL();
    console.log('✅ PostgreSQL connection successful!');
    
    // Test a simple query
    const result = await sequelize.query('SELECT version();');
    console.log('📊 PostgreSQL version:', result[0][0].version);
    
    await sequelize.close();
    console.log('✅ Connection closed successfully');
    
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.log('\n💡 To fix this:');
    console.log('1. Install PostgreSQL: https://www.postgresql.org/download/');
    console.log('2. Start PostgreSQL service');
    console.log('3. Create database: createdb rootfin_dev');
    console.log('4. Update password in .env files if needed');
    
    return false;
  }
};

testPostgresConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 PostgreSQL is ready! The "Save as Completed" fix should work now.');
    } else {
      console.log('\n⚠️ PostgreSQL setup needed before the fix will work.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });