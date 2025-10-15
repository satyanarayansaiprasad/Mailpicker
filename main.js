const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const nodemailer = require('nodemailer');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
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

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
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
