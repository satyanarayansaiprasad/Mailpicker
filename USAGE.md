# Mail Picker - Usage Guide

## Quick Start

### 1. Installation
```bash
# Install dependencies
npm install

# Run the application
npm start
```

### 2. First Time Setup

#### Step 1: Configure Email Settings
1. Open the application
2. In the "Email Configuration" section:
   - Select your email service (Gmail, Outlook, Yahoo, or Custom)
   - Enter your email address
   - Enter your password or app password
   - Click "Save Configuration"

#### Step 2: Prepare Your CSV File
Your CSV file should have columns for email addresses and optionally names:

```csv
name,email,company
John Doe,john.doe@example.com,Tech Corp
Jane Smith,jane.smith@example.com,Design Inc
```

#### Step 3: Load CSV File
1. Click "Choose CSV File"
2. Select your CSV file
3. The app will auto-detect email and name columns

#### Step 4: Select Random Recipients
1. Set the number of records to select (default: 10)
2. Verify the email and name column names
3. Click "Select Random Data"

#### Step 5: Compose and Send Emails
1. Enter your email subject
2. Write your message (use `{name}` for personalization)
3. Click "Send Emails"

## Detailed Features

### Email Configuration

#### Gmail Setup
1. Enable 2-factor authentication in your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use your Gmail address and the generated app password

#### Outlook Setup
1. Use your Outlook email and regular password
2. If 2FA is enabled, generate an app password
3. Use your Outlook email and the app password

#### Yahoo Setup
1. Enable 2-factor authentication
2. Generate an App Password:
   - Account Security → Generate and manage app passwords
   - Create password for "Mail"
3. Use your Yahoo email and the app password

### CSV File Requirements

#### Required Columns
- **Email column**: Must contain valid email addresses
- **Name column** (optional): Used for personalization

#### Supported Formats
- Standard CSV with comma separators
- Headers in first row
- UTF-8 encoding recommended

#### Example CSV Structure
```csv
first_name,last_name,email,company,department
John,Doe,john.doe@example.com,Tech Corp,Engineering
Jane,Smith,jane.smith@example.com,Design Inc,Creative
```

### Random Selection

#### Selection Options
- **Number of records**: 1-100 (default: 10)
- **Email validation**: Only selects records with valid email addresses
- **Random algorithm**: Uses Fisher-Yates shuffle for true randomness

#### Column Detection
The app automatically detects:
- Email columns (looks for "email" or "mail" in column name)
- Name columns (looks for "name" or "first" in column name)

### Email Personalization

#### Template Variables
- `{name}`: Replaced with recipient's name
- `{email}`: Replaced with recipient's email
- `{company}`: Replaced with company name (if available)

#### Example Message
```
Hello {name},

Thank you for your interest in our services. We're excited to work with {company}.

Best regards,
Your Team
```

### Progress Tracking

#### Real-time Updates
- Progress bar shows sending status
- Individual email status (Success/Failed)
- Error messages for failed sends
- Final summary with counts

#### Error Handling
- Authentication errors
- Invalid email addresses
- Network connectivity issues
- SMTP server errors

## Troubleshooting

### Common Issues

#### "Authentication failed"
- **Cause**: Wrong email/password or 2FA not configured
- **Solution**: Use app passwords for Gmail/Yahoo, check credentials

#### "No valid email addresses found"
- **Cause**: CSV doesn't have email column or invalid format
- **Solution**: Check CSV structure, verify email column name

#### "Emails not sending"
- **Cause**: Network issues, server limits, or configuration problems
- **Solution**: Check internet, verify settings, test with small batch

#### "App won't start"
- **Cause**: Missing dependencies or Node.js issues
- **Solution**: Run `npm install`, check Node.js version

### Debug Mode

Enable debug mode by setting environment variable:
```bash
# macOS/Linux
NODE_ENV=development npm start

# Windows
set NODE_ENV=development && npm start
```

### Logs and Debugging

- Check browser console for frontend errors
- Check terminal output for backend errors
- Email configuration is saved in `email-config.json`

## Advanced Usage

### Custom SMTP Configuration

For custom SMTP servers, modify the email configuration:
```javascript
{
  "service": "custom",
  "host": "smtp.yourserver.com",
  "port": 587,
  "secure": false,
  "auth": {
    "user": "your-email@domain.com",
    "pass": "your-password"
  }
}
```

### Batch Processing

For large datasets:
1. Split CSV into smaller files
2. Process in batches of 50-100 emails
3. Add delays between batches to avoid rate limits

### Email Templates

Create reusable templates:
1. Save common messages in text files
2. Copy-paste into the message field
3. Use variables for personalization

## Security Best Practices

### Password Security
- Use app passwords instead of main passwords
- Don't share configuration files
- Store credentials securely

### Email Limits
- Respect service provider limits
- Gmail: 500 emails/day (free), 2000/day (paid)
- Outlook: 300 emails/day
- Yahoo: 500 emails/day

### Data Privacy
- CSV files are processed locally
- Email credentials stored locally only
- No data sent to external servers

## Building for Distribution

### Prerequisites
- Node.js 16+ installed
- Platform-specific build tools

### Build Commands
```bash
# Build for current platform
npm run build

# Build for Windows
npm run build-win

# Build for macOS
npm run build-mac

# Build for all platforms
npm run build-all

# Use custom build script
npm run build-script
```

### Distribution Files
- Windows: `.exe` installer in `dist/`
- macOS: `.dmg` file in `dist/`
- Linux: AppImage or deb package

## Support

### Getting Help
1. Check this usage guide
2. Review error messages carefully
3. Test with sample data first
4. Check email service documentation

### Common Solutions
- Restart the application
- Clear saved configuration
- Use sample CSV for testing
- Check internet connection

### Reporting Issues
Include in your report:
- Operating system
- Node.js version
- Error messages
- Steps to reproduce
- Sample CSV file (remove sensitive data)
