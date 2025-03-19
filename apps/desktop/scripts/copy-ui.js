const fs = require('fs');
const path = require('path');

// Create the target directory if it doesn't exist
const targetDir = path.join(__dirname, '..', 'node_modules', '@comicers', 'ui');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Source directory containing the UI files
const sourceDir = path.join(__dirname, '..', '..', '..', 'packages', 'ui', 'dist');

// Copy all files from source to target
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read all files in the source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy directories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy the files
copyDir(sourceDir, targetDir);

console.log('UI files copied successfully!'); 