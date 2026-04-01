/**
 * Stock Verification Script
 * Compares what the Inventory Report shows vs actual warehouseStocks in MongoDB
 * Run: node verify-stock-count.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });

const MONGODB_URI = process.env.MONGODB_URI;

// Minimal schemas
const ShoeItemSchema = new mongoose.Schema({ itemName: String, sku: String, costPrice: Number, warehouseStocks: Array }, { strict: false });
const ItemGroupSchema = new mongoose.Schema({ name: String, items: Array, isActive: Boolean }, { strict: false });

const ShoeItem = mongoose.model("ShoeItem", ShoeItemSchema);
const ItemGroup = mongoose.model("ItemGroup", ItemGroupSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB\n");

  // --- Standalone items ---
  const standaloneItems = await ShoeItem.find({});
  // --- Group items ---
  const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });

  let allItems = [];

  for (const item of standaloneItems) {
    allItems.push({ name: item.itemName || item.name || "?", sku: item.sku || "", warehouseStocks: item.warehouseStocks || [], source: "standalone" });
  }

  for (const group of itemGroups) {
    for (const item of (group.items || [])) {
      allItems.push({ name: item.name || "?", sku: item.sku || "", warehouseStocks: item.warehouseStocks || [], source: `group:${group.name}` });
    }
  }

  // --- Per-warehouse totals ---
  const warehouseTotals = {};
  let grandTotal = 0;
  let grandItems = 0;

  for (const item of allItems) {
    for (const ws of item.warehouseStocks) {
      const wName = (ws.warehouse || "Unknown").trim();
      const stock = parseFloat(ws.stockOnHand) || 0;
      if (!warehouseTotals[wName]) warehouseTotals[wName] = { qty: 0, items: 0 };
      warehouseTotals[wName].qty += stock;
      warehouseTotals[wName].items++;
      grandTotal += stock;
    }
    grandItems++;
  }

  // --- Check for duplicate warehouse entries per item ---
  let duplicateWarnings = 0;
  for (const item of allItems) {
    const seen = {};
    for (const ws of item.warehouseStocks) {
      const wName = (ws.warehouse || "").trim().toLowerCase();
      if (seen[wName]) {
        console.warn(`⚠️  DUPLICATE warehouse entry "${ws.warehouse}" on item: ${item.name} (${item.sku})`);
        duplicateWarnings++;
      }
      seen[wName] = true;
    }
  }

  // --- Print results ---
  console.log("=== STOCK BY WAREHOUSE ===");
  const sorted = Object.entries(warehouseTotals).sort((a, b) => b[1].qty - a[1].qty);
  for (const [wh, data] of sorted) {
    console.log(`  ${wh.padEnd(35)} qty: ${String(data.qty).padStart(6)}   (${data.items} item entries)`);
  }

  console.log("\n=== SUMMARY ===");
  console.log(`  Total unique items (standalone + group): ${grandItems}`);
  console.log(`  Total stock quantity (ALL warehouses):   ${grandTotal}`);
  console.log(`  Duplicate warehouse entries found:       ${duplicateWarnings}`);
  console.log("\n  ℹ️  The Inventory Report 'All Stores' should show:");
  console.log(`     TOTAL ITEMS    = ${allItems.length}`);
  console.log(`     TOTAL QUANTITY = ${grandTotal}`);

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
