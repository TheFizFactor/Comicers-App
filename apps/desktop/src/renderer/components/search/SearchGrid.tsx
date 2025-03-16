const fs = require('fs');
import React, { useEffect, useRef } from 'react';
const { ipcRenderer } = require('electron');
import { Series } from '@tiyo/common';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { libraryColumnsState } from '@/renderer/state/settingStates';
import {
  searchResultState,
  addModalEditableState,
  addModalSeriesState,
  showingAddModalState,
  searchExtensionState,
} from '@/renderer/state/searchStates';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import { cn } from '@comicers/ui/util';
import { Skeleton } from '@comicers/ui/components/Skeleton';
import { ScrollArea } from '@comicers/ui/components/ScrollArea';
import { Badge } from '@comicers/ui/components/Badge';
import { motion } from 'framer-motion';
import { ContextMenu, ContextMenuTrigger } from '@comicers/ui/components/ContextMenu';
import SearchGridContextMenu from './SearchGridContextMenu';
import ExtensionImage from '../general/ExtensionImage';

const thumbnailsDir = await ipcRenderer.invoke(ipcChannels.GET_PATH.THUMBNAILS_DIR);
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir);
}

type Props = {
  loading: boolean;
  handleSearch: () => void;
};

const SearchGrid: React.FC<Props> = (props: Props): JSX.Element => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const searchResult = useRecoilValue(searchResultState);
  const libraryColumns = useRecoilValue(libraryColumnsState);
  const searchExtension = useRecoilValue(searchExtensionState);
  const setAddModalSeries = useSetRecoilState(addModalSeriesState);
  const setAddModalEditable = useSetRecoilState(addModalEditableState);
  const [showingAddModal, setShowingAddModal] = useRecoilState(showingAddModalState);

  const handleOpenAddModal = (series: Series) => {
    setAddModalSeries(series);
    setAddModalEditable(searchExtension === FS_METADATA.id);
    setShowingAddModal(!showingAddModal);
  };

  const renderSeriesGrid = (): JSX.Element[] =>
    searchResult.seriesList.map((series, i) => {
      const seriesWithProvider = series as Series & { provider?: string };
      return (
        <motion.div
          key={`${series.id}-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className="group relative cursor-pointer"
                onClick={() => handleOpenAddModal(series)}
              >
                {/* Cover Image Container */}
                <div className="relative overflow-hidden rounded-lg aspect-[70/100]">
                  <ExtensionImage
                    url={series.remoteCoverUrl}
                    series={series}
                    alt={series.title}
                    className="h-full w-full object-cover transition-all duration-200 group-hover:scale-105"
                  />

                  {/* Dark Overlay for Better Text Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200" />

                  {/* Provider Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <Badge 
                      variant="secondary" 
                      className="bg-black/60 text-white border-none text-xs"
                    >
                      {seriesWithProvider.provider || 'Unknown'}
                    </Badge>
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
                          handleOpenAddModal(series);
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
            <SearchGridContextMenu series={series} viewDetails={() => handleOpenAddModal(series)} />
          </ContextMenu>
        </motion.div>
      );
    });

  const renderLoadingSkeleton = (): JSX.Element[] =>
    Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="aspect-[70/100] w-full rounded-lg" />
      </div>
    ));

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (!searchResult.hasMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;

      const distanceFromBottom = scrollHeight - (clientHeight + scrollTop);
      const ratioOfVisibleHeight = distanceFromBottom / clientHeight;

      if (ratioOfVisibleHeight < 0.3) {
        // note: relying on handleSearch to debounce
        props.handleSearch();
      }
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [searchResult, props.handleSearch]);

  useEffect(() => {
    if (!searchResult.hasMore) return;
    const viewport = viewportRef.current;
    if (!viewport || !viewport.firstElementChild) return;

    if (viewport.firstElementChild.clientHeight < viewport.clientHeight) {
      props.handleSearch();
    }
  }, [props.loading]);

  return (
    <ScrollArea 
      viewportRef={viewportRef} 
      className="h-[calc(100vh-20px-64px)] w-full pr-4 -mr-2"
    >
      <div
        className={cn(
          'grid gap-4',
          libraryColumns === 2 && 'grid-cols-2',
          libraryColumns === 4 && 'grid-cols-4',
          libraryColumns === 6 && 'grid-cols-6',
          libraryColumns === 8 && 'grid-cols-8',
        )}
      >
        {props.loading ? renderLoadingSkeleton() : renderSeriesGrid()}
      </div>
      {!props.loading && searchResult.seriesList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">No results found</p>
          <p className="text-sm text-muted-foreground/80">Try adjusting your search or filters</p>
        </div>
      )}
    </ScrollArea>
  );
};

export default SearchGrid;
