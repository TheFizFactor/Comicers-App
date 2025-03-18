import React from 'react';
import { useRecoilState } from 'recoil';
import { Label } from '@comicers/ui/components/Label';
import { Alert, AlertDescription, AlertTitle } from '@comicers/ui/components/Alert';
import { InfoIcon, BookOpen, RefreshCw, Link } from 'lucide-react';
import { Accordion, AccordionItem } from '@comicers/ui/components/Accordion';
import { TrackerAuthOAuth } from './TrackerAuthOAuth';
import {
  AniListTrackerMetadata,
  MALTrackerMetadata,
  MUTrackerMetadata,
} from '@/common/temp_tracker_metadata';
import { trackerAutoUpdateState } from '@/renderer/state/settingStates';
import { TrackerAuthUserPass } from './TrackerAuthUserPass';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@comicers/ui/components/Card';
import { Separator } from '@comicers/ui/components/Separator';
import { Switch } from '@comicers/ui/components/Switch';

export const SettingsTrackers: React.FC = () => {
  const [trackerAutoUpdate, setTrackerAutoUpdate] = useRecoilState(trackerAutoUpdateState);

  return (
    <div className="space-y-8">
      {/* Info Alert */}
      <Alert className="bg-primary/5 border-primary/20">
        <InfoIcon className="h-4 w-4 text-primary" />
        <AlertTitle className="mb-2">Track Your Reading Progress</AlertTitle>
        <AlertDescription className="mt-3">
          Connect your manga reading lists to keep track of your progress across platforms. After
          authenticating, you can link series to your lists using the "Trackers" button on any series
          page.
        </AlertDescription>
      </Alert>

      {/* Auto Update Card */}
      <Card className="p-2">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-5 w-5" />
            Automatic Updates
          </CardTitle>
          <CardDescription>
            Configure how your reading progress is synced with tracking services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-base">Update Progress Automatically</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync your reading progress with connected trackers
              </p>
            </div>
            <Switch
              checked={trackerAutoUpdate}
              onCheckedChange={(checked) => setTrackerAutoUpdate(checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tracker Services Card */}
      <Card className="p-2">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 mb-2">
            <Link className="h-5 w-5" />
            Connected Services
          </CardTitle>
          <CardDescription>
            Link your manga reading lists from popular tracking services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {[AniListTrackerMetadata, MALTrackerMetadata].map((trackerMetadata) => (
              <AccordionItem
                value={trackerMetadata.id}
                key={trackerMetadata.id}
                className="border rounded-lg px-6 py-2"
              >
                <TrackerAuthOAuth trackerMetadata={trackerMetadata} />
              </AccordionItem>
            ))}
            {[MUTrackerMetadata].map((trackerMetadata) => (
              <AccordionItem
                value={trackerMetadata.id}
                key={trackerMetadata.id}
                className="border rounded-lg px-6 py-2"
              >
                <TrackerAuthUserPass trackerMetadata={trackerMetadata} />
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* How to Use Card */}
      <Card className="p-2">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5" />
            How to Use
          </CardTitle>
          <CardDescription>Learn how to track your reading progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-medium text-base">1. Connect Your Services</h4>
            <p className="text-sm text-muted-foreground">
              Click on any service above to authenticate and connect your account.
            </p>
          </div>
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium text-base">2. Link Your Series</h4>
            <p className="text-sm text-muted-foreground">
              Go to any series page and click the "Trackers" button to link it with your reading list.
            </p>
          </div>
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium text-base">3. Track Progress</h4>
            <p className="text-sm text-muted-foreground">
              Your reading progress will be automatically synced with connected services when you
              complete chapters.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
