import { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
const { ipcRenderer } = require('electron');
import { useRecoilValue, useSetRecoilState } from 'recoil';
import routes from '@/common/constants/routes.json';
import DashboardPage from './components/general/DashboardPage';
import ReaderPage from './components/reader/ReaderPage';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { migrateSeriesTags } from './features/library/utils';
import AppLoading from './components/general/AppLoading';
import { Toaster } from '@/components/ui/Toaster';
import { toast } from '@/components/ui/use-toast';
import { categoryListState, seriesListState, titlebarTextState } from './state/libraryStates';
import { downloaderClient } from './services/downloader';
import {
  currentTaskState,
  downloadErrorsState,
  queueState,
  runningState,
} from './state/downloaderStates';
import { autoCheckForUpdatesState } from './state/settingStates';
import library from './services/library';
import {
  createRendererIpcHandlers,
  loadStoredExtensionSettings,
  loadStoredTrackerTokens,
} from './services/ipc';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { UpdateInfo } from 'electron-updater';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { WifiOffIcon, Loader2Icon, ClockIcon } from 'lucide-react';
import { Progress } from '@/components/ui/Progress';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { SettingsConfig } from './components/settings/SettingsConfig';

loadStoredExtensionSettings();
loadStoredTrackerTokens();

interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

const SCHEDULE_OPTIONS = [
  { value: '1h', label: 'In 1 hour', ms: 3600000 },
  { value: '4h', label: 'In 4 hours', ms: 14400000 },
  { value: '8h', label: 'In 8 hours', ms: 28800000 },
  { value: '24h', label: 'Tomorrow', ms: 86400000 },
];

interface Settings {
  theme: 'light' | 'dark';
  autoUpdate: boolean;
  telemetry: boolean;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | undefined>(undefined);
  const [showUpdateAvailableDialog, setShowUpdateAvailableDialog] = useState(false);
  const [showUpdateDownloadedDialog, setShowUpdateDownloadedDialog] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [releaseNotes, setReleaseNotes] = useState<string>('Loading release notes...');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDisplayIssueNotice, setShowDisplayIssueNotice] = useState(false);
  const [showFirstLaunch, setShowFirstLaunch] = useState(false);
  const setSeriesList = useSetRecoilState(seriesListState);
  const setCategoryList = useSetRecoilState(categoryListState);
  const setRunning = useSetRecoilState(runningState);
  const setQueue = useSetRecoilState(queueState);
  const setCurrentTask = useSetRecoilState(currentTaskState);
  const setDownloadErrors = useSetRecoilState(downloadErrorsState);
  const autoCheckForUpdates = useRecoilValue(autoCheckForUpdatesState);
  const isOnline = useNetworkStatus();
  const setTitlebarText = useSetRecoilState(titlebarTextState);

  useEffect(() => {
    if (loading) {
      console.debug('Performing initial app load steps');

      createRendererIpcHandlers(
        (updateInfo) => {
          setUpdateInfo(updateInfo);
          setShowUpdateAvailableDialog(true);
          // Fetch release notes when update is available
          if (updateInfo?.version) {
            ipcRenderer
              .invoke(ipcChannels.APP.GET_RELEASE_NOTES, updateInfo.version)
              .then((notes: string) => setReleaseNotes(notes))
              .catch((error) => {
                console.error('Error fetching release notes:', error);
                setReleaseNotes('Failed to load release notes. Please try again later.');
              });
          } else {
            setReleaseNotes('No release notes available.');
          }
        },
        () => setShowUpdateDownloadedDialog(true),
      );

      // Listen for download progress
      ipcRenderer.on(ipcChannels.APP.UPDATE_DOWNLOAD_PROGRESS, (_event, progress: UpdateProgress) => {
        setUpdateProgress(progress);
      });

      downloaderClient.setStateFunctions(setRunning, setQueue, setCurrentTask, setDownloadErrors);

      migrateSeriesTags();

      library
        .fetchSeriesList()
        .filter((series) => series.preview)
        .forEach((series) => (series.id ? library.removeSeries(series.id, false) : undefined));

      if (autoCheckForUpdates) {
        ipcRenderer.invoke(ipcChannels.APP.CHECK_FOR_UPDATES);
      } else {
        console.debug('Skipping update check, autoCheckForUpdates is disabled');
      }

      setSeriesList(library.fetchSeriesList());
      setCategoryList(library.fetchCategoryList());
      setLoading(false);
    }

    return () => {
      ipcRenderer.removeAllListeners(ipcChannels.APP.UPDATE_DOWNLOAD_PROGRESS);
    };
  }, [loading]);

  // Update titlebar text with network status
  useEffect(() => {
    setTitlebarText(prev => {
      const base = prev || 'Comicers';
      return !isOnline ? `${base} (Offline)` : base;
    });
  }, [isOnline]);

  // Add this to the existing useEffect that handles location changes
  useEffect(() => {
    const handleRouteChange = () => {
      // Show notice when navigating from reader
      if (window.location.hash.includes(routes.READER)) {
        setShowDisplayIssueNotice(true);
      }
    };
    window.addEventListener('hashchange', handleRouteChange);
    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, []);

  useEffect(() => {
    // Check if this is the first launch
    const isFirstLaunch = !localStorage.getItem('hasCompletedSetup');
    setShowFirstLaunch(isFirstLaunch);

    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const handleFirstLaunchComplete = (settings: Settings) => {
    // Save settings
    localStorage.setItem('theme', settings.theme);
    localStorage.setItem('autoUpdate', String(settings.autoUpdate));
    localStorage.setItem('telemetry', String(settings.telemetry));
    localStorage.setItem('hasCompletedSetup', 'true');
    
    // Apply theme
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    
    setShowFirstLaunch(false);
  };

  const handleUpdateDownload = () => {
    setIsDownloading(true);
    ipcRenderer.invoke(ipcChannels.APP.PERFORM_UPDATE);
  };

  const handleScheduleUpdate = (delayMs: number) => {
    const scheduledDate = new Date(Date.now() + delayMs);
    ipcRenderer.invoke(ipcChannels.APP.UPDATE_SCHEDULED, scheduledDate.toISOString());
    setShowUpdateAvailableDialog(false);
    toast({
      title: 'Update Scheduled',
      description: `The update will be installed ${new Date(scheduledDate).toLocaleString()}`,
    });
  };

  return (
    <>
      <SettingsConfig
        isOpen={showFirstLaunch}
        onComplete={handleFirstLaunchComplete}
        isPreLaunch={true}
      />
      {showDisplayIssueNotice && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 px-4 py-2 text-center z-[9999]">
          If you notice any display issues, please press F5 to reload the page
          <button 
            onClick={() => setShowDisplayIssueNotice(false)}
            className="ml-4 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
          >
            ✕
          </button>
        </div>
      )}

      <div className={showDisplayIssueNotice ? "pt-10" : ""}>
        <Toaster />

        <div className="flex flex-col min-h-screen">
          {!isOnline && (
            <div className="flex justify-center p-2">
              <Alert variant="destructive" className="w-fit rounded-full bg-yellow-500/10 border-yellow-500">
                <AlertDescription className="flex items-center space-x-2 px-2 text-yellow-500">
                  <WifiOffIcon className="w-4 h-4" />
                  <span>You are currently offline. Some features may be unavailable.</span>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <AlertDialog open={showUpdateAvailableDialog} onOpenChange={setShowUpdateAvailableDialog}>
            <AlertDialogContent className="sm:max-w-[525px]">
              <AlertDialogHeader>
                <AlertDialogTitle>Update available</AlertDialogTitle>
                <AlertDialogDescription>
                  A new version of Comicers is available. Would you like to update now?
                </AlertDialogDescription>
              </AlertDialogHeader>

              {updateInfo && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">
                      Version {updateInfo.version} • Released{' '}
                      {new Date(updateInfo.releaseDate).toLocaleDateString()}
                    </p>
                    {isDownloading && updateProgress && (
                      <p className="text-sm text-muted-foreground">
                        {Math.round(updateProgress.percent)}%
                      </p>
                    )}
                  </div>

                  {isDownloading && (
                    <Progress value={updateProgress?.percent || 0} className="w-full" />
                  )}

                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">Release Notes</h4>
                    <ScrollArea className="h-[200px] w-full rounded border p-4">
                      <div className="text-sm whitespace-pre-wrap">{releaseNotes}</div>
                    </ScrollArea>
                  </div>
                </div>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDownloading}>Not now</AlertDialogCancel>
                
                <Select onValueChange={(value) => handleScheduleUpdate(Number(value))}>
                  <SelectTrigger className="w-[180px]" disabled={isDownloading}>
                    <ClockIcon className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Schedule..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.ms.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <AlertDialogAction
                  onClick={handleUpdateDownload}
                  disabled={isDownloading}
                  className="relative"
                >
                  {isDownloading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    'Download & Install'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showUpdateDownloadedDialog} onOpenChange={setShowUpdateDownloadedDialog}>
            <AlertDialogContent className="sm:max-w-[425px]">
              <AlertDialogHeader>
                <AlertDialogTitle>Restart required</AlertDialogTitle>
                {updateInfo && (
                  <AlertDialogDescription>
                    Comicers needs to restart to finish installing updates.
                  </AlertDialogDescription>
                )}
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Not now</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => ipcRenderer.invoke(ipcChannels.APP.UPDATE_AND_RESTART)}
                >
                  Restart
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {loading ? (
            <AppLoading />
          ) : (
            <Router>
              <Routes>
                <Route path={`${routes.READER}/:series_id/:chapter_id`} element={<ReaderPage />} />
                <Route path="*" element={<DashboardPage />} />
              </Routes>
            </Router>
          )}
        </div>
      </div>
    </>
  );
}
