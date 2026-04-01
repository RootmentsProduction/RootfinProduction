# Email Setup - Quick Reference

## 🚀 Quick Setup (5 Minutes)

### For Gmail Users (Easiest)

```
1. Go to: https://myaccount.google.com/apppasswords
2. Select: Mail + Windows Computer
3. Click: Generate
4. Copy: 16-character password
5. Update .env file (see below)
6. Run: npm install nodemailer
7. Restart: npm start
8. Test: Go to Inventory > Reorder Alerts > Test Email
```

---

## 📝 Update Your `.env` File

### Gmail
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

### Outlook
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Yahoo
```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

---

## ✅ Verification Checklist

- [ ] Email service chosen (Gmail/Outlook/Yahoo)
- [ ] App password generated (if required)
- [ ] `.env` file updated with credentials
- [ ] `npm install nodemailer` completed
- [ ] Backend server restarted
- [ ] Test email sent successfully
- [ ] Email received in inbox

---

## 🧪 Test Email

### Method 1: Frontend (Easiest)
```
1. Go to: Inventory > Reorder Alerts
2. Click: "Test Email" button
3. Enter: your email address
4. Click: "Send Test Email"
5. Check: Your inbox
```

### Method 2: Terminal
```bash
curl -X POST http://localhost:7000/api/reorder-alerts/test-email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"your-email@gmail.com\"}"
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Email credentials not configured" | Check `.env` file has EMAIL_USER and EMAIL_PASSWORD |
| "Invalid login credentials" | For Gmail: regenerate app password. For Outlook: use correct password |
| Email not received | Check spam folder, wait 1-2 minutes, try again |
| "SMTP connection timeout" | Check internet connection, try different email provider |
| Backend won't start | Check `.env` syntax, no extra spaces |

---

## 📧 What You'll Get

When stock reaches reorder point, admins receive email with:
- ✅ Product name and SKU
- ✅ Current stock level
- ✅ Reorder point threshold
- ✅ Warehouse location
- ✅ Recommended action

---

## 🎯 How It Works

```
Invoice Created
    ↓
Stock Reduced
    ↓
Check: Stock ≤ Reorder Point?
    ↓ YES
Alert Created
    ↓
Email Sent to Admins
    ↓
Alert Marked as "Notified"
```

---

## 📱 Gmail Setup (Step by Step)

### Step 1: Enable 2FA
- Go to: https://myaccount.google.com
- Click: Security
- Enable: 2-Step Verification

### Step 2: Generate App Password
- Go to: https://myaccount.google.com/apppasswords
- Select: Mail + Windows Computer
- Click: Generate
- Copy: 16-character password

### Step 3: Update .env
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

### Step 4: Install & Restart
```bash
npm install nodemailer
npm start
```

### Step 5: Test
- Go to: Inventory > Reorder Alerts
- Click: Test Email
- Enter: your email
- Click: Send

---

## 🔐 Security

- ✅ Never share app password
- ✅ Don't commit `.env` to git
- ✅ Use app-specific passwords
- ✅ Enable 2FA on email account
- ✅ Rotate passwords every 3 months

---

## 📞 Support

If stuck:
1. Check `.env` file is saved
2. Restart backend server
3. Check console for errors
4. Try test email again
5. Check spam folder
6. Verify credentials are correct

---

## 🎉 Done!

Once setup is complete:
- Automatic emails sent when stock reaches reorder point
- All admins notified automatically
- No manual action needed
- Professional email template
- Track when emails were sent

Enjoy automatic reorder alerts! 🚀
