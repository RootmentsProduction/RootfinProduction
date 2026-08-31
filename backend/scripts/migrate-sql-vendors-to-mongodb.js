import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.development') });

import MongoVendor from '../model/Vendor.js';

const dbURI = process.env.MONGODB_URI_DEV || process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;

function parseCopyBlock(sqlText, tableName) {
  const regex = new RegExp(`COPY public\\.${tableName} \\(([^)]+)\\) FROM stdin;\\r?\\n([\\s\\S]*?)\\r?\\n\\\\\\.`, 'i');
  const match = sqlText.match(regex);
  if (!match) return null;

  const columns = match[1].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
  const rowsRaw = match[2].split(/\r?\n/);

  const rows = [];
  for (const rawLine of rowsRaw) {
    if (!rawLine || rawLine.trim() === '\\.') continue;
    const values = rawLine.split('\t').map(v => (v === '\\N' ? null : v));
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = values[idx];
    });
    rows.push(obj);
  }
  return rows;
}

function parseJson(val, fallback = []) {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

async function migrateSqlVendorsToMongoDB() {
  console.log('--------------------------------------------------');
  console.log('🚚 Migrating SQL Vendors to MongoDB Collection');
  console.log('--------------------------------------------------');

  const sqlFilePath = process.argv[2] || path.join(__dirname, '../rootfin_backup.sql');
  let sqlText = '';

  if (fs.existsSync(sqlFilePath)) {
    console.log(`📄 Reading SQL dump file: ${sqlFilePath}`);
    sqlText = fs.readFileSync(sqlFilePath, 'utf8');
  } else {
    // Check root directory
    const rootPath = 'd:\\rootfin_backup.sql';
    if (fs.existsSync(rootPath)) {
      console.log(`📄 Reading SQL dump file: ${rootPath}`);
      sqlText = fs.readFileSync(rootPath, 'utf8');
    } else {
      console.error(`❌ Could not find SQL dump file at ${sqlFilePath} or ${rootPath}`);
      console.log('💡 Pass your sql file path: node scripts/migrate-sql-vendors-to-mongodb.js <path-to-sql-file>');
      process.exit(1);
    }
  }

  const vendors = parseCopyBlock(sqlText, 'vendors');
  if (!vendors || vendors.length === 0) {
    console.error('❌ No vendor records found in SQL COPY block.');
    process.exit(1);
  }

  console.log(`📊 Found ${vendors.length} vendors in SQL dump!`);

  console.log('⏳ Connecting to MongoDB...');
  await mongoose.connect(dbURI);
  console.log('✅ Connected to MongoDB!');

  let created = 0;
  let updated = 0;

  for (const v of vendors) {
    const displayName = v.displayName || v.companyName || `${v.firstName || ''} ${v.lastName || ''}`.trim();
    if (!displayName) continue;

    const mongoData = {
      salutation: v.salutation || '',
      firstName: v.firstName || '',
      lastName: v.lastName || '',
      companyName: v.companyName || '',
      displayName: displayName,
      email: v.email || '',
      phone: v.phone || '',
      mobile: v.mobile || '',
      vendorLanguage: v.vendorLanguage || '',
      gstTreatment: v.gstTreatment || '',
      sourceOfSupply: v.sourceOfSupply || '',
      pan: v.pan || '',
      gstin: v.gstin || '',
      currency: v.currency || 'INR',
      paymentTerms: v.paymentTerms || '',
      tds: v.tds || '',
      enablePortal: v.enablePortal === 't' || v.enablePortal === 'true',
      contacts: parseJson(v.contacts, []),
      billingAttention: v.billingAttention || '',
      billingAddress: v.billingAddress || '',
      billingAddress2: v.billingAddress2 || '',
      billingCity: v.billingCity || '',
      billingState: v.billingState || '',
      billingPinCode: v.billingPinCode || '',
      billingCountry: v.billingCountry || '',
      billingPhone: v.billingPhone || '',
      billingFax: v.billingFax || '',
      shippingAttention: v.shippingAttention || '',
      shippingAddress: v.shippingAddress || '',
      shippingAddress2: v.shippingAddress2 || '',
      shippingCity: v.shippingCity || '',
      shippingState: v.shippingState || '',
      shippingPinCode: v.shippingPinCode || '',
      shippingCountry: v.shippingCountry || '',
      shippingPhone: v.shippingPhone || '',
      shippingFax: v.shippingFax || '',
      bankAccounts: parseJson(v.bankAccounts, []),
      payables: parseFloat(v.payables || 0),
      credits: parseFloat(v.credits || 0),
      itemsToReceive: parseInt(v.itemsToReceive || 0, 10),
      totalItemsOrdered: parseInt(v.totalItemsOrdered || 0, 10),
      remarks: v.remarks || '',
      userId: v.userId || 'officerootments@gmail.com',
      locCode: v.locCode || '',
      isActive: v.isActive !== 'f' && v.isActive !== 'false',
      status: v.status || 'active',
    };

    // Upsert by displayName & userId
    const existing = await MongoVendor.findOne({
      displayName: mongoData.displayName,
      userId: mongoData.userId,
    });

    if (existing) {
      await MongoVendor.updateOne({ _id: existing._id }, mongoData);
      console.log(`✏️  Updated MongoDB Vendor: ${mongoData.displayName}`);
      updated++;
    } else {
      await MongoVendor.create(mongoData);
      console.log(`✨ Created MongoDB Vendor: ${mongoData.displayName}`);
      created++;
    }
  }

  console.log('\n--------------------------------------------------');
  console.log(`🎉 Migration Completed Successfully!`);
  console.log(`   Created in MongoDB: ${created}`);
  console.log(`   Updated in MongoDB: ${updated}`);
  console.log(`   Total Processed   : ${created + updated}`);
  console.log('--------------------------------------------------');

  await mongoose.disconnect();
  process.exit(0);
}

migrateSqlVendorsToMongoDB();
