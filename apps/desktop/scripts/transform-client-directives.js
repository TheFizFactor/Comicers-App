const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define the pattern to find files with "use client" directives
const UI_COMPONENTS_GLOB = path.resolve(__dirname, '../../../packages/ui/src/**/*.tsx');

console.log('Transforming UI components to remove "use client" directives...');
console.log(`Looking in: ${UI_COMPONENTS_GLOB}`);

// Find all UI component files
glob(UI_COMPONENTS_GLOB, (err, files) => {
  if (err) {
    console.error('Error finding files:', err);
    return;
  }

  console.log(`Found ${files.length} files to check.`);
  
  let modifiedCount = 0;
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if the file has "use client" directive
    if (content.includes('"use client"') || content.includes("'use client'")) {
      // Create backup
      const backupFile = file + '.bak';
      fs.writeFileSync(backupFile, content);
      
      // Remove the "use client" directive
      content = content.replace(/["']use client["'];?\s*/g, '');
      
      // Write back the modified content
      fs.writeFileSync(file, content);
      
      console.log(`Modified: ${path.basename(file)}`);
      modifiedCount++;
    }
  });
  
  console.log(`Transformed ${modifiedCount} files to remove "use client" directives.`);
  console.log('After building, run the restore script to put them back.');
}); 