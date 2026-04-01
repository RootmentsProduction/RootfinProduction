// Debug script to test stock on hand report
import ShoeItem from "./model/ShoeItem.js";
import ItemGroup from "./model/ItemGroup.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to database
const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_DEV || "mongodb://localhost:27017/rootfin";
console.log("🔗 Connecting to MongoDB:", mongoUri.replace(/\/\/.*@/, "//***:***@"));

try {
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB successfully");
} catch (error) {
  console.error("❌ MongoDB connection failed:", error.message);
  process.exit(1);
}

async function debugStockReport() {
  try {
    console.log("🔍 Debugging Stock Report...");
    
    // Check total count first
    const totalItems = await ShoeItem.countDocuments();
    console.log(`📊 Total items in database: ${totalItems}`);
    
    if (totalItems === 0) {
      console.log("❌ No items found in database. This explains why everything shows 0.");
      return;
    }
    
    // Get a few items to test
    const items = await ShoeItem.find({}).limit(5);
    console.log(`📦 Found ${items.length} items to analyze`);
    
    items.forEach((item, index) => {
      console.log(`\n--- Item ${index + 1}: ${item.itemName} ---`);
      console.log(`SKU: ${item.sku}`);
      console.log(`Cost Price: ${item.costPrice}`);
      console.log(`Created At: ${item.createdAt}`);
      console.log(`Warehouse Stocks:`, item.warehouseStocks?.length || 0, "entries");
      
      if (item.warehouseStocks && item.warehouseStocks.length > 0) {
        item.warehouseStocks.forEach((ws, wsIndex) => {
          console.log(`  Warehouse ${wsIndex + 1}:`);
          console.log(`    Warehouse: ${ws.warehouse}`);
          console.log(`    Opening Stock: ${ws.openingStock}`);
          console.log(`    Stock On Hand: ${ws.stockOnHand}`);
          console.log(`    Stock: ${ws.stock}`);
        });
      } else {
        console.log("  ❌ No warehouse stocks found - this is why stock shows 0");
      }
    });
    
    // Check item groups too
    const totalGroups = await ItemGroup.countDocuments();
    console.log(`\n📊 Total item groups in database: ${totalGroups}`);
    
    if (totalGroups > 0) {
      const groups = await ItemGroup.find({}).limit(2);
      console.log(`📦 Found ${groups.length} groups to analyze`);
      
      groups.forEach((group, index) => {
        console.log(`\n--- Group ${index + 1}: ${group.name} ---`);
        console.log(`Items in group: ${group.items?.length || 0}`);
        
        if (group.items && group.items.length > 0) {
          const firstItem = group.items[0];
          console.log(`  First item: ${firstItem.name}`);
          console.log(`  Warehouse stocks: ${firstItem.warehouseStocks?.length || 0} entries`);
          
          if (firstItem.warehouseStocks && firstItem.warehouseStocks.length > 0) {
            const firstWs = firstItem.warehouseStocks[0];
            console.log(`    First warehouse: ${firstWs.warehouse}`);
            console.log(`    Stock: ${firstWs.stockOnHand || firstWs.stock || 0}`);
          }
        }
      });
    }
    
    // Test date parsing
    const testStartDate = "2026-02-11";
    const testEndDate = "2026-02-27";
    
    console.log("\n🗓️ Testing date parsing:");
    console.log(`Start Date: ${testStartDate} -> ${new Date(testStartDate)}`);
    console.log(`End Date: ${testEndDate} -> ${new Date(testEndDate)}`);
    
    const startDateObj = new Date(testStartDate);
    startDateObj.setHours(0, 0, 0, 0);
    
    const endDateObj = new Date(testEndDate);
    endDateObj.setHours(23, 59, 59, 999);
    
    console.log(`Processed Start Date: ${startDateObj}`);
    console.log(`Processed End Date: ${endDateObj}`);
    
    // Check if dates are in the future
    const now = new Date();
    console.log(`Current Date: ${now}`);
    console.log(`Start date is in future: ${startDateObj > now}`);
    console.log(`End date is in future: ${endDateObj > now}`);
    
    // Test with current date
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📅 Suggestion: Try using current date instead: ${today}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

debugStockReport();