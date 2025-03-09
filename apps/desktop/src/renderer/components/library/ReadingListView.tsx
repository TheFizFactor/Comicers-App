import React from 'react';
import { useRecoilState } from 'recoil';
import { ReadingList } from '@/common/models/types';
import { activeReadingListState, readingListsState } from '@/renderer/state/libraryStates';
import { Button } from '@comicers/ui/components/Button';
import { ScrollArea } from '@comicers/ui/components/ScrollArea';
import { ArrowLeft } from 'lucide-react';
import LibraryGrid from './LibraryGrid';
import { RemoveSeriesDialog } from './RemoveSeriesDialog';
import library from '@/renderer/services/library';
import { Series } from '@tiyo/common';

export const ReadingListView: React.FC = () => {
  const [activeReadingList, setActiveReadingList] = useRecoilState(activeReadingListState);
  const [readingLists, setReadingLists] = useRecoilState(readingListsState);
  const [removeModalShowing, setRemoveModalShowing] = React.useState(false);
  const [removeModalSeries, setRemoveModalSeries] = React.useState<Series | null>(null);

  const removeFromList = (series: Series) => {
    if (!activeReadingList) return;

    const updatedList: ReadingList = {
      ...activeReadingList,
      series: activeReadingList.series.filter((s: Series) => s.id !== series.id),
      updatedAt: Date.now(),
    };

    library.upsertReadingList(updatedList);
    setReadingLists(readingLists.map(l => l.id === updatedList.id ? updatedList : l));
    setActiveReadingList(updatedList);
    setRemoveModalShowing(false);
    setRemoveModalSeries(null);
  };
  
  if (!activeReadingList) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Reading Lists</h2>
        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readingLists.map((list: ReadingList) => (
              <div
                key={list.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
                onClick={() => setActiveReadingList(list)}
              >
                <h3 className="font-medium">{list.name}</h3>
                <p className="text-sm text-muted-foreground">{list.series.length} series</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setActiveReadingList(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lists
        </Button>
        <h2 className="text-2xl font-bold">{activeReadingList.name}</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-100px)]">
        <LibraryGrid
          getFilteredList={() => activeReadingList.series}
          showRemoveModal={(series) => {
            setRemoveModalSeries(series);
            setRemoveModalShowing(true);
          }}
          contextMenuRemoveAction="Remove from list"
        />
      </ScrollArea>
      <RemoveSeriesDialog
        series={removeModalSeries}
        showing={removeModalShowing}
        setShowing={setRemoveModalShowing}
        onConfirm={() => removeModalSeries && removeFromList(removeModalSeries)}
        confirmText="Remove from list"
        description="Are you sure you want to remove this series from the reading list?"
      />
    </div>
  );
};