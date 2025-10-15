# 🔧 Windows Installation Fix Guide

## 🚨 **Issue: "Windows is searching for mail picker.exe"**

This is a common Windows installation issue. Here are the solutions:

---

## ✅ **Solution 1: Manual File Location (Quick Fix)**

### **When Windows asks to locate the file:**
1. **Click "Browse"** button
2. **Navigate to:** `C:\Users\[YourUsername]\AppData\Local\Programs\Mail Picker\`
3. **Look for:** `Mail Picker.exe` (note the capital letters)
4. **Select the file** and click "Open"

### **If the file is not found:**
1. **Check:** `C:\Program Files\Mail Picker\`
2. **Check:** `C:\Program Files (x86)\Mail Picker\`
3. **Search:** Press `Win + S` and search for "Mail Picker.exe"

---

## ✅ **Solution 2: Reinstall with Fixed Version**

### **Step 1: Uninstall Current Version**
1. Go to **Settings** → **Apps** → **Apps & features**
2. Find "Mail Picker" and click **Uninstall**
3. Restart your computer

### **Step 2: Download Fixed Version**
1. Go to: https://github.com/satyanarayansaiprasad/Mailpicker/releases
2. Download the latest `Mail Picker Setup 1.0.0.exe`
3. **Right-click** the installer and select **"Run as administrator"**
4. Follow the installation wizard

---

## ✅ **Solution 3: Portable Version (Alternative)**

If the installer continues to have issues, you can run the portable version:

### **Download Portable Version:**
1. Go to the releases page
2. Download the `win-arm64-unpacked` folder
3. Extract it to your desired location
4. Run `Mail Picker.exe` directly

---

## 🔍 **Troubleshooting Steps**

### **Check Installation Directory:**
```cmd
# Open Command Prompt and run:
dir "C:\Users\%USERNAME%\AppData\Local\Programs\Mail Picker"
dir "C:\Program Files\Mail Picker"
dir "C:\Program Files (x86)\Mail Picker"
```

### **Check Windows Event Logs:**
1. Press `Win + R`, type `eventvwr.msc`
2. Go to **Windows Logs** → **Application**
3. Look for errors related to "Mail Picker"

### **Run as Administrator:**
1. Right-click on `Mail Picker.exe`
2. Select **"Run as administrator"**

---

## 🛠️ **What Was Fixed in the New Build**

### **Windows Build Improvements:**
- ✅ **Proper NSIS configuration** with correct file paths
- ✅ **Desktop shortcut creation** enabled
- ✅ **Start Menu shortcut** enabled
- ✅ **Custom installation directory** allowed
- ✅ **Proper application naming** and titles
- ✅ **Better error handling** and window management

### **Installation Features:**
- ✅ **One-click installation** disabled (allows customization)
- ✅ **Desktop shortcut** created automatically
- ✅ **Start Menu entry** created
- ✅ **Uninstaller** properly configured

---

## 📋 **Installation Checklist**

### **Before Installing:**
- [ ] **Close any running instances** of Mail Picker
- [ ] **Run installer as administrator**
- [ ] **Check available disk space** (at least 100 MB)
- [ ] **Disable antivirus temporarily** (if needed)

### **During Installation:**
- [ ] **Choose installation directory** (default is recommended)
- [ ] **Allow desktop shortcut creation**
- [ ] **Allow Start Menu entry creation**
- [ ] **Complete the installation wizard**

### **After Installation:**
- [ ] **Test the application** by launching it
- [ ] **Check desktop shortcut** works
- [ ] **Verify Start Menu entry** exists
- [ ] **Test email configuration**

---

## 🎯 **Expected Installation Paths**

### **Default Installation:**
```
C:\Users\[Username]\AppData\Local\Programs\Mail Picker\
├── Mail Picker.exe
├── resources\
├── locales\
└── [other files]
```

### **Desktop Shortcut:**
```
C:\Users\[Username]\Desktop\Mail Picker.lnk
```

### **Start Menu Entry:**
```
C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Mail Picker.lnk
```

---

## 🆘 **Still Having Issues?**

### **Common Problems:**
1. **Antivirus blocking** → Add exception for Mail Picker
2. **Windows Defender** → Add to exclusions
3. **Permission issues** → Run as administrator
4. **Corrupted download** → Re-download the installer

### **Alternative Solutions:**
1. **Use portable version** (no installation required)
2. **Run from source code** (requires Node.js)
3. **Use macOS version** (if available)

---

## 📞 **Support**

If you continue to have issues:
1. **Check the GitHub repository** for latest updates
2. **Create an issue** on GitHub with your error details
3. **Include your Windows version** and error messages
4. **Try the portable version** as a workaround

---

**The fixed Windows build should resolve the installation issues! 🚀**
