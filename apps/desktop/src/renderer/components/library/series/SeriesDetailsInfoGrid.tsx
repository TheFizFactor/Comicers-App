const fs = require('fs');
import React from 'react';
const { ipcRenderer } = require('electron');
import { Languages, Series, SeriesStatus } from '@tiyo/common';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { Badge } from '@comicers/ui/components/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@comicers/ui/components/Card';
import { Users2, Info, BookOpen, Tags } from 'lucide-react';
import { cn } from '@comicers/ui/util';

const thumbnailsDir = await ipcRenderer.invoke(ipcChannels.GET_PATH.THUMBNAILS_DIR);
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir);
}

type Props = {
  series: Series;
};

const SeriesDetailsInfoGrid: React.FC<Props> = (props: Props) => {
  const language = Languages[props.series.originalLanguageKey];
  const languageStr = language !== undefined && 'name' in language ? language.name : 'Unknown';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
      {/* Creator Info */}
      <Card>
        <CardHeader className="px-4 pb-2 pt-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users2 className="w-4 h-4" />
            Creator(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-2">
            {props.series.authors && props.series.authors.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Authors</span>
                <p className="font-medium text-sm">{props.series.authors.join(', ')}</p>
              </div>
            )}
            {props.series.artists && props.series.artists.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Artists</span>
                <p className="font-medium text-sm">{props.series.artists.join(', ')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Info */}
      <Card>
        <CardHeader className="px-4 pb-2 pt-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="w-4 h-4" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground">Publication Status</span>
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  props.series.status === SeriesStatus.COMPLETED && "bg-green-500",
                  props.series.status === SeriesStatus.ONGOING && "bg-blue-500",
                  props.series.status === SeriesStatus.CANCELLED && "bg-red-500",
                  "bg-gray-500"
                )} />
                <p className="font-medium text-sm">{props.series.status || 'Unknown'}</p>
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Original Language</span>
              <p className="font-medium text-sm">{languageStr}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reading Progress */}
      <Card>
        <CardHeader className="px-4 pb-2 pt-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Reading Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground">Unread Chapters</span>
              <p className="font-medium text-sm">
                {props.series.numberUnread}
              </p>
            </div>
            {props.series.numberUnread > 0 && (
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all bg-sky-500"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      {props.series.tags && props.series.tags.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader className="px-4 pb-2 pt-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tags className="w-4 h-4" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {props.series.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="capitalize">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SeriesDetailsInfoGrid;
