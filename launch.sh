#!/bin/bash

echo "🚀 Starting Mail Picker Application..."
echo "📧 Desktop Email Sender with CSV Random Selection"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Set development environment
export NODE_ENV=development

# Start the application
echo "🖥️  Launching application..."
npm start
