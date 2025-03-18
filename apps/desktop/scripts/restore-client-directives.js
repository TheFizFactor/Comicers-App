const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define the pattern to find backup files
const BACKUP_FILES_GLOB = path.resolve(__dirname, '../../../packages/ui/src/**/*.tsx.bak');

console.log('Restoring UI components with "use client" directives...');
console.log(`Looking for backups in: ${BACKUP_FILES_GLOB}`);

// Find all backup files
glob(BACKUP_FILES_GLOB, (err, files) => {
  if (err) {
    console.error('Error finding backup files:', err);
    return;
  }

  console.log(`Found ${files.length} backup files to restore.`);
  
  files.forEach(backupFile => {
    const originalFile = backupFile.slice(0, -4); // Remove .bak extension
    
    // Copy the backup content back to the original file
    fs.copyFileSync(backupFile, originalFile);
    
    // Delete the backup file
    fs.unlinkSync(backupFile);
    
    console.log(`Restored: ${path.basename(originalFile)}`);
  });
  
  console.log(`Restored ${files.length} files with "use client" directives.`);
}); 