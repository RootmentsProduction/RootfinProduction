import { Store } from "./models/sequelize/index.js";
import { getSequelize } from "./db/postgresql.js";
import dotenv from 'dotenv';

dotenv.config();

const checkStores = async () => {
  try {
    // Initialize database connection
    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
    
    // Find all stores
    const allStores = await Store.findAll({
      order: [['name', 'ASC']]
    });
    
    console.log('\n=== All Stores in Database ===');
    console.log(`Total stores: ${allStores.length}`);
    
    allStores.forEach(store => {
      console.log(`📍 ${store.name} | LocCode: ${store.locCode} | Active: ${store.isActive} | ID: ${store.id}`);
    });
    
    // Check specifically for MG Road related stores
    console.log('\n=== MG Road Related Stores ===');
    const mgRoadStores = await Store.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { name: { [sequelize.Sequelize.Op.iLike]: '%mg%road%' } },
          { name: { [sequelize.Sequelize.Op.iLike]: '%mg road%' } },
          { locCode: '729' },
          { locCode: '718' }
        ]
      }
    });
    
    console.log(`Found ${mgRoadStores.length} MG Road related stores:`);
    mgRoadStores.forEach(store => {
      console.log(`📍 "${store.name}" | LocCode: "${store.locCode}" | Active: ${store.isActive}`);
    });
    
    // Check for location code 729 specifically
    console.log('\n=== Location Code 729 Check ===');
    const loc729Store = await Store.findOne({ where: { locCode: '729' } });
    if (loc729Store) {
      console.log(`✅ Store with locCode 729 exists: "${loc729Store.name}"`);
    } else {
      console.log(`❌ No store with locCode 729 found`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkStores();