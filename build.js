const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Mail Picker Application...\n');

// Clean previous builds
console.log('🧹 Cleaning previous builds...');
if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
    execSync('npm install', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
}

// Build for different platforms
const platforms = process.argv.slice(2);

if (platforms.length === 0) {
    console.log('📱 Building for all platforms...');
    try {
        execSync('npm run build-all', { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
} else {
    for (const platform of platforms) {
        console.log(`📱 Building for ${platform}...`);
        try {
            if (platform === 'win' || platform === 'windows') {
                execSync('npm run build-win', { stdio: 'inherit' });
            } else if (platform === 'mac' || platform === 'macos') {
                execSync('npm run build-mac', { stdio: 'inherit' });
            } else {
                console.log(`⚠️  Unknown platform: ${platform}`);
            }
        } catch (error) {
            console.error(`❌ Build failed for ${platform}:`, error.message);
        }
    }
}

console.log('\n✅ Build completed!');
console.log('📁 Check the "dist" folder for your built applications.');

// List built files
if (fs.existsSync('dist')) {
    console.log('\n📋 Built files:');
    const files = fs.readdirSync('dist');
    files.forEach(file => {
        const filePath = path.join('dist', file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
            const size = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`  - ${file} (${size} MB)`);
        }
    });
}
