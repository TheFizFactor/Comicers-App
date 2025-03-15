import React, { useState } from 'react';
import { ExtensionMetadata } from '@tiyo/common';
import { useRecoilState, useSetRecoilState } from 'recoil';
const { ipcRenderer } = require('electron');
import {
  searchExtensionState,
  searchTextState,
  showingFilterDrawerState,
  enabledProvidersState,
} from '@/renderer/state/searchStates';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { Button } from '@comicers/ui/components/Button';
import { Filter, FolderOpen, Settings } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@comicers/ui/components/Select';
import { Checkbox } from '@comicers/ui/components/Checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@comicers/ui/components/Tooltip';
import { Label } from '@comicers/ui/components/Label';
import { cn } from '@/renderer/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@comicers/ui/components/Sheet';

interface Props {
  extensionList: ExtensionMetadata[];
  hasFilterOptions: boolean;
  handleSearch: (fresh?: boolean) => void;
  handleSearchFilesystem: (searchPaths: string[]) => void;
}

const SearchControlBar: React.FC<Props> = (props: Props) => {
  const [searchExtension, setSearchExtension] = useRecoilState(searchExtensionState);
  const setShowingFilterDrawer = useSetRecoilState(showingFilterDrawerState);
  const [multiSeriesEnabled, setMultiSeriesEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [enabledProviders, setEnabledProviders] = useRecoilState(enabledProvidersState);

  const handleSelectDirectory = async () => {
    const fileList = await ipcRenderer.invoke(
      ipcChannels.APP.SHOW_OPEN_DIALOG,
      true,
      [],
      'Select Series Directory',
    );
    if (fileList.length <= 0) return;

    const selectedPath = fileList[0];

    const searchPaths = multiSeriesEnabled
      ? await ipcRenderer.invoke(ipcChannels.FILESYSTEM.LIST_DIRECTORY, selectedPath)
      : [selectedPath];

    props.handleSearchFilesystem(searchPaths);
  };

  const toggleProvider = (providerId: string) => {
    setEnabledProviders(current => 
      current.includes(providerId)
        ? current.filter(id => id !== providerId)
        : [...current, providerId]
    );
  };

  const renderFilesystemControls = () => {
    return (
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
          onClick={handleSelectDirectory}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Select Directory</span>
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multi-series"
                  checked={multiSeriesEnabled}
                  onCheckedChange={(checked) => setMultiSeriesEnabled(!!checked)}
                />
                <Label htmlFor="multi-series">Multi-series mode</Label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enable to import multiple series from subdirectories</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex items-center gap-2">
        <Select
          defaultValue={searchExtension}
          onValueChange={(value) => setSearchExtension(value || searchExtension)}
        >
          <SelectTrigger className={cn(
            "w-[200px] shadow-sm hover:shadow-md transition-shadow",
            searchExtension === 'all' && "bg-primary/10"
          )}>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all" className="font-medium">All Providers</SelectItem>
              <SelectItem value={FS_METADATA.id}>Local Files</SelectItem>
              {props.extensionList
                .filter(ext => ext.id !== FS_METADATA.id)
                .map((metadata: ExtensionMetadata) => (
                  <SelectItem key={metadata.id} value={metadata.id}>
                    {metadata.name}
                  </SelectItem>
                ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {searchExtension === 'all' && (
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4" />
                <span>Provider Settings</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col h-full">
              <SheetHeader className="flex-none">
                <SheetTitle>Provider Settings</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Select which providers to include in "All Providers" search:
                </p>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto mt-4">
                <div className="space-y-4 pr-6">
                  {props.extensionList
                    .filter(ext => ext.id !== FS_METADATA.id)
                    .map(provider => (
                      <div key={provider.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={provider.id}
                          checked={enabledProviders.includes(provider.id)}
                          onCheckedChange={() => toggleProvider(provider.id)}
                        />
                        <Label htmlFor={provider.id}>{provider.name}</Label>
                      </div>
                    ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <div className="flex-1">
        {searchExtension === FS_METADATA.id ? renderFilesystemControls() : (
          props.hasFilterOptions && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
              onClick={() => setShowingFilterDrawer(true)}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </Button>
          )
        )}
      </div>
    </div>
  );
};

export default SearchControlBar;
