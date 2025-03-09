// ...existing code...

import fs from 'fs';
import { dialog, ipcMain } from 'electron';

// Add these IPC handlers
ipcMain.handle('dialog:showSaveDialog', async (_event, options) => {
  return dialog.showSaveDialog(options);
});

ipcMain.handle('dialog:showOpenDialog', async (_event, options) => {
  return dialog.showOpenDialog(options);
});

ipcMain.handle('fs:writeFile', async (_event, filePath, data) => {
  return fs.promises.writeFile(filePath, data, 'utf8');
});

ipcMain.handle('fs:readFile', async (_event, filePath) => {
  return fs.promises.readFile(filePath, 'utf8');
});

// ...rest of the file...