const fs = require('fs');
const babel = require('@babel/core');
const content = fs.readFileSync('src/pages/Home.jsx', 'utf-8');
try {
  babel.parse(content, {
    presets: ['@babel/preset-react'],
    filename: 'src/pages/Home.jsx'
  });
  console.log("No syntax errors found by Babel.");
} catch (e) {
  console.error("Syntax Error:", e.message);
}
