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

  const showRemoveModal = (series: Series) => {
    setRemoveModalSeries(series);
    setRemoveModalShowing(true);
  };

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

  const renderEmptyMessage = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-medium text-muted-foreground">Your library is empty</p>
      <p className="text-sm text-muted-foreground/80 mt-1">Add some series to get started</p>
    </div>
  );

  const renderNoneMatchMessage = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-medium text-muted-foreground">No series match your filter</p>
      <p className="text-sm text-muted-foreground/80 mt-1">Try adjusting your search criteria</p>
    </div>
  );

  const renderLibrary = () => (
    <>
      {activeSeriesList.length > 0 && (
        <div className="mb-4 text-center">
          <p className="text-sm text-muted-foreground/80">
            Pro tip: Right-click on any series to access quick actions
          </p>
        </div>
      )}
      {libraryView === LibraryView.List ? (
        <LibraryList getFilteredList={getFilteredList} showRemoveModal={showRemoveModal} />
      ) : (
        <LibraryGrid getFilteredList={getFilteredList} showRemoveModal={showRemoveModal} />
      )}
      <RemoveSeriesDialog
        series={removeModalSeries}
        showing={removeModalShowing}
        setShowing={setRemoveModalShowing}
      />
    </>
  );

  useEffect(() => setSeriesList(library.fetchSeriesList()), [setSeriesList]);

  return (
    <div className="h-screen">
      {!activeReadingList && (
        <>
          {multiSelectEnabled ? (
            <LibraryControlBarMultiSelect
              showAssignCategoriesModal={() => console.log('TODO placeholder')}
            />
          ) : (
            <LibraryControlBar getFilteredList={getFilteredList} />
          )}
          <ScrollArea className="h-[calc(100vh-64px-56px)] w-full">
            <div className="px-4 pb-4">
              {activeSeriesList.length === 0 && renderEmptyMessage()}
              {activeSeriesList.length > 0 && getFilteredList().length === 0 && renderNoneMatchMessage()}
              {activeSeriesList.length > 0 && getFilteredList().length > 0 && renderLibrary()}
            </div>
          </ScrollArea>
        </>
      )}
      {activeReadingList && <ReadingListView />}
    </div>
  );
};

export default Library;
