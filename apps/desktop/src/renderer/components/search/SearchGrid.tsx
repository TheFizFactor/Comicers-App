const fs = require('fs');
import React, { useEffect, useRef } from 'react';
const { ipcRenderer } = require('electron');
import { Series } from '@tiyo/common';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { libraryColumnsState, libraryCropCoversState } from '@/renderer/state/settingStates';
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
  const libraryCropCovers = useRecoilValue(libraryCropCoversState);
  const searchExtension = useRecoilValue(searchExtensionState);
  const setAddModalSeries = useSetRecoilState(addModalSeriesState);
  const setAddModalEditable = useSetRecoilState(addModalEditableState);
  const [showingAddModal, setShowingAddModal] = useRecoilState(showingAddModalState);

  const handleOpenAddModal = (series: Series) => {
    setAddModalSeries(series);
    setAddModalEditable(searchExtension === FS_METADATA.id);
    setShowingAddModal(!showingAddModal);
  };

  const renderSeriesGrid = () =>
    searchResult.seriesList.map((series, i) => (
      <motion.div
        key={`${series.id}-${i}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: i * 0.05 }}
        className="group relative cursor-pointer"
        onClick={() => handleOpenAddModal(series)}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted/30">
          <img
            src={series.remoteCoverUrl}
            alt={series.title}
            className={cn(
              'h-full w-full transition-all duration-300',
              'hover:scale-105 hover:brightness-110',
              libraryCropCovers ? 'object-cover' : 'object-contain',
            )}
            loading="lazy"
          />
          {(series as any).provider && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 right-2 bg-black/60 text-white border-none"
            >
              {(series as any).provider}
            </Badge>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {series.title}
          </h3>
          {series.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {series.description}
            </p>
          )}
        </div>
      </motion.div>
    ));

  const renderLoadingSkeleton = () => {
    const skeletonCount = libraryColumns * 2;
    return Array.from({ length: skeletonCount }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: i * 0.05 }}
        className="space-y-3"
      >
        <Skeleton className="aspect-[2/3] w-full rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-3 w-[60%]" />
        </div>
      </motion.div>
    ));
  };

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
          'grid gap-6',
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
