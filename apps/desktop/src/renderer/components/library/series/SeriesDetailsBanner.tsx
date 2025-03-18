import React from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { Series, SeriesStatus } from '@tiyo/common';
import {
  reloadingSeriesListState,
  seriesListState,
  seriesState,
} from '@/renderer/state/libraryStates';
import { reloadSeriesList } from '@/renderer/features/library/utils';
import { chapterLanguagesState } from '@/renderer/state/settingStates';
import { Button } from '@comicers/ui/components/Button';
import { SeriesDetailsBannerBackground } from './SeriesDetailsBannerBackground';
import { Download, Edit, Loader2, RefreshCw, Target, Heart } from 'lucide-react';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import { cn } from '@comicers/ui/util';
import ExtensionImage from '../../general/ExtensionImage';
import { userPreferencesService } from '@/renderer/services/userPreferences';

type SeriesDetailsBannerProps = {
  series: Series;
  showDownloadModal: () => void;
  showEditModal: () => void;
  showTrackerModal: () => void;
  showRemoveModal: () => void;
  onBackToSearch?: () => void;
  onAddToLibrary?: () => void;
  showNavigationButtons?: boolean;
};

const SeriesDetailsBanner: React.FC<SeriesDetailsBannerProps> = (
  props: SeriesDetailsBannerProps,
) => {
  const series = useRecoilValue(seriesState);
  const setSeriesList = useSetRecoilState(seriesListState);
  const [reloadingSeriesList, setReloadingSeriesList] = useRecoilState(reloadingSeriesListState);
  const chapterLanguages = useRecoilValue(chapterLanguagesState);
  const [isFavorite, setIsFavorite] = React.useState(false);

  React.useEffect(() => {
    if (props.series.id) {
      setIsFavorite(userPreferencesService.isFavorite(props.series.id));
    }
  }, [props.series.id]);

  const handleRefresh = () => {
    if (series !== undefined && !reloadingSeriesList)
      reloadSeriesList([series], setSeriesList, setReloadingSeriesList, chapterLanguages).catch(
        (e) => console.error(e),
      );
  };

  const handleFavoriteClick = () => {
    if (props.series.id) {
      if (isFavorite) {
        userPreferencesService.removeFromFavorites(props.series.id);
      } else {
        userPreferencesService.addToFavorites(props.series.id);
      }
      setIsFavorite(!isFavorite);
    }
  };

  return (
    <div className="relative">
      {/* Main Banner Content */}
      <div className="relative h-[280px] overflow-hidden">
        <SeriesDetailsBannerBackground>
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
          
          <div className="relative h-full flex items-end p-6">
            <div className="flex gap-6 items-end max-w-[1400px] mx-auto w-full">
              {/* Cover Image */}
              <div className="w-36 h-52 flex-shrink-0 rounded-lg overflow-hidden shadow-lg relative z-10">
                <ExtensionImage
                  url={props.series.remoteCoverUrl || ''}
                  series={props.series}
                  alt={props.series.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Series Info */}
              <div className="flex-1 text-white relative z-10 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2 line-clamp-2">{props.series.title}</h1>
                    {props.series.authors && props.series.authors.length > 0 && (
                      <p className="text-white/80 mb-4 line-clamp-1">
                        by {props.series.authors.join(', ')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant={isFavorite ? "destructive" : "secondary"}
                    size="sm"
                    className="flex-shrink-0"
                    onClick={handleFavoriteClick}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                    {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </Button>
                </div>
                
                {/* Quick Stats */}
                <div className="flex gap-4 mb-4 flex-wrap">
                  {props.series.status && (
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        props.series.status === SeriesStatus.COMPLETED && "bg-green-500",
                        props.series.status === SeriesStatus.ONGOING && "bg-blue-500",
                        props.series.status === SeriesStatus.CANCELLED && "bg-red-500",
                        "bg-gray-500"
                      )} />
                      <span className="text-sm">{props.series.status}</span>
                    </div>
                  )}
                  {props.series.numberUnread > 0 && (
                    <div className="text-sm">
                      <span className="text-sky-400">{props.series.numberUnread}</span> chapters unread
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {!props.series.preview && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-neutral-900 border-none shadow-md"
                        onClick={() => props.showDownloadModal()}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      {props.series.extensionId === FS_METADATA.id && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/90 hover:bg-white text-neutral-900 border-none shadow-md"
                          onClick={() => props.showEditModal()}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-neutral-900 border-none shadow-md"
                        onClick={() => props.showTrackerModal()}
                      >
                        <Target className="w-4 h-4 mr-1" />
                        Trackers
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-neutral-900 border-none shadow-md"
                        onClick={handleRefresh}
                        disabled={reloadingSeriesList}
                      >
                        {reloadingSeriesList ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span className="ml-1">Refresh</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SeriesDetailsBannerBackground>
      </div>

      {/* Bottom Gradient Overlay - Prevents content overlap */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
};

export default SeriesDetailsBanner;
