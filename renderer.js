const { ipcRenderer } = require('electron');

let csvData = [];
let selectedData = [];
let emailConfig = {};
let selectedMethod = null;
let currentScreen = 1;

// Screen Navigation
function goToScreen(screenNumber) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    document.getElementById(`screen${screenNumber}`).classList.add('active');
    currentScreen = screenNumber;
    
    // Update step indicators
    document.querySelectorAll('.step-dot').forEach((dot, index) => {
        if (index + 1 <= screenNumber) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function goToMethodSelection() {
    if (selectedData.length === 0) {
        showAlert('Please select some data first', 'error');
        return;
    }
    goToScreen(2);
}

function selectMethod(method) {
    selectedMethod = method;
    
    // Update UI
    document.querySelectorAll('.method-card').forEach(card => {
        card.classList.remove('selected');
    });
    // Find the clicked card
    const cards = document.querySelectorAll('.method-card');
    const methodIndex = { 'email': 0, 'sms': 1, 'whatsapp': 2 };
    if (methodIndex[method] !== undefined) {
        cards[methodIndex[method]].classList.add('selected');
    }
    
    // Enable next button
    document.getElementById('nextToConfig').disabled = false;
}

function goToConfiguration() {
    if (!selectedMethod) {
        showAlert('Please select a sending method', 'error');
        return;
    }
    
    // Show/hide config sections
    document.getElementById('emailConfigSection').classList.add('hidden');
    document.getElementById('smsConfigSection').classList.add('hidden');
    document.getElementById('whatsappConfigSection').classList.add('hidden');
    
    // Reset next button
    document.getElementById('nextToComposition').disabled = true;
    
    if (selectedMethod === 'email') {
        document.getElementById('emailConfigSection').classList.remove('hidden');
        loadEmailConfig();
    } else if (selectedMethod === 'sms') {
        document.getElementById('smsConfigSection').classList.remove('hidden');
        toggleSMSProviderConfig(); // Initialize SMS provider config
    } else if (selectedMethod === 'whatsapp') {
        document.getElementById('whatsappConfigSection').classList.remove('hidden');
        // Check if already connected
        ipcRenderer.invoke('whatsapp-status').then(status => {
            if (status.ready) {
                const statusEl = document.getElementById('whatsappStatus');
                if (statusEl) {
                    statusEl.textContent = 'Connected ✓';
                    statusEl.style.color = 'green';
                }
                document.getElementById('nextToComposition').disabled = false;
            }
        });
    }
    
    goToScreen(3);
}

function goToComposition() {
    // Validate configuration based on method
    if (selectedMethod === 'email') {
        const email = document.getElementById('senderEmail').value;
        const password = document.getElementById('senderPassword').value;
        if (!email || !password) {
            showAlert('Please configure email settings', 'error');
            return;
        }
        // Check if test was successful
        const testResult = document.getElementById('emailTestResult');
        if (!testResult || !testResult.textContent.includes('successful')) {
            showAlert('Please test email connection first', 'error');
            return;
        }
    } else if (selectedMethod === 'sms') {
        const provider = document.getElementById('smsProvider').value;
        if (provider === 'twilio') {
            const sid = document.getElementById('twilioAccountSid').value;
            const token = document.getElementById('twilioAuthToken').value;
            const from = document.getElementById('twilioFromNumber').value;
            if (!sid || !token || !from) {
                showAlert('Please configure SMS API credentials', 'error');
                return;
            }
        } else if (provider === 'completeapi') {
            const key = document.getElementById('completeApiKey').value;
            if (!key) {
                showAlert('Please configure CompleteAPI key', 'error');
                return;
            }
        } else if (provider === 'smsmode') {
            const token = document.getElementById('smsmodeToken').value;
            if (!token) {
                showAlert('Please configure SMSMode access token', 'error');
                return;
            }
        }
    } else if (selectedMethod === 'whatsapp') {
        const status = document.getElementById('whatsappStatus').textContent;
        if (!status.includes('Connected')) {
            showAlert('Please connect WhatsApp first', 'error');
            return;
        }
    }
    
    // Show/hide composition sections
    document.getElementById('emailCompositionSection').classList.add('hidden');
    document.getElementById('smsCompositionSection').classList.add('hidden');
    document.getElementById('whatsappCompositionSection').classList.add('hidden');
    
    if (selectedMethod === 'email') {
        document.getElementById('emailCompositionSection').classList.remove('hidden');
    } else if (selectedMethod === 'sms') {
        document.getElementById('smsCompositionSection').classList.remove('hidden');
    } else if (selectedMethod === 'whatsapp') {
        document.getElementById('whatsappCompositionSection').classList.remove('hidden');
    }
    
    goToScreen(4);
}

function goToHome() {
    // Reset everything
    selectedData = [];
    selectedMethod = null;
    currentScreen = 1;
    document.getElementById('selectedData').innerHTML = '';
    document.getElementById('nextToMethod').disabled = true;
    goToScreen(1);
}

// Load email configuration on startup
window.addEventListener('DOMContentLoaded', () => {
    loadEmailConfig();
});

// Email Configuration Functions
async function saveEmailConfig() {
    const config = {
        service: document.getElementById('emailService').value,
        email: document.getElementById('senderEmail').value,
        password: document.getElementById('senderPassword').value
    };

    if (!config.email || !config.password) {
        showAlert('Please fill in all email configuration fields', 'error');
        return;
    }

    try {
        const result = await ipcRenderer.invoke('save-email-config', config);
        if (result.success) {
            showAlert('Email configuration saved successfully!', 'success');
            emailConfig = config;
        } else {
            showAlert('Failed to save configuration: ' + result.error, 'error');
        }
    } catch (error) {
        showAlert('Error saving configuration: ' + error.message, 'error');
    }
}

async function loadEmailConfig() {
    try {
        const result = await ipcRenderer.invoke('load-email-config');
        if (result.success && result.config) {
            emailConfig = result.config;
            document.getElementById('emailService').value = result.config.service || 'gmail';
            document.getElementById('senderEmail').value = result.config.email || '';
            document.getElementById('senderPassword').value = result.config.password || '';
            showAlert('Email configuration loaded successfully!', 'success');
        }
    } catch (error) {
        console.log('No saved configuration found');
    }
}

async function testEmailConfig() {
    const config = {
        service: document.getElementById('emailService').value,
        email: document.getElementById('senderEmail').value,
        password: document.getElementById('senderPassword').value
    };

    if (!config.email || !config.password) {
        showAlert('Please fill in all email configuration fields first', 'error');
        return;
    }

    const testResultDiv = document.getElementById('emailTestResult');
    testResultDiv.innerHTML = '<div class="alert alert-info">Testing email configuration...</div>';

    try {
        const result = await ipcRenderer.invoke('test-email', config);
        
        if (result.success) {
            testResultDiv.innerHTML = '<div class="alert alert-success">✅ Test email sent successfully! Check your inbox.</div>';
            document.getElementById('nextToComposition').disabled = false;
        } else {
            testResultDiv.innerHTML = `<div class="alert alert-error">❌ Test failed: ${result.error}</div>`;
            document.getElementById('nextToComposition').disabled = true;
        }
    } catch (error) {
        testResultDiv.innerHTML = `<div class="alert alert-error">❌ Error: ${error.message}</div>`;
        document.getElementById('nextToComposition').disabled = true;
    }
}

function refreshEmailConfig() {
    // Update the global emailConfig variable with current form values
    emailConfig = {
        service: document.getElementById('emailService').value,
        email: document.getElementById('senderEmail').value,
        password: document.getElementById('senderPassword').value
    };
    
    showAlert(`Email configuration refreshed: ${emailConfig.service} (${emailConfig.email})`, 'success');
}

// CSV File Selection
async function selectCSVFile() {
    try {
        const filePath = await ipcRenderer.invoke('select-csv-file');
        if (filePath) {
            await loadCSVFile(filePath);
        }
    } catch (error) {
        showAlert('Error selecting file: ' + error.message, 'error');
    }
}

async function loadCSVFile(filePath) {
    try {
        showAlert('Loading CSV file...', 'info');
        csvData = await ipcRenderer.invoke('read-csv-file', filePath);
        
        // Update UI
        document.getElementById('fileName').textContent = filePath.split('/').pop();
        document.getElementById('totalRecords').textContent = csvData.length;
        document.getElementById('fileInfo').classList.add('show');
        
        // Update serial selection max values
        const endIndexInput = document.getElementById('endIndex');
        if (endIndexInput) {
            endIndexInput.max = csvData.length;
            endIndexInput.value = Math.min(10, csvData.length);
        }
        
        showAlert(`CSV file loaded successfully! Found ${csvData.length} records.`, 'success');
        
        // Auto-detect column names
        if (csvData.length > 0) {
            const columns = Object.keys(csvData[0]);
            const emailCol = columns.find(col => 
                col.toLowerCase().includes('email') || 
                col.toLowerCase().includes('mail')
            );
            const nameCol = columns.find(col => 
                col.toLowerCase().includes('name') || 
                col.toLowerCase().includes('first')
            );
            const phoneCol = columns.find(col => 
                col.toLowerCase().includes('phone') || 
                col.toLowerCase().includes('mobile') ||
                col.toLowerCase().includes('number') ||
                col.toLowerCase().includes('contact')
            );
            
            if (emailCol) {
                document.getElementById('emailColumn').value = emailCol;
                const emailColSerial = document.getElementById('emailColumnSerial');
                if (emailColSerial) {
                    emailColSerial.value = emailCol;
                }
            }
            if (nameCol) {
                document.getElementById('nameColumn').value = nameCol;
            }
            if (phoneCol) {
                document.getElementById('phoneColumn').value = phoneCol;
            }
            
            // Set default end index for serial selection
            const endIndexInput = document.getElementById('endIndex');
            if (endIndexInput && csvData.length > 0) {
                endIndexInput.max = csvData.length;
                endIndexInput.value = Math.min(10, csvData.length);
            }
        }
    } catch (error) {
        showAlert('Error loading CSV file: ' + error.message, 'error');
    }
}

// Toggle between Random and Serial selection modes
function toggleSelectionMode() {
    const mode = document.getElementById('selectionMode').value;
    const randomOptions = document.getElementById('randomSelectionOptions');
    const serialOptions = document.getElementById('serialSelectionOptions');
    const selectBtn = document.getElementById('selectDataBtn');
    
    if (mode === 'random') {
        randomOptions.style.display = 'block';
        serialOptions.style.display = 'none';
        selectBtn.textContent = 'Select Random Data';
    } else {
        randomOptions.style.display = 'none';
        serialOptions.style.display = 'block';
        selectBtn.textContent = 'Select Serial Data';
        // Sync email column value
        const emailCol = document.getElementById('emailColumn').value;
        const emailColSerial = document.getElementById('emailColumnSerial');
        if (emailColSerial && emailCol) {
            emailColSerial.value = emailCol;
        }
    }
}

// Main data selection function (handles both random and serial)
function selectData() {
    const mode = document.getElementById('selectionMode').value;
    
    if (mode === 'random') {
        selectRandomData();
    } else {
        selectSerialData();
    }
}

// Random Data Selection
function selectRandomData() {
    if (csvData.length === 0) {
        showAlert('Please load a CSV file first', 'error');
        return;
    }

    const numRecords = parseInt(document.getElementById('numRecords').value);
    const emailColumn = document.getElementById('emailColumn').value || document.getElementById('emailColumnSerial')?.value;
    const nameColumn = document.getElementById('nameColumn').value;
    const phoneColumn = document.getElementById('phoneColumn').value;

    // Check if at least email or phone column is specified
    if (!emailColumn && !phoneColumn) {
        showAlert('Please specify at least email or phone column name', 'error');
        return;
    }

    // Filter data that has email addresses or phone numbers
    const validData = csvData.filter(row => {
        const hasEmail = emailColumn && row[emailColumn] && 
                        row[emailColumn].includes('@') && 
                        row[emailColumn].includes('.');
        const hasPhone = phoneColumn && row[phoneColumn] && 
                        row[phoneColumn].replace(/\D/g, '').length >= 10;
        return hasEmail || hasPhone;
    });

    if (validData.length === 0) {
        showAlert('No valid email addresses or phone numbers found', 'error');
        return;
    }

    // Select random records
    const shuffled = [...validData].sort(() => 0.5 - Math.random());
    selectedData = shuffled.slice(0, Math.min(numRecords, validData.length));

    displaySelectedData();
    showAlert(`Selected ${selectedData.length} random records`, 'success');
}

// Serial Data Selection
function selectSerialData() {
    if (csvData.length === 0) {
        showAlert('Please load a CSV file first', 'error');
        return;
    }

    const startIndex = parseInt(document.getElementById('startIndex').value);
    const endIndex = parseInt(document.getElementById('endIndex').value);
    const emailColumn = document.getElementById('emailColumnSerial').value || document.getElementById('emailColumn').value;
    const nameColumn = document.getElementById('nameColumn').value;
    const phoneColumn = document.getElementById('phoneColumn').value;

    // Validate indices
    if (isNaN(startIndex) || isNaN(endIndex) || startIndex < 1 || endIndex < 1) {
        showAlert('Please enter valid start and end indices (starting from 1)', 'error');
        return;
    }

    if (startIndex > endIndex) {
        showAlert('Start index must be less than or equal to end index', 'error');
        return;
    }

    if (startIndex > csvData.length) {
        showAlert(`Start index (${startIndex}) exceeds total records (${csvData.length})`, 'error');
        return;
    }

    // Check if at least email or phone column is specified
    if (!emailColumn && !phoneColumn) {
        showAlert('Please specify at least email or phone column name', 'error');
        return;
    }

    // Get serial range (convert to 0-based index)
    const actualStart = Math.max(0, startIndex - 1); // Convert to 0-based
    const actualEnd = Math.min(csvData.length, endIndex); // Keep 1-based for slice
    
    // Get data in the specified range
    const rangeData = csvData.slice(actualStart, actualEnd);

    // Filter data that has email addresses or phone numbers
    const validData = rangeData.filter(row => {
        const hasEmail = emailColumn && row[emailColumn] && 
                        row[emailColumn].includes('@') && 
                        row[emailColumn].includes('.');
        const hasPhone = phoneColumn && row[phoneColumn] && 
                        row[phoneColumn].replace(/\D/g, '').length >= 10;
        return hasEmail || hasPhone;
    });

    if (validData.length === 0) {
        showAlert(`No valid email addresses or phone numbers found in records ${startIndex}-${endIndex}`, 'error');
        return;
    }

    // Select serial records (in order)
    selectedData = validData;

    displaySelectedData();
    showAlert(`Selected ${selectedData.length} serial records (${startIndex}-${endIndex})`, 'success');
}

function displaySelectedData() {
    const container = document.getElementById('selectedData');
    const section = document.getElementById('selectedDataSection');
    
    if (selectedData.length === 0) {
        section.style.display = 'none';
        document.getElementById('nextToMethod').disabled = true;
        return;
    }

    section.style.display = 'block';
    container.innerHTML = '';

    const emailColumn = document.getElementById('emailColumn').value || document.getElementById('emailColumnSerial')?.value;
    const nameColumn = document.getElementById('nameColumn').value;
    const phoneColumn = document.getElementById('phoneColumn').value;
    const mode = document.getElementById('selectionMode').value;

    selectedData.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'data-item';
        const email = emailColumn && item[emailColumn] ? item[emailColumn] : 'No email';
        const phone = phoneColumn && item[phoneColumn] ? item[phoneColumn] : 'No phone';
        const name = nameColumn && item[nameColumn] ? item[nameColumn] : 'No name';
        
        // Find original index in CSV for serial mode
        let originalIndex = '';
        if (mode === 'serial') {
            const csvIndex = csvData.findIndex(row => row === item);
            originalIndex = csvIndex >= 0 ? `#${csvIndex + 1}` : '';
        }
        
        div.innerHTML = `
            <div class="data-info">
                <div class="data-email">${email} ${originalIndex}</div>
                <div class="data-name">${name} | ${phone}</div>
            </div>
            <div class="status pending">Selected</div>
        `;
        container.appendChild(div);
    });
    
    // Enable next button
    document.getElementById('nextToMethod').disabled = false;
}

