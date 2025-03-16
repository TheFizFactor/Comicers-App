import React, { useState } from 'react';
import { useRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import { Series } from '@tiyo/common';
import { ReadingList } from '@/common/models/types';
import { readingListsState } from '@/renderer/state/libraryStates';
import library from '@/renderer/services/library';
import { exportReadingList, importReadingList } from '@/renderer/features/library/readingListUtils';
import { copyShareableUrl, importFromUrl } from '@/renderer/features/library/readingListSharing';
import { Button } from '@comicers/ui/components/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@comicers/ui/components/Dialog';
import { Input } from '@comicers/ui/components/Input';
import { 
  ImportIcon, 
  FilePlus2Icon, 
  PlusIcon, 
  TrashIcon, 
  ShareIcon,
  LinkIcon,
  BookmarkIcon,
  CalendarIcon
} from 'lucide-react';
import { ScrollArea } from '@comicers/ui/components/ScrollArea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@comicers/ui/components/DropdownMenu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@comicers/ui/components/Popover';
import { Separator } from '@comicers/ui/components/Separator';
import { cn } from '@comicers/ui/util';

type Props = {
  series?: Series;
  showing: boolean;
  setShowing: (showing: boolean) => void;
};

export const ReadingListsDialog: React.FC<Props> = (props: Props) => {
  const [readingLists, setReadingLists] = useRecoilState(readingListsState);
  const [newListName, setNewListName] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [showImportUrl, setShowImportUrl] = useState(false);
  
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

  const handleImportFromUrl = async () => {
    if (!importUrl) return;
    
    const importedList = await importFromUrl(importUrl);
    if (importedList) {
      library.upsertReadingList(importedList);
      setReadingLists([...readingLists, importedList]);
      setImportUrl('');
      setShowImportUrl(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={props.showing} onOpenChange={props.setShowing}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkIcon className="w-5 h-5" />
            Reading Lists
          </DialogTitle>
          <DialogDescription>
            {props.series 
              ? `Add "${props.series.title}" to a reading list`
              : 'Create and manage your reading lists'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 my-4">
          <div className="relative flex-1">
            <Input
              placeholder="Enter list name..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createList()}
              className="pr-20"
            />
            <Button 
              size="sm"
              className="absolute right-1 top-1 h-7"
              onClick={createList}
              disabled={!newListName.trim()}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Create
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {readingLists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <BookmarkIcon className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">No reading lists yet</p>
                <p className="text-xs">Create your first list to get started</p>
              </div>
            ) : (
              readingLists.map((list) => (
                <div 
                  key={list.id} 
                  className={cn(
                    "group relative p-4 rounded-lg border",
                    "hover:bg-muted/50 transition-colors"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{list.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {list.series.length} {list.series.length === 1 ? 'series' : 'series'}
                        </span>
                        <span className="text-xs text-muted-foreground/60">•</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {formatDate(list.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {props.series && (
                        <Button
                          variant={list.series.some((s: Series) => s.id === props.series?.id) ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => addToList(list)}
                          disabled={list.series.some((s: Series) => s.id === props.series?.id)}
                          className="min-w-[70px]"
                        >
                          {list.series.some((s: Series) => s.id === props.series?.id) ? 'Added' : 'Add'}
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <ShareIcon className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyShareableUrl(list)}>
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportReadingList(list)}>
                            <FilePlus2Icon className="w-4 h-4 mr-2" />
                            Export File
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteList(list.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <Separator className="my-4" />

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleImport}>
              <ImportIcon className="w-4 h-4 mr-2" />
              Import File
            </Button>
            <Popover open={showImportUrl} onOpenChange={setShowImportUrl}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Import from URL
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="flex flex-col space-y-2">
                  <Input
                    placeholder="Paste shared list URL..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleImportFromUrl()}
                  />
                  <Button 
                    onClick={handleImportFromUrl}
                    disabled={!importUrl.trim()}
                  >
                    Import
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};