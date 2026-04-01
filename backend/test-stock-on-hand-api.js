// Test the stock on hand API directly
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:7000';

async function testStockOnHandAPI() {
  try {
    console.log("🧪 Testing Stock On Hand API...");
    
    // Test with current date (today)
    const today = new Date().toISOString().split('T')[0];
    const startDate = '2026-01-01'; // Start from beginning of year when items were created
    
    console.log(`📅 Testing with date range: ${startDate} to ${today}`);
    
    const params = new URLSearchParams({
      warehouse: 'Warehouse', // Test with "All Stores"
      userId: 'officerootments@gmail.com',
      locCode: '858',
      startDate: startDate,
      endDate: today
    });
    
    const url = `${baseUrl}/api/reports/inventory/stock-on-hand?${params}`;
    console.log(`🔗 Calling: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ API Error: ${response.status} - ${text}`);
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log("✅ API call successful!");
      console.log("📊 Summary:", result.data.summary);
      console.log(`📦 Items found: ${result.data.itemDetails?.length || 0}`);
      
      if (result.data.itemDetails && result.data.itemDetails.length > 0) {
        console.log("\n📋 First 3 items:");
        result.data.itemDetails.slice(0, 3).forEach((item, idx) => {
          console.log(`  ${idx + 1}. ${item.itemName}`);
          console.log(`     Opening: ${item.openingStock}, In: ${item.stockIn}, Out: ${item.stockOut}, Closing: ${item.closingStock}`);
          console.log(`     Value: ₹${item.stockValue}`);
          console.log(`     Raw item:`, JSON.stringify(item, null, 2));
        });
      } else {
        console.log("❌ No items returned - this explains the zero values!");
      }
    } else {
      console.error("❌ API returned error:", result.message);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testStockOnHandAPI();