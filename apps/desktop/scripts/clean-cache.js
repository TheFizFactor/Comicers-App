const fs = require('fs');
const path = require('path');
const os = require('os');

const cachePath = path.join(os.homedir(), '.cache', 'electron-builder');

if (fs.existsSync(cachePath)) {
  console.log(`Removing electron-builder cache at ${cachePath}`);
  fs.rmSync(cachePath, { recursive: true, force: true });
  console.log('Cache removed successfully');
} else {
  console.log('No electron-builder cache found');
} 