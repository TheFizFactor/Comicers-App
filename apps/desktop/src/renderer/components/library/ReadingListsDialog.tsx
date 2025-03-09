import React, { useState } from 'react';
import { useRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { Series } from '@tiyo/common';
import { ReadingList } from '@/common/models/types';
import { readingListsState } from '@/renderer/state/libraryStates';
import library from '@/renderer/services/library';
import { exportReadingList, importReadingList } from '@/renderer/features/library/readingListUtils';
import { Button } from '@comicers/ui/components/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@comicers/ui/components/Dialog';
import { Input } from '@comicers/ui/components/Input';
import { ImportIcon, FilePlus2Icon, PlusIcon, TrashIcon } from 'lucide-react';
import { ScrollArea } from '@comicers/ui/components/ScrollArea';

type Props = {
  series?: Series;
  showing: boolean;
  setShowing: (showing: boolean) => void;
};

export const ReadingListsDialog: React.FC<Props> = (props: Props) => {
  const [readingLists, setReadingLists] = useRecoilState(readingListsState);
  const [newListName, setNewListName] = useState('');
  
  const createList = () => {
    if (!newListName.trim()) return;
    
    const newList: ReadingList = {
      id: uuidv4(),
      name: newListName.trim(),
      series: props.series ? [props.series] : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    library.upsertReadingList(newList);
    setReadingLists([...readingLists, newList]);
    setNewListName('');
  };
  
  const deleteList = (listId: string) => {
    library.removeReadingList(listId);
    setReadingLists(readingLists.filter(list => list.id !== listId));
  };
  
  const addToList = (list: ReadingList) => {
    if (!props.series || list.series.some((s: Series) => s.id === props.series?.id)) return;
    
    const updatedList: ReadingList = {
      ...list,
      series: [...list.series, props.series],
      updatedAt: Date.now(),
    };
    
    library.upsertReadingList(updatedList);
    setReadingLists(readingLists.map(l => l.id === list.id ? updatedList : l));
  };
  
  const handleImport = async () => {
    const importedList = await importReadingList();
    if (importedList) {
      setReadingLists([...readingLists, importedList]);
    }
  };

  return (
    <Dialog open={props.showing} onOpenChange={props.setShowing}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reading Lists</DialogTitle>
          <DialogDescription>
            {props.series 
              ? `Add "${props.series.title}" to a reading list`
              : 'Manage your reading lists'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 my-4">
          <Input
            placeholder="New list name..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createList()}
          />
          <Button onClick={createList}>
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {readingLists.map((list) => (
              <div key={list.id} className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">{list.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {list.series.length} series
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {props.series && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToList(list)}
                      disabled={list.series.some((s: Series) => s.id === props.series?.id)}
                    >
                      {list.series.some((s: Series) => s.id === props.series?.id) ? 'Added' : 'Add'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReadingList(list)}
                  >
                    <FilePlus2Icon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteList(list.id)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleImport}>
            <ImportIcon className="w-4 h-4 mr-2" />
            Import List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};