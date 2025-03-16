import React, { useEffect, useState } from 'react';
import { Chapter, Series } from '@tiyo/common';
const { ipcRenderer } = require('electron');
import { useRecoilValue } from 'recoil';
import ipcChannels from '@/common/constants/ipcChannels.json';
import library from '@/renderer/services/library';
import { customDownloadsDirState } from '@/renderer/state/settingStates';
import { getFromChapterIds } from '@/renderer/features/library/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@comicers/ui/components/Accordion';
import { Checkbox } from '@comicers/ui/components/Checkbox';
import { Badge } from '@comicers/ui/components/Badge';
import { Label } from '@comicers/ui/components/Label';
import { Button } from '@comicers/ui/components/Button';
import { Trash2Icon, FolderIcon, BookOpenIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@comicers/ui/components/AlertDialog';
import {
  Card,
  CardContent,
  CardHeader,
} from '@comicers/ui/components/Card';
import { ScrollArea } from '@comicers/ui/components/ScrollArea';

const defaultDownloadsDir = await ipcRenderer.invoke(ipcChannels.GET_PATH.DEFAULT_DOWNLOADS_DIR);

const MyDownloads: React.FC = () => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [chapterLists, setChapterLists] = useState<{ [key: string]: Chapter[] }>({});
  const [checkedChapters, setCheckedChapters] = useState<string[]>([]);
  const customDownloadsDir = useRecoilValue(customDownloadsDirState);

  const loadDownloads = async () => {
    const downloadedChapterIds = await ipcRenderer.invoke(
      ipcChannels.FILESYSTEM.GET_ALL_DOWNLOADED_CHAPTER_IDS,
      customDownloadsDir || defaultDownloadsDir,
    );
    const downloaded = getFromChapterIds(downloadedChapterIds);

    setSeriesList(downloaded.seriesList);
    setChapterLists(downloaded.chapterLists);
  };

  const deleteChecked = async () => {
    const toDelete = new Set(checkedChapters);
    console.debug(`Deleting ${toDelete.size} downloaded chapters`);

    Promise.all(
      [...toDelete].map(async (chapterId: string) => {
        let seriesId: string | undefined;
        Object.entries(chapterLists).forEach(([curSeriesId, chapters]) => {
          if (chapters.find((chapter) => chapter.id && chapter.id === chapterId)) {
            seriesId = curSeriesId;
          }
        });
        if (!seriesId) return;

        const series = library.fetchSeries(seriesId);
        const chapter = library.fetchChapter(seriesId, chapterId);
        if (series === null || chapter === null) return;

        await ipcRenderer.invoke(
          ipcChannels.FILESYSTEM.DELETE_DOWNLOADED_CHAPTER,
          series,
          chapter,
          customDownloadsDir || defaultDownloadsDir,
        );
      }),
    )
      .then(() => {
        setCheckedChapters([]);
        loadDownloads();
      })
      .catch((err) => console.error(err));
  };

  const renderHeader = () => {
    const totalChapters = Object.values(chapterLists).reduce((sum, chapters) => sum + chapters.length, 0);
    const totalSeries = seriesList.length;
    
    return (
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Downloaded Content</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalSeries === 0 
              ? 'No downloaded chapters yet'
              : `${totalChapters} chapter${totalChapters !== 1 ? 's' : ''} from ${totalSeries} series`
            }
          </p>
        </div>
        <div className="flex space-x-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                disabled={checkedChapters.length === 0}
              >
                <Trash2Icon className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-[425px]">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete downloaded chapters</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {checkedChapters.length} downloaded chapters? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteChecked}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button size="sm" variant="outline" onClick={loadDownloads}>
            Refresh
          </Button>
        </div>
      </div>
    );
  };

  const handleChangeSeriesCheckbox = (seriesId: string | undefined) => {
    if (!seriesId) return;

    const chapterIds: string[] = [];
    if (chapterLists[seriesId]) {
      chapterLists[seriesId].forEach((chapter) => {
        if (chapter.id) chapterIds.push(chapter.id);
      });
    }

    if (chapterIds.every((id) => checkedChapters.includes(id))) {
      setCheckedChapters(checkedChapters.filter((id) => !chapterIds.includes(id)));
    } else {
      setCheckedChapters([...checkedChapters, ...chapterIds]);
    }
  };

  const handleChangeChapterCheckbox = (chapterId: string | undefined, checked: boolean) => {
    if (!chapterId) return;

    if (checked) {
      if (!checkedChapters.includes(chapterId)) {
        setCheckedChapters([chapterId, ...checkedChapters]);
      }
    } else {
      setCheckedChapters(checkedChapters.filter((id) => id !== chapterId));
    }
  };

  useEffect(() => {
    loadDownloads();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        {renderHeader()}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[50vh] pr-4">
          {seriesList.length === 0 ? (
            <div className="h-[40vh] flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-muted">
                <FolderIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">Your downloaded chapters will appear here</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  To download chapters, navigate to a series and use the download button or select chapters from the chapter list.
                </p>
              </div>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {seriesList.map((series) => {
                if (!series.id || !chapterLists[series.id]) return null;

                const numChapters = chapterLists[series.id].length;
                const numSelected = chapterLists[series.id].filter(
                  (chapter) => chapter.id && checkedChapters.includes(chapter.id),
                ).length;

                return (
                  <AccordionItem value={series.id} key={series.id} className="border rounded-lg">
                    <AccordionTrigger className="hover:no-underline px-4">
                      <div className="flex justify-between w-full items-center">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={numSelected === numChapters}
                            className="h-4 w-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChangeSeriesCheckbox(series.id);
                            }}
                          />
                          <div className="flex flex-col items-start text-left">
                            <span className="font-medium">{series.title}</span>
                            <span className="text-sm text-muted-foreground">
                              {numChapters} chapter{numChapters !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        {numSelected > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {numSelected} selected
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 px-4 py-2">
                        {chapterLists[series.id]
                          .sort(
                            (a, b) =>
                              parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber) ||
                              a.id!.localeCompare(b.id!),
                          )
                          .reverse()
                          .map((chapter) => {
                            if (!chapter.id) return null;
                            return (
                              <div
                                key={chapter.id}
                                className="flex items-center space-x-3 py-1 px-2 rounded hover:bg-muted/50 cursor-pointer"
                                onClick={() =>
                                  handleChangeChapterCheckbox(
                                    chapter.id!,
                                    !checkedChapters.includes(chapter.id!),
                                  )
                                }
                              >
                                <Checkbox
                                  checked={checkedChapters.includes(chapter.id)}
                                  className="h-4 w-4"
                                />
                                <div className="flex items-center justify-between w-full">
                                  <Label className="cursor-pointer flex items-center space-x-2">
                                    <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
                                    <span>Chapter {chapter.chapterNumber}</span>
                                  </Label>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MyDownloads;
