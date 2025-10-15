# Mail Picker - Desktop Email Application

A cross-platform desktop application built with Electron.js that allows you to randomly select data from CSV files and send personalized emails to the selected recipients.

## Features

- 📧 **Email Configuration**: Support for Gmail, Outlook, Yahoo, and custom SMTP
- 📁 **CSV File Support**: Load and parse CSV files with automatic column detection
- 🎲 **Random Selection**: Select random records from your CSV data (10 or more)
- ✍️ **Email Composition**: Create personalized emails with template variables
- 📊 **Progress Tracking**: Real-time progress display during email sending
- 💾 **Configuration Persistence**: Save and load email settings
- 🖥️ **Cross-Platform**: Works on Windows, macOS, and Linux

## Installation

1. **Clone or download this repository**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the application:**
   ```bash
   npm start
   ```

## Building for Distribution

### Build for Windows:
```bash
npm run build-win
```

### Build for macOS:
```bash
npm run build-mac
```

### Build for both platforms:
```bash
npm run build-all
```

Built applications will be available in the `dist` folder.

## Usage

### 1. Email Configuration
- Select your email service (Gmail, Outlook, Yahoo, or Custom SMTP)
- Enter your email address and password/app password
- Click "Save Configuration" to store your settings

### 2. Load CSV File
- Click "Choose CSV File" to select your CSV file
- The application will automatically detect email and name columns
- View the total number of records loaded

### 3. Select Random Data
- Specify the number of records to select (default: 10)
- Set the email column name (auto-detected)
- Set the name column name for personalization (optional)
- Click "Select Random Data" to choose recipients

### 4. Compose and Send Emails
- Enter your email subject
- Write your message (use `{name}` for personalization)
- Click "Send Emails" to start sending

## CSV File Format

Your CSV file should have columns for email addresses and optionally names:

```csv
name,email,company
John Doe,john.doe@example.com,Tech Corp
Jane Smith,jane.smith@example.com,Design Inc
```

## Email Personalization

Use `{name}` in your email message to personalize with the recipient's name:

```
Hello {name},

Thank you for your interest in our services...

Best regards,
Your Team
```

## Email Service Setup

### Gmail
1. Enable 2-factor authentication
2. Generate an App Password
3. Use your Gmail address and the App Password

### Outlook
1. Use your Outlook email and password
2. Or use App Password if 2FA is enabled

### Yahoo
1. Enable 2-factor authentication
2. Generate an App Password
3. Use your Yahoo email and the App Password

## Troubleshooting

### Common Issues

1. **"Authentication failed" error:**
   - Make sure you're using App Passwords for Gmail/Yahoo
   - Check your email and password are correct

2. **"No valid email addresses found":**
   - Check your CSV file has an email column
   - Ensure email addresses are valid format

3. **Emails not sending:**
   - Check your internet connection
   - Verify email service settings
   - Check spam folder for test emails

### Getting Help

If you encounter issues:
1. Check the console for error messages
2. Verify your CSV file format
3. Test with a small number of emails first
4. Check your email service's sending limits

## Security Notes

- Email passwords are stored locally in encrypted format
- Never share your email configuration files
- Use App Passwords instead of your main password
- Be mindful of email service sending limits

## License

MIT License - feel free to modify and distribute as needed.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
# Mailpicker
