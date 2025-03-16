const { ipcRenderer } = require('electron');
import React, { useEffect, useState } from 'react';
import { Series } from '@tiyo/common';
import {
  AniListTrackerMetadata,
  MALTrackerMetadata,
  MUTrackerMetadata,
} from '@/common/temp_tracker_metadata';
import { updateSeriesTrackerKeys } from '@/renderer/features/library/utils';
import { Dialog, DialogContent, DialogTitle } from '@comicers/ui/components/Dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@comicers/ui/components/Sidebar';
import { SeriesTrackerPage } from './SeriesTrackerPage';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@comicers/ui/components/Breadcrumb';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { TrackEntry, TrackerListEntry, TrackStatus } from '@/common/models/types';
import { Skeleton } from '@comicers/ui/components/Skeleton';

export enum TrackerPage {
  AniList = 'AniList',
  MyAnimeList = 'MyAnimeList',
  MangaUpdates = 'MangaUpdates',
}

const TRACKER_PAGE_METADATA = {
  [TrackerPage.AniList]: AniListTrackerMetadata,
  [TrackerPage.MyAnimeList]: MALTrackerMetadata,
  [TrackerPage.MangaUpdates]: MUTrackerMetadata,
};

type Props = {
  series: Series;
  showing: boolean;
  setShowing: (showing: boolean) => void;
};

export const SeriesTrackerDialog: React.FC<Props> = (props: Props) => {
  const [activePage, setActivePage] = useState<TrackerPage>(TrackerPage.AniList);
  const [seriesTrackerKeys, setSeriesTrackerKeys] = useState<Series['trackerKeys'] | undefined>(
    props.series.trackerKeys,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [trackEntry, setTrackEntry] = useState<TrackEntry | null>(null);
  const [trackerListEntries, setTrackerListEntries] = useState<TrackerListEntry[]>([]);

  const applySeriesTrackerKey = (trackerId: string, key: string) => {
    const newSeries = updateSeriesTrackerKeys(props.series, {
      ...props.series.trackerKeys,
      [trackerId]: key,
    });
    setSeriesTrackerKeys(newSeries.trackerKeys);
  };

  const loadCurrentTrackerData = async () => {
    setLoading(true);
    setTrackEntry(null);
    const metadata = TRACKER_PAGE_METADATA[activePage];
    const trackerKey =
      seriesTrackerKeys && seriesTrackerKeys[TRACKER_PAGE_METADATA[activePage].id]
        ? seriesTrackerKeys[TRACKER_PAGE_METADATA[activePage].id]
        : '';
    console.log(`Loading tracker data for ${metadata.name}`);

    const username: string | null = await ipcRenderer
      .invoke(ipcChannels.TRACKER.GET_USERNAME, metadata.id)
      .catch((e) => console.error(e));
    setUsername(username);

    let newTrackEntry = null;
    if (username) {
      if (trackerKey) {
        const sourceTrackEntry = await ipcRenderer
          .invoke(ipcChannels.TRACKER.GET_LIBRARY_ENTRY, metadata.id, trackerKey)
          .catch((e) => console.error(e));
        if (sourceTrackEntry) {
          newTrackEntry = sourceTrackEntry;
        } else {
          newTrackEntry = {
            seriesId: trackerKey,
            progress: 0,
            status: TrackStatus.Reading,
          };
        }
      }

      const listEntries = await ipcRenderer
        .invoke(ipcChannels.TRACKER.GET_LIST_ENTRIES, metadata.id)
        .catch((e) => console.error(e));
      setTrackerListEntries(listEntries);
    }

    setTrackEntry(newTrackEntry);
    setLoading(false);
  };

  const uploadTrackEntry = async () => {
    const metadata = TRACKER_PAGE_METADATA[activePage];
    console.log(`Uploading tracker data for ${metadata.name}`, trackEntry);
    if (trackEntry !== null) {
      ipcRenderer
        .invoke(ipcChannels.TRACKER.UPDATE_LIBRARY_ENTRY, metadata.id, trackEntry)
        .catch((e) => console.error(e));
    }
  };

  useEffect(() => {
    if (props.showing) {
      setSeriesTrackerKeys(props.series.trackerKeys);
    }
  }, [props.showing]);

  useEffect(() => {
    if (props.showing) {
      loadCurrentTrackerData();
    }
  }, [activePage, props.series, seriesTrackerKeys]);

  const renderPage = () => {
    const metadata = TRACKER_PAGE_METADATA[activePage];

    if (loading) {
      return (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="w-full h-24" />
          ))}
        </div>
      );
    }

    if (!username) {
      return (
        <p className="font-medium">
          In order to track this series, please link your {metadata.name} account on the{' '}
          <code className="relative bg-muted px-[0.3rem] py-[0.2rem] text-sm font-semibold">
            Settings
          </code>{' '}
          page.
        </p>
      );
    }

    console.log(`Rendering track entry for ${metadata.name}`, trackEntry);

    return (
      <SeriesTrackerPage
        series={props.series}
        trackerMetadata={metadata}
        trackEntry={trackEntry}
        trackerListEntries={trackerListEntries}
        link={(key) => applySeriesTrackerKey(metadata.id, key)}
        updateTrackEntry={setTrackEntry}
      />
    );
  };

  return (
    <Dialog
      open={props.showing}
      onOpenChange={(open) => {
        if (!open && trackEntry) {
          uploadTrackEntry();
        }
        props.setShowing(open);
      }}
    >
      <DialogContent className="overflow-hidden !p-0 max-h-[90vh] md:max-h-[600px] md:max-w-[700px] lg:max-w-[800px] text-foreground">
        <DialogTitle className="sr-only">Trackers</DialogTitle>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="border-r">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {Object.values(TrackerPage).map((page) => (
                      <SidebarMenuItem key={page}>
                        <SidebarMenuButton
                          isActive={page === activePage}
                          onClick={() => uploadTrackEntry().then(() => setActivePage(page))}
                          className="w-full px-4 py-2 text-sm font-medium"
                        >
                          <span>{page}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[600px] flex-1 flex-col overflow-hidden">
            <header className="flex h-14 shrink-0 items-center border-b px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink className="text-muted-foreground">Trackers</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium">{activePage}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-[160px] w-full rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : !username ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <p className="text-lg font-medium mb-2">Account Required</p>
                  <p className="text-muted-foreground">
                    To track this series, please link your {TRACKER_PAGE_METADATA[activePage].name} account in{' '}
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                      Settings
                    </code>
                  </p>
                </div>
              ) : (
                renderPage()
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
};
