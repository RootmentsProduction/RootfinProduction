import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load production environment
dotenv.config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  console.log('💡 Make sure .env file has DATABASE_URL set');
  process.exit(1);
}

console.log('🔗 Connecting to:', DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Hide password

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log, // Show all SQL queries
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

async function syncDatabase() {
  try {
    console.log('\n🔌 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully!\n');
    
    console.log('📦 Loading Sequelize models...');
    const models = await import('./models/sequelize/index.js');
    console.log('✅ Models loaded\n');
    
    // List all loaded models
    console.log('📋 Models to sync:');
    const modelNames = Object.keys(models.default).filter(key => key !== 'sequelize');
    modelNames.forEach(name => {
      console.log(`   - ${name}`);
    });
    console.log('');
    
    console.log('🔄 Syncing models with database (alter: true)...');
    console.log('⚠️  This will modify existing tables to match model definitions');
    console.log('⚠️  Backup your data before proceeding!\n');
    
    // Wait 3 seconds to allow user to cancel
    console.log('Starting in 3 seconds... (Press Ctrl+C to cancel)');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await sequelize.sync({ alter: true });
    
    console.log('\n✅ Database synced successfully!');
    console.log('📊 All tables are now up to date with model definitions\n');
    
    // List all tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables in database:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    await sequelize.close();
    console.log('\n✅ Done! Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    console.error('\nFull error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

syncDatabase();