function clearSelection() {
    selectedData = [];
    document.getElementById('selectedData').innerHTML = '';
    document.getElementById('selectedDataSection').style.display = 'none';
    document.getElementById('nextToMethod').disabled = true;
    showAlert('Selection cleared', 'info');
}

// Unified sending function
async function startSending() {
    if (!selectedMethod) {
        showAlert('No method selected', 'error');
        return;
    }
    
    // Go to progress screen
    goToScreen(5);
    
    if (selectedMethod === 'email') {
        await sendEmails();
    } else if (selectedMethod === 'sms') {
        await sendSMSMessagesAuto();
    } else if (selectedMethod === 'whatsapp') {
        await sendWhatsAppMessagesAuto();
    }
}

// Email Sending
async function sendEmails() {
    if (selectedData.length === 0) {
        showAlert('Please select some data first', 'error');
        return;
    }

    const subject = document.getElementById('emailSubject').value;
    const message = document.getElementById('emailMessage').value;

    if (!subject || !message) {
        showAlert('Please fill in both subject and message', 'error');
        return;
    }

    // Get current email configuration from form fields
    const currentEmailConfig = {
        service: document.getElementById('emailService').value,
        email: document.getElementById('senderEmail').value,
        password: document.getElementById('senderPassword').value
    };

    if (!currentEmailConfig.email || !currentEmailConfig.password) {
        showAlert('Please configure your email settings first', 'error');
        return;
    }

    const emailColumn = document.getElementById('emailColumn').value || document.getElementById('emailColumnSerial')?.value;
    const nameColumn = document.getElementById('nameColumn').value;

    // Prepare recipients
    const recipients = selectedData.map(item => ({
        email: item[emailColumn],
        name: item[nameColumn] || 'Valued Customer'
    }));

    // Update progress screen
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const resultsContainer = document.getElementById('resultsContainer');
    
    progressText.textContent = `Preparing to send emails using ${currentEmailConfig.service} (${currentEmailConfig.email})...`;
    progressFill.style.width = '0%';
    resultsContainer.innerHTML = '';

    try {
        const results = await ipcRenderer.invoke('send-emails', {
            recipients,
            emailConfig: currentEmailConfig,
            subject,
            message
        });

        displayEmailResults(results, progressText, progressFill, resultsContainer);
        
        // Show success screen
        const successCount = results.filter(r => r.status === 'success').length;
        const errorCount = results.filter(r => r.status === 'error').length;
        showSuccessScreen(successCount, errorCount, 'email');
    } catch (error) {
        progressText.textContent = `Error: ${error.message}`;
        showAlert('Error sending emails: ' + error.message, 'error');
    }
}

