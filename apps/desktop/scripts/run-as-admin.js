const { spawn } = require('child_process');
const path = require('path');

console.log('Launching PowerShell with admin privileges to build Windows app...');

// Create the command that will be run
const buildCommand = 'cd ' + path.resolve(__dirname, '..') + ' && pnpm dist:win';

// Launch PowerShell with admin privileges
const ps = spawn('powershell.exe', [
  '-Command',
  `Start-Process powershell -ArgumentList '-NoExit -Command "${buildCommand}"' -Verb RunAs`
]);

ps.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ps.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

ps.on('close', (code) => {
  console.log(`PowerShell process exited with code ${code}`);
  console.log('Please check the admin PowerShell window for build progress and results.');
}); 