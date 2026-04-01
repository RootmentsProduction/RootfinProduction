import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
const PG_HOST = process.env.POSTGRES_HOST_DEV || 'localhost';
const PG_PORT = process.env.POSTGRES_PORT_DEV || 5432;
const PG_DB = process.env.POSTGRES_DB_DEV || 'rootfin_dev';
const PG_USER = process.env.POSTGRES_USER_DEV || 'postgres';
const PG_PASS = process.env.POSTGRES_PASSWORD_DEV || 'root';

let sequelize;
if (DATABASE_URL) {
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  });
} else {
  sequelize = new Sequelize(PG_DB, PG_USER, PG_PASS, {
    host: PG_HOST,
    port: parseInt(PG_PORT),
    dialect: 'postgres',
    logging: false,
  });
}

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    const qi = sequelize.getQueryInterface();

    // --- sales_invoices: add isSplitPayment and splitPaymentAmounts ---
    const [siCols] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'sales_invoices';
    `);
    const siColNames = siCols.map(c => c.column_name);

    if (!siColNames.includes('isSplitPayment')) {
      await sequelize.query(`ALTER TABLE sales_invoices ADD COLUMN "isSplitPayment" BOOLEAN DEFAULT false;`);
      console.log('✅ Added isSplitPayment to sales_invoices');
    } else {
      console.log('⏭️  isSplitPayment already exists in sales_invoices');
    }

    if (!siColNames.includes('splitPaymentAmounts')) {
      await sequelize.query(`ALTER TABLE sales_invoices ADD COLUMN "splitPaymentAmounts" JSON DEFAULT NULL;`);
      console.log('✅ Added splitPaymentAmounts to sales_invoices');
    } else {
      console.log('⏭️  splitPaymentAmounts already exists in sales_invoices');
    }

    // --- transactions: add subCategory ---
    const [txCols] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'transactions';
    `);
    const txColNames = txCols.map(c => c.column_name);

    if (!txColNames.includes('subCategory')) {
      await sequelize.query(`ALTER TABLE transactions ADD COLUMN "subCategory" VARCHAR(255) DEFAULT '';`);
      console.log('✅ Added subCategory to transactions');
    } else {
      console.log('⏭️  subCategory already exists in transactions');
    }

    console.log('\n✅ Migration complete!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

migrate();
