const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/Home.jsx.bak', 'utf8');

// Find the start of the return statement
const returnIndex = content.indexOf('return (');
if (returnIndex === -1) {
  console.log('return statement not found');
  process.exit(1);
}

// We will keep the data processing logic but add store-wise grouping.
// Instead of just parsing `return`, we should probably replace the entire fetchDashboardData to also calculate store-wise data.

