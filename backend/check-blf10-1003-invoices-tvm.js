// Check invoices for BLF10-1003 (Shoe Formal-1003 - BLACK/10) in Grooms Trivandrum
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SalesInvoice from './model/SalesInvoice.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Helper function to match Trivandrum branch names
const matchesTrivandrum = (locationName) => {
  if (!locationName) return false;
  const name = locationName.toLowerCase().trim();
  return name.includes('trivandrum') || name.includes('trivandum') ||
         name.includes('sg-trivandrum') || name.includes('sg.tvm') ||
         name.includes('sg-tvm') || name.includes('sg.trivandrum') ||
         name.includes('grooms trivandrum') || name === 'trivandrum branch' ||
         name.includes('grooms trivandum');
};

// Check invoices for BLF10-1003 in Trivandrum
const checkBLF10InvoicesInTVM = async () => {
  console.log('\n=== CHECKING INVOICES FOR BLF10-1003 IN GROOMS TRIVANDRUM ===\n');
  
  const targetSKU = 'BLF10-1003';
  const targetItemName = 'Shoe Formal-1003 - BLACK/10';
  
  console.log(`🔍 Searching for invoices containing: ${targetSKU} (${targetItemName})`);
  console.log(`📍 Location: Grooms Trivandrum branch\n`);
  
  try {
    // Find all sales invoices that contain the target SKU
    const invoicesWithItem = await SalesInvoice.find({
      'items.sku': targetSKU
    }).sort({ invoiceDate: -1 });
    
    console.log(`📊 Total invoices found with ${targetSKU}: ${invoicesWithItem.length}`);
    
    if (invoicesWithItem.length === 0) {
      console.log(`❌ No invoices found containing ${targetSKU}`);
      return;
    }
    
    // Filter invoices from Trivandrum branch
    const tvmInvoices = invoicesWithItem.filter(invoice => 
      matchesTrivandrum(invoice.location) || 
      matchesTrivandrum(invoice.branch) ||
      matchesTrivandrum(invoice.store)
    );
    
    console.log(`📍 Invoices from Trivandrum branch: ${tvmInvoices.length}\n`);
    
    if (tvmInvoices.length === 0) {
      console.log(`❌ No invoices found for ${targetSKU} in Trivandrum branch`);
      console.log(`\n📋 Locations where this item was sold:`);
      
      const locationCounts = {};
      invoicesWithItem.forEach(invoice => {
        const location = invoice.location || invoice.branch || invoice.store || 'Unknown';
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      });
      
      Object.entries(locationCounts).forEach(([location, count]) => {
        console.log(`   - ${location}: ${count} invoices`);
      });
      
      return;
    }
    
    // Analyze the Trivandrum invoices
    let totalQuantitySold = 0;
    let totalRevenue = 0;
    let invoiceDetails = [];
    
    console.log(`📋 DETAILED INVOICE ANALYSIS:\n`);
    console.log(`${'Invoice #'.padEnd(15)} | ${'Date'.padEnd(12)} | ${'Qty'.padEnd(5)} | ${'Price'.padEnd(8)} | ${'Total'.padEnd(8)} | Customer`);
    console.log(`${'-'.repeat(15)} | ${'-'.repeat(12)} | ${'-'.repeat(5)} | ${'-'.repeat(8)} | ${'-'.repeat(8)} | ${'-'.repeat(20)}`);
    
    tvmInvoices.forEach(invoice => {
      // Find the specific item in the invoice
      const targetItem = invoice.items.find(item => item.sku === targetSKU);
      
      if (targetItem) {
        const quantity = targetItem.quantity || 0;
        const price = targetItem.sellingPrice || targetItem.price || 0;
        const itemTotal = quantity * price;
        
        totalQuantitySold += quantity;
        totalRevenue += itemTotal;
        
        const invoiceDate = invoice.invoiceDate ? 
          new Date(invoice.invoiceDate).toLocaleDateString('en-GB') : 
          'N/A';
        
        const customerName = invoice.customerName || 
          invoice.customer?.name || 
          invoice.customer || 
          'Walk-in Customer';
        
        console.log(`${(invoice.invoiceNumber || 'N/A').toString().padEnd(15)} | ${invoiceDate.padEnd(12)} | ${quantity.toString().padEnd(5)} | ₹${price.toString().padEnd(7)} | ₹${itemTotal.toString().padEnd(7)} | ${customerName.substring(0, 18)}`);
        
        invoiceDetails.push({
          invoiceNumber: invoice.invoiceNumber,
          date: invoiceDate,
          quantity,
          price,
          total: itemTotal,
          customer: customerName,
          invoiceTotal: invoice.totalAmount || 0,
          paymentMethod: invoice.paymentMethod || 'N/A'
        });
      }
    });
    
    // Summary statistics
    console.log(`\n📊 SUMMARY STATISTICS:`);
    console.log(`   Total Invoices: ${tvmInvoices.length}`);
    console.log(`   Total Quantity Sold: ${totalQuantitySold} units`);
    console.log(`   Total Revenue from this item: ₹${totalRevenue.toLocaleString()}`);
    console.log(`   Average Price per unit: ₹${totalQuantitySold > 0 ? (totalRevenue / totalQuantitySold).toFixed(2) : 0}`);
    console.log(`   Average Quantity per Invoice: ${tvmInvoices.length > 0 ? (totalQuantitySold / tvmInvoices.length).toFixed(1) : 0} units`);
    
    // Date range analysis
    if (invoiceDetails.length > 0) {
      const dates = invoiceDetails.map(inv => new Date(inv.date.split('/').reverse().join('-'))).filter(d => !isNaN(d));
      if (dates.length > 0) {
        const earliestDate = new Date(Math.min(...dates)).toLocaleDateString('en-GB');
        const latestDate = new Date(Math.max(...dates)).toLocaleDateString('en-GB');
        
        console.log(`\n📅 DATE RANGE:`);
        console.log(`   First Sale: ${earliestDate}`);
        console.log(`   Last Sale: ${latestDate}`);
      }
    }
    
    // Payment method analysis
    console.log(`\n💳 PAYMENT METHODS:`);
    const paymentMethods = {};
    invoiceDetails.forEach(inv => {
      const method = inv.paymentMethod || 'Unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });
    
    Object.entries(paymentMethods).forEach(([method, count]) => {
      console.log(`   - ${method}: ${count} invoices`);
    });
    
    // Monthly sales breakdown
    console.log(`\n📈 MONTHLY BREAKDOWN:`);
    const monthlySales = {};
    invoiceDetails.forEach(inv => {
      if (inv.date !== 'N/A') {
        const [day, month, year] = inv.date.split('/');
        const monthKey = `${year}-${month.padStart(2, '0')}`;
        if (!monthlySales[monthKey]) {
          monthlySales[monthKey] = { quantity: 0, revenue: 0, invoices: 0 };
        }
        monthlySales[monthKey].quantity += inv.quantity;
        monthlySales[monthKey].revenue += inv.total;
        monthlySales[monthKey].invoices += 1;
      }
    });
    
    Object.entries(monthlySales).sort().forEach(([month, data]) => {
      console.log(`   - ${month}: ${data.quantity} units, ₹${data.revenue}, ${data.invoices} invoices`);
    });
    
    // Current stock check
    console.log(`\n📦 CURRENT STOCK STATUS:`);
    console.log(`   Based on TVM analysis: Database shows 1 unit, Image shows 2 units`);
    console.log(`   Discrepancy: -1 unit (Database missing 1 unit)`);
    
    if (totalQuantitySold > 0) {
      console.log(`\n💡 INSIGHTS:`);
      console.log(`   - This item has sales activity in Trivandrum (${totalQuantitySold} units sold)`);
      console.log(`   - Current stock discrepancy might be due to recent sales or stock adjustments`);
      console.log(`   - Consider checking recent transactions around the image date (21-01-2026)`);
    }
    
  } catch (error) {
    console.error('❌ Error checking invoices:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkBLF10InvoicesInTVM();
  
  console.log('\n=== BLF10-1003 INVOICE CHECK COMPLETED ===');
  
  process.exit(0);
};

main().catch(console.error);