import React from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { Series } from '@tiyo/common';
import {
  reloadingSeriesListState,
  seriesListState,
  seriesState,
} from '@/renderer/state/libraryStates';
import { reloadSeriesList } from '@/renderer/features/library/utils';
import { chapterLanguagesState } from '@/renderer/state/settingStates';
import { Button } from '@comicers/ui/components/Button';
import { SeriesDetailsBannerBackground } from './SeriesDetailsBannerBackground';
import { Download, Edit, Loader2, MenuIcon, RefreshCw, Target } from 'lucide-react';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@comicers/ui/components/DropdownMenu';

type SeriesDetailsBannerProps = {
  series: Series;
  showDownloadModal: () => void;
  showEditModal: () => void;
  showTrackerModal: () => void;
  showRemoveModal: () => void;
};

const SeriesDetailsBanner: React.FC<SeriesDetailsBannerProps> = (
  props: SeriesDetailsBannerProps,
) => {
  const series = useRecoilValue(seriesState);
  const setSeriesList = useSetRecoilState(seriesListState);
  const [reloadingSeriesList, setReloadingSeriesList] = useRecoilState(reloadingSeriesListState);
  const chapterLanguages = useRecoilValue(chapterLanguagesState);

  const handleRefresh = () => {
    if (series !== undefined && !reloadingSeriesList)
      reloadSeriesList([series], setSeriesList, setReloadingSeriesList, chapterLanguages).catch(
        (e) => console.error(e),
      );
  };

  return (
    <div className="-mx-2 h-[180px]" style={{ overflow: 'hidden' }}>
      <SeriesDetailsBannerBackground>
        <div className="flex justify-end h-full">
          <div className="flex flex-col justify-between">
            <div className="flex justify-end m-2">
              {!props.series.preview && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/90 hover:bg-white/100 text-neutral-900 border-none shadow-md"
                    >
                      <MenuIcon className="w-4 h-4 mr-1" />
                      Options
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" className="w-48">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onSelect={() => props.showDownloadModal()}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => props.showRemoveModal()} className="text-red-600">
                        <Target className="w-4 h-4 mr-2" />
                        Remove series
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="flex m-2 space-x-2">
              {props.series.extensionId === FS_METADATA.id && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 hover:bg-white/100 text-neutral-900 border-none shadow-md"
                  onClick={() => props.showEditModal()}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/90 hover:bg-white/100 text-neutral-900 border-none shadow-md"
                onClick={() => props.showTrackerModal()}
              >
                <Target className="w-4 h-4 mr-1" />
                Trackers
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={reloadingSeriesList}
                className="bg-white/90 hover:bg-white/100 text-neutral-900 border-none shadow-md disabled:bg-neutral-300 disabled:text-neutral-500"
                onClick={() => handleRefresh()}
              >
                {reloadingSeriesList ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                {reloadingSeriesList ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </SeriesDetailsBannerBackground>
    </div>
  );
};

export default SeriesDetailsBanner;
