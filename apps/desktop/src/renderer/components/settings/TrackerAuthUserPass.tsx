import React, { useEffect, useState } from 'react';
const { ipcRenderer } = require('electron');
import ipcChannels from '@/common/constants/ipcChannels.json';
import storeKeys from '@/common/constants/storeKeys.json';
import persistantStore from '@/renderer/util/persistantStore';
import { TrackerMetadata } from '@/common/models/types';
import { Button } from '@comicers/ui/components/Button';
import { AccordionContent, AccordionTrigger } from '@comicers/ui/components/Accordion';
import { Label } from '@comicers/ui/components/Label';
import { Input } from '@comicers/ui/components/Input';
import { Alert, AlertDescription } from '@comicers/ui/components/Alert';
import { Badge } from '@comicers/ui/components/Badge';
import {
  Loader2Icon,
  LogInIcon,
  LogOutIcon,
  AlertCircleIcon,
  CheckCircle2,
  WifiOffIcon,
} from 'lucide-react';
import { useNetworkStatus } from '@/renderer/hooks/useNetworkStatus';

type Props = {
  trackerMetadata: TrackerMetadata;
};

export const TrackerAuthUserPass: React.FC<Props> = (props: Props) => {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [tempUsername, setTempUsername] = useState('');
  const [tempPassword, setTempPassword] = useState('');
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

  const submitUserPass = async () => {
    if (!isOnline) {
      setError('Cannot authenticate while offline');
      return;
    }

    if (!tempUsername || !tempPassword) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError(null);
    setShowSuccess(false);

    try {
      const credentials = JSON.stringify({
        username: tempUsername,
        password: tempPassword,
      });

      const token = await ipcRenderer.invoke(
        ipcChannels.TRACKER.GET_TOKEN,
        props.trackerMetadata.id,
        credentials
      );

      if (!token) {
        setError('Authentication failed. Please check your credentials and try again.');
        setLoading(false);
        return;
      }

      await saveAccessToken(token);
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
              <div className="prose prose-sm dark:prose-invert">
                <p className="text-muted-foreground">
                  Connect your MangaUpdates account to track your reading progress and sync your lists. 
                  Your credentials are only used for authentication and are never stored.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="flex-grow space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="trackerUsername" className="flex items-center justify-between">
                      <span>Username</span>
                      {tempUsername && tempUsername.length < 3 && (
                        <span className="text-xs text-destructive">Username must be at least 3 characters</span>
                      )}
                    </Label>
                    <Input
                      type="text"
                      id="trackerUsername"
                      placeholder="Enter your username"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      disabled={!isOnline}
                      className={tempUsername && tempUsername.length < 3 ? "border-destructive" : ""}
                    />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="trackerPassword" className="flex items-center justify-between">
                      <span>Password</span>
                      {tempPassword && tempPassword.length < 6 && (
                        <span className="text-xs text-destructive">Password must be at least 6 characters</span>
                      )}
                    </Label>
                    <Input
                      type="password"
                      id="trackerPassword"
                      placeholder="Enter your password"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      disabled={!isOnline}
                      className={tempPassword && tempPassword.length < 6 ? "border-destructive" : ""}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Don't have an account? <a href="https://www.mangaupdates.com/register.html" target="_blank" className="text-primary hover:underline">Register at MangaUpdates</a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  2
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => submitUserPass()}
                  disabled={loading || !isOnline || !tempUsername || !tempPassword || tempUsername.length < 3 || tempPassword.length < 6}
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
        </div>
      </AccordionContent>
    </>
  );
};
