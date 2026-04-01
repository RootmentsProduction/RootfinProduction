# Restart Backend Server

## What I Did

✅ Added ReorderAlertRoutes import to `backend/server.js`
✅ Registered the routes in the Express app
✅ Routes are now available at `/api/reorder-alerts`

## How to Restart

### Step 1: Stop Current Server
- Go to your terminal where backend is running
- Press: **Ctrl + C**
- Wait for it to stop

### Step 2: Start Server Again
```bash
npm start
```

### Step 3: Verify It's Running
You should see:
```
🚀  Server listening on :7000
💾 Connected databases: MongoDB
```

### Step 4: Test the API
Go to your app and:
1. **Inventory > Reorder Alerts**
2. Click **"Test Email"** button
3. Enter your email
4. Click **"Send Test Email"**

## If Still Getting Errors

### Check 1: Backend Running?
- Open browser: http://localhost:7000
- Should see: "App is running on AWS"

### Check 2: Routes Registered?
- Open browser: http://localhost:7000/api/test
- Should see JSON response

### Check 3: Email Configured?
- Check `.env` file has:
  ```env
  EMAIL_SERVICE=gmail
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASSWORD=your-app-password
  ```

### Check 4: Nodemailer Installed?
```bash
npm list nodemailer
```

If not installed:
```bash
npm install nodemailer
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Failed to fetch alerts" | Restart backend server |
| "<!DOCTYPE" error | Routes not registered, restart server |
| "Email credentials not configured" | Check `.env` file |
| "Invalid login credentials" | Check Gmail app password |

## Quick Checklist

- [ ] Backend server stopped (Ctrl+C)
- [ ] Backend server restarted (npm start)
- [ ] Server shows "listening on :7000"
- [ ] `.env` file has email config
- [ ] Nodemailer installed (npm list nodemailer)
- [ ] Try test email again

Done! 🚀
