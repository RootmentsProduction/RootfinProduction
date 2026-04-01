// Test Store API Endpoint
import fetch from 'node-fetch';

async function testStoreAPI() {
  try {
    console.log('🧪 TESTING STORE API ENDPOINT');
    console.log('=============================\n');

    const API_URL = 'http://localhost:7000';
    
    console.log('📋 Testing GET /api/stores/loc/700...');
    
    const response = await fetch(`${API_URL}/api/stores/loc/700`);
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Store data:');
      console.log(`   Store ID: ${data.store.id}`);
      console.log(`   Store Name: "${data.store.name}"`);
      console.log(`   LocCode: "${data.store.locCode}"`);
      console.log(`   IsActive: ${data.store.isActive}`);
    } else {
      const errorData = await response.text();
      console.log('❌ Error response:');
      console.log(errorData);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testStoreAPI();