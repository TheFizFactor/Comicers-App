import React, { useEffect, useState } from 'react';
const { ipcRenderer } = require('electron');
import ipcChannels from '@/common/constants/ipcChannels.json';
import storeKeys from '@/common/constants/storeKeys.json';
import persistantStore from '@/renderer/util/persistantStore';
import { TrackerMetadata } from '@/common/models/types';
import { AccordionContent, AccordionTrigger } from '@comicers/ui/components/Accordion';
import { Button } from '@comicers/ui/components/Button';
import { ExternalLinkIcon, Loader2Icon, CheckCircle2 } from 'lucide-react';
import { Input } from '@comicers/ui/components/Input';
import { Alert, AlertDescription } from '@comicers/ui/components/Alert';

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

  const loadTrackerDetails = async () => {
    setLoading(true);
    setError(null);
    setShowSuccess(false);

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
  }, []);

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
        <div className="flex justify-between items-center w-full pr-2">
          <span>{props.trackerMetadata.name}</span>
          {username ? (
            <div className="flex space-x-2">
              <span>
                Logged in as{' '}
                <code className="relative bg-muted px-[0.3rem] py-[0.2rem] text-sm font-semibold">
                  {username}
                </code>
              </span>
              <Button
                size="sm"
                variant={'destructive'}
                className="!h-6"
                asChild
                onClick={(e) => {
                  e.stopPropagation();
                  saveAccessToken('');
                }}
              >
                <span>Unlink</span>
              </Button>
            </div>
          ) : (
            <span>Not logged in.</span>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent>
        <div className="flex flex-col space-y-4">
          {props.trackerMetadata.id === 'MyAnimeList' ? (
            <div className="p-4 border-2 border-yellow-500 rounded-lg bg-yellow-500/10">
              <h3 className="text-lg font-semibold mb-2 text-yellow-500">⚠️ Under Development</h3>
              <p className="text-sm text-muted-foreground mb-2">
                The MyAnimeList integration is currently under development and may not work as expected. We are working on:
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Fixing authentication issues</li>
                <li>Improving error handling</li>
                <li>Enhancing sync reliability</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Please use AniList or MangaUpdates for tracking until this integration is complete.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {showSuccess && (
                <Alert variant="default" className="py-2 bg-green-500/10 border-green-500">
                  <AlertDescription className="flex items-center text-green-500">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Successfully linked with {props.trackerMetadata.name}!
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col space-y-2">
                <div className="flex space-x-4 items-center">
                  <div className="bg-foreground text-background w-8 h-8 rounded-full flex items-center justify-center">
                    <span className="font-bold">1</span>
                  </div>
                  <Button variant="link" asChild>
                    <a href={authUrls[props.trackerMetadata.id]} target="_blank">
                      Authenticate on {props.trackerMetadata.name}
                      <ExternalLinkIcon className="ml-2 w-4 h-4" />
                    </a>
                  </Button>
                </div>

                <div className="flex space-x-4">
                  <div className="bg-foreground text-background w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold">2</span>
                  </div>
                  <div className="flex-grow">
                    {props.trackerMetadata.id === 'MyAnimeList' && (
                      <div className="text-sm text-muted-foreground mb-2">
                        <ol className="list-decimal pl-5 space-y-1">
                          <li>After clicking "Authenticate on MyAnimeList", <strong>complete the login process on MyAnimeList</strong></li>
                          <li>You will be redirected to comicers.org with a code in the URL</li>
                          <li>Copy the <strong>entire URL</strong> from your browser's address bar</li>
                          <li>Paste it below and click Submit</li>
                          <li>If authentication fails, try clicking Refresh and starting over</li>
                        </ol>
                      </div>
                    )}
                    <Input
                      className="w-full h-8 text-sm"
                      value={accessCode || ''}
                      placeholder={props.trackerMetadata.id === 'MyAnimeList' ? "Paste URL from browser (https://comicers.org/?code=...)" : "Paste access code..."}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccessCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex space-x-4 items-center">
                  <div className="bg-foreground text-background w-8 h-8 rounded-full flex items-center justify-center">
                    <span className="font-bold">3</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => submitAccessCode()} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setAccessCode('');
                        setError(null);
                        loadTrackerDetails();
                      }}
                      disabled={loading}
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </AccordionContent>
    </>
  );
};
