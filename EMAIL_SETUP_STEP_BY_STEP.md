# Email Setup - Step by Step Guide

## Option 1: Gmail (Recommended - Easiest)

### Step 1: Enable 2-Factor Authentication on Google Account

1. Go to https://myaccount.google.com
2. Click **"Security"** in the left menu
3. Scroll down to **"How you sign in to Google"**
4. Click **"2-Step Verification"**
5. Follow the steps to enable 2FA
6. You'll need your phone to verify

### Step 2: Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. You should see a dropdown that says **"Select the app and device you're using"**
3. Select:
   - **App:** Mail
   - **Device:** Windows Computer (or your device type)
4. Click **"Generate"**
5. Google will show you a **16-character password** (looks like: `abcd efgh ijkl mnop`)
6. **Copy this password** (without spaces)

### Step 3: Update Your `.env` File

Open `backend/.env` and update these lines:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Replace:**
- `your-email@gmail.com` with your actual Gmail address
- `abcdefghijklmnop` with the 16-character password (without spaces)

### Step 4: Install Nodemailer

Run this command in your backend folder:

```bash
npm install nodemailer
```

### Step 5: Restart Your Backend Server

```bash
npm start
```

### Step 6: Test Email Configuration

**Option A: Using Frontend**
1. Go to **Inventory > Reorder Alerts**
2. Click **"Test Email"** button
3. Enter your email address
4. Click **"Send Test Email"**
5. Check your inbox (may take 1-2 minutes)

**Option B: Using Terminal/Command Prompt**

```bash
curl -X POST http://localhost:7000/api/reorder-alerts/test-email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"your-email@gmail.com\"}"
```

### Step 7: Verify Email Received

- Check your inbox for the test email
- Subject: "Test Email - Reorder Alert System"
- If you don't see it, check spam folder

---

## Option 2: Outlook/Office 365

### Step 1: Update `.env` File

```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Step 2: Install Nodemailer

```bash
npm install nodemailer
```

### Step 3: Restart Backend

```bash
npm start
```

### Step 4: Test Email

Follow Step 6 from Gmail setup above.

---

## Option 3: Yahoo Mail

### Step 1: Generate App Password

1. Go to https://login.yahoo.com
2. Click your account icon
3. Go to **Account info > Security**
4. Click **"Generate app password"**
5. Select **Mail** and **Other App**
6. Copy the generated password

### Step 2: Update `.env` File

```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

### Step 3: Install Nodemailer

```bash
npm install nodemailer
```

### Step 4: Restart Backend

```bash
npm start
```

---

## Troubleshooting

### Problem: "Email credentials not configured"

**Solution:** Check your `.env` file has these lines:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Problem: "Invalid login credentials"

**For Gmail:**
- Make sure 2FA is enabled
- Generate a NEW app password
- Use the 16-character password WITHOUT spaces
- Don't use your regular Gmail password

**For Outlook:**
- Use your full email address
- Use your actual Outlook password

### Problem: Email not received

1. Check spam/junk folder
2. Wait 1-2 minutes (emails can be slow)
3. Check console for error messages
4. Try sending test email again

### Problem: "SMTP connection timeout"

- Check your internet connection
- Verify email service is accessible
- Try a different email provider

---

## How to Find Your Email Configuration

### Gmail
- **Service:** gmail
- **Email:** your-email@gmail.com
- **Password:** 16-character app password (from Step 2)

### Outlook
- **Service:** outlook
- **Email:** your-email@outlook.com
- **Password:** Your Outlook password

### Yahoo
- **Service:** yahoo
- **Email:** your-email@yahoo.com
- **Password:** App password from Yahoo

---

## Complete `.env` Example

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
POSTGRES_DB_DEV=rootfin_dev
POSTGRES_USER_DEV=postgres
POSTGRES_PASSWORD_DEV=admin
POSTGRES_HOST_DEV=localhost
POSTGRES_PORT_DEV=5432

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop

# Other settings
POSTGRES_LOGGING=false
SYNC_DB=true
DB_TYPE=both
```

---

## After Setup

### What Happens Automatically

1. When you create an invoice
2. Stock is reduced
3. System checks if stock ≤ reorder point
4. If yes, alert is created
5. **Email automatically sent** to all admins
6. Alert marked as "notified"

### Manual Testing

1. Go to **Inventory > Reorder Alerts**
2. Click **"Test Email"** button
3. Enter your email
4. Click **"Send Test Email"**
5. Check inbox

### View Alerts

1. Go to **Inventory > Reorder Alerts**
2. See all active alerts
3. Click **"Notify"** to send email manually
4. Click **"Resolve"** when stock is replenished
5. Click **"Delete"** to remove alert

---

## Security Tips

1. **Never share your app password**
2. **Don't commit `.env` to git** (add to `.gitignore`)
3. **Use app-specific passwords** (not your main password)
4. **Enable 2FA** on your email account
5. **Rotate passwords** every 3 months

---

## Need Help?

If email still doesn't work:

1. Check `.env` file is saved
2. Restart backend server
3. Check console for error messages
4. Try test email again
5. Check spam folder
6. Verify email credentials are correct

---

## Next Steps

1. ✅ Choose email provider (Gmail recommended)
2. ✅ Follow setup steps for your provider
3. ✅ Update `.env` file
4. ✅ Install nodemailer: `npm install nodemailer`
5. ✅ Restart backend: `npm start`
6. ✅ Test email configuration
7. ✅ Create test invoice to trigger alert
8. ✅ Verify email received
