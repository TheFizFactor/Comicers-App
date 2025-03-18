const fs = require('fs');
const path = require('path');

// Get current working directory (should be packages/ui)
const cwd = process.cwd();
const uiDistPath = path.join(cwd, 'dist');
const desktopResourcesPath = path.join(cwd, '../../apps/desktop/resources/ui/dist');

console.log('Copying UI files to desktop resources:');
console.log(`From: ${uiDistPath}`);
console.log(`To: ${desktopResourcesPath}`);

// Create destination directory if it doesn't exist
if (!fs.existsSync(desktopResourcesPath)) {
  fs.mkdirSync(desktopResourcesPath, { recursive: true });
  console.log('Created target directory');
}

// Recursive function to copy files
function copyFolderSync(from, to) {
  // Create the destination folder if it doesn't exist
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }

  // Read all files in the source folder
  const files = fs.readdirSync(from);
  
  // Copy each file to the destination
  files.forEach(file => {
    const sourceFile = path.join(from, file);
    const targetFile = path.join(to, file);
    
    // Check if it's a directory or a file
    const stats = fs.statSync(sourceFile);
    
    if (stats.isDirectory()) {
      // If it's a directory, recursively copy its contents
      copyFolderSync(sourceFile, targetFile);
    } else {
      // If it's a file, copy it directly
      fs.copyFileSync(sourceFile, targetFile);
    }
  });
}

// Copy files
try {
  copyFolderSync(uiDistPath, desktopResourcesPath);
  console.log('Successfully copied UI files');
} catch (err) {
  console.error('Error copying UI files:', err);
  process.exit(1);
} 