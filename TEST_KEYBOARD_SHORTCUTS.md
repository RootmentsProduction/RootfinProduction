# Testing Keyboard Shortcuts

## How to Test

### Step 1: Open Browser Console
1. Press `F12` to open Developer Tools
2. Go to the "Console" tab
3. Keep it open while testing

### Step 2: Test Ctrl+I (Open Invoice List)
1. Go to the invoice creation page: `http://localhost:3000/sales/invoices/new`
2. Press `Ctrl+I` (or `Cmd+I` on Mac)
3. **Expected Result:** Should navigate to `/sales/invoices` (invoice list page)
4. **Check Console:** Look for any error messages

### Step 3: Test Ctrl+O (Create New Invoice)
1. Go to an invoice edit page: `http://localhost:3000/sales/invoices/[invoice-id]`
2. Press `Ctrl+O` (or `Cmd+O` on Mac)
3. **Expected Result:** Should navigate to `/sales/invoices/new` (create new invoice page)
4. **Check Console:** Look for any error messages

### Step 4: Test Ctrl+N (Create New Invoice)
1. Go to an invoice edit page: `http://localhost:3000/sales/invoices/[invoice-id]`
2. Press `Ctrl+N` (or `Cmd+N` on Mac)
3. **Expected Result:** Should navigate to `/sales/invoices/new` (create new invoice page)
4. **Check Console:** Look for any error messages

## Troubleshooting

### Shortcut Not Working?

#### Check 1: Browser Focus
- Make sure the browser window has focus (click on the page)
- Try clicking on the page content first, then press the shortcut

#### Check 2: Browser Conflicts
- Some browsers have default shortcuts that may conflict
- Try in a different browser (Chrome, Firefox, Safari, Edge)
- Check if your browser has the shortcut disabled

#### Check 3: Console Errors
- Open F12 Developer Tools
- Go to Console tab
- Look for any red error messages
- Take a screenshot and share the error

#### Check 4: Page URL
- Make sure you're on the correct page
- Ctrl+O and Ctrl+N only work on edit pages
- Ctrl+I works on any invoice page

### Browser-Specific Issues

#### Chrome/Edge
- Ctrl+O might open a file dialog
- Try using a different shortcut or disable the browser shortcut
- Check Settings > Keyboard shortcuts

#### Firefox
- Ctrl+I might open Inspector
- Try using a different shortcut
- Check Preferences > Keyboard

#### Safari (Mac)
- Cmd+O might open a file dialog
- Cmd+I might open Inspector
- Try using different shortcuts

#### Mac Users
- Replace `Ctrl` with `Cmd`
- So `Ctrl+O` becomes `Cmd+O`
- So `Ctrl+I` becomes `Cmd+I`
- So `Ctrl+N` becomes `Cmd+N`

## Debug Steps

### Step 1: Check if Hook is Running
Add this to the browser console:
```javascript
console.log("Testing keyboard shortcut hook");
```

### Step 2: Check Event Listener
Open Console and type:
```javascript
// This will show if event listeners are attached
window.addEventListener("keydown", (e) => {
  console.log("Key pressed:", e.key, "Ctrl:", e.ctrlKey);
});
```

### Step 3: Manual Test
Try pressing different key combinations and watch the console:
- Press `Ctrl+A` - should show in console
- Press `Ctrl+O` - should show in console and navigate
- Press `Ctrl+I` - should show in console and navigate

## Expected Console Output

When you press `Ctrl+O`, you should see:
```
Key pressed: o Ctrl: true
```

And the page should navigate to the invoice list or create page.

## If Still Not Working

1. **Clear Browser Cache**
   - Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
   - Clear all cache and cookies
   - Refresh the page

2. **Hard Refresh**
   - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
   - This forces a full page reload

3. **Check Network Tab**
   - Open F12 Developer Tools
   - Go to Network tab
   - Refresh the page
   - Look for any failed requests (red items)

4. **Check if JavaScript is Enabled**
   - Open F12 Developer Tools
   - Go to Settings
   - Make sure JavaScript is enabled

## Success Indicators

✅ Shortcut is working if:
- Page navigates to the correct URL
- No error messages in console
- URL changes in address bar
- Page content updates

❌ Shortcut is NOT working if:
- Page doesn't navigate
- Error messages in console
- URL doesn't change
- Page stays the same

## Report Issues

If shortcuts still don't work:
1. Take a screenshot of the console
2. Note which shortcut you tried
3. Note which page you were on
4. Note your browser and OS
5. Share this information for debugging
