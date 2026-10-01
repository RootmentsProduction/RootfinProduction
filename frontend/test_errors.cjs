const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set localStorage
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('rootfinuser', JSON.stringify({ power: 'admin', role: 'superadmin' }));
  });

  page.on('pageerror', error => {
    console.log('PAGE_ERROR:', error.message);
    console.log(error.stack);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE_ERROR:', msg.text());
    }
  });

  console.log('Visiting /purchase/vendors');
  await page.goto('http://localhost:5173/purchase/vendors', { waitUntil: 'networkidle0' });
  
  console.log('Visiting /purchase/bills');
  await page.goto('http://localhost:5173/purchase/bills', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
