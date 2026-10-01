const fs = require('fs');
const path = require('path');

const pagesDir = '/Users/abijithgkaimal/Documents/RootfinBrynexTestenv/frontend/src/pages/';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

let count = 0;
files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes("isSidebarOpen ? 'ml-64' : 'ml-0'")) {
    content = content.replace(/isSidebarOpen \? 'ml-64' : 'ml-0'/g, "isSidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'");
    
    // Let's also do p-6 to p-3 sm:p-6 for the main container if it exists on the same line
    content = content.replace(/className=\{`([^`]*)p-6([^`]*)isSidebarOpen/g, "className={`$1p-3 sm:p-6$2isSidebarOpen");

    fs.writeFileSync(filePath, content);
    count++;
  }
});
console.log(`Updated ${count} files.`);
