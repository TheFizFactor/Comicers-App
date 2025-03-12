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
import { Toaster } from '@comicers/ui/components/Toaster';
import { toast } from '@comicers/ui/hooks/use-toast';
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
} from '@comicers/ui/components/AlertDialog';
import { UpdateInfo } from 'electron-updater';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { Alert, AlertDescription } from '@comicers/ui/components/Alert';
import { WifiOffIcon, Loader2Icon, ClockIcon } from 'lucide-react';
import { Progress } from '@comicers/ui/components/Progress';
import { ScrollArea } from '@comicers/ui/components/ScrollArea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@comicers/ui/components/Select';

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

export default function App() {
  const [loading, setLoading] = useState(true);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | undefined>(undefined);
  const [showUpdateAvailableDialog, setShowUpdateAvailableDialog] = useState(false);
  const [showUpdateDownloadedDialog, setShowUpdateDownloadedDialog] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [releaseNotes, setReleaseNotes] = useState<string>('Loading release notes...');
  const [isDownloading, setIsDownloading] = useState(false);
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
          ipcRenderer
            .invoke(ipcChannels.APP.GET_RELEASE_NOTES, updateInfo.version)
            .then((notes: string) => setReleaseNotes(notes))
            .catch(console.error);
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
    </>
  );
}
