# Automatic Email Alerts Setup

## Quick Start

### 1. Install Nodemailer
```bash
npm install nodemailer
```

### 2. Add Environment Variables to `.env`

#### Gmail (Recommended for Testing)
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Gmail Setup:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Copy the 16-character password
4. Paste it in `EMAIL_PASSWORD` (without spaces)

#### Outlook
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### 3. Register Routes in Server

Add to your main server file (e.g., `server.js` or `index.js`):

```javascript
import ReorderAlertRoutes from "./route/ReorderAlertRoutes.js";

// Add with your other routes
app.use("/api", ReorderAlertRoutes);
```

### 4. Restart Backend Server

```bash
npm start
```

## How It Works

### Automatic Flow

1. **Invoice Created** → Stock is reduced
2. **System Checks** → Is stock ≤ reorder point?
3. **Alert Created** → If yes, alert is created in database
4. **Email Sent** → Automatically to all admins and warehouse managers
5. **Alert Marked** → Alert is marked as "notified" with timestamp

### Email Recipients

Emails are automatically sent to users with:
- `power: "admin"`
- `role: "admin"` or `role: "superadmin"`
- `role: "store_manager"`

## Testing

### Test Email Configuration

**Option 1: Using API**
```bash
curl -X POST http://localhost:7000/api/reorder-alerts/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

**Option 2: Using Frontend**
1. Go to **Inventory > Reorder Alerts**
2. Click **"Test Email"** button
3. Enter your email address
4. Click **"Send Test Email"**
5. Check your inbox

### Expected Response
```json
{
  "message": "Test email sent successfully",
  "email": "your-email@example.com"
}
```

## Email Content

The automatic email includes:

- **Product Information**
  - Product name
  - SKU
  - Warehouse location
  - Item group (if applicable)

- **Stock Status**
  - Current stock level (highlighted in red)
  - Reorder point threshold (highlighted in yellow)

- **Recommended Action**
  - "Please place a purchase order for this product immediately"

- **Alert Details**
  - Alert ID
  - Timestamp

## Troubleshooting

### Email Not Sending

**Check 1: Environment Variables**
```bash
# Verify variables are set
echo $EMAIL_USER
echo $EMAIL_PASSWORD
```

**Check 2: Gmail App Password**
- Ensure 2FA is enabled on Google Account
- Generate new app password
- Use 16-character password without spaces

**Check 3: Email Service Accessible**
```bash
# Test connection
curl -X POST http://localhost:7000/api/reorder-alerts/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com"}'
```

**Check 4: Console Logs**
Look for error messages:
```
❌ Error sending reorder alert email: [error details]
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Email credentials not configured" | Add EMAIL_USER and EMAIL_PASSWORD to .env |
| "Invalid login credentials" | Regenerate Gmail app password |
| "SMTP connection timeout" | Check internet connection, verify email service |
| "No admin users found" | Ensure at least one user has `power: "admin"` |
| "No valid email addresses" | Ensure admin users have valid email in database |

## Email Customization

### Change Email Subject

Edit `backend/utils/emailService.js`:
```javascript
subject: `🚨 Low Stock Alert: ${alert.itemName} (${alert.itemSku || "N/A"})`,
```

### Change Email Template

Edit the `htmlContent` variable in `sendReorderAlertEmail()` function to customize:
- Colors
- Layout
- Text content
- Add company logo
- Add footer

### Example: Add Company Logo

```javascript
<img src="https://your-domain.com/logo.png" 
     alt="Company Logo" 
     style="max-width: 200px; margin-bottom: 20px;">
```

## Advanced Configuration

### Using SendGrid

```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
```

### Using AWS SES

```env
EMAIL_SERVICE=aws-ses
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### Using Custom SMTP

```env
EMAIL_SERVICE=custom
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
EMAIL_SECURE=false
```

## Monitoring

### Check Alert Status

View alerts in database:
```javascript
// Active alerts (not yet notified)
db.reorderalerts.find({ status: "active", notifiedAt: null })

// Notified alerts
db.reorderalerts.find({ notifiedAt: { $exists: true } })

// Resolved alerts
db.reorderalerts.find({ status: "resolved" })
```

### Check Email Logs

Console output shows:
```
✅ Reorder alert email sent successfully. Message ID: <id>
📧 Sending reorder alert email to 3 recipient(s)...
```

## API Endpoints

### Test Email
```
POST /api/reorder-alerts/test-email
Body: { "email": "test@example.com" }
```

### Get All Alerts
```
GET /api/reorder-alerts?status=active
```

### Get Warehouse Alerts
```
GET /api/reorder-alerts/warehouse/:warehouse
```

### Mark as Notified
```
PUT /api/reorder-alerts/:id/notify
```

### Resolve Alert
```
PUT /api/reorder-alerts/:id/resolve
```

### Delete Alert
```
DELETE /api/reorder-alerts/:id
```

## Security Best Practices

1. **Never commit credentials** to git
2. **Use .env file** for all sensitive data
3. **Use app-specific passwords** (Gmail)
4. **Enable 2FA** on email accounts
5. **Rotate credentials** regularly
6. **Use HTTPS** for all API calls
7. **Validate email addresses** before sending

## Performance Considerations

- Emails are sent asynchronously (non-blocking)
- Alert creation doesn't fail if email fails
- Duplicate alerts are prevented (one per item/warehouse)
- Email sending is logged for debugging

## Future Enhancements

- [ ] SMS notifications
- [ ] Slack/Teams integration
- [ ] Webhook notifications
- [ ] Email template builder UI
- [ ] Recipient management UI
- [ ] Email delivery tracking
- [ ] Retry logic for failed emails
- [ ] Batch email sending
- [ ] Email scheduling
- [ ] Multi-language support

## Support

For issues:
1. Check troubleshooting section
2. Review console logs
3. Test email configuration
4. Verify environment variables
5. Check database records

## Files Modified/Created

**Created:**
- `backend/utils/emailService.js` - Email sending logic
- `backend/utils/reorderNotification.js` - Alert creation with email
- `backend/route/ReorderAlertRoutes.js` - API endpoints
- `backend/model/ReorderAlert.js` - Database schema
- `frontend/src/pages/ReorderAlerts.jsx` - Alert management UI

**Modified:**
- `backend/utils/stockManagement.js` - Added reorder check
- `frontend/src/App.jsx` - Added route
- `frontend/src/components/Nav.jsx` - Added navigation link

## Next Steps

1. ✅ Install nodemailer
2. ✅ Configure .env file
3. ✅ Register routes in server
4. ✅ Restart backend
5. ✅ Test email configuration
6. ✅ Create test invoice to trigger alert
7. ✅ Verify email received
