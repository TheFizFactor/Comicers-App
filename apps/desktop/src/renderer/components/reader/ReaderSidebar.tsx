import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@comicers/ui/components/Sidebar';
import {
  BookOpenIcon,
  Check,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  GalleryVerticalIcon,
  Settings2Icon,
  StickyNoteIcon,
  XIcon,
} from 'lucide-react';
import {
  seriesState,
  pageNumberState,
  showingSettingsModalState,
  lastPageNumberState,
  pageGroupListState,
  chapterState,
  relevantChapterListState,
  languageChapterListState,
} from '@/renderer/state/readerStates';
import {
  pageStyleState,
  fitContainToWidthState,
  fitContainToHeightState,
  fitStretchState,
  readingDirectionState,
  pageGapState,
} from '@/renderer/state/settingStates';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { Button } from '@comicers/ui/components/Button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@comicers/ui/components/Select';
import { Chapter, Languages } from '@tiyo/common';
import { PageStyle, ReadingDirection } from '@/common/models/types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@comicers/ui/components/Collapsible';
import { RadioGroup, RadioGroupItem } from '@comicers/ui/components/RadioGroup';
import { Label } from '@comicers/ui/components/Label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@comicers/ui/components/DropdownMenu';

// Extracted components
const PageNavigationControls: React.FC<{
  pageNumber: number;
  lastPageNumber: number;
  readingDirection: ReadingDirection;
  pageStyle: PageStyle;
  pageGroupList: number[][];
  onPageChange: (left: boolean, toBound?: boolean) => void;
  onPageNumberChange: (value: number) => void;
  getAdjacentChapterId: (previous: boolean) => string | null;
}> = ({
  pageNumber,
  lastPageNumber,
  readingDirection,
  pageStyle,
  pageGroupList,
  onPageChange,
  onPageNumberChange,
  getAdjacentChapterId,
}) => {
  const getCurrentPageNumText = () => {
    let text = `${pageNumber}`;
    if (pageStyle === PageStyle.Double) {
      const curGroup = pageGroupList.find((group) => group.includes(pageNumber));
      if (curGroup && curGroup.length > 1) {
        text = `${curGroup[0]}-${curGroup[1]}`;
      }
    }
    return `${text} / ${lastPageNumber}`.replace('Infinity', '??');
  };

  return (
    <div className="flex w-full space-x-1">
      <Button
        variant="outline"
        className="flex justify-center bg-transparent !px-1"
        disabled={
          (readingDirection === ReadingDirection.LeftToRight && pageNumber <= 1) ||
          (readingDirection === ReadingDirection.RightToLeft && pageNumber >= lastPageNumber)
        }
        onClick={() => onPageChange(true, true)}
      >
        <ChevronFirst className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        className="flex justify-center bg-transparent !px-1"
        disabled={
          (readingDirection === ReadingDirection.RightToLeft &&
            pageNumber === lastPageNumber &&
            getAdjacentChapterId(false) === null) ||
          (readingDirection === ReadingDirection.LeftToRight &&
            pageNumber <= 1 &&
            getAdjacentChapterId(true) === null)
        }
        onClick={() => onPageChange(true)}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <Select value={`${pageNumber}`} onValueChange={(value) => onPageNumberChange(+value)}>
        <SelectTrigger>
          <SelectValue>{getCurrentPageNumText()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Array.from({ length: lastPageNumber }, (_v, k) => k + 1).map((i: number) => (
              <SelectItem key={i} value={`${i}`}>
                Page {i}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        className="flex justify-center bg-transparent !px-1"
        disabled={
          (readingDirection === ReadingDirection.LeftToRight &&
            pageNumber === lastPageNumber &&
            getAdjacentChapterId(false) === null) ||
          (readingDirection === ReadingDirection.RightToLeft &&
            pageNumber <= 1 &&
            getAdjacentChapterId(true) === null)
        }
        onClick={() => onPageChange(false)}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        className="flex justify-center bg-transparent !px-1"
        disabled={
          (readingDirection === ReadingDirection.LeftToRight && pageNumber >= lastPageNumber) ||
          (readingDirection === ReadingDirection.RightToLeft && pageNumber <= 1)
        }
        onClick={() => onPageChange(false, true)}
      >
        <ChevronLast className="w-4 h-4" />
      </Button>
    </div>
  );
};

const ChapterNavigationControls: React.FC<{
  chapter: Chapter;
  relevantChapterList: Chapter[];
  readingDirection: ReadingDirection;
  onChapterChange: (direction: 'left' | 'right' | 'next' | 'previous') => void;
  onChapterSelect: (id: string) => void;
  getAdjacentChapterId: (previous: boolean) => string | null;
}> = ({
  chapter,
  relevantChapterList,
  readingDirection,
  onChapterChange,
  onChapterSelect,
  getAdjacentChapterId,
}) => (
  <div className="flex w-full space-x-1">
    <Button
      variant="outline"
      className="flex justify-center bg-transparent !px-1.5"
      disabled={
        (readingDirection === ReadingDirection.LeftToRight &&
          getAdjacentChapterId(true) === null) ||
        (readingDirection === ReadingDirection.RightToLeft &&
          getAdjacentChapterId(false) === null)
      }
      onClick={() => onChapterChange('left')}
    >
      <ChevronLeft className="w-4 h-4" />
    </Button>
    <Select value={chapter.id} onValueChange={onChapterSelect}>
      <SelectTrigger>
        <SelectValue>
          {chapter && chapter.chapterNumber
            ? `Chapter ${chapter.chapterNumber}`
            : 'Unknown Chapter'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {relevantChapterList
            .filter((c) => c.id !== undefined)
            .map((relevantChapter: Chapter) => (
              <SelectItem key={relevantChapter.id} value={relevantChapter.id!}>
                Chapter {relevantChapter.chapterNumber}
              </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
    <Button
      variant="outline"
      className="flex justify-center bg-transparent !px-1.5"
      disabled={
        (readingDirection === ReadingDirection.LeftToRight &&
          getAdjacentChapterId(false) === null) ||
        (readingDirection === ReadingDirection.RightToLeft &&
          getAdjacentChapterId(true) === null)
      }
      onClick={() => onChapterChange('right')}
    >
      <ChevronRight className="w-4 h-4" />
    </Button>
  </div>
);

const PageStyleControls: React.FC<{
  pageStyle: PageStyle;
  pageGap: boolean;
  onPageStyleChange: (style: PageStyle) => void;
  onPageGapChange: (gap: boolean) => void;
}> = ({ pageStyle, pageGap, onPageStyleChange, onPageGapChange }) => (
  <Collapsible className="group/collapsible">
    <SidebarGroupLabel
      asChild
      className="group/label w-full text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <CollapsibleTrigger>
        Page Style{' '}
        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
      </CollapsibleTrigger>
    </SidebarGroupLabel>
    <CollapsibleContent>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <RadioGroup
              className="grid grid-cols-3 gap-1 py-2"
              value={pageStyle}
              onValueChange={(v) => onPageStyleChange(v as PageStyle)}
            >
              {[
                {
                  icon: StickyNoteIcon,
                  text: 'Single',
                  value: PageStyle.Single,
                },
                {
                  icon: BookOpenIcon,
                  text: 'Double',
                  value: PageStyle.Double,
                },
                {
                  icon: GalleryVerticalIcon,
                  text: 'Vertical',
                  value: PageStyle.LongStrip,
                },
              ].map((item) => {
                const id = `pageStyle-${item.value}`;
                return (
                  <div key={item.value}>
                    <RadioGroupItem value={item.value} id={id} className="peer sr-only" />
                    <Label
                      htmlFor={id}
                      className="flex flex-col items-center justify-between rounded-md border border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <item.icon className="mb-3 h-6 w-6" />
                      {item.text}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => onPageGapChange(!pageGap)}
              disabled={pageStyle === PageStyle.Single}
            >
              <div
                data-active={pageGap}
                className="group/item flex aspect-square size-4 shrink-0 items-center justify-center rounded-sm border border-sidebar-border text-sidebar-primary-foreground data-[active=true]:border-sidebar-foreground data-[active=true]:bg-sidebar-foreground"
              >
                <Check className="hidden group-data-[active=true]/item:block text-background" />
              </div>
              Spacing between pages
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </CollapsibleContent>
  </Collapsible>
);

const PageFitControls: React.FC<{
  fitContainToWidth: boolean;
  fitContainToHeight: boolean;
  fitStretch: boolean;
  onFitContainToWidthChange: (value: boolean) => void;
  onFitContainToHeightChange: (value: boolean) => void;
  onFitStretchChange: (value: boolean) => void;
}> = ({
  fitContainToWidth,
  fitContainToHeight,
  fitStretch,
  onFitContainToWidthChange,
  onFitContainToHeightChange,
  onFitStretchChange,
}) => (
  <Collapsible className="group/collapsible">
    <SidebarGroupLabel
      asChild
      className="group/label w-full text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <CollapsibleTrigger>
        Page Fit{' '}
        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
      </CollapsibleTrigger>
    </SidebarGroupLabel>
    <CollapsibleContent>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onFitContainToWidthChange(!fitContainToWidth)}>
              <div
                data-active={fitContainToWidth}
                className="group/item flex aspect-square size-4 shrink-0 items-center justify-center rounded-sm border border-sidebar-border text-sidebar-primary-foreground data-[active=true]:border-sidebar-foreground data-[active=true]:bg-sidebar-foreground"
              >
                <Check className="hidden group-data-[active=true]/item:block text-background" />
              </div>
              Contain to width
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onFitContainToHeightChange(!fitContainToHeight)}>
              <div
                data-active={fitContainToHeight}
                className="group/item flex aspect-square size-4 shrink-0 items-center justify-center rounded-sm border border-sidebar-border text-sidebar-primary-foreground data-[active=true]:border-sidebar-foreground data-[active=true]:bg-sidebar-foreground"
              >
                <Check className="hidden group-data-[active=true]/item:block text-background" />
              </div>
              Contain to height
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => onFitStretchChange(!fitStretch)}
              disabled={!(fitContainToHeight || fitContainToWidth)}
            >
              <div
                data-active={fitStretch}
                className="group/item flex aspect-square size-4 shrink-0 items-center justify-center rounded-sm border border-sidebar-border text-sidebar-primary-foreground data-[active=true]:border-sidebar-foreground data-[active=true]:bg-sidebar-foreground"
              >
                <Check className="hidden group-data-[active=true]/item:block text-background" />
              </div>
              Stretch small pages
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </CollapsibleContent>
  </Collapsible>
);

type Props = {
  changePage: (left: boolean, toBound?: boolean) => void;
  setChapter: (id: string, page?: number) => void;
  changeChapter: (direction: 'left' | 'right' | 'next' | 'previous') => void;
  getAdjacentChapterId: (previous: boolean) => string | null;
  exitPage: () => void;
};

export const ReaderSidebar: React.FC<Props> = (props: Props) => {
  const readerSeries = useRecoilValue(seriesState);
  const [pageNumber, setPageNumber] = useRecoilState(pageNumberState);
  const setShowingSettingsModal = useSetRecoilState(showingSettingsModalState);
  const lastPageNumber = useRecoilValue(lastPageNumberState);
  const pageGroupList = useRecoilValue(pageGroupListState);
  const chapter = useRecoilValue(chapterState);
  const relevantChapterList = useRecoilValue(relevantChapterListState);
  const languageChapterList = useRecoilValue(languageChapterListState);
  const [pageStyle, setPageStyle] = useRecoilState(pageStyleState);
  const [pageGap, setPageGap] = useRecoilState(pageGapState);
  const [fitContainToWidth, setFitContainToWidth] = useRecoilState(fitContainToWidthState);
  const [fitContainToHeight, setFitContainToHeight] = useRecoilState(fitContainToHeightState);
  const [fitStretch, setFitStretch] = useRecoilState(fitStretchState);
  const readingDirection = useRecoilValue(readingDirectionState);

  if (!readerSeries || !chapter) {
    return <></>;
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenuItem>
          <SidebarMenuButton
            className="max-w-full flex space-x-1 px-1 py-6"
            onClick={() => props.exitPage()}
          >
            <XIcon className="opacity-50" />
            <h3 className="truncate font-semibold text-wrap line-clamp-2">{readerSeries.title}</h3>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <ChapterNavigationControls
                chapter={chapter}
                relevantChapterList={relevantChapterList}
                readingDirection={readingDirection}
                onChapterChange={props.changeChapter}
                onChapterSelect={props.setChapter}
                getAdjacentChapterId={props.getAdjacentChapterId}
              />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <PageNavigationControls
                pageNumber={pageNumber}
                lastPageNumber={lastPageNumber}
                readingDirection={readingDirection}
                pageStyle={pageStyle}
                pageGroupList={pageGroupList}
                onPageChange={props.changePage}
                onPageNumberChange={setPageNumber}
                getAdjacentChapterId={props.getAdjacentChapterId}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="py-2 border-y border-sidebar-border">
          <PageStyleControls
            pageStyle={pageStyle}
            pageGap={pageGap}
            onPageStyleChange={setPageStyle}
            onPageGapChange={setPageGap}
          />
        </SidebarGroup>
        <SidebarGroup className="pt-0 pb-2 border-b border-sidebar-border">
          <PageFitControls
            fitContainToWidth={fitContainToWidth}
            fitContainToHeight={fitContainToHeight}
            fitStretch={fitStretch}
            onFitContainToWidthChange={setFitContainToWidth}
            onFitContainToHeightChange={setFitContainToHeight}
            onFitStretchChange={setFitStretch}
          />
        </SidebarGroup>
        <SidebarGroup className="pt-0 pb-2 border-b border-sidebar-border">
          <SidebarGroupLabel
            asChild
            className="w-full text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <SidebarMenuButton onClick={() => setShowingSettingsModal(true)}>
              Settings <Settings2Icon className="ml-auto" />
            </SidebarMenuButton>
          </SidebarGroupLabel>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex w-full space-x-2 items-center">
                    <div className="flex-1 text-left text-sm leading-tight overflow-hidden">
                      <span className="truncate font-semibold">
                        {chapter.volumeNumber && `Vol. ${chapter.volumeNumber} · `}
                        Ch. {chapter.chapterNumber}
                      </span>
                      <div className="flex space-x-1 items-center">
                        <div
                          className={`flag:${Languages[chapter.languageKey]?.flagCode} w-[1.125rem] h-[0.75rem]`}
                          title={Languages[chapter.languageKey]?.name}
                        />
                        <span className="truncate text-xs">
                          {Languages[chapter.languageKey]?.name}
                          {chapter.groupName && ` by ${chapter.groupName}`}
                        </span>
                      </div>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                {languageChapterList.map((languageChapter: Chapter) => (
                  <DropdownMenuItem
                    key={languageChapter.id}
                    onClick={() => {
                      if (languageChapter.id) props.setChapter(languageChapter.id, pageNumber);
                    }}
                  >
                    {Languages[languageChapter.languageKey] !== undefined && (
                      <>
                        <div
                          className={`flag:${Languages[languageChapter.languageKey]?.flagCode} w-[1.125rem] h-[0.75rem]`}
                          title={Languages[languageChapter.languageKey]?.name}
                        />
                        {`${Languages[languageChapter.languageKey].name} by ${languageChapter.groupName}`}
                      </>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
