const fs = require('fs');
import path from 'path';
import React, { useEffect } from 'react';
const { ipcRenderer } = require('electron');
import { Series, SeriesStatus } from '@tiyo/common';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useNavigate } from 'react-router-dom';
import blankCover from '@/renderer/img/blank_cover.png';
import ipcChannels from '@/common/constants/ipcChannels.json';
import constants from '@/common/constants/constants.json';
import {
  multiSelectEnabledState,
  multiSelectSeriesListState,
} from '@/renderer/state/libraryStates';
import {
  libraryColumnsState,
} from '@/renderer/state/settingStates';
import { goToSeries } from '@/renderer/features/library/utils';
import ExtensionImage from '../general/ExtensionImage';
import LibraryGridContextMenu from './LibraryGridContextMenu';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import { ContextMenu, ContextMenuTrigger } from '@comicers/ui/components/ContextMenu';
import { cn } from '@comicers/ui/util';

const thumbnailsDir = await ipcRenderer.invoke(ipcChannels.GET_PATH.THUMBNAILS_DIR);
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir);
}

type Props = {
  getFilteredList: () => Series[];
  showRemoveModal: (series: Series) => void;
  contextMenuRemoveAction?: string;
};

const LibraryGrid: React.FC<Props> = (props: Props) => {
  const navigate = useNavigate();
  const libraryColumns = useRecoilValue(libraryColumnsState);
  const [multiSelectEnabled, setMultiSelectEnabled] = useRecoilState(multiSelectEnabledState);
  const [multiSelectSeriesList, setMultiSelectSeriesList] = useRecoilState(
    multiSelectSeriesListState,
  );

  const viewFunc = (series: Series) => {
    goToSeries(series, navigate);
  };

  /**
   * Get the cover image source of a series.
   * If the series id is non-undefined (i.e. it is in the user's library) we first try to find the
   * downloaded thumbnail image. If it doesn't exist, we return the blankCover path.
   * @param series
   * @returns the cover image for a series, which can be put in an <img> tag
   */
  const getImageSource = (series: Series) => {
    const fileExtensions = constants.IMAGE_EXTENSIONS;
    for (let i = 0; i < fileExtensions.length; i += 1) {
      const thumbnailPath = path.join(thumbnailsDir, `${series.id}.${fileExtensions[i]}`);
      if (fs.existsSync(thumbnailPath)) return `atom://${encodeURIComponent(thumbnailPath)}`;
    }

    if (series.extensionId === FS_METADATA.id) {
      return series.remoteCoverUrl
        ? `atom://${encodeURIComponent(series.remoteCoverUrl)}`
        : blankCover;
    }
    return series.remoteCoverUrl || blankCover;
  };

  useEffect(() => {
    if (multiSelectSeriesList.length === 0) setMultiSelectEnabled(false);
  }, [multiSelectSeriesList]);

  return (
    <div
      className={cn(
        libraryColumns === 2 && 'grid-cols-2',
        libraryColumns === 4 && 'grid-cols-4',
        libraryColumns === 6 && 'grid-cols-6',
        libraryColumns === 8 && 'grid-cols-8',
        `grid gap-4`,
      )}
    >
      {props.getFilteredList().map((series: Series) => {
        const coverSource = getImageSource(series).replaceAll('\\', '/');
        const isMultiSelected = multiSelectSeriesList.includes(series);

        return (
          <div key={`${series.id}-${series.title}`}>
            <ContextMenu>
              <ContextMenuTrigger>
                <div
                  className="group relative cursor-pointer"
                  onClick={() => {
                    if (multiSelectEnabled) {
                      if (isMultiSelected) {
                        setMultiSelectSeriesList(multiSelectSeriesList.filter((s) => s !== series));
                      } else {
                        setMultiSelectSeriesList([...multiSelectSeriesList, series]);
                      }
                    } else {
                      viewFunc(series);
                    }
                  }}
                >
                  {/* Cover Image Container */}
                  <div className="relative overflow-hidden rounded-lg aspect-[70/100]">
                    <ExtensionImage
                      url={coverSource}
                      series={series}
                      alt={series.title}
                      className={cn(
                        !multiSelectEnabled && 'group-hover:scale-105',
                        multiSelectEnabled && isMultiSelected && 'ring-4 ring-primary',
                        'h-full w-full object-cover transition-all duration-200',
                      )}
                    />

                    {/* Dark Overlay for Better Text Contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200" />

                    {/* Unread Badge */}
                    {series.numberUnread > 0 && (
                      <div className="absolute top-2 right-2 bg-primary px-2 min-w-6 rounded-full font-medium text-primary-foreground text-center text-sm z-10">
                        {series.numberUnread}
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium text-white",
                        series.status === SeriesStatus.COMPLETED && "bg-green-500/90",
                        series.status === SeriesStatus.ONGOING && "bg-blue-500/90",
                        series.status === SeriesStatus.CANCELLED && "bg-red-500/90",
                        "bg-gray-500/90"
                      )}>
                        {series.status || 'Unknown'}
                      </div>
                    </div>

                    {/* Hover Overlay with Title and Info */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 p-4 flex flex-col justify-end z-20">
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-white font-bold text-sm line-clamp-2">
                            {series.title}
                          </h3>
                          {series.authors && series.authors.length > 0 && (
                            <p className="text-white/80 text-xs line-clamp-1 mt-0.5">
                              by {series.authors.join(', ')}
                            </p>
                          )}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            viewFunc(series);
                          }}
                          className="w-full bg-white/90 hover:bg-white text-black text-xs font-medium py-1.5 px-3 rounded-md transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </ContextMenuTrigger>
              <LibraryGridContextMenu
                series={series}
                showRemoveModal={props.showRemoveModal}
                removeActionText={props.contextMenuRemoveAction}
              />
            </ContextMenu>
          </div>
        );
      })}
    </div>
  );
};

export default LibraryGrid;