function displayEmailResults(results, progressText, progressFill, container) {
    container.innerHTML = '';
    
    let successCount = 0;
    let errorCount = 0;

    results.forEach((result, index) => {
        const div = document.createElement('div');
        div.className = 'data-item';
        
        const statusClass = result.status === 'success' ? 'success' : 'error';
        const statusText = result.status === 'success' ? 'Sent' : 'Failed';
        
        div.innerHTML = `
            <div class="data-info">
                <div class="data-email">${result.email}</div>
                <div class="data-name">${result.messageId || result.error || ''}</div>
            </div>
            <div class="status ${statusClass}">${statusText}</div>
        `;
        container.appendChild(div);

        if (result.status === 'success') {
            successCount++;
        } else {
            errorCount++;
        }

        // Update progress
        const progress = ((index + 1) / results.length) * 100;
        progressFill.style.width = progress + '%';
        progressText.textContent = `Sending email ${index + 1} of ${results.length}... (${successCount} sent, ${errorCount} failed)`;
    });

    // Final progress update
    progressText.textContent = `Completed! ${successCount} sent, ${errorCount} failed`;
}

function showSuccessScreen(successCount, errorCount, method) {
    const summaryDiv = document.getElementById('successSummary');
    const methodNames = { 'email': 'Emails', 'sms': 'SMS', 'whatsapp': 'WhatsApp messages' };
    const methodName = methodNames[method] || 'Messages';
    
    summaryDiv.innerHTML = `
        <div style="font-size: 1.2em; margin-bottom: 10px;">
            <strong>${successCount}</strong> ${methodName} sent successfully
        </div>
        ${errorCount > 0 ? `<div style="color: #721c24;">${errorCount} failed</div>` : ''}
    `;
    
    goToScreen(6);
}

