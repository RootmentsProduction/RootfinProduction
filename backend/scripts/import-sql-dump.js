import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;
if (fs.existsSync(path.join(__dirname, '..', envFile))) {
  dotenv.config({ path: path.join(__dirname, '..', envFile) });
} else {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const host = process.env.DB_HOST || process.env.POSTGRES_HOST_DEV || 'rootfin.cluster-cni408e4geb9.ap-southeast-2.rds.amazonaws.com';
const port = process.env.DB_PORT || process.env.POSTGRES_PORT_DEV || 5432;
const database = process.env.DB_NAME || process.env.POSTGRES_DB_DEV || 'postgres';
const user = process.env.DB_USER || process.env.POSTGRES_USER_DEV || 'postgres';
let password = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD_DEV || 'Brynex#2026';
if (password.startsWith('"') && password.endsWith('"')) {
  password = password.slice(1, -1);
}

async function importSqlDump() {
  const sqlFilePath = process.argv[2] || path.join(__dirname, 'dump.sql');

  console.log('--------------------------------------------------');
  console.log('📦 AWS RDS PostgreSQL SQL Dump Importer');
  console.log('--------------------------------------------------');
  console.log(`📌 Target Host : ${host}`);
  console.log(`📌 Database    : ${database}`);
  console.log(`📌 User        : ${user}`);
  console.log(`📌 SQL File    : ${sqlFilePath}`);
  console.log('--------------------------------------------------');

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ SQL dump file not found at: ${sqlFilePath}`);
    console.log('\n💡 Usage: node scripts/import-sql-dump.js <path-to-sql-file>');
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  const client = new pg.Client({
    host,
    port,
    database,
    user,
    password,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('⏳ Connecting to AWS RDS PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to AWS RDS PostgreSQL!');

    console.log('🚀 Importing SQL dump into AWS RDS (this may take a few seconds)...');
    await client.query(sqlContent);
    console.log('🎉 SUCCESS! All tables, schemas, and data imported successfully into AWS RDS!');

  } catch (error) {
    console.error('❌ SQL Import failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

importSqlDump();
