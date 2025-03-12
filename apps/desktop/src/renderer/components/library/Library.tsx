import React, { useEffect, useState } from 'react';
import { Series } from '@tiyo/common';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import LibraryControlBar from './LibraryControlBar';
import { LibrarySort, LibraryView, ProgressFilter } from '@/common/models/types';
import {
  activeSeriesListState,
  chapterListState,
  filterState,
  multiSelectEnabledState,
  seriesListState,
  seriesState,
  activeReadingListState,
  readingListsState,
  reloadingSeriesListState,
} from '@/renderer/state/libraryStates';
import {
  libraryFilterStatusState,
  libraryFilterProgressState,
  librarySortState,
  libraryViewState,
  libraryFilterCategoryState,
} from '@/renderer/state/settingStates';
import LibraryGrid from './LibraryGrid';
import LibraryList from './LibraryList';
import library from '@/renderer/services/library';
import LibraryControlBarMultiSelect from './LibraryControlBarMultiSelect';
import { ScrollArea } from '@comicers/ui/components/ScrollArea';
import { RemoveSeriesDialog } from './RemoveSeriesDialog';
import { ReadingListView } from './ReadingListView';

type Props = unknown;

const Library: React.FC<Props> = () => {
  const [removeModalShowing, setRemoveModalShowing] = useState(false);
  const [removeModalSeries, setRemoveModalSeries] = useState<Series | null>(null);
  const activeSeriesList = useRecoilValue(activeSeriesListState);
  const [multiSelectEnabled, setMultiSelectEnabled] = useRecoilState(multiSelectEnabledState);
  const [filter, setFilter] = useRecoilState(filterState);
  const [_reloadingSeriesList, setReloadingSeriesList] = useRecoilState(reloadingSeriesListState);
  const libraryFilterCategory = useRecoilValue(libraryFilterCategoryState);
  const [libraryFilterStatus, setLibraryFilterStatus] = useRecoilState(libraryFilterStatusState);
  const [libraryFilterProgress, setLibraryFilterProgress] = useRecoilState(libraryFilterProgressState);
  const [libraryView, setLibraryView] = useRecoilState(libraryViewState);
  const [librarySort, setLibrarySort] = useRecoilState(librarySortState);
  const setSeries = useSetRecoilState(seriesState);
  const setSeriesList = useSetRecoilState(seriesListState);
  const setChapterList = useSetRecoilState(chapterListState);
  const setReadingLists = useSetRecoilState(readingListsState);
  const activeReadingList = useRecoilValue(activeReadingListState);

  useEffect(() => {
    setSeries(undefined);
    setChapterList([]);
    setMultiSelectEnabled(false);
  }, []);

  useEffect(() => {
    setSeriesList(library.fetchSeriesList());
    setReadingLists(library.fetchReadingLists());
  }, [setSeriesList, setReadingLists]);

  useEffect(() => {
    setFilter('');
    setReloadingSeriesList(false);
    setLibraryFilterStatus(null);
    setLibraryFilterProgress(ProgressFilter.All);
    setLibrarySort(LibrarySort.TitleAsc);
    setLibraryView(LibraryView.GridCompact);
  }, []);

  /**
   * Get a filtered (and sorted) list of series after applying the specified filters.
   * TODO: this can probably be moved into a Recoil selector
   * @param seriesList the list of series to filter
   * @returns a sorted list of series matching all filter props
   */
  const getFilteredList = (): Series[] => {
    const filteredList = activeSeriesList.filter((series: Series) => {
      if (!series) return false;

      if (series.preview) return false;

      if (!series.title.toLowerCase().includes(filter.toLowerCase())) return false;
      if (libraryFilterStatus !== null && series.status !== libraryFilterStatus) {
        return false;
      }
      if (libraryFilterProgress === ProgressFilter.Unread && series.numberUnread === 0) {
        return false;
      }
      if (libraryFilterProgress === ProgressFilter.Finished && series.numberUnread > 0) {
        return false;
      }

      if (libraryFilterCategory) {
        if (!series.categories || !series.categories.includes(libraryFilterCategory)) return false;
      }

      return true;
    });

    switch (librarySort) {
      case LibrarySort.UnreadAsc:
        return filteredList.sort((a: Series, b: Series) => a.numberUnread - b.numberUnread);
      case LibrarySort.UnreadDesc:
        return filteredList.sort((a: Series, b: Series) => b.numberUnread - a.numberUnread);
      case LibrarySort.TitleAsc:
        return filteredList.sort((a: Series, b: Series) => a.title.localeCompare(b.title));
      case LibrarySort.TitleDesc:
        return filteredList.sort((a: Series, b: Series) => b.title.localeCompare(a.title));
      default:
        return filteredList;
    }
  };

  const renderLibrary = () => {
    return (
      <>
        <RemoveSeriesDialog
          series={removeModalSeries}
          showing={removeModalShowing}
          setShowing={setRemoveModalShowing}
        />

        {libraryView === LibraryView.List ? (
          <LibraryList
            getFilteredList={getFilteredList}
            showRemoveModal={(series) => {
              setRemoveModalSeries(series);
              setRemoveModalShowing(true);
            }}
          />
        ) : (
          <LibraryGrid
            getFilteredList={getFilteredList}
            showRemoveModal={(series) => {
              setRemoveModalSeries(series);
              setRemoveModalShowing(true);
            }}
          />
        )}
      </>
    );
  };

  const renderEmptyMessage = () => {
    return (
      <div className="flex items-center justify-center pt-[30vh]">
        <div className="max-w-[460px]">
          <p className="text-center">
            Your library is empty. Install{' '}
            <code className="relative bg-muted px-[0.3rem] py-[0.2rem] text-sm font-semibold">
              Plugins
            </code>{' '}
            from the tab on the left, and then go to{' '}
            <code className="relative bg-muted px-[0.3rem] py-[0.2rem] text-sm font-semibold">
              Add Series
            </code>{' '}
            to start building your library.
          </p>
        </div>
      </div>
    );
  };

  const renderNoneMatchMessage = () => {
    return (
      <div className="flex items-center justify-center pt-[30vh]">
        <div className="max-w-[500px]">
          <p className="text-center">
            There are no series in your library which match the current filters.
          </p>
        </div>
      </div>
    );
  };

  useEffect(() => setSeriesList(library.fetchSeriesList()), [setSeriesList]);

  return (
    <div>
      {!activeReadingList && (
        <>
          {multiSelectEnabled ? (
            <LibraryControlBarMultiSelect
              showAssignCategoriesModal={() => console.log('TODO placeholder')}
            />
          ) : (
            <LibraryControlBar getFilteredList={getFilteredList} />
          )}
          <ScrollArea className="h-[calc(100vh-20px-64px)] w-full pr-4 -mr-2">
            {activeSeriesList.length === 0 && renderEmptyMessage()}
            {activeSeriesList.length > 0 && getFilteredList().length === 0 && renderNoneMatchMessage()}
            {activeSeriesList.length > 0 && getFilteredList().length > 0 && renderLibrary()}
          </ScrollArea>
        </>
      )}
      {activeReadingList && <ReadingListView />}
    </div>
  );
};

export default Library;
