const { ipcRenderer } = require('electron');
import {
  TrackerSeries,
  TrackEntry,
  TrackerListEntry,
  TrackStatus,
  TrackerMetadata,
  TrackScoreFormat,
} from '@/common/models/types';
import React, { useEffect, useState } from 'react';
import { Series } from '@tiyo/common';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { Button } from '@comicers/ui/components/Button';
import { Input } from '@comicers/ui/components/Input';
import { SearchIcon, SquareArrowOutUpRight } from 'lucide-react';
import { Skeleton } from '@comicers/ui/components/Skeleton';
import { Label } from '@comicers/ui/components/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@comicers/ui/components/Select';

const SCORE_FORMAT_OPTIONS: {
  [key in TrackScoreFormat]: number[];
} = {
  [TrackScoreFormat.POINT_10]: [...Array(11).keys()],
  [TrackScoreFormat.POINT_100]: [...Array(101).keys()],
  [TrackScoreFormat.POINT_10_DECIMAL]: [...Array(101).keys()],
  [TrackScoreFormat.POINT_10_DECIMAL_ONE_DIGIT]: ((sequence) => {
    sequence.splice(1, 9);
    return [...sequence];
  })([...Array(101).keys()].map((num) => num / 10)),
  [TrackScoreFormat.POINT_5]: [...Array(6).keys()],
  [TrackScoreFormat.POINT_3]: [...Array(4).keys()],
};

type Props = {
  series: Series;
  trackerMetadata: TrackerMetadata;
  trackEntry: TrackEntry | null;
  trackerListEntries: TrackerListEntry[];
  link: (trackerSeriesId: string) => void;
  updateTrackEntry: (entry: TrackEntry) => void;
};

export const SeriesTrackerPage: React.FC<Props> = (props: Props) => {
  const [searching, setSearching] = useState(false);
  const [searchText, setSearchText] = useState(props.series.title);
  const [searchResultsList, setSearchResultsList] = useState<TrackerSeries[] | null>(null);

  const search = async () => {
    setSearching(true);
    const seriesList = await ipcRenderer
      .invoke(ipcChannels.TRACKER.SEARCH, props.trackerMetadata.id, searchText)
      .catch((e) => console.error(e));
    setSearchResultsList(seriesList.slice(0, 5));
    setSearching(false);
  };

  const renderSearchResults = () => {
    if (!searchResultsList || searchResultsList.length === 0) {
      return (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          <span className="font-medium">No series found.</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col space-y-3">
        {searchResultsList.map((searchResult) => (
          <div key={searchResult.id} className="flex gap-4 p-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors">
            <div className="w-[100px] flex-shrink-0">
              <img 
                src={searchResult.coverUrl} 
                alt={searchResult.title} 
                className="w-full aspect-[70/100] object-cover rounded-md shadow-sm"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base line-clamp-1 mb-1">{searchResult.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{searchResult.description}</p>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => props.link(searchResult.id)}
                className="self-start mt-2"
              >
                Link Series
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSearch = () => {
    return (
      <div className="space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-full"
            autoFocus
            placeholder="Search for series..."
            defaultValue={searchText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') search();
            }}
          />
        </div>

        {searching ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[160px] w-full rounded-lg" />
            ))}
          </div>
        ) : (
          renderSearchResults()
        )}
      </div>
    );
  };

  const renderTrackEntry = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {props.trackerMetadata.hasCustomLists ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={props.trackEntry!.listId}
                onValueChange={(value) => {
                  if (value) {
                    props.updateTrackEntry({
                      ...props.trackEntry!,
                      listId: value,
                      listName: props.trackerListEntries.find((entry) => entry.id === value)?.name,
                      status: props.trackerListEntries.find((entry) => entry.id === value)?.status,
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a list" />
                </SelectTrigger>
                <SelectContent>
                  {props.trackerListEntries.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={props.trackEntry!.status}
                onValueChange={(value) => {
                  if (value) {
                    props.updateTrackEntry({
                      ...props.trackEntry!,
                      status: value as TrackStatus,
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TrackStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Progress</Label>
            <Input
              className="w-full"
              type="number"
              value={props.trackEntry!.progress}
              min={0}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!Number.isNaN(value)) {
                  props.updateTrackEntry({
                    ...props.trackEntry!,
                    progress: value,
                  });
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Score</Label>
            <Select
              value={props.trackEntry!.score !== undefined ? `${props.trackEntry!.score}` : undefined}
              onValueChange={(value) => {
                if (value) {
                  props.updateTrackEntry({
                    ...props.trackEntry!,
                    score: parseFloat(value),
                  });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a score" />
              </SelectTrigger>
              <SelectContent>
                {SCORE_FORMAT_OPTIONS[props.trackEntry!.scoreFormat || TrackScoreFormat.POINT_10].map(
                  (value) => (
                    <SelectItem key={value} value={`${value}`}>
                      {value}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button asChild variant="default" className="flex-1">
            <a
              href={
                props.trackEntry!.url ||
                `${props.trackerMetadata.url}/manga/${props.trackEntry!.seriesId}`
              }
              target="_blank"
              className="flex items-center justify-center"
            >
              <SquareArrowOutUpRight className="w-4 h-4 mr-2" />
              View on {props.trackerMetadata.name}
            </a>
          </Button>
          <Button variant="destructive" onClick={() => props.link('')} className="flex-1">
            Unlink Series
          </Button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    setSearchText(props.series.title);
    search();
  }, [props.trackEntry]);

  return <div>{props.trackEntry ? renderTrackEntry() : renderSearch()}</div>;
};
