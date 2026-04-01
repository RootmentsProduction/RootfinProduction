// Test script to verify invoice transaction creation
import fetch from 'node-fetch';

const API_URL = 'http://localhost:7000';

// Test data for invoice creation
const testInvoiceData = {
  invoiceNumber: "TEST-001",
  invoiceDate: new Date(),
  dueDate: new Date(),
  customer: "Test Customer",
  customerPhone: "1234567890",
  branch: "Head Office",
  orderNumber: "ORDER-001",
  terms: "Due on Receipt",
  salesperson: "Test Sales Person",
  subject: "Test Invoice",
  warehouse: "Warehouse",
  category: "Footwear", // This should be saved as transaction type
  subCategory: "Sports Shoes",
  paymentMethod: "Cash", // This should set cash amount to bill value
  lineItems: [
    {
      item: "Test Item",
      itemData: null,
      size: "10",
      quantity: 1,
      rate: 1000,
      tax: "gst18",
      amount: 1000,
    }
  ],
  customerNotes: "Thanks for your business.",
  termsAndConditions: "",
  discount: { value: "0", type: "%" },
  applyDiscountAfterTax: false,
  tdsTcsType: "TDS",
  tdsTcsTax: "",
  adjustment: "0.00",
  subTotal: 1000,
  discountAmount: 0,
  totalTax: 180,
  tdsTcsAmount: 0,
  adjustmentAmount: 0,
  finalTotal: 1180,
  status: "draft",
  userId: "test@example.com",
  locCode: "001",
};

async function testInvoiceCreation() {
  try {
    console.log('🧪 Testing invoice creation with category and payment method...');
    console.log('📋 Test Data:');
    console.log(`   Category: ${testInvoiceData.category}`);
    console.log(`   Payment Method: ${testInvoiceData.paymentMethod}`);
    console.log(`   Final Total: ₹${testInvoiceData.finalTotal}`);
    console.log('');

    const response = await fetch(`${API_URL}/api/sales/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testInvoiceData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Invoice created successfully!');
      console.log(`   Invoice Number: ${result.invoiceNumber}`);
      console.lo