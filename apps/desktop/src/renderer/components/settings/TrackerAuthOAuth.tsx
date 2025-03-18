import React, { useEffect, useState } from 'react';
const { ipcRenderer } = require('electron');
import ipcChannels from '@/common/constants/ipcChannels.json';
import storeKeys from '@/common/constants/storeKeys.json';
import persistantStore from '@/renderer/util/persistantStore';
import { TrackerMetadata } from '@/common/models/types';
import { AccordionContent, AccordionTrigger } from '@comicers/ui/components/Accordion';
import { Button } from '@comicers/ui/components/Button';
import {
  ExternalLinkIcon,
  Loader2Icon,
  CheckCircle2,
  WifiOffIcon,
  LogInIcon,
  LogOutIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { Input } from '@comicers/ui/components/Input';
import { Alert, AlertDescription } from '@comicers/ui/components/Alert';
import { useNetworkStatus } from '@/renderer/hooks/useNetworkStatus';
import { Badge } from '@comicers/ui/components/Badge';

type Props = {
  trackerMetadata: TrackerMetadata;
};

export const TrackerAuthOAuth: React.FC<Props> = (props: Props) => {
  const [loading, setLoading] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [authUrls, setAuthUrls] = useState<{ [trackerId: string]: string }>({});
  const [username, setUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const isOnline = useNetworkStatus();

  const loadTrackerDetails = async () => {
    setLoading(true);
    setError(null);
    setShowSuccess(false);

    if (!isOnline) {
      setLoading(false);
      return;
    }

    setAuthUrls(
      await ipcRenderer.invoke(ipcChannels.TRACKER.GET_AUTH_URLS).catch((e) => console.error(e)),
    );
    const newUsername = await ipcRenderer
      .invoke(ipcChannels.TRACKER.GET_USERNAME, props.trackerMetadata.id)
      .catch((e) => console.error(e));
    
    setUsername(newUsername);
    if (newUsername) {
      setShowSuccess(true);
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }

    setLoading(false);
  };

  const saveAccessToken = async (accessToken: string) => {
    if (!isOnline) {
      setError('Cannot authenticate while offline');
      return;
    }

    setLoading(true);
    setError(null);
    setShowSuccess(false);

    persistantStore.write(
      `${storeKeys.TRACKER_ACCESS_TOKEN_PREFIX}${props.trackerMetadata.id}`,
      accessToken,
    );
    await ipcRenderer
      .invoke(ipcChannels.TRACKER.SET_ACCESS_TOKEN, props.trackerMetadata.id, accessToken)
      .catch((e) => console.error(e));

    loadTrackerDetails();
  };

  const submitAccessCode = async () => {
    if (!isOnline) {
      setError('Cannot authenticate while offline');
      return;
    }

    if (!accessCode || accessCode.trim() === '') {
      setError('Please enter a valid access code');
      return;
    }

    setLoading(true);
    setError(null);
    setShowSuccess(false);

    try {
      const token = await ipcRenderer.invoke(
        ipcChannels.TRACKER.GET_TOKEN, 
        props.trackerMetadata.id, 
        accessCode
      );
      
      if (!token) {
        setError('Authentication failed. Please try again with a new code.');
        setLoading(false);
        return;
      }
      
      await saveAccessToken(token || '');
    } catch (e) {
      console.error(e);
      setError('An error occurred during authentication. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackerDetails();
  }, [isOnline]);

  if (loading) {
    return (
      <AccordionTrigger className="hover:no-underline" disabled>
        <div className="flex items-center space-x-2">
          <Loader2Icon className="animate-spin w-4 h-4" />
          <span>Loading {props.trackerMetadata.name} details...</span>
        </div>
      </AccordionTrigger>
    );
  }

  return (
    <>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
              {props.trackerMetadata.name.substring(0, 2)}
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">{props.trackerMetadata.name}</span>
              {!isOnline ? (
                <Badge variant="outline" className="text-muted-foreground">
                  <WifiOffIcon className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              ) : username ? (
                <span className="text-sm text-muted-foreground">
                  Logged in as <span className="font-medium">{username}</span>
                </span>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>
              )}
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pt-4 pb-2">
        <div className="flex flex-col space-y-4">
          {!isOnline && (
            <Alert variant="default" className="bg-yellow-500/10 border-yellow-500">
              <AlertDescription className="flex items-center text-yellow-500">
                <WifiOffIcon className="w-4 h-4 mr-2" />
                You are currently offline. Authentication requires an internet connection.
              </AlertDescription>
            </Alert>
          )}

          {props.trackerMetadata.id === 'MyAnimeList' ? (
            <Alert variant="default" className="border-2 border-yellow-500 bg-yellow-500/10">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 font-semibold text-yellow-500">
                  <AlertCircleIcon className="h-4 w-4" />
                  Under Development
                </div>
                <AlertDescription className="text-muted-foreground">
                  <p className="mb-2">
                    The MyAnimeList integration is currently under development and may not work as expected. We are working on:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Fixing authentication issues</li>
                    <li>Improving error handling</li>
                    <li>Enhancing sync reliability</li>
                  </ul>
                  <p className="mt-2">
                    Please use AniList or MangaUpdates for tracking until this integration is complete.
                  </p>
                </AlertDescription>
              </div>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="flex items-center">
                    <AlertCircleIcon className="w-4 h-4 mr-2" />
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              {showSuccess && (
                <Alert variant="default" className="bg-green-500/10 border-green-500">
                  <AlertDescription className="flex items-center text-green-500">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Successfully linked with {props.trackerMetadata.name}!
                  </AlertDescription>
                </Alert>
              )}

              {username ? (
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                        {username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{username}</span>
                        <span className="text-sm text-muted-foreground">Connected Account</span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => saveAccessToken('')}
                      className="gap-2"
                    >
                      <LogOutIcon className="h-4 w-4" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      1
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      disabled={!isOnline}
                      asChild
                    >
                      <a href={authUrls[props.trackerMetadata.id]} target="_blank">
                        <LogInIcon className="h-4 w-4" />
                        Authenticate with {props.trackerMetadata.name}
                        <ExternalLinkIcon className="ml-auto h-4 w-4" />
                      </a>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                        2
                      </div>
                      <div className="flex-grow">
                        <span className="text-sm font-medium">Enter Access Code</span>
                        {props.trackerMetadata.id === 'MyAnimeList' && (
                          <div className="text-sm text-muted-foreground mt-2 space-y-1">
                            <p>After authentication:</p>
                            <ol className="list-decimal pl-5 space-y-1">
                              <li>You'll be redirected to comicers.org</li>
                              <li>Copy the <strong>entire URL</strong> from your browser</li>
                              <li>Paste it below and click Connect</li>
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                    <Input
                      className="w-full"
                      value={accessCode}
                      placeholder={
                        props.trackerMetadata.id === 'MyAnimeList'
                          ? "Paste URL from browser (https://comicers.org/?code=...)"
                          : "Paste access code..."
                      }
                      onChange={(e) => setAccessCode(e.target.value)}
                      disabled={!isOnline}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      3
                    </div>
                    <Button
                      className="w-full gap-2"
                      onClick={() => submitAccessCode()}
                      disabled={loading || !isOnline || !accessCode}
                    >
                      {loading ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogInIcon className="h-4 w-4" />
                      )}
                      Connect Account
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AccordionContent>
    </>
  );
};
