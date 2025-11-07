# Mail Picker - Installation Guide

## 📦 What's Included

This package contains installers for:
- **macOS** (Apple Silicon - M1/M2/M3): `Mail Picker-1.0.0-arm64.dmg`
- **Windows** (x64): `Mail Picker Setup 1.0.0.exe`
- **Sample CSV**: `sample_contacts.csv` (for testing)

---

## 🍎 macOS Installation

### For Apple Silicon Macs (M1/M2/M3)

1. **Download** the `Mail Picker-1.0.0-arm64.dmg` file
2. **Double-click** the DMG file to open it
3. **Drag** "Mail Picker" to your Applications folder
4. **Open** Mail Picker from Applications
5. **If you see a security warning:**
   - Go to System Settings → Privacy & Security
   - Click "Open Anyway" next to the Mail Picker message
   - Or right-click the app → Open → Click "Open"

### System Requirements
- macOS 10.12 or later
- Apple Silicon (M1/M2/M3) processor

---

## 🪟 Windows Installation

### For Windows 10/11 (64-bit)

1. **Download** the `Mail Picker Setup 1.0.0.exe` file
2. **Double-click** the installer
3. **Follow** the installation wizard
4. **Launch** Mail Picker from the Start Menu or Desktop shortcut

### System Requirements
- Windows 10 or later
- 64-bit (x64) processor

---

## 🚀 Quick Start Guide

### 1. Prepare Your CSV File

Your CSV file should include:
- **Email column** (required for email sending)
- **Phone column** (required for SMS/WhatsApp)
- **Name column** (optional, for personalization)

Example CSV format:
```csv
name,email,phone,company
John Doe,john@example.com,1234567890,Tech Corp
Jane Smith,jane@example.com,0987654321,Design Inc
```

### 2. Configure Email (for Email Feature)

1. Open Mail Picker
2. Go to "Email Configuration" section
3. Select your email service (Gmail, Outlook, Yahoo, or Custom)
4. Enter your email and password/app password
5. Click "Test Email" to verify

**Gmail Users:** You need an App Password, not your regular password!
- Enable 2-Factor Authentication
- Go to Security → App passwords → Generate password for "Mail"
- Use the 16-character App Password

### 3. Load CSV File

1. Click "Choose CSV File"
2. Select your CSV file
3. The app will auto-detect email, phone, and name columns

### 4. Select Random Recipients

1. Enter the number of records to select
2. Verify column names are correct
3. Click "Select Random Data"

### 5. Send Messages

#### For Emails:
1. Enter subject and message (use `{name}` for personalization)
2. Click "Send Emails"

#### For SMS:
1. Scroll to "SMS Messaging" section
2. Enter your message (use `{name}` for personalization)
3. Set delay between opens (default: 2000ms)
4. Click "Open SMS Apps"
5. **Manually send** each message from your SMS app

#### For WhatsApp:
1. Scroll to "WhatsApp Messaging" section
2. Make sure WhatsApp Web is logged in
3. Enter your message (use `{name}` for personalization)
4. Set delay between opens (default: 2000ms)
5. Click "Open WhatsApp Chats"
6. **Manually send** each message from WhatsApp

---

## ✨ Features

- 📧 **Email Sending**: Send personalized emails via SMTP
- 📱 **SMS Messaging**: Open SMS apps with pre-filled messages
- 💬 **WhatsApp Messaging**: Open WhatsApp chats with pre-filled messages
- 🎲 **Random Selection**: Randomly select recipients from CSV
- 📝 **Personalization**: Use `{name}` in messages for personalization
- 🔄 **Progress Tracking**: Real-time progress for email sending

---

## 📝 Important Notes

### SMS & WhatsApp Features
- These features **open** the messaging apps with pre-filled phone numbers and messages
- You need to **manually send** each message
- This is a **free solution** that doesn't require premium services
- For WhatsApp, make sure WhatsApp Web is logged in before using

### Email Feature
- Requires valid email credentials
- Gmail/Yahoo users need App Passwords (not regular passwords)
- Check your email service's sending limits

---

## 🆘 Troubleshooting

### macOS Issues

**"App is damaged" or "Can't be opened"**
- Right-click the app → Open → Click "Open"
- Or go to System Settings → Privacy & Security → Allow the app

**App won't start**
- Make sure you're using macOS 10.12 or later
- Check if you have an Apple Silicon Mac (M1/M2/M3)

### Windows Issues

**Installation blocked**
- Windows may show a security warning
- Click "More info" → "Run anyway"
- Or disable Windows Defender temporarily

**App won't start**
- Make sure you have Windows 10 or later
- Check if you have a 64-bit system

### General Issues

**CSV not loading**
- Check CSV format (comma-separated)
- Ensure first row has headers
- Verify file encoding is UTF-8

**Emails not sending**
- Verify email configuration
- Check internet connection
- Use App Passwords for Gmail/Yahoo
- Test with a single email first

**SMS/WhatsApp not opening**
- Check phone number format in CSV
- Ensure phone numbers have at least 10 digits
- For WhatsApp, make sure WhatsApp Web is logged in

---

## 📞 Support

For issues or questions, please check:
1. This README file
2. The app's built-in help messages
3. CSV file format requirements

---

## 📄 License

MIT License - Free to use and distribute

---

**Version:** 1.0.0  
**Last Updated:** 2024

