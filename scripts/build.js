#!/usr/bin/env node

/**
 * Multi-Browser Build & Packaging Script for YouTube Custom Chat & Danmaku
 * Builds clean, lightweight packages for both Google Chrome and Mozilla Firefox.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const CHROME_OUT = path.join(DIST_DIR, 'chrome');
const FIREFOX_OUT = path.join(DIST_DIR, 'firefox');

// 1. Read base manifest.json
const manifestPath = path.join(ROOT_DIR, 'manifest.json');
const rawManifest = fs.readFileSync(manifestPath, 'utf8');
const baseManifest = JSON.parse(rawManifest);
const version = baseManifest.version || '1.0.0';

console.log(`\n📦 Building YouTube Custom Chat & Danmaku v${version}...`);

// 2. Clean and create output directories
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(CHROME_OUT, { recursive: true });
fs.mkdirSync(FIREFOX_OUT, { recursive: true });

// 3. Helper to copy files recursively
function copyDir(src, dest, filterFn) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (filterFn && !filterFn(srcPath, entry)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, filterFn);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 4. File filtering rules
// Exclude dev scripts, heavy uncompressed images, documentation, and OS files
function iconFilter(filePath, dirent) {
  const allowedIcons = ['icon-16.png', 'icon-48.png', 'icon-128.png'];
  return allowedIcons.includes(dirent.name);
}

function generalFilter(filePath, dirent) {
  if (dirent.name.startsWith('.') || dirent.name.endsWith('.DS_Store')) return false;
  return true;
}

// 5. Populate Common Files for target directory
function populateTarget(targetDir, manifestObj) {
  // Write custom manifest.json
  fs.writeFileSync(
    path.join(targetDir, 'manifest.json'),
    JSON.stringify(manifestObj, null, 2) + '\n',
    'utf8'
  );

  // Copy content scripts and styles
  copyDir(path.join(ROOT_DIR, 'content'), path.join(targetDir, 'content'), generalFilter);

  // Copy popup UI
  copyDir(path.join(ROOT_DIR, 'popup'), path.join(targetDir, 'popup'), generalFilter);

  // Copy icons (only official required sizes)
  copyDir(path.join(ROOT_DIR, 'icons'), path.join(targetDir, 'icons'), iconFilter);

  // Copy LICENSE if available
  const licenseSrc = path.join(ROOT_DIR, 'LICENSE');
  if (fs.existsSync(licenseSrc)) {
    fs.copyFileSync(licenseSrc, path.join(targetDir, 'LICENSE'));
  }
}

// 6. Build Chrome Package
const chromeManifest = JSON.parse(JSON.stringify(baseManifest));
delete chromeManifest.browser_specific_settings; // Ensure clean Chrome MV3 manifest
populateTarget(CHROME_OUT, chromeManifest);

// 7. Build Firefox Package
const firefoxManifest = JSON.parse(JSON.stringify(baseManifest));
firefoxManifest.browser_specific_settings = {
  gecko: {
    id: 'youtube-custom-chat@khanhnkq',
    strict_min_version: '109.0',
    data_collection_permissions: {
      required: ['none']
    }
  }
};
populateTarget(FIREFOX_OUT, firefoxManifest);

// 8. Create ZIP Archives
function createZip(sourceDir, zipFileName) {
  const zipFilePath = path.join(DIST_DIR, zipFileName);
  // Zip from inside source directory to avoid nesting folder
  execSync(`cd "${sourceDir}" && zip -r -q "${zipFilePath}" ./*`, { stdio: 'inherit' });
  const stats = fs.statSync(zipFilePath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  return { path: zipFilePath, sizeKB };
}

const chromeZipName = `YouTube-Custom-Chat-Chrome-v${version}.zip`;
const firefoxZipName = `YouTube-Custom-Chat-Firefox-v${version}.zip`;
const firefoxXpiName = `YouTube-Custom-Chat-Firefox-v${version}.xpi`;

const chromeZip = createZip(CHROME_OUT, chromeZipName);
const firefoxZip = createZip(FIREFOX_OUT, firefoxZipName);

// Also generate .xpi (standard Firefox add-on file extension)
fs.copyFileSync(firefoxZip.path, path.join(DIST_DIR, firefoxXpiName));

// 9. Output Summary
console.log('✅ Build completed successfully!\n');
console.log('📊 Generated Artifacts in dist/:');
console.log(`   ├── Chrome  (Unpacked) : dist/chrome/`);
console.log(`   │   └── Package        : dist/${chromeZipName} (${chromeZip.sizeKB} KB)`);
console.log(`   ├── Firefox (Unpacked) : dist/firefox/`);
console.log(`   │   └── Package        : dist/${firefoxZipName} (${firefoxZip.sizeKB} KB)`);
console.log(`   │   └── AMO XPI        : dist/${firefoxXpiName}`);
console.log('\n🚀 Next Steps:');
console.log('   - Test in Chrome  : Open chrome://extensions -> Load unpacked -> select dist/chrome');
console.log('   - Test in Firefox : Open about:debugging#/runtime/this-firefox -> Load Temporary Add-on -> select dist/firefox/manifest.json');
console.log('   - Lint for Firefox: npm run lint:firefox\n');
