# Email Notification Setup Guide

## Overview
The reorder alert system now sends automatic email notifications to admins and warehouse managers when products reach their reorder point.

## Prerequisites
- Node.js with nodemailer package installed
- Email service credentials (Gmail, Outlook, or custom SMTP)

## Installation

### 1. Install Nodemailer
```bash
npm install nodemailer
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

#### For Gmail (Recommended for testing)
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Note:** For Gmail, you need to:
1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character app password in `EMAIL_PASSWORD`

#### For Outlook/Office 365
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### For Custom SMTP Server
```env
EMAIL_SERVICE=custom
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
EMAIL_SECURE=false
```

### 3. Update Backend Server File

Add the ReorderAlertRoutes to your main server file:

```javascript
import ReorderAlertRoutes from "./route/ReorderAlertRoutes.js";

// Add this line with your other routes
app.use("/api", ReorderAlertRoutes);
```

## Testing Email Configuration

### Method 1: Using API Endpoint

Send a POST request to test email:
```bash
curl -X POST http://localhost:7000/api/reorder-alerts/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

### Method 2: Using Frontend (Coming Soon)

A test email button will be added to the Reorder Alerts page.

## How It Works

### Automatic Email Notifications

1. **Alert Created**: When stock reaches reorder point
2. **Email Sent**: Automatically to all admins and warehouse managers
3. **Email Contains**:
   - Product name and SKU
   - Current stock level
   - Reorder point threshold
   - Warehouse location
   - Item group (if applicable)
   - Recommended action

### Email Recipients

Emails are automatically sent to:
- All users with `power: "admin"`
- All users with `role: "admin"` or `role: "superadmin"`
- All users with `role: "store_manager"`

### Email Content

The email includes:
- Professional HTML formatting
- Product details table
- Stock status with visual indicators
- Recommended action
- Alert ID and timestamp

## Troubleshooting

### Email Not Sending

1. **Check Environment Variables**
   ```bash
   # Verify in your .env file
   echo $EMAIL_USER
   echo $EMAIL_PASSWORD
   ```

2. **Check Gmail App Password**
   - Ensure 2FA is enabled
   - Generate new app password if needed
   - Use 16-character password without spaces

3. **Check Email Logs**
   - Look for error messages in console
   - Check if email service is accessible

4. **Test Connection**
   ```bash
   curl -X POST http://localhost:7000/api/reorder-alerts/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

### Common Errors

| Error | Solution |
|-------|----------|
| "Email credentials not configured" | Add EMAIL_USER and EMAIL_PASSWORD to .env |
| "Invalid login credentials" | Check email/password, regenerate Gmail app password |
| "SMTP connection timeout" | Check EMAIL_HOST and EMAIL_PORT settings |
| "No recipients provided" | Ensure admin users have valid email addresses |

## Email Customization

### Modify Email Template

Edit `backend/utils/emailService.js` in the `sendReorderAlertEmail` function to customize:
- Email subject line
- HTML content and styling
- Plain text version
- Sender name

### Example: Add Company Logo

```javascript
<img src="https://your-domain.com/logo.png" alt="Company Logo" style="max-width: 200px; margin-bottom: 20px;">
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

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Use app-specific passwords** instead of main account password
4. **Enable 2FA** on email accounts
5. **Rotate credentials** regularly
6. **Use HTTPS** for all API calls

## Monitoring

### Check Email Logs

The system logs all email operations:
```
✅ Reorder alert email sent successfully. Message ID: <message-id>
❌ Error sending reorder alert email: <error-details>
```

### Database Records

Check `ReorderAlert` collection for:
- `notifiedAt`: Timestamp when email was sent
- `status`: "active", "notified", or "resolved"

## Future Enhancements

- [ ] SMS notifications
- [ ] Slack/Teams integration
- [ ] Webhook notifications
- [ ] Email template customization UI
- [ ] Recipient management UI
- [ ] Email delivery tracking
- [ ] Retry logic for failed emails
- [ ] Batch email sending

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs for error messages
3. Test email configuration using the test endpoint
4. Verify environment variables are set correctly
