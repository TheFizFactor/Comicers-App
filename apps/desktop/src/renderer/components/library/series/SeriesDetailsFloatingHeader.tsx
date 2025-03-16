import React from 'react';
import { Link } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { Series } from '@tiyo/common';
import { downloadCover } from '@/renderer/util/download';
import library from '@/renderer/services/library';
import { seriesListState } from '@/renderer/state/libraryStates';
import routes from '@/common/constants/routes.json';
import { ArrowLeftIcon, HeartIcon } from 'lucide-react';
import { Button } from '@comicers/ui/components/Button';

type Props = {
  series: Series;
};

const SeriesDetailsFloatingHeader: React.FC<Props> = (props: Props) => {
  const setSeriesList = useSetRecoilState(seriesListState);

  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex justify-between items-center">
        <div>
          {props.series.preview ? (
            <Link to={routes.SEARCH}>
              <Button size="sm" variant="ghost">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Search
              </Button>
            </Link>
          ) : (
            <Link to={routes.LIBRARY}>
              <Button size="sm" variant="ghost" onClick={() => setSeriesList(library.fetchSeriesList())}>
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Library
              </Button>
            </Link>
          )}
        </div>

        {props.series.preview && (
          <div>
            <Button
              className="bg-primary hover:bg-primary/90"
              size="sm"
              onClick={() => {
                downloadCover(props.series);
                library.upsertSeries({ ...props.series, preview: false });
                setSeriesList(library.fetchSeriesList());
              }}
            >
              <HeartIcon className="w-4 h-4 mr-2" />
              Add to Library
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesDetailsFloatingHeader;
