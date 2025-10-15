const { ipcRenderer } = require('electron');

let csvData = [];
let selectedData = [];
let emailConfig = {};

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

    try {
        showAlert('Testing email configuration...', 'info');
        const result = await ipcRenderer.invoke('test-email', config);
        
        if (result.success) {
            showAlert('Test email sent successfully! Check your inbox.', 'success');
        } else {
            showAlert('Test email failed: ' + result.error, 'error');
        }
    } catch (error) {
        showAlert('Error testing email: ' + error.message, 'error');
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
            
            if (emailCol) {
                document.getElementById('emailColumn').value = emailCol;
            }
            if (nameCol) {
                document.getElementById('nameColumn').value = nameCol;
            }
        }
    } catch (error) {
        showAlert('Error loading CSV file: ' + error.message, 'error');
    }
}

// Random Data Selection
function selectRandomData() {
    if (csvData.length === 0) {
        showAlert('Please load a CSV file first', 'error');
        return;
    }

    const numRecords = parseInt(document.getElementById('numRecords').value);
    const emailColumn = document.getElementById('emailColumn').value;
    const nameColumn = document.getElementById('nameColumn').value;

    if (!emailColumn) {
        showAlert('Please specify the email column name', 'error');
        return;
    }

    // Filter data that has email addresses
    const validData = csvData.filter(row => 
        row[emailColumn] && 
        row[emailColumn].includes('@') && 
        row[emailColumn].includes('.')
    );

    if (validData.length === 0) {
        showAlert('No valid email addresses found in the specified column', 'error');
        return;
    }

    // Select random records
    const shuffled = [...validData].sort(() => 0.5 - Math.random());
    selectedData = shuffled.slice(0, Math.min(numRecords, validData.length));

    displaySelectedData();
    showAlert(`Selected ${selectedData.length} random records`, 'success');
}

function displaySelectedData() {
    const container = document.getElementById('selectedData');
    const section = document.getElementById('selectedDataSection');
    
    if (selectedData.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    container.innerHTML = '';

    const emailColumn = document.getElementById('emailColumn').value;
    const nameColumn = document.getElementById('nameColumn').value;

    selectedData.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'data-item';
        div.innerHTML = `
            <div class="data-info">
                <div class="data-email">${item[emailColumn] || 'No email'}</div>
                <div class="data-name">${item[nameColumn] || 'No name'}</div>
            </div>
            <div class="status pending">Selected</div>
        `;
        container.appendChild(div);
    });
}

function clearSelection() {
    selectedData = [];
    document.getElementById('selectedDataSection').classList.add('hidden');
    showAlert('Selection cleared', 'info');
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

    const emailColumn = document.getElementById('emailColumn').value;
    const nameColumn = document.getElementById('nameColumn').value;

    // Prepare recipients
    const recipients = selectedData.map(item => ({
        email: item[emailColumn],
        name: item[nameColumn] || 'Valued Customer'
    }));

    // Show progress section
    document.getElementById('progressSection').classList.remove('hidden');
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('progressText').textContent = `Preparing to send emails using ${currentEmailConfig.service} (${currentEmailConfig.email})...`;
    document.getElementById('progressFill').style.width = '0%';

    try {
        const results = await ipcRenderer.invoke('send-emails', {
            recipients,
            emailConfig: currentEmailConfig,
            subject,
            message
        });

        displayEmailResults(results);
        showAlert(`Email sending completed! Check results below.`, 'success');
    } catch (error) {
        showAlert('Error sending emails: ' + error.message, 'error');
    } finally {
        document.getElementById('sendBtn').disabled = false;
    }
}

function displayEmailResults(results) {
    const container = document.getElementById('emailResults');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
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
        progressText.textContent = `Sending email ${index + 1} of ${results.length}...`;
    });

    // Final progress update
    progressText.textContent = `Completed! ${successCount} sent, ${errorCount} failed`;
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
function generateSampleCSV() {
    const sampleData = [
        { name: 'John Doe', email: 'john.doe@example.com', company: 'Tech Corp' },
        { name: 'Jane Smith', email: 'jane.smith@example.com', company: 'Design Inc' },
        { name: 'Bob Johnson', email: 'bob.johnson@example.com', company: 'Marketing Ltd' },
        { name: 'Alice Brown', email: 'alice.brown@example.com', company: 'Sales Co' },
        { name: 'Charlie Wilson', email: 'charlie.wilson@example.com', company: 'Finance Group' },
        { name: 'Diana Davis', email: 'diana.davis@example.com', company: 'HR Solutions' },
        { name: 'Eve Miller', email: 'eve.miller@example.com', company: 'Consulting' },
        { name: 'Frank Garcia', email: 'frank.garcia@example.com', company: 'Development' },
        { name: 'Grace Lee', email: 'grace.lee@example.com', company: 'Support Team' },
        { name: 'Henry Taylor', email: 'henry.taylor@example.com', company: 'Operations' }
    ];

    // Convert to CSV format
    const headers = Object.keys(sampleData[0]);
    const csvContent = [
        headers.join(','),
        ...sampleData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_contacts.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Add sample data button (for testing)
document.addEventListener('DOMContentLoaded', () => {
    const csvSection = document.querySelector('.section:nth-child(3)');
    const sampleBtn = document.createElement('button');
    sampleBtn.className = 'btn btn-secondary';
    sampleBtn.textContent = 'Generate Sample CSV';
    sampleBtn.onclick = generateSampleCSV;
    sampleBtn.style.marginLeft = '10px';
    
    const csvButton = csvSection.querySelector('button');
    csvButton.parentNode.insertBefore(sampleBtn, csvButton.nextSibling);
});
