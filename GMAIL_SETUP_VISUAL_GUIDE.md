# Gmail Setup - Visual Guide

## Complete Gmail Setup Process

### ✅ Step 1: Enable 2-Factor Authentication

**Go to:** https://myaccount.google.com

```
┌─────────────────────────────────────┐
│  Google Account                     │
├─────────────────────────────────────┤
│  Left Menu:                         │
│  • Personal info                    │
│  • Security ← CLICK HERE            │
│  • Privacy & personalization        │
│  • Data & privacy                   │
└─────────────────────────────────────┘
```

**In Security page:**

```
┌─────────────────────────────────────┐
│  Security                           │
├─────────────────────────────────────┤
│  How you sign in to Google:         │
│  • Password                         │
│  • 2-Step Verification ← CLICK      │
│  • App passwords                    │
│  • Security keys                    │
└─────────────────────────────────────┘
```

**Enable 2-Step Verification:**
- Click "2-Step Verification"
- Follow prompts
- Verify with your phone
- You'll get a backup code (save it!)

---

### ✅ Step 2: Generate App Password

**Go to:** https://myaccount.google.com/apppasswords

```
┌─────────────────────────────────────┐
│  App passwords                      │
├─────────────────────────────────────┤
│  Select the app and device:         │
│                                     │
│  App: [Mail ▼]                      │
│  Device: [Windows Computer ▼]       │
│                                     │
│  [Generate]                         │
└─────────────────────────────────────┘
```

**You'll see:**
```
┌─────────────────────────────────────┐
│  Your app password:                 │
│                                     │
│  abcd efgh ijkl mnop                │
│                                     │
│  [Copy]                             │
└─────────────────────────────────────┘
```

**Copy the password** (without spaces): `abcdefghijklmnop`

---

### ✅ Step 3: Update `.env` File

**Open:** `backend/.env`

**Find these lines:**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Replace with your details:**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=john@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Save the file** (Ctrl+S)

---

### ✅ Step 4: Install Nodemailer

**Open Terminal/Command Prompt in backend folder:**

```bash
npm install nodemailer
```

**Wait for installation to complete** (1-2 minutes)

---

### ✅ Step 5: Restart Backend Server

**Stop current server** (Ctrl+C)

**Start server again:**
```bash
npm start
```

**You should see:**
```
✅ Server running on port 7000
✅ Connected to MongoDB
```

---

### ✅ Step 6: Test Email Configuration

**Option A: Using Frontend (Easiest)**

1. Open your app in browser
2. Go to: **Inventory > Reorder Alerts**
3. Click: **"Test Email"** button
4. Enter: your email address
5. Click: **"Send Test Email"**
6. Wait 1-2 minutes
7. Check your inbox

**Option B: Using Terminal**

```bash
curl -X POST http://localhost:7000/api/reorder-alerts/test-email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"john@gmail.com\"}"
```

---

### ✅ Step 7: Verify Email Received

**Check your inbox:**

```
┌─────────────────────────────────────┐
│  Inbox                              │
├─────────────────────────────────────┤
│  From: your-email@gmail.com         │
│  Subject: Test Email - Reorder...   │
│  ✅ Email Configuration Successful  │
│                                     │
│  Your reorder alert email system    │
│  is configured and working.         │
└─────────────────────────────────────┘
```

**If not in inbox:**
- Check **Spam** folder
- Wait another minute
- Try sending test email again

---

## 🎯 Your `.env` File Should Look Like

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
POSTGRES_DB_DEV=rootfin_dev
POSTGRES_USER_DEV=postgres
POSTGRES_PASSWORD_DEV=admin
POSTGRES_HOST_DEV=localhost
POSTGRES_PORT_DEV=5432

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=john@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop

# Other settings
POSTGRES_LOGGING=false
SYNC_DB=true
DB_TYPE=both
```

---

## 🔍 Common Mistakes to Avoid

❌ **Wrong:** Using your regular Gmail password
✅ **Right:** Using 16-character app password

❌ **Wrong:** `EMAIL_PASSWORD=abcd efgh ijkl mnop` (with spaces)
✅ **Right:** `EMAIL_PASSWORD=abcdefghijklmnop` (no spaces)

❌ **Wrong:** Forgetting to enable 2FA
✅ **Right:** Enable 2FA first, then generate app password

❌ **Wrong:** Not restarting backend after updating `.env`
✅ **Right:** Always restart backend after changes

❌ **Wrong:** Checking inbox immediately
✅ **Right:** Wait 1-2 minutes for email to arrive

---

## 📊 Verification Checklist

```
Gmail Setup Checklist:

□ 2-Factor Authentication enabled
□ App password generated (16 characters)
□ .env file updated with:
  - EMAIL_SERVICE=gmail
  - EMAIL_USER=your-email@gmail.com
  - EMAIL_PASSWORD=16-char-password
□ npm install nodemailer completed
□ Backend server restarted
□ Test email sent successfully
□ Email received in inbox
□ Ready for automatic alerts!
```

---

## 🚀 What Happens Next

Once setup is complete:

1. **Create an invoice** with items
2. **Stock is reduced** automatically
3. **System checks** if stock ≤ reorder point
4. **Alert is created** in database
5. **Email sent automatically** to all admins
6. **Alert marked** as "notified"

---

## 🆘 Troubleshooting

### Email not received?

1. **Check spam folder** - Gmail sometimes marks as spam
2. **Wait 1-2 minutes** - Emails can be slow
3. **Try test email again** - Click "Test Email" button again
4. **Check console** - Look for error messages in terminal

### "Invalid login credentials"?

1. **Regenerate app password** - Go to apppasswords again
2. **Copy without spaces** - Make sure no spaces in password
3. **Check email address** - Verify it's correct
4. **Restart backend** - Stop and start server again

### Backend won't start?

1. **Check `.env` syntax** - No extra spaces or quotes
2. **Verify file saved** - Make sure changes are saved
3. **Check for typos** - EMAIL_SERVICE, EMAIL_USER, EMAIL_PASSWORD
4. **Restart terminal** - Close and reopen terminal

---

## ✨ Success!

When you see this in your inbox:

```
From: your-email@gmail.com
Subject: Test Email - Reorder Alert System

✅ Email Configuration Successful

Your reorder alert email system is configured 
and working correctly.

You will receive notifications when products 
reach their reorder point.
```

**You're all set!** 🎉

Automatic reorder alerts are now active and will send emails when stock reaches the reorder point.

---

## 📞 Need Help?

1. Check this guide again
2. Review troubleshooting section
3. Check console for error messages
4. Verify `.env` file is correct
5. Try test email again

Good luck! 🚀
