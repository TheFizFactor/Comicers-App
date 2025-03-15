import React, { useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  FilterCheckbox,
  FilterCycle,
  FilterHeader,
  FilterInput,
  FilterMultiToggle,
  FilterOption,
  FilterOptionType,
  FilterSelect,
  FilterSeparator,
  FilterSort,
  FilterSortValue,
  FilterTriStateCheckbox,
  MultiToggleValues,
  TriState,
} from '@tiyo/common';
import {
  filterValuesMapState,
  searchExtensionState,
  showingFilterDrawerState,
} from '@/renderer/state/searchStates';
import SearchFilterMultiToggle from './filter/SearchFilterMultiToggle';
import SearchFilterSort from './filter/SearchFilterSort';
import SearchFilterTriCheckbox from './filter/SearchFilterTriCheckbox';
import SearchFilterCycle from './filter/SearchFilterCycle';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@comicers/ui/components/Sheet';
import { Label } from '@comicers/ui/components/Label';
import { Input } from '@comicers/ui/components/Input';
import { Checkbox } from '@comicers/ui/components/Checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@comicers/ui/components/Select';
import { Separator } from '@comicers/ui/components/Separator';
import { cn } from '@/renderer/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@comicers/ui/components/Badge';
import { Button } from '@comicers/ui/components/Button';
import { X } from 'lucide-react';

interface Props {
  filterOptions: FilterOption[];
  onClose?: (wasChanged: boolean) => void;
}

const SearchFilterDrawer: React.FC<Props> = (props: Props) => {
  const [showingFilterDrawer, setShowingFilterDrawer] = useRecoilState(showingFilterDrawerState);
  const searchExtension = useRecoilValue(searchExtensionState);
  const [filterValuesMap, setFilterValuesMap] = useRecoilState(filterValuesMapState);
  const [wasChanged, setWasChanged] = useState(false);

  const handleChange = (id: string, value: any) => {
    setFilterValuesMap({
      ...filterValuesMap,
      [searchExtension]: {
        ...filterValuesMap[searchExtension],
        [id]: value,
      },
    });
    setWasChanged(true);
  };

  const resetFilters = () => {
    const defaultValues = Object.fromEntries(
      props.filterOptions.map((opt) => [opt.id, opt.defaultValue])
    );
    setFilterValuesMap({
      ...filterValuesMap,
      [searchExtension]: defaultValues,
    });
    setWasChanged(true);
  };

  const getActiveFilterCount = () => {
    if (!filterValuesMap[searchExtension]) return 0;
    return Object.entries(filterValuesMap[searchExtension]).filter(([id, value]) => {
      const option = props.filterOptions.find(opt => opt.id === id);
      if (!option) return false;
      return JSON.stringify(value) !== JSON.stringify(option.defaultValue);
    }).length;
  };

  const renderControl = (option: FilterOption) => {
    const value = filterValuesMap[searchExtension]?.[option.id] ?? option.defaultValue;
    const isModified = JSON.stringify(value) !== JSON.stringify(option.defaultValue);

    return (
      <motion.div
        key={option.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'p-4 rounded-lg transition-colors',
          isModified && 'bg-primary/5'
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">
            {option.label}
            {isModified && (
              <Badge variant="secondary" className="ml-2 bg-primary/10">
                Modified
              </Badge>
            )}
          </Label>
          {isModified && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => handleChange(option.id, option.defaultValue)}
            >
              <X className="h-3 w-3" />
              <span className="ml-1 text-xs">Reset</span>
            </Button>
          )}
        </div>
        {option.kind === FilterOptionType.Input && (
          <Input
            value={value as string}
            onChange={(e) => handleChange(option.id, e.target.value)}
            className="w-full"
          />
        )}
        {option.kind === FilterOptionType.Select && (
          <Select
            value={value as string}
            onValueChange={(value) => handleChange(option.id, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {(option as FilterSelect).options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
        {option.kind === FilterOptionType.Checkbox && (
          <Checkbox
            checked={value as boolean}
            onCheckedChange={(checked) => handleChange(option.id, checked)}
          />
        )}
        {option.kind === FilterOptionType.TriStateCheckbox && (
          <SearchFilterTriCheckbox
            label={option.label}
            value={value as TriState}
            onChange={(value) => handleChange(option.id, value)}
          />
        )}
        {option.kind === FilterOptionType.MultiToggle && (
          <SearchFilterMultiToggle
            label={option.label}
            fields={(option as FilterMultiToggle).fields || []}
            values={value as MultiToggleValues}
            onChange={(value) => handleChange(option.id, value)}
          />
        )}
        {option.kind === FilterOptionType.Sort && (
          <SearchFilterSort
            label={(option as FilterSort).label}
            fields={(option as FilterSort).fields || []}
            value={value as FilterSortValue}
            onChange={(value) => handleChange(option.id, value)}
            supportsBothDirections={(option as FilterSort).supportsBothDirections}
          />
        )}
        {option.kind === FilterOptionType.Cycle && (
          <SearchFilterCycle
            label={option.label}
            options={(option as FilterCycle).options || []}
            value={value as string}
            onChange={(value) => handleChange(option.id, value)}
          />
        )}
      </motion.div>
    );
  };

  const renderControls = () => {
    let currentHeader: string | undefined;
    const controls: JSX.Element[] = [];

    props.filterOptions.forEach((option, index) => {
      if (option.kind === FilterOptionType.Header) {
        currentHeader = (option as FilterHeader).label;
        if (index > 0) {
          controls.push(
            <Separator key={`separator-${index}`} className="my-4" />
          );
        }
        controls.push(
          <h3 key={`header-${index}`} className="text-lg font-semibold mb-4">
            {currentHeader}
          </h3>
        );
      } else if (option.kind === FilterOptionType.Separator) {
        controls.push(
          <Separator key={`separator-${index}`} className="my-4" />
        );
      } else {
        controls.push(renderControl(option));
      }
    });

    return controls;
  };

  return (
    <Sheet
      open={showingFilterDrawer}
      onOpenChange={(open) => {
        if (!open && props.onClose !== undefined) {
          props.onClose(wasChanged);
        }
        setShowingFilterDrawer(open);
      }}
    >
      <SheetContent className="flex flex-col w-[400px] sm:w-[540px]">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SheetTitle>Search Filters</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {getActiveFilterCount()} active filters
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={getActiveFilterCount() === 0}
            >
              Reset All
            </Button>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-1">
          <AnimatePresence>
            <div className="space-y-4">
              {renderControls()}
            </div>
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SearchFilterDrawer;
