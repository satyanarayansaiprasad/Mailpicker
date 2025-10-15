@echo off
echo 🚀 Starting Mail Picker Application...
echo 📧 Desktop Email Sender with CSV Random Selection
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

REM Set development environment
set NODE_ENV=development

REM Start the application
echo 🖥️  Launching application...
npm start

pause
