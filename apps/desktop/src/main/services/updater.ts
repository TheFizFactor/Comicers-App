import { IpcMain } from 'electron';
import { autoUpdater, UpdateCheckResult, UpdateDownloadedEvent } from 'electron-updater';
import ipcChannels from '@/common/constants/ipcChannels.json';
import packageJson from '../../../package.json';
import axios from 'axios';

interface ScheduledUpdate {
  version: string;
  scheduledDate: Date;
  timer: NodeJS.Timeout;
}

let currentScheduledUpdate: ScheduledUpdate | null = null;

export const createUpdaterIpcHandlers = (ipcMain: IpcMain) => {
  console.debug('Creating updater IPC handlers in main...');

  ipcMain.handle(ipcChannels.APP.CHECK_FOR_UPDATES, async (event) => {
    console.debug('Handling check for updates request...');
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
      console.info('Skipping update check because we are in dev environment');
      return;
    }

    autoUpdater.logger = console;
    autoUpdater.autoDownload = false;

    // Set up progress tracking
    autoUpdater.on('download-progress', (progressObj) => {
      event.sender.send(ipcChannels.APP.UPDATE_DOWNLOAD_PROGRESS, progressObj);
    });

    return autoUpdater
      .checkForUpdates()
      .then((result: UpdateCheckResult) => {
        if (result.updateInfo.version === packageJson.version) {
          console.info(`Already up-to-date at version ${packageJson.version}`);
          event.sender.send(
            ipcChannels.APP.SEND_NOTIFICATION,
            'Comicers is up-to-date!',
            'You are using the latest version.',
          );
          return;
        }

        console.info(
          `Found update to version ${result.updateInfo.version} (from ${packageJson.version})`,
        );
        event.sender.send(ipcChannels.APP.SHOW_PERFORM_UPDATE_DIALOG, result.updateInfo);
        return result;
      })
      .catch((e) => console.error(e));
  });

  ipcMain.handle(ipcChannels.APP.GET_RELEASE_NOTES, async (_event, version: string) => {
    try {
      // This assumes your releases are on GitHub. Adjust the URL if using a different platform
      const response = await axios.get(
        `https://api.github.com/repos/comicers/comicers/releases/tags/v${version}`,
      );
      return response.data.body || 'No release notes available.';
    } catch (error) {
      console.error('Error fetching release notes:', error);
      return 'Failed to load release notes.';
    }
  });

  ipcMain.handle(ipcChannels.APP.PERFORM_UPDATE, (event) => {
    // Clear any scheduled updates
    if (currentScheduledUpdate) {
      clearTimeout(currentScheduledUpdate.timer);
      currentScheduledUpdate = null;
    }

    autoUpdater.removeAllListeners();

    autoUpdater.on('update-downloaded', (info: UpdateDownloadedEvent) => {
      event.sender.send(
        ipcChannels.APP.SEND_NOTIFICATION,
        'Downloaded update',
        `Restart to finish installing update to version ${info.version}`,
      );
      event.sender.send(ipcChannels.APP.SHOW_RESTART_UPDATE_DIALOG);
    });

    autoUpdater.on('error', (err: Error) => {
      console.error(`Updater encountered error: ${err}`);
      event.sender.send(
        ipcChannels.APP.SEND_NOTIFICATION,
        'Failed to update',
        `${err.name}: ${err.message}`,
      );
    });

    autoUpdater
      .checkForUpdates()
      .then((result) => {
        if (result.updateInfo.version !== packageJson.version) {
          event.sender.send(
            ipcChannels.APP.SEND_NOTIFICATION,
            'Downloading update',
            `Downloading update for v${result.updateInfo.version}`,
          );
          autoUpdater.downloadUpdate();
        }
      })
      .catch((e) => console.error(e));
  });

  ipcMain.handle(ipcChannels.APP.UPDATE_SCHEDULED, (event, scheduledDate: string) => {
    // Clear any existing scheduled updates
    if (currentScheduledUpdate) {
      clearTimeout(currentScheduledUpdate.timer);
    }

    // Schedule the update
    const scheduleTime = new Date(scheduledDate).getTime() - Date.now();
    const timer = setTimeout(() => {
      event.sender.send(
        ipcChannels.APP.SEND_NOTIFICATION,
        'Scheduled Update',
        'Starting scheduled update installation...',
      );
      autoUpdater
        .checkForUpdates()
        .then((result) => {
          if (result.updateInfo.version !== packageJson.version) {
            autoUpdater.downloadUpdate();
          }
        })
        .catch((e) => console.error(e));
    }, scheduleTime);

    currentScheduledUpdate = {
      version: packageJson.version,
      scheduledDate: new Date(scheduledDate),
      timer,
    };
  });

  ipcMain.handle(ipcChannels.APP.UPDATE_AND_RESTART, () => {
    autoUpdater.quitAndInstall(true, true);
  });
};
