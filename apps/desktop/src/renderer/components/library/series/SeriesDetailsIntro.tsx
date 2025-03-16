const fs = require('fs');
import React from 'react';
const { ipcRenderer } = require('electron');
import { useRecoilValue } from 'recoil';
import path from 'path';
import { Series } from '@tiyo/common';
import blankCover from '@/renderer/img/blank_cover.png';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { currentExtensionMetadataState } from '@/renderer/state/libraryStates';
import constants from '@/common/constants/constants.json';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import { ScrollArea } from '@comicers/ui/components/ScrollArea';
import { Badge } from '@comicers/ui/components/Badge';
import ExtensionImage from '../../general/ExtensionImage';

const thumbnailsDir = await ipcRenderer.invoke(ipcChannels.GET_PATH.THUMBNAILS_DIR);
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir);
}

type Props = {
  series: Series;
};

const SeriesDetailsIntro: React.FC<Props> = (props: Props) => {
  const currentExtensionMetadata = useRecoilValue(currentExtensionMetadataState);

  const getThumbnailPath = () => {
    const fileExtensions = constants.IMAGE_EXTENSIONS;
    for (let i = 0; i < fileExtensions.length; i += 1) {
      const thumbnailPath = path.join(thumbnailsDir, `${props.series.id}.${fileExtensions[i]}`);
      if (fs.existsSync(thumbnailPath)) return `atom://${encodeURIComponent(thumbnailPath)}`;
    }

    if (props.series.extensionId === FS_METADATA.id) {
      return props.series.remoteCoverUrl
        ? `atom://${encodeURIComponent(props.series.remoteCoverUrl)}`
        : blankCover;
    }
    return props.series.remoteCoverUrl || blankCover;
  };

  return (
    <div className="flex gap-4 p-4">
      <div className="w-[140px] md:w-[180px] flex-shrink-0">
        <ExtensionImage
          url={getThumbnailPath().replaceAll('\\', '/')}
          series={props.series}
          alt={props.series.title}
          className="w-full aspect-[70/100] object-cover rounded-lg shadow-md"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-4 mb-3">
          <h2 className="text-lg font-bold line-clamp-2">{props.series.title}</h2>
          <Badge variant={'secondary'} className="cursor-default text-xs flex-shrink-0">
            {currentExtensionMetadata?.name}
          </Badge>
        </div>
        <ScrollArea className="h-[90px]">
          <p className="text-muted-foreground text-sm">
            {props.series.description}
          </p>
        </ScrollArea>
      </div>
    </div>
  );
};

export default SeriesDetailsIntro;
