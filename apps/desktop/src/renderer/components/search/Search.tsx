import React, { useEffect, useState } from 'react';
import { ExtensionMetadata, FilterOption, Series, SeriesListResponse } from '@tiyo/common';
const { ipcRenderer } = require('electron');
import { useRecoilState, useRecoilValue } from 'recoil';
import ExplorerModal from './ExplorerModal';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import ipcChannels from '@/common/constants/ipcChannels.json';
import {
  addModalEditableState,
  addModalSeriesState,
  filterValuesMapState,
  nextSourcePageState,
  searchExtensionState,
  searchTextState,
  searchResultState,
  showingAddModalState,
  enabledProvidersState,
} from '@/renderer/state/searchStates';
import SearchControlBar from './SearchControlBar';
import SearchFilterDrawer from './SearchFilterDrawer';
import { Button } from '@comicers/ui/components/Button';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@comicers/ui/components/Input';
import { 
  Grid2X2, 
  List, 
  SlidersHorizontal,
  Star,
  Calendar,
  BookOpen,
  Languages,
  Activity,
  Tag,
  User
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@comicers/ui/components/Select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@comicers/ui/components/Sheet';
import { Slider } from '@comicers/ui/components/Slider';
import { cn } from '../../utils';
import { Badge } from '@comicers/ui/components/Badge';

const BATCH_SIZE = 3; // Number of concurrent provider searches
const PROVIDER_TIMEOUT = 15000; // 15 seconds timeout per provider
const MAX_RETRIES = 2; // Maximum number of retries for failed requests

interface Filters {
    status: string;
    language: string;
    minChapters: number;
    maxChapters: number;
    yearFrom: number;
    yearTo: number;
    rating: number;
}

// Add interface for series with provider
interface SeriesWithProvider extends Series {
  provider?: string;
  rating?: number;
  chapterCount?: number;
  lastUpdated?: number;
  year?: number;
  availableTranslations?: string[];
}

// Add ListCard component
const ListCard: React.FC<{
  series: SeriesWithProvider;
  onClick: () => void;
  extensionList: ExtensionMetadata[];
}> = ({ series, onClick, extensionList }) => {
  // Helper to check if a string array has valid content
  const hasValidContent = (arr?: string[]) => arr && arr.length > 0 && arr[0]?.trim() !== '';

  return (
    <div 
      className="group relative flex gap-6 p-4 cursor-pointer bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {/* Cover Image */}
      <div className="relative w-[180px] aspect-[2/3] flex-shrink-0">
        {series.remoteCoverUrl ? (
          <img
            src={series.remoteCoverUrl}
            alt={series.title}
            className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
            <BookOpen className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 bg-black/60 text-white border-none"
        >
          {series.provider || extensionList.find(e => e.id === series.extensionId)?.name || series.sourceId}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {series.title}
            </h3>
            {hasValidContent(series.altTitles) && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                {series.altTitles![0]}
              </p>
            )}
          </div>
          {/* Quick Stats */}
          {series.rating && series.rating > 0 && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span>{series.rating.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Metadata Grid - Only show if we have any metadata */}
        {(series.status || series.originalLanguageKey || hasValidContent(series.authors) || hasValidContent(series.tags)) && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
            {series.status && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                <span className="capitalize">{series.status}</span>
              </div>
            )}
            {series.originalLanguageKey && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Languages className="w-4 h-4" />
                <span className="uppercase">{series.originalLanguageKey}</span>
              </div>
            )}
            {hasValidContent(series.authors) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="truncate">{series.authors!.join(', ')}</span>
              </div>
            )}
            {hasValidContent(series.tags) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="w-4 h-4" />
                <div className="flex gap-2 flex-wrap">
                  {series.tags!.slice(0, 3).map((tag, index) => (
                    <span key={index} className="bg-muted rounded-full px-2 py-0.5 text-xs">
                      {tag}
                    </span>
                  ))}
                  {series.tags!.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{series.tags!.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description - Only show if we have one */}
        {series.description && series.description.trim() !== '' && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {series.description}
          </p>
        )}

        {/* No metadata message */}
        {!series.status && !series.originalLanguageKey && !hasValidContent(series.authors) && 
         !hasValidContent(series.tags) && !series.description && (
          <p className="text-sm text-muted-foreground italic">
            Limited information available from this provider
          </p>
        )}
      </div>
    </div>
  );
};

// Add helper functions at the top level
const normalizeStatus = (status?: string): string => {
    if (!status) return '';
    const normalized = status.toLowerCase().trim();
    switch (normalized) {
        case 'ongoing':
        case 'publishing':
        case 'releasing':
            return 'ongoing';
        case 'completed':
        case 'finished':
            return 'completed';
        case 'hiatus':
        case 'pause':
        case 'paused':
            return 'hiatus';
        case 'cancelled':
        case 'canceled':
        case 'dropped':
            return 'cancelled';
        default:
            return normalized;
    }
};

const normalizeLanguage = (lang?: string): string => {
  if (!lang) return '';
  const normalized = lang.toLowerCase().trim();
  switch (normalized) {
    case 'en':
    case 'eng':
    case 'english':
      return 'en';
    case 'jp':
    case 'jpn':
    case 'japanese':
      return 'jp';
    case 'kr':
    case 'kor':
    case 'korean':
      return 'kr';
    case 'cn':
    case 'chi':
    case 'chinese':
      return 'cn';
    default:
      return normalized;
  }
};

const Search: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [extensionList, setExtensionList] = useState<ExtensionMetadata[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchText, setSearchText] = useRecoilState(searchTextState);
  const [filterValuesMap, setFilterValuesMap] = useRecoilState(filterValuesMapState);
  const [nextSourcePage, setNextSourcePage] = useRecoilState(nextSourcePageState);
  const [searchResult, setSearchResult] = useRecoilState<{ seriesList: SeriesWithProvider[]; hasMore: boolean }>(searchResultState);
  const searchExtension = useRecoilValue(searchExtensionState);
  const [enabledProviders, setEnabledProviders] = useRecoilState(enabledProvidersState);
  const [addModalSeries, setAddModalSeries] = useRecoilState(addModalSeriesState);
  const [addModalEditable, setAddModalEditable] = useRecoilState(addModalEditableState);
  const [showingAddModal, setShowingAddModal] = useRecoilState(showingAddModalState);
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('latest');
  const [filters, setFilters] = useState({
    status: 'all',
    language: 'all',
    minChapters: 0,
    maxChapters: 1000,
    yearFrom: 2000,
    yearTo: new Date().getFullYear(),
    rating: 0,
  });

  // Helper function to search a single provider with timeout and retries
  const searchProvider = async (extension: ExtensionMetadata | undefined, page: number, retryCount = 0) => {
    if (!extension) {
      return {
        success: false,
        error: new Error('Provider not found'),
      };
    }

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout for provider ${extension.name}`)), PROVIDER_TIMEOUT)
      );

      const searchPromise = searchText.length === 0
        ? ipcRenderer.invoke(
            ipcChannels.EXTENSION.DIRECTORY,
            extension.id,
            page,
            filterValuesMap[extension.id] || {},
          )
        : ipcRenderer.invoke(
            ipcChannels.EXTENSION.SEARCH,
            extension.id,
            searchText,
            page,
            filterValuesMap[extension.id] || {},
          );

      const result = await Promise.race([searchPromise, timeoutPromise]);
      
      // Validate the response
      if (!result || !result.seriesList) {
        throw new Error(`Invalid response from provider ${extension.name}`);
      }

      return {
        success: true,
        provider: extension,
        data: result as SeriesListResponse
      };
    } catch (error) {
      console.error(`Error searching provider ${extension.name}:`, error);
      
      // Retry on network errors if we haven't exceeded max retries
      if (retryCount < MAX_RETRIES && (
        error instanceof Error && (
          error.message.includes('fetch failed') ||
          error.message.includes('Timeout') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('other side closed')
        )
      )) {
        console.log(`Retrying provider ${extension.name} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return searchProvider(extension, page, retryCount + 1);
      }

      return {
        success: false,
        provider: extension,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  };

  // Search providers in batches
  const searchProviderBatch = async (providers: ExtensionMetadata[], page: number) => {
    const results = [];
    for (let i = 0; i < providers.length; i += BATCH_SIZE) {
      const batch = providers.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(provider => searchProvider(provider, page))
      );
      results.push(...batchResults);
    }
    return results;
  };

  // Add sorting function
  const sortSeries = (series: SeriesWithProvider[]): SeriesWithProvider[] => {
    return [...series].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'chapters':
          return (b.chapterCount || 0) - (a.chapterCount || 0);
        case 'latest':
        default:
          // Sort by last updated timestamp if available, otherwise keep original order
          return (b.lastUpdated || 0) - (a.lastUpdated || 0);
      }
    });
  };

  // Update the filterSeries function with debug logging
  const filterSeries = (series: SeriesWithProvider[], filters: Filters): SeriesWithProvider[] => {
    console.log('Filtering with:', filters);
    
    return series.filter(series => {
        // Status filter
        if (filters.status && filters.status !== 'all') {
            const normalizedStatus = normalizeStatus(series.status);
            const normalizedFilter = normalizeStatus(filters.status);
            console.log('Status check:', { 
                original: series.status, 
                normalized: normalizedStatus, 
                filter: normalizedFilter,
                matches: normalizedStatus === normalizedFilter 
            });
            if (normalizedStatus !== normalizedFilter) return false;
        }

        // Language filter
        if (filters.language && filters.language !== 'all') {
            const normalizedFilter = normalizeLanguage(filters.language);
            
            // Check original language
            const hasOriginalLanguage = normalizeLanguage(series.originalLanguageKey) === normalizedFilter;
            
            // Check available translations
            const hasTranslation = series.availableTranslations?.some(
                (lang: string) => normalizeLanguage(lang) === normalizedFilter
            );
            
            console.log('Language check:', { 
                series: series.title,
                original: series.originalLanguageKey,
                translations: series.availableTranslations,
                filter: normalizedFilter,
                hasOriginal: hasOriginalLanguage,
                hasTranslation: hasTranslation
            });

            if (!hasOriginalLanguage && !hasTranslation) return false;
        }

        // Chapter count filter
        if (filters.minChapters > 0 && series.chapterCount) {
            if (series.chapterCount < filters.minChapters) return false;
        }
        if (filters.maxChapters < Infinity && series.chapterCount) {
            if (series.chapterCount > filters.maxChapters) return false;
        }

        // Year filter
        if (filters.yearFrom > 0 && series.year) {
            if (series.year < filters.yearFrom) return false;
        }
        if (filters.yearTo < Infinity && series.year) {
            if (series.year > filters.yearTo) return false;
        }

        // Rating filter
        if (filters.rating > 0 && series.rating) {
            if (series.rating < filters.rating) return false;
        }

        return true;
    });
  };

  // Update the search result processing
  useEffect(() => {
    // Trigger a new search when filters change
    handleSearch(true);
  }, [sortBy, filters]);

  // Update handleSearch to apply sorting and filtering
  const handleSearch = async (fresh = false) => {
    if (!loading) {
      setLoading(true);
      setErrorMessage(null);

      const page = fresh ? 1 : nextSourcePage;
      const curSeriesList = fresh ? [] : searchResult.seriesList;

      if (fresh) setSearchResult({ seriesList: [], hasMore: false });

      try {
        if (searchExtension === 'all') {
          // Get enabled providers except filesystem
          const providers = extensionList.filter(ext => 
            ext.id !== FS_METADATA.id && enabledProviders.includes(ext.id)
          );
          
          if (providers.length === 0) {
            setErrorMessage('No enabled providers available. Please enable providers in settings.');
            return;
          }

          // Search providers in batches
          const results = await searchProviderBatch(providers, page);

          // Process successful results
          const successfulResults = results.filter(r => r.success && r.provider);
          const combinedSeriesList = successfulResults.flatMap(result => {
            if (!result.provider || !result.data) return [];
            return (result.data as SeriesListResponse).seriesList.map(series => ({
              ...series,
              provider: result.provider.name
            } as SeriesWithProvider));
          });

          if (combinedSeriesList.length > 0 || page === 1) {
            const filtered = filterSeries(combinedSeriesList, filters);
            const sorted = sortSeries(filtered);
            
            setSearchResult({
              seriesList: curSeriesList.concat(sorted),
              hasMore: successfulResults.some(r => r.data && (r.data as SeriesListResponse).hasMore),
            });
            setNextSourcePage(page + 1);
          }

          // Handle failed providers
          const failedProviders = results.filter(r => !r.success && r.provider);
          if (failedProviders.length > 0) {
            const failedNames = failedProviders.map(r => r.provider?.name || 'Unknown').join(', ');
            console.warn('Failed to fetch from providers:', failedNames);
            
            if (successfulResults.length === 0) {
              setErrorMessage(`No results found. Failed to fetch from: ${failedNames}`);
            }
          }
        } else {
          // Single provider search
          const provider = extensionList.find(e => e.id === searchExtension);
          if (!provider) {
            setErrorMessage(`Provider "${searchExtension}" not found. Please select a valid provider.`);
            return;
          }

          const result = await searchProvider(provider, page);

          if (result.success && result.data) {
            const resp = result.data as SeriesListResponse;
            const filtered = filterSeries(resp.seriesList, filters);
            const sorted = sortSeries(filtered);
            
            setSearchResult({
              seriesList: curSeriesList.concat(sorted),
              hasMore: resp.hasMore,
            });
            setNextSourcePage(page + 1);
          } else {
            setErrorMessage(`Failed to search provider ${provider.name}: ${result.error?.message || 'Unknown error'}`);
          }
        }
      } catch (e) {
        console.error('Search error:', e);
        setErrorMessage('An unexpected error occurred while searching');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearchFilesystem = async (searchPaths: string[]) => {
    const seriesList: Series[] = [];

    for (const searchPath of searchPaths) {
      const series = await ipcRenderer.invoke(
        ipcChannels.EXTENSION.GET_SERIES,
        FS_METADATA.id,
        searchPath,
      );
      if (series !== null) seriesList.push(series);
    }

    if (seriesList.length > 1) {
      setSearchResult({ seriesList: seriesList, hasMore: false });
    } else if (seriesList.length == 1) {
      setAddModalSeries(seriesList[0]);
      setAddModalEditable(searchExtension === FS_METADATA.id);
      setShowingAddModal(!showingAddModal);
    }
  };

  useEffect(() => {
    ipcRenderer
      .invoke(ipcChannels.EXTENSION_MANAGER.GET_ALL)
      .then((list: ExtensionMetadata[]) => {
        setExtensionList(list);
        
        // Initialize enabled providers if empty
        if (enabledProviders.length === 0) {
          const defaultProviders = list.filter(ext => 
            ext.name.toLowerCase().includes('mangadex') ||
            ext.name.toLowerCase().includes('guya') ||
            ext.name.toLowerCase().includes('comick')
          );
          
          if (defaultProviders.length > 0) {
            setEnabledProviders(defaultProviders.map(p => p.id));
            // Return early to prevent immediate search
            return Promise.resolve();
          }
        }

        // Only fetch filter options if not in "all" mode
        if (searchExtension !== 'all') {
          return ipcRenderer
            .invoke(ipcChannels.EXTENSION.GET_FILTER_OPTIONS, searchExtension)
            .then((opts: FilterOption[]) => {
              setFilterValuesMap({
                ...filterValuesMap,
                [searchExtension]: {
                  ...Object.fromEntries(opts.map((opt) => [opt.id, opt.defaultValue])),
                  ...filterValuesMap[searchExtension],
                },
              });
              setFilterOptions(opts);
            });
        } else {
          // Clear filter options when in "all" mode
          setFilterOptions([]);
          return Promise.resolve();
        }
      })
      .then(() => handleSearch(true))
      .catch((err: Error) => console.error(err));
  }, [searchExtension]);

  // Add a new useEffect to handle search after enabledProviders is updated
  useEffect(() => {
    if (extensionList.length > 0 && enabledProviders.length > 0 && searchExtension === 'all') {
      handleSearch(true);
    }
  }, [enabledProviders, extensionList]);

  if (extensionList.length === 0) return <></>;

  return (
    <>
      <ExplorerModal
        showing={showingAddModal}
        setShowing={(showing) => {
          setShowingAddModal(showing);
          setAddModalEditable(false);
        }}
        series={addModalSeries}
        editable={addModalEditable}
      />
      
      {/* Hero Section */}
      <div className="relative -mt-4 px-8 py-16 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden rounded-b-3xl border-b">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
            Explore Comics Universe
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Discover manga, manhwa, manhua, and comics from various sources
          </p>
          <div className="max-w-2xl mx-auto">
            <form
              className="flex space-x-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(true);
                return false;
              }}
            >
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
                <Input
                  className="pl-10 w-full h-14 text-lg bg-background border-border focus:border-primary/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] hover:bg-accent transition-all rounded-lg"
                  placeholder="Search for your next favorite series..."
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                size="lg"
                className="h-14 px-8 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-lg"
              >
                Search
              </Button>
            </form>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Sticky Controls */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="px-4">
          <SearchControlBar
            extensionList={extensionList}
            hasFilterOptions={searchExtension !== 'all' && filterOptions && filterOptions.length > 0}
            handleSearch={handleSearch}
            handleSearchFilesystem={handleSearchFilesystem}
          />
        </div>
      </div>

      {searchExtension !== 'all' && (
        <SearchFilterDrawer
          filterOptions={filterOptions}
          onClose={(wasChanged) => {
            if (wasChanged) handleSearch(true);
          }}
        />
      )}
      
      <div className="px-4 py-4">
        {errorMessage && (
          <div className="text-red-500 p-4 text-center">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-between mb-6 px-8">
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid2X2 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest Update</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="chapters">Chapter Count</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px]">
              <SheetHeader>
                <SheetTitle>Advanced Filters</SheetTitle>
                <SheetDescription>
                  Refine your search with advanced filters
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 py-4">
                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="hiatus">Hiatus</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <Select 
                    value={filters.language} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="jp">Japanese</SelectItem>
                      <SelectItem value="kr">Korean</SelectItem>
                      <SelectItem value="cn">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Chapter Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chapter Range</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={filters.minChapters}
                      onChange={(e) => setFilters(prev => ({ ...prev, minChapters: parseInt(e.target.value) }))}
                      className="w-20 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={filters.maxChapters}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxChapters: parseInt(e.target.value) }))}
                      className="w-20 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    />
                  </div>
                </div>

                {/* Year Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year Range</label>
                  <div className="flex items-center gap-4">
                    <Select 
                      value={filters.yearFrom.toString()} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, yearFrom: parseInt(value) }))}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="From year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => (
                          <SelectItem key={2000 + i} value={(2000 + i).toString()}>
                            {2000 + i}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>to</span>
                    <Select 
                      value={filters.yearTo.toString()} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, yearTo: parseInt(value) }))}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="To year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => (
                          <SelectItem key={2000 + i} value={(2000 + i).toString()}>
                            {2000 + i}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Minimum Rating</label>
                  <Slider
                    value={[filters.rating]}
                    onValueChange={([value]) => setFilters(prev => ({ ...prev, rating: value }))}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-4 h-4" />
                    <span>{filters.rating} / 5</span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Add filter tags */}
        <div className="flex flex-wrap gap-2 mb-6 px-8">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-2">
              <Activity className="w-3 h-3" />
              {filters.status}
              <button 
                className="ml-1 hover:text-destructive"
                onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
              >
                ×
              </button>
            </Badge>
          )}
          {filters.language !== 'all' && (
            <Badge variant="secondary" className="gap-2">
              <Languages className="w-3 h-3" />
              {filters.language.toUpperCase()}
              <button 
                className="ml-1 hover:text-destructive"
                onClick={() => setFilters(prev => ({ ...prev, language: 'all' }))}
              >
                ×
              </button>
            </Badge>
          )}
          {(filters.minChapters > 0 || filters.maxChapters < 1000) && (
            <Badge variant="secondary" className="gap-2">
              <BookOpen className="w-3 h-3" />
              {filters.minChapters}-{filters.maxChapters} chapters
              <button 
                className="ml-1 hover:text-destructive"
                onClick={() => setFilters(prev => ({ ...prev, minChapters: 0, maxChapters: 1000 }))}
              >
                ×
              </button>
            </Badge>
          )}
          {(filters.yearFrom > 2000 || filters.yearTo < new Date().getFullYear()) && (
            <Badge variant="secondary" className="gap-2">
              <Calendar className="w-3 h-3" />
              {filters.yearFrom}-{filters.yearTo}
              <button 
                className="ml-1 hover:text-destructive"
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  yearFrom: 2000, 
                  yearTo: new Date().getFullYear() 
                }))}
              >
                ×
              </button>
            </Badge>
          )}
          {filters.rating > 0 && (
            <Badge variant="secondary" className="gap-2">
              <Star className="w-3 h-3" />
              {filters.rating}+ stars
              <button 
                className="ml-1 hover:text-destructive"
                onClick={() => setFilters(prev => ({ ...prev, rating: 0 }))}
              >
                ×
              </button>
            </Badge>
          )}
        </div>

        {/* Update the grid/list view based on viewMode */}
        <div className={cn(
          'px-8 grid gap-6',
          viewMode === 'grid' 
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
            : 'grid-cols-1'
        )}>
          {searchResult.seriesList.map((series) => {
            const handleClick = () => {
              setAddModalSeries(series);
              setAddModalEditable(searchExtension === FS_METADATA.id);
              setShowingAddModal(true);
            };

            return viewMode === 'grid' ? (
              <div 
                key={`${series.id}-${series.sourceId}`}
                className="group relative cursor-pointer"
                onClick={handleClick}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted/30">
                  <img
                    src={series.remoteCoverUrl}
                    alt={series.title}
                    className={cn(
                      'h-full w-full transition-all duration-300',
                      'hover:scale-105 hover:brightness-110',
                      'object-cover'
                    )}
                    loading="lazy"
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 bg-black/60 text-white border-none"
                  >
                    {series.provider || extensionList.find(e => e.id === series.extensionId)?.name || series.sourceId}
                  </Badge>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="mt-3 space-y-1">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {series.title}
                  </h3>
                  {series.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {series.description}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <ListCard
                key={`${series.id}-${series.sourceId}`}
                series={series}
                onClick={handleClick}
                extensionList={extensionList}
              />
            );
          })}
          {loading && (
            Array.from({ length: viewMode === 'grid' ? 12 : 6 }).map((_, i) => (
              <div key={`skeleton-${i}`} className={cn(
                "space-y-3",
                viewMode === 'list' && "flex gap-6 p-4 bg-muted/30 rounded-lg"
              )}>
                <div className={cn(
                  "bg-muted animate-pulse rounded-lg",
                  viewMode === 'grid' ? "aspect-[2/3] w-full" : "w-[120px] h-[180px]"
                )} />
                {viewMode === 'list' ? (
                  <div className="flex-1 space-y-4">
                    <div className="h-6 w-2/3 bg-muted animate-pulse rounded" />
                    <div className="grid grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-4 w-24 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                      <div className="h-4 w-4/5 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="h-4 w-[80%] bg-muted animate-pulse rounded" />
                    <div className="h-3 w-[60%] bg-muted animate-pulse rounded" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Search;
