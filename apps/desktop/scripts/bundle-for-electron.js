const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'out');
const resourcesDir = path.join(rootDir, 'resources');
const uiDistDir = path.join(resourcesDir, 'ui', 'dist');

// Ensure UI resources are correctly copied
console.log('✓ Checking UI resources...');
if (!fs.existsSync(uiDistDir)) {
  console.log('  Creating UI dist directory...');
  fs.mkdirSync(uiDistDir, { recursive: true });
}

// Check if UI build exists in the packages directory
const uiPackageDistDir = path.resolve(rootDir, '../../packages/ui/dist');
if (fs.existsSync(uiPackageDistDir)) {
  console.log('  Copying UI dist files...');
  // Copy UI dist files to resources
  fs.cpSync(uiPackageDistDir, uiDistDir, { recursive: true });
}

// Clean up any node_modules references
console.log('✓ Cleaning up package.json for electron-builder...');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = require(packageJsonPath);

// Remove workspace dependencies
if (packageJson.dependencies && packageJson.dependencies['@comicers/ui']) {
  delete packageJson.dependencies['@comicers/ui'];
}

// Write the modified package.json
fs.writeFileSync(
  packageJsonPath,
  JSON.stringify(packageJson, null, 2)
);

console.log('✓ Bundle preparation complete!'); 