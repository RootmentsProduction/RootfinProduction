import { sequelize } from "./models/sequelize/index.js";
import dotenv from 'dotenv';

dotenv.config();

/**
 * Analyze PostgreSQL Database
 * Check what tables and data exist in PostgreSQL
 */

async function analyzePostgresData() {
  try {
    console.log('🔍 Analyzing PostgreSQL Database...\n');
    
    // Get all tables in the database
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📊 PostgreSQL Tables Found:');
    console.log('============================');
    
    for (const table of tables) {
      const tableName = table.table_name;
      
      try {
        // Get row count for each table
        const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const rowCount = countResult[0].count;
        
        // Get column info
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          ORDER BY ordinal_position;
        `);
        
        console.log(`\n📋 Table: ${tableName}`);
        console.log(`   Records: ${rowCount}`);
        
        if (rowCount > 0) {
          console.log(`   Columns: ${columns.length}`);
          
          // Show first few columns
          const mainColumns = columns.slice(0, 5).map(col => 
            `${col.column_name} (${col.data_type})`
          ).join(', ');
          console.log(`   Main Columns: ${mainColumns}${columns.length > 5 ? '...' : ''}`);
          
          // Get sample data for tables with records
          try {
            const [sampleData] = await sequelize.query(`SELECT * FROM "${tableName}" LIMIT 1`);
            if (sampleData.length > 0) {
              const sample = sampleData[0];
              const sampleKeys = Object.keys(sample).slice(0, 3);
              console.log(`   Sample Data: ${sampleKeys.map(key => `${key}: ${sample[key]}`).join(', ')}`);
            }
          } catch (sampleError) {
            console.log(`   Sample Data: Unable to fetch (${sampleError.message})`);
          }
        }
        
      } catch (error) {
        console.log(`\n📋 Table: ${tableName}`);
        console.log(`   Error: ${error.message}`);
      }
    }
    
    console.log('\n🎯 Tables with Data (Candidates for Dual-Save):');
    console.log('================================================');
    
    const tablesWithData = [];
    
    for (const table of tables) {
      const tableName = table.table_name;
      
      try {
        const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const rowCount = parseInt(countResult[0].count);
        
        if (rowCount > 0) {
          tablesWithData.push({ name: tableName, count: rowCount });
        }
      } catch (error) {
        // Skip tables we can't access
      }
    }
    
    // Sort by record count (descending)
    tablesWithData.sort((a, b) => b.count - a.count);
    
    tablesWithData.forEach((table, index) => {
      const priority = table.count > 100 ? '🔥 HIGH' : table.count > 10 ? '⚠️  MEDIUM' : '📝 LOW';
      console.log(`${index + 1}. ${table.name}: ${table.count} records ${priority}`);
    });
    
    console.log('\n💡 Recommendations:');
    console.log('===================');
    
    if (tablesWithData.length === 0) {
      console.log('✅ No tables with data found - nothing to migrate');
    } else {
      console.log('🎯 Consider implementing dual-save for these tables:');
      
      // Prioritize tables with more data
      const highPriority = tablesWithData.filter(t => t.count > 10);
      const mediumPriority = tablesWithData.filter(t => t.count > 0 && t.count <= 10);
      
      if (highPriority.length > 0) {
        console.log('\n🔥 HIGH PRIORITY (>10 records):');
        highPriority.forEach(table => {
          console.log(`   - ${table.name} (${table.count} records)`);
        });
      }
      
      if (mediumPriority.length > 0) {
        console.log('\n📝 MEDIUM PRIORITY (1-10 records):');
        mediumPriority.forEach(table => {
          console.log(`   - ${table.name} (${table.count} records)`);
        });
      }
    }
    
    console.log('\n🔧 Next Steps:');
    console.log('==============');
    console.log('1. Review the tables above');
    console.log('2. Identify which ones need dual-save logic');
    console.log('3. Check if corresponding MongoDB models exist');
    console.log('4. Implement dual-save in the controllers');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

console.log('🔍 PostgreSQL Database Analyzer');
console.log('===============================\n');

analyzePostgresData();