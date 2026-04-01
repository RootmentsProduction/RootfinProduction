import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

// Load production environment
dotenv.config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

console.log('🔗 Connecting to:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

async function createStoreOrdersTable() {
  try {
    console.log('\n🔌 Connecting to production database...');
    await sequelize.authenticate();
    console.log('✅ Connected!\n');
    
    console.log('🔍 Checking if store_orders table exists...');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'store_orders';
    `);
    
    if (tables.length > 0) {
      console.log('✅ store_orders table already exists!');
      console.log('\n📊 Table structure:');
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'store_orders'
        ORDER BY ordinal_position;
      `);
      console.table(columns);
    } else {
      console.log('❌ store_orders table does NOT exist');
      console.log('📦 Creating store_orders table...\n');
      
      // Define the StoreOrder model inline
      const StoreOrder = sequelize.define('StoreOrder', {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        orderNumber: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('pending', 'approved', 'rejected', 'transferred'),
          defaultValue: 'pending',
        },
        storeWarehouse: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        destinationWarehouse: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'Warehouse',
        },
        items: {
          type: DataTypes.JSONB,
          defaultValue: [],
        },
        transferOrderId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        userId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        createdBy: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        approvedBy: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        approvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        rejectedBy: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        rejectedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        rejectionReason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        locCode: {
          type: DataTypes.STRING,
          defaultValue: '',
        },
        totalQuantityRequested: {
          type: DataTypes.DECIMAL(10, 2),
          defaultValue: 0,
        },
      }, {
        tableName: 'store_orders',
        timestamps: true,
        underscored: false,
      });
      
      // Sync the model (create table)
      await StoreOrder.sync({ force: false });
      
      console.log('✅ store_orders table created successfully!\n');
      
      // Create indexes
      console.log('📊 Creating indexes...');
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS store_orders_user_date_idx ON store_orders (userId, date);
      `);
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS store_orders_store_status_idx ON store_orders (storeWarehouse, status);
      `);
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS store_orders_status_idx ON store_orders (status);
      `);
      await sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS store_orders_number_idx ON store_orders (orderNumber);
      `);
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS store_orders_transfer_order_idx ON store_orders (transferOrderId);
      `);
      console.log('✅ Indexes created!\n');
    }
    
    // Verify table exists now
    console.log('🔍 Verifying table...');
    const [finalCheck] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'store_orders';
    `);
    
    if (finalCheck.length > 0) {
      console.log('✅ Verification successful! store_orders table exists.\n');
    } else {
      console.log('❌ Verification failed! Table was not created.\n');
    }
    
    await sequelize.close();
    console.log('✅ Done! Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

createStoreOrdersTable();