// SMS/WhatsApp Functions
function validatePhoneNumber(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it has at least 10 digits (minimum for a phone number)
    return cleaned.length >= 10;
}

function formatPhoneNumber(phone) {
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
}

async function openSMS(phoneNumber, message) {
    if (!validatePhoneNumber(phoneNumber)) {
        showAlert('Invalid phone number format', 'error');
        return;
    }

    try {
        const result = await ipcRenderer.invoke('open-sms', {
            phoneNumber: formatPhoneNumber(phoneNumber),
            message: message
        });
        
        if (result.success) {
            showAlert('SMS app opened! Please send the message manually.', 'success');
        } else {
            showAlert('Failed to open SMS app: ' + result.error, 'error');
        }
    } catch (error) {
        showAlert('Error opening SMS app: ' + error.message, 'error');
    }
}

async function openWhatsApp(phoneNumber, message) {
    if (!validatePhoneNumber(phoneNumber)) {
        showAlert('Invalid phone number format', 'error');
        return;
    }

    try {
        const result = await ipcRenderer.invoke('open-whatsapp', {
            phoneNumber: formatPhoneNumber(phoneNumber),
            message: message
        });
        
        if (result.success) {
            showAlert('WhatsApp opened! Please send the message manually.', 'success');
        } else {
            showAlert('Failed to open WhatsApp: ' + result.error, 'error');
        }
    } catch (error) {
        showAlert('Error opening WhatsApp: ' + error.message, 'error');
    }
}

