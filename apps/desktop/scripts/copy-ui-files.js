const fs = require('fs');
const path = require('path');

// Define source and destination paths
const uiDistDir = path.resolve(__dirname, '../../../packages/ui/dist');
const destDir = path.resolve(__dirname, '../resources/ui/dist');
const uiSrcDir = path.resolve(__dirname, '../../../packages/ui/src');
const destSrcDir = path.resolve(__dirname, '../node_modules/@comicers/ui');

// Copy UI dist files to desktop resources
console.log('Copying UI files to desktop resources:');
console.log(`From: ${uiDistDir}`);
console.log(`To: ${destDir}`);

// Create destination directories if they don't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

if (!fs.existsSync(destSrcDir)) {
  fs.mkdirSync(destSrcDir, { recursive: true });
  fs.mkdirSync(path.join(destSrcDir, 'components'), { recursive: true });
  fs.mkdirSync(path.join(destSrcDir, 'hooks'), { recursive: true });
}

// Copy dist files
copyDirectory(uiDistDir, destDir);
console.log('Successfully copied UI files');

// Copy src files to node_modules for direct imports
console.log('Copying UI source files for direct imports:');
console.log(`From: ${uiSrcDir}`);
console.log(`To: ${destSrcDir}`);

// Copy components and hooks
copyDirectory(path.join(uiSrcDir, 'components'), path.join(destSrcDir, 'components'));
copyDirectory(path.join(uiSrcDir, 'hooks'), path.join(destSrcDir, 'hooks'));

// Create a package.json in the @comicers/ui directory
fs.writeFileSync(
  path.join(destSrcDir, 'package.json'),
  JSON.stringify({
    name: '@comicers/ui',
    version: '0.0.0',
    main: './dist/index.js',
    types: './dist/index.d.ts',
  }, null, 2)
);

console.log('Successfully copied UI source files for direct imports');

/**
 * Recursively copy a directory
 * @param {string} src Source directory
 * @param {string} dest Destination directory
 */
function copyDirectory(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory contents
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectory(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
    }
  }
} 