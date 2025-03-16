import React from 'react';
import { useRecoilValue } from 'recoil';
import { downloaderClient, DownloadTask } from '@/renderer/services/downloader';
import { currentTaskState, queueState } from '@/renderer/state/downloaderStates';
import { Languages } from '@tiyo/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@comicers/ui/components/Card';
import { Progress } from '@comicers/ui/components/Progress';
import { ScrollArea } from '@comicers/ui/components/ScrollArea';
import { Button } from '@comicers/ui/components/Button';
import { PauseIcon, PlayIcon, XIcon, InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@comicers/ui/components/Tooltip';

const DownloadQueue: React.FC = () => {
  const queue = useRecoilValue(queueState);
  const currentTask = useRecoilValue(currentTaskState);

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Active Downloads</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTask ? 'Downloading in progress' : queue.length > 0 ? 'Download paused' : 'No active downloads'}
          </p>
        </div>
        {(currentTask || queue.length > 0) && (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => downloaderClient.clear()}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XIcon className="h-4 w-4 mr-1" />
              Clear Queue
            </Button>
            {currentTask === null && queue.length > 0 ? (
              <Button
                className="text-white bg-green-600 hover:bg-green-700"
                size="sm"
                onClick={() => downloaderClient.start()}
              >
                <PlayIcon className="h-4 w-4 mr-1" />
                Resume
              </Button>
            ) : (
              <Button
                className="text-white bg-orange-600 hover:bg-orange-700"
                size="sm"
                onClick={() => downloaderClient.pause()}
              >
                <PauseIcon className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTask = (task: DownloadTask) => {
    const descriptionFields: string[] = [];
    if (task.chapter.languageKey && Languages[task.chapter.languageKey]) {
      descriptionFields.push(Languages[task.chapter.languageKey].name);
    }
    if (task.chapter.groupName) {
      descriptionFields.push(task.chapter.groupName);
    }

    const value = task.page && task.totalPages ? (task.page / task.totalPages) * 100 : 0;
    const progressText = task.page && task.totalPages ? `${task.page}/${task.totalPages} pages` : 'Preparing download...';
    
    return (
      <Card key={`${task.series.id}-${task.chapter.id}`} className="w-full">
        <CardHeader className="px-4 pt-3 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                {task.series.title}
              </CardTitle>
              <CardDescription>
                Chapter {task.chapter.chapterNumber}
                {descriptionFields.length > 0 && ` • ${descriptionFields.join(' • ')}`}
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download started at {new Date().toLocaleTimeString()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-1">
            <Progress value={value} className="h-2" />
            <p className="text-sm text-muted-foreground text-right">{progressText}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        {renderHeader()}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[40vh] min-h-64 pr-4">
          <div className="space-y-4">
            {currentTask ? renderTask(currentTask) : null}
            {queue.map((task: DownloadTask) => renderTask(task))}
            {currentTask === null && queue.length === 0 && (
              <div className="h-[36vh] min-h-60 flex flex-col items-center justify-center text-center space-y-2">
                <p className="text-muted-foreground">There are no downloads in the queue.</p>
                <p className="text-sm text-muted-foreground">
                  To download chapters, go to a series page and click the download button or select chapters from the chapter list.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DownloadQueue;