async function sendSMSMessages() {
    if (selectedData.length === 0) {
        showAlert('Please select some data first', 'error');
        return;
    }

    const message = document.getElementById('smsMessage').value;
    const phoneColumn = document.getElementById('phoneColumn').value;

    if (!message) {
        showAlert('Please enter a message', 'error');
        return;
    }

    if (!phoneColumn) {
        showAlert('Please specify the phone column name', 'error');
        return;
    }

    const nameColumn = document.getElementById('nameColumn').value;
    const delay = parseInt(document.getElementById('smsDelay').value) || 2000;

    // Prepare recipients with valid phone numbers
    const recipients = selectedData
        .map(item => ({
            phone: item[phoneColumn],
            name: item[nameColumn] || 'Valued Customer'
        }))
        .filter(recipient => recipient.phone && validatePhoneNumber(recipient.phone));

    if (recipients.length === 0) {
        showAlert('No valid phone numbers found in selected data', 'error');
        return;
    }

    // Show progress
    document.getElementById('smsProgressSection').classList.remove('hidden');
    document.getElementById('sendSMSBtn').disabled = true;
    document.getElementById('smsProgressText').textContent = `Opening SMS app for ${recipients.length} recipients...`;
    document.getElementById('smsProgressFill').style.width = '0%';

    try {
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            const personalizedMessage = message.replace(/\{name\}/g, recipient.name);

            try {
                await openSMS(recipient.phone, personalizedMessage);
                successCount++;

                // Update progress
                const progress = ((i + 1) / recipients.length) * 100;
                document.getElementById('smsProgressFill').style.width = progress + '%';
                document.getElementById('smsProgressText').textContent = 
                    `Opened SMS app ${i + 1} of ${recipients.length}...`;

                // Wait before opening next (except for last one)
                if (i < recipients.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (error) {
                errorCount++;
            }
        }

        document.getElementById('smsProgressText').textContent = 
            `Completed! Opened ${successCount} SMS apps, ${errorCount} failed. Please send messages manually.`;
        showAlert(`SMS apps opened for ${successCount} recipients!`, 'success');
    } catch (error) {
        showAlert('Error opening SMS apps: ' + error.message, 'error');
    } finally {
        document.getElementById('sendSMSBtn').disabled = false;
    }
}

async function sendWhatsAppMessages() {
    if (selectedData.length === 0) {
        showAlert('Please select some data first', 'error');
        return;
    }

    const message = document.getElementById('whatsappMessage').value;
    const phoneColumn = document.getElementById('phoneColumn').value;

    if (!message) {
        showAlert('Please enter a message', 'error');
        return;
    }

    if (!phoneColumn) {
        showAlert('Please specify the phone column name', 'error');
        return;
    }

    const nameColumn = document.getElementById('nameColumn').value;
    const delay = parseInt(document.getElementById('whatsappDelay').value) || 2000;

    // Prepare recipients with valid phone numbers
    const recipients = selectedData
        .map(item => ({
            phone: item[phoneColumn],
            name: item[nameColumn] || 'Valued Customer'
        }))
        .filter(recipient => recipient.phone && validatePhoneNumber(recipient.phone));

    if (recipients.length === 0) {
        showAlert('No valid phone numbers found in selected data', 'error');
        return;
    }

    // Show progress
    document.getElementById('whatsappProgressSection').classList.remove('hidden');
    document.getElementById('sendWhatsAppBtn').disabled = true;
    document.getElementById('whatsappProgressText').textContent = `Opening WhatsApp for ${recipients.length} recipients...`;
    document.getElementById('whatsappProgressFill').style.width = '0%';

    try {
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            const personalizedMessage = message.replace(/\{name\}/g, recipient.name);

            try {
                await openWhatsApp(recipient.phone, personalizedMessage);
                successCount++;

                // Update progress
                const progress = ((i + 1) / recipients.length) * 100;
                document.getElementById('whatsappProgressFill').style.width = progress + '%';
                document.getElementById('whatsappProgressText').textContent = 
                    `Opened WhatsApp ${i + 1} of ${recipients.length}...`;

                // Wait before opening next (except for last one)
                if (i < recipients.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (error) {
                errorCount++;
            }
        }

        document.getElementById('whatsappProgressText').textContent = 
            `Completed! Opened ${successCount} WhatsApp chats, ${errorCount} failed. Please send messages manually.`;
        showAlert(`WhatsApp opened for ${successCount} recipients!`, 'success');
    } catch (error) {
        showAlert('Error opening WhatsApp: ' + error.message, 'error');
    } finally {
        document.getElementById('sendWhatsAppBtn').disabled = false;
    }
}

// Automatic WhatsApp Functions
let whatsappConnected = false;

// Listen for WhatsApp events from main process
// Note: ipcRenderer is already imported at the top of the file

ipcRenderer.on('whatsapp-qr', (event, qr) => {
    console.log('QR code received in renderer, length:', qr ? qr.length : 0);
    // Display QR code
    const qrContainer = document.getElementById('whatsappQRCode');
    if (qrContainer && qr) {
        // Use a more reliable QR code generator
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr)}`;
        qrContainer.innerHTML = `
            <div style="text-align: center;">
                <p style="margin-bottom: 10px; font-weight: 600; color: #333;">Scan this QR code with WhatsApp:</p>
                <img src="${qrUrl}" alt="QR Code" style="max-width: 250px; border: 2px solid #4facfe; padding: 10px; background: white; margin: 10px 0; border-radius: 8px;">
                <p style="margin-top: 10px; font-size: 0.9em; color: #666;">Open WhatsApp → Settings → Linked Devices → Link a Device</p>
            </div>
        `;
        qrContainer.style.display = 'block';
        
        // Update status
        const statusEl = document.getElementById('whatsappStatus');
        if (statusEl) {
            statusEl.textContent = 'Waiting for QR scan...';
            statusEl.style.color = 'orange';
        }
        
        showAlert('QR code generated! Scan it with your WhatsApp to connect', 'info');
    } else {
        console.error('QR container not found or QR code is empty');
        showAlert('Error: Could not generate QR code', 'error');
    }
});

ipcRenderer.on('whatsapp-ready', (event, ready) => {
    whatsappConnected = ready;
    const qrContainer = document.getElementById('whatsappQRCode');
    if (qrContainer) {
        qrContainer.style.display = 'none';
    }
    const statusEl = document.getElementById('whatsappStatus');
    if (statusEl) {
        statusEl.textContent = 'Connected ✓';
        statusEl.style.color = 'green';
    }
    // Enable next button if on config screen
    const nextBtn = document.getElementById('nextToComposition');
    if (nextBtn) {
        nextBtn.disabled = false;
    }
    showAlert('WhatsApp connected successfully!', 'success');
});

ipcRenderer.on('whatsapp-error', (event, error) => {
    console.error('WhatsApp error:', error);
    const statusEl = document.getElementById('whatsappStatus');
    if (statusEl) {
        statusEl.textContent = 'Error: ' + error;
        statusEl.style.color = 'red';
    }
    showAlert('WhatsApp error: ' + error, 'error');
});

ipcRenderer.on('whatsapp-loading', (event, data) => {
    const statusEl = document.getElementById('whatsappStatus');
    if (statusEl) {
        statusEl.textContent = `Loading... ${data.percent}%`;
        statusEl.style.color = 'orange';
    }
});

ipcRenderer.on('whatsapp-authenticated', () => {
    const statusEl = document.getElementById('whatsappStatus');
    if (statusEl) {
        statusEl.textContent = 'Authenticating...';
        statusEl.style.color = 'orange';
    }
});

ipcRenderer.on('whatsapp-disconnected', () => {
    whatsappConnected = false;
    const statusEl = document.getElementById('whatsappStatus');
    if (statusEl) {
        statusEl.textContent = 'Disconnected';
        statusEl.style.color = 'red';
    }
});

async function initWhatsApp() {
    try {
        const initBtn = document.getElementById('initWhatsAppBtn');
        if (initBtn) {
            initBtn.disabled = true;
            initBtn.textContent = 'Connecting...';
        }
        
        const statusEl = document.getElementById('whatsappStatus');
        const qrContainer = document.getElementById('whatsappQRCode');
        
        if (statusEl) {
            statusEl.textContent = 'Initializing...';
            statusEl.style.color = 'orange';
        }
        
        // Clear previous QR code
        if (qrContainer) {
            qrContainer.innerHTML = '';
            qrContainer.style.display = 'none';
        }
        
        showAlert('Initializing WhatsApp... This may take 10-20 seconds. Please wait...', 'info');
        console.log('Calling init-whatsapp...');
        
        const result = await ipcRenderer.invoke('init-whatsapp');
        console.log('Init result:', result);
        
        if (result.success) {
            if (result.ready) {
                showAlert('WhatsApp is already connected!', 'success');
                if (statusEl) {
                    statusEl.textContent = 'Connected ✓';
                    statusEl.style.color = 'green';
                }
                // Enable next button
                const nextBtn = document.getElementById('nextToComposition');
                if (nextBtn) {
                    nextBtn.disabled = false;
                }
            } else {
                showAlert('QR code will appear shortly. Please wait...', 'info');
                if (statusEl) {
                    statusEl.textContent = 'Waiting for QR code...';
                    statusEl.style.color = 'orange';
                }
                // QR code will be displayed via the 'whatsapp-qr' event
            }
        } else {
            showAlert('Failed to initialize WhatsApp: ' + (result.error || 'Unknown error'), 'error');
            if (statusEl) {
                statusEl.textContent = 'Failed: ' + (result.error || 'Unknown error');
                statusEl.style.color = 'red';
            }
        }
    } catch (error) {
        console.error('Error in initWhatsApp:', error);
        showAlert('Error initializing WhatsApp: ' + error.message, 'error');
        const statusEl = document.getElementById('whatsappStatus');
        if (statusEl) {
            statusEl.textContent = 'Error: ' + error.message;
            statusEl.style.color = 'red';
        }
    } finally {
        const initBtn = document.getElementById('initWhatsAppBtn');
        if (initBtn) {
            initBtn.disabled = false;
            initBtn.textContent = 'Connect WhatsApp';
        }
    }
}

let selectedMedia = null;

async function selectWhatsAppMedia() {
    try {
        const result = await ipcRenderer.invoke('select-whatsapp-media');
        if (result.success) {
            selectedMedia = result;
            await displaySelectedMedia(result);
            showAlert(`Media selected: ${result.fileName}`, 'success');
        }
    } catch (error) {
        showAlert('Error selecting media: ' + error.message, 'error');
    }
}

async function displaySelectedMedia(media) {
    const previewContainer = document.getElementById('whatsappMediaPreview');
    const mediaInfo = document.getElementById('whatsappMediaInfo');
    
    if (!previewContainer || !mediaInfo) return;
    
    if (media.isImage) {
        // Read image as base64 for preview in Electron
        try {
            const fs = require('fs');
            const imageBuffer = fs.readFileSync(media.filePath);
            const base64Image = imageBuffer.toString('base64');
            const imageDataUrl = `data:${media.mimeType};base64,${base64Image}`;
            
            previewContainer.innerHTML = `
                <img src="${imageDataUrl}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin: 10px 0; border: 2px solid #4facfe;">
            `;
        } catch (error) {
            previewContainer.innerHTML = `
                <div style="padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">
                    <div style="font-size: 3em; margin-bottom: 10px;">🖼️</div>
                    <div style="font-weight: 600;">${media.fileName}</div>
                </div>
            `;
        }
        previewContainer.style.display = 'block';
    } else if (media.isVideo) {
        previewContainer.innerHTML = `
            <div style="padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">
                <div style="font-size: 3em; margin-bottom: 10px;">🎥</div>
                <div style="font-weight: 600;">${media.fileName}</div>
            </div>
        `;
        previewContainer.style.display = 'block';
    } else if (media.isAudio) {
        previewContainer.innerHTML = `
            <div style="padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">
                <div style="font-size: 3em; margin-bottom: 10px;">🎵</div>
                <div style="font-weight: 600;">${media.fileName}</div>
            </div>
        `;
        previewContainer.style.display = 'block';
    } else {
        previewContainer.innerHTML = `
            <div style="padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">
                <div style="font-size: 3em; margin-bottom: 10px;">📎</div>
                <div style="font-weight: 600;">${media.fileName}</div>
            </div>
        `;
        previewContainer.style.display = 'block';
    }
    
    const fileSizeMB = (media.fileSize / (1024 * 1024)).toFixed(2);
    const fileSizeKB = media.fileSize < 1024 * 1024 ? (media.fileSize / 1024).toFixed(2) + ' KB' : fileSizeMB + ' MB';
    
    mediaInfo.innerHTML = `
        <div style="margin-top: 10px; padding: 10px; background: #e8f4fd; border-radius: 5px;">
            <strong>File:</strong> ${media.fileName}<br>
            <strong>Size:</strong> ${fileSizeKB}<br>
            <strong>Type:</strong> ${media.mimeType}
        </div>
        <button class="btn btn-danger" onclick="clearWhatsAppMedia()" style="margin-top: 10px;">Remove Media</button>
    `;
    mediaInfo.style.display = 'block';
}

function clearWhatsAppMedia() {
    selectedMedia = null;
    const previewContainer = document.getElementById('whatsappMediaPreview');
    const mediaInfo = document.getElementById('whatsappMediaInfo');
    
    if (previewContainer) previewContainer.style.display = 'none';
    if (mediaInfo) mediaInfo.style.display = 'none';
    
    showAlert('Media removed', 'info');
}

async function sendWhatsAppMessagesAuto() {
    if (selectedData.length === 0) {
        showAlert('Please select some data first', 'error');
        return;
    }

    const message = document.getElementById('whatsappMessage').value;
    const phoneColumn = document.getElementById('phoneColumn').value;

    // Message is optional if media is provided
    if (!message && !selectedMedia) {
        showAlert('Please enter a message or select media', 'error');
        return;
    }

    if (!phoneColumn) {
        showAlert('Please specify the phone column name', 'error');
        return;
    }

    // Check WhatsApp status
    const status = await ipcRenderer.invoke('whatsapp-status');
    if (!status.ready) {
        showAlert('WhatsApp not connected. Please initialize and scan QR code first.', 'error');
        return;
    }

    const nameColumn = document.getElementById('nameColumn').value;

    // Prepare recipients
    const recipients = selectedData
        .map(item => ({
            phone: item[phoneColumn],
            name: item[nameColumn] || 'Valued Customer'
        }))
        .filter(recipient => recipient.phone && validatePhoneNumber(recipient.phone));

    if (recipients.length === 0) {
        showAlert('No valid phone numbers found', 'error');
        return;
    }

    // Update progress screen
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const resultsContainer = document.getElementById('resultsContainer');
    
    const mediaText = selectedMedia ? ` with ${selectedMedia.isImage ? 'image' : 'media'}` : '';
    progressText.textContent = `Sending WhatsApp messages${mediaText} to ${recipients.length} recipients...`;
    progressFill.style.width = '0%';
    resultsContainer.innerHTML = '';

    try {
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            const personalizedMessage = message ? message.replace(/\{name\}/g, recipient.name) : '';

            try {
                const result = await ipcRenderer.invoke('send-whatsapp-auto', {
                    phoneNumber: recipient.phone,
                    message: personalizedMessage,
                    mediaPath: selectedMedia ? selectedMedia.filePath : null,
                    mediaCaption: selectedMedia ? personalizedMessage : null
                });

                if (result.success) {
                    successCount++;
                } else {
                    errorCount++;
                }

                // Update progress
                const progress = ((i + 1) / recipients.length) * 100;
                progressFill.style.width = progress + '%';
                progressText.textContent = 
                    `Sending ${i + 1} of ${recipients.length}... (${successCount} sent, ${errorCount} failed)`;

                // Small delay to avoid rate limiting
                if (i < recipients.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            } catch (error) {
                errorCount++;
            }
        }

        progressText.textContent = `Completed! ${successCount} sent, ${errorCount} failed.`;
        showSuccessScreen(successCount, errorCount, 'whatsapp');
    } catch (error) {
        progressText.textContent = `Error: ${error.message}`;
        showAlert('Error sending WhatsApp messages: ' + error.message, 'error');
    }
}

// Automatic SMS Functions
async function sendSMSMessagesAuto() {
    if (selectedData.length === 0) {
        showAlert('Please select some data first', 'error');
        return;
    }

    const message = document.getElementById('smsMessage').value;
    const phoneColumn = document.getElementById('phoneColumn').value;

    if (!message) {
        showAlert('Please enter a message', 'error');
        return;
    }

    if (!phoneColumn) {
        showAlert('Please specify the phone column name', 'error');
        return;
    }

    // Get API configuration
    const apiProvider = document.getElementById('smsProvider').value;
    const apiConfig = {
        provider: apiProvider,
        accountSid: document.getElementById('twilioAccountSid')?.value || '',
        authToken: document.getElementById('twilioAuthToken')?.value || '',
        fromNumber: document.getElementById('twilioFromNumber')?.value || '',
        apiKey: document.getElementById('completeApiKey')?.value || '',
        accessToken: document.getElementById('smsmodeToken')?.value || ''
    };

    // Validate API config based on provider
    if (apiProvider === 'twilio' && (!apiConfig.accountSid || !apiConfig.authToken || !apiConfig.fromNumber)) {
        showAlert('Please configure Twilio API credentials', 'error');
        return;
    }
    if (apiProvider === 'completeapi' && !apiConfig.apiKey) {
        showAlert('Please configure CompleteAPI key', 'error');
        return;
    }
    if (apiProvider === 'smsmode' && !apiConfig.accessToken) {
        showAlert('Please configure SMSMode access token', 'error');
        return;
    }

    const nameColumn = document.getElementById('nameColumn').value;

    // Prepare recipients
    const recipients = selectedData
        .map(item => ({
            phone: item[phoneColumn],
            name: item[nameColumn] || 'Valued Customer'
        }))
        .filter(recipient => recipient.phone && validatePhoneNumber(recipient.phone));

    if (recipients.length === 0) {
        showAlert('No valid phone numbers found', 'error');
        return;
    }

    // Update progress screen
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const resultsContainer = document.getElementById('resultsContainer');
    
    progressText.textContent = `Sending SMS to ${recipients.length} recipients...`;
    progressFill.style.width = '0%';
    resultsContainer.innerHTML = '';

    try {
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            const personalizedMessage = message.replace(/\{name\}/g, recipient.name);

            try {
                const result = await ipcRenderer.invoke('send-sms-api', {
                    phoneNumber: recipient.phone,
                    message: personalizedMessage,
                    apiConfig: apiConfig
                });

                if (result.success) {
                    successCount++;
                } else {
                    errorCount++;
                }

                // Update progress
                const progress = ((i + 1) / recipients.length) * 100;
                progressFill.style.width = progress + '%';
                progressText.textContent = 
                    `Sending ${i + 1} of ${recipients.length}... (${successCount} sent, ${errorCount} failed)`;

                // Small delay to avoid rate limiting
                if (i < recipients.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (error) {
                errorCount++;
            }
        }

        progressText.textContent = `Completed! ${successCount} sent, ${errorCount} failed.`;
        showSuccessScreen(successCount, errorCount, 'sms');
    } catch (error) {
        progressText.textContent = `Error: ${error.message}`;
        showAlert('Error sending SMS: ' + error.message, 'error');
    }
}

function toggleSMSProviderConfig() {
    const provider = document.getElementById('smsProvider').value;
    
    // Hide all config sections
    document.getElementById('twilioConfig').classList.add('hidden');
    document.getElementById('completeapiConfig').classList.add('hidden');
    document.getElementById('smsmodeConfig').classList.add('hidden');
    
    // Show selected provider config
    if (provider === 'twilio') {
        document.getElementById('twilioConfig').classList.remove('hidden');
    } else if (provider === 'completeapi') {
        document.getElementById('completeapiConfig').classList.remove('hidden');
    } else if (provider === 'smsmode') {
        document.getElementById('smsmodeConfig').classList.remove('hidden');
    }
}

// Utility Functions
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert at the top of content
    const content = document.querySelector('.content');
    content.insertBefore(alert, content.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Sample CSV data generator (for testing)
// generateSampleCSV function removed - not needed in wizard interface

// Sample CSV generation removed - not needed in wizard interface
