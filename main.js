const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const nodemailer = require('nodemailer');
const { exec } = require('child_process');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const mime = require('mime-types');

let mainWindow;
let whatsappClient = null;
let whatsappReady = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    title: 'Mail Picker',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    // icon: path.join(__dirname, 'assets/icon.png'), // Optional icon
    titleBarStyle: 'default',
    show: false
  });

  mainWindow.loadFile('index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools to see console logs (helpful for debugging WhatsApp)
  // Uncomment the line below to see console logs
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle CSV file selection
ipcMain.handle('select-csv-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Handle CSV file reading
ipcMain.handle('read-csv-file', async (event, filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
});

// Handle email sending
ipcMain.handle('send-emails', async (event, { recipients, emailConfig, subject, message }) => {
  try {
    let transporterConfig;
    
    // Configure transporter based on service
    switch (emailConfig.service) {
      case 'gmail':
        transporterConfig = {
          service: 'gmail',
          auth: {
            user: emailConfig.email,
            pass: emailConfig.password
          }
        };
        break;
      case 'outlook':
        transporterConfig = {
          service: 'hotmail',
          auth: {
            user: emailConfig.email,
            pass: emailConfig.password
          }
        };
        break;
      case 'yahoo':
        transporterConfig = {
          service: 'yahoo',
          auth: {
            user: emailConfig.email,
            pass: emailConfig.password
          }
        };
        break;
      case 'custom':
        transporterConfig = {
          host: emailConfig.host || 'smtp.gmail.com',
          port: emailConfig.port || 587,
          secure: emailConfig.secure || false,
          auth: {
            user: emailConfig.email,
            pass: emailConfig.password
          }
        };
        break;
      default:
        transporterConfig = {
          service: 'gmail',
          auth: {
            user: emailConfig.email,
            pass: emailConfig.password
          }
        };
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    const results = [];
    
    for (const recipient of recipients) {
      try {
        const mailOptions = {
          from: emailConfig.email,
          to: recipient.email,
          subject: subject,
          html: message.replace(/\{name\}/g, recipient.name || 'Valued Customer')
        };

        const info = await transporter.sendMail(mailOptions);
        results.push({
          email: recipient.email,
          status: 'success',
          messageId: info.messageId
        });
      } catch (error) {
        results.push({
          email: recipient.email,
          status: 'error',
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Email configuration error: ${error.message}`);
  }
});

// Handle saving email configuration
ipcMain.handle('save-email-config', async (event, config) => {
  const configPath = path.join(__dirname, 'email-config.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle loading email configuration
ipcMain.handle('load-email-config', async () => {
  const configPath = path.join(__dirname, 'email-config.json');
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { success: true, config };
    }
    return { success: false, config: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle test email sending
ipcMain.handle('test-email', async (event, emailConfig) => {
  try {
    let transporterConfig;
    
    // Configure transporter based on service
    switch (emailConfig.service) {
      case 'gmail':
        transporterConfig = {
          service: 'gmail',
          auth: {
            user: emailConfig.email,
            pass: emailConfig.password
          }
        };
        break;
      case 'outlook':
        transporterConfig = {
          service: 'hotmail',
          auth: {
            user: emailConfig.email,
            pass: emailConfig.password
          }
        };
        break;
      case 'yahoo':
        transporterConfig = {
          service: 'yahoo',
          auth: {
            user: emailConfig.email,
            pass: emailConfig.password
          }
        };
        break;
      case 'custom':
        transporterConfig = {
          host: emailConfig.host || 'smtp.gmail.com',
          port: emailConfig.port || 587,
          secure: emailConfig.secure || false,
          auth: {
            user: emailConfig.email,
            pass: emailConfig.password
          }
        };
        break;
      default:
        transporterConfig = {
          service: 'gmail',
          auth: {
            user: emailConfig.email,
            pass: emailConfig.password
          }
        };
    }

    const transporter = nodemailer.createTransport(transporterConfig);
    
    // Verify connection
    await transporter.verify();
    
    // Send test email to self
    const testEmail = await transporter.sendMail({
      from: emailConfig.email,
      to: emailConfig.email,
      subject: 'Mail Picker - Test Email',
      html: '<h2>Test Email Successful!</h2><p>Your email configuration is working correctly.</p>'
    });

    return { success: true, messageId: testEmail.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle opening SMS app
ipcMain.handle('open-sms', async (event, { phoneNumber, message }) => {
  try {
    const platform = process.platform;
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    
    let command;
    
    if (platform === 'darwin') {
      // macOS - opens Messages app
      command = `open "sms:${cleanPhone}&body=${encodedMessage}"`;
      // Alternative: open -a Messages "sms:${cleanPhone}&body=${encodedMessage}"
    } else if (platform === 'win32') {
      // Windows - opens default SMS app or Skype
      command = `start "" "sms:${cleanPhone}?body=${encodedMessage}"`;
    } else {
      // Linux - opens default SMS handler
      command = `xdg-open "sms:${cleanPhone}?body=${encodedMessage}"`;
    }
    
    exec(command, (error) => {
      // Ignore errors silently to avoid EPIPE issues in Electron
      if (error) {
        // Error opening SMS app - can be ignored
      }
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle opening WhatsApp (manual method)
ipcMain.handle('open-whatsapp', async (event, { phoneNumber, message }) => {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    const encodedMessage = encodeURIComponent(message);
    
    // WhatsApp Web URL format: https://wa.me/PHONENUMBER?text=MESSAGE
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    await shell.openExternal(whatsappUrl);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Initialize WhatsApp Client
ipcMain.handle('init-whatsapp', async () => {
  try {
    if (whatsappClient) {
      if (whatsappReady) {
        return { success: true, ready: true, message: 'WhatsApp client already connected' };
      }
      // If client exists but not ready, destroy it and create new one
      try {
        await whatsappClient.destroy();
      } catch (e) {
        // Ignore destroy errors
      }
      whatsappClient = null;
    }

    whatsappClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, '.wwebjs_auth')
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    // Set up event listeners BEFORE initializing
    whatsappClient.on('qr', (qr) => {
      // Send QR code to renderer immediately
      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log('Sending QR code to renderer...');
        mainWindow.webContents.send('whatsapp-qr', qr);
      } else {
        console.error('Main window not available for QR code');
      }
    });

    whatsappClient.on('ready', () => {
      whatsappReady = true;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('whatsapp-ready', true);
      }
    });

    whatsappClient.on('authenticated', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('whatsapp-authenticated');
      }
    });

    whatsappClient.on('auth_failure', (msg) => {
      whatsappReady = false;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('whatsapp-error', `Authentication failed: ${msg}`);
      }
    });

    whatsappClient.on('disconnected', (reason) => {
      whatsappReady = false;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('whatsapp-disconnected', reason);
      }
    });

    whatsappClient.on('loading_screen', (percent, message) => {
      // Remove console.log to avoid EPIPE errors
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('whatsapp-loading', { percent, message });
      }
    });

    await whatsappClient.initialize();
    
    return { success: true, ready: false, message: 'WhatsApp client initializing. Please scan QR code.' };
  } catch (error) {
    whatsappClient = null;
    whatsappReady = false;
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
});

// Handle file selection for WhatsApp media
ipcMain.handle('select-whatsapp-media', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'] },
      { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv'] },
      { name: 'Audio', extensions: ['mp3', 'wav', 'ogg'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const stats = fs.statSync(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    
    return {
      success: true,
      filePath: filePath,
      fileName: path.basename(filePath),
      fileSize: stats.size,
      mimeType: mimeType,
      isImage: mimeType.startsWith('image/'),
      isVideo: mimeType.startsWith('video/'),
      isAudio: mimeType.startsWith('audio/'),
      isDocument: !mimeType.startsWith('image/') && !mimeType.startsWith('video/') && !mimeType.startsWith('audio/')
    };
  }
  return { success: false };
});

// Send WhatsApp message automatically with optional media
ipcMain.handle('send-whatsapp-auto', async (event, { phoneNumber, message, mediaPath, mediaCaption }) => {
  try {
    if (!whatsappClient || !whatsappReady) {
      return { success: false, error: 'WhatsApp client not ready. Please initialize and scan QR code first.' };
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    // Format: country code + number (e.g., 911234567890 for India)
    const formattedNumber = cleanPhone.includes('@c.us') ? cleanPhone : `${cleanPhone}@c.us`;
    
    let result;
    
    // If media is provided, send media with caption
    if (mediaPath && fs.existsSync(mediaPath)) {
      const media = MessageMedia.fromFilePath(mediaPath);
      const caption = mediaCaption || message || '';
      
      result = await whatsappClient.sendMessage(formattedNumber, media, { caption: caption });
    } else {
      // Send text message only
      result = await whatsappClient.sendMessage(formattedNumber, message);
    }
    
    return { success: true, messageId: result.id._serialized };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Send SMS via API
ipcMain.handle('send-sms-api', async (event, { phoneNumber, message, apiConfig }) => {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    let result;

    switch (apiConfig.provider) {
      case 'twilio':
        // Twilio API
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${apiConfig.accountSid}/Messages.json`;
        const twilioAuth = Buffer.from(`${apiConfig.accountSid}:${apiConfig.authToken}`).toString('base64');
        
        result = await axios.post(twilioUrl, 
          new URLSearchParams({
            From: apiConfig.fromNumber,
            To: `+${cleanPhone}`,
            Body: message
          }),
          {
            headers: {
              'Authorization': `Basic ${twilioAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        return { success: true, messageId: result.data.sid, provider: 'twilio' };

      case 'completeapi':
        // CompleteAPI
        const completeApiUrl = 'https://api.completeapi.com/v1/sms/send';
        result = await axios.post(completeApiUrl, {
          api_key: apiConfig.apiKey,
          to: cleanPhone,
          message: message,
          from: apiConfig.fromNumber || 'MailPicker'
        });
        return { success: true, messageId: result.data.message_id || 'sent', provider: 'completeapi' };

      case 'smsmode':
        // SMSMode API
        const smsmodeUrl = 'https://api.smsmode.com/http/1.6/sendSMS.do';
        result = await axios.get(smsmodeUrl, {
          params: {
            accessToken: apiConfig.accessToken,
            message: message,
            numero: cleanPhone
          }
        });
        return { success: true, messageId: result.data, provider: 'smsmode' };

      default:
        return { success: false, error: 'Unknown SMS provider' };
    }
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
});

// Get WhatsApp connection status
ipcMain.handle('whatsapp-status', async () => {
  return { ready: whatsappReady, initialized: !!whatsappClient };
});

// Disconnect WhatsApp
ipcMain.handle('disconnect-whatsapp', async () => {
  try {
    if (whatsappClient) {
      await whatsappClient.destroy();
      whatsappClient = null;
      whatsappReady = false;
      return { success: true };
    }
    return { success: true, message: 'No active connection' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
