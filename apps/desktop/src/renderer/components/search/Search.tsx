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
import SearchGrid from './SearchGrid';
import SearchControlBar from './SearchControlBar';
import SearchFilterDrawer from './SearchFilterDrawer';
import { Button } from '@comicers/ui/components/Button';
import { Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@comicers/ui/components/Sheet';
import { Checkbox } from '@comicers/ui/components/Checkbox';
import { Label } from '@comicers/ui/components/Label';

const BATCH_SIZE = 3; // Number of concurrent provider searches
const PROVIDER_TIMEOUT = 15000; // 15 seconds timeout per provider
const MAX_RETRIES = 2; // Maximum number of retries for failed requests

const Search: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [extensionList, setExtensionList] = useState<ExtensionMetadata[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const searchText = useRecoilValue(searchTextState);
  const [filterValuesMap, setFilterValuesMap] = useRecoilState(filterValuesMapState);
  const [nextSourcePage, setNextSourcePage] = useRecoilState(nextSourcePageState);
  const [searchResult, setSearchResult] = useRecoilState(searchResultState);
  const searchExtension = useRecoilValue(searchExtensionState);
  const [enabledProviders, setEnabledProviders] = useRecoilState(enabledProvidersState);
  const [addModalSeries, setAddModalSeries] = useRecoilState(addModalSeriesState);
  const [addModalEditable, setAddModalEditable] = useRecoilState(addModalEditableState);
  const [showingAddModal, setShowingAddModal] = useRecoilState(showingAddModalState);
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);

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

  const handleSearch = async (fresh = false) => {
    if (!loading) {
      setLoading(true);
      setErrorMessage(null); // Clear any previous errors

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
            }));
          });

          if (combinedSeriesList.length > 0 || page === 1) {
            setSearchResult({
              seriesList: curSeriesList.concat(combinedSeriesList),
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
            setSearchResult({
              seriesList: curSeriesList.concat(resp.seriesList),
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

  const toggleProvider = (providerId: string) => {
    setEnabledProviders(current => 
      current.includes(providerId)
        ? current.filter(id => id !== providerId)
        : [...current, providerId]
    );
  };

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
      
      {/* Provider Settings Sheet */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-4 z-50 flex items-center justify-center"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Provider Settings</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select which providers to include in "All Providers" search:
            </p>
            <div className="space-y-4">
              {extensionList
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

      {searchExtension !== 'all' && (
        <SearchFilterDrawer
          filterOptions={filterOptions}
          onClose={(wasChanged) => {
            if (wasChanged) handleSearch(true);
          }}
        />
      )}
      
      <SearchControlBar
        extensionList={extensionList}
        hasFilterOptions={searchExtension !== 'all' && filterOptions && filterOptions.length > 0}
        handleSearch={handleSearch}
        handleSearchFilesystem={handleSearchFilesystem}
      />
      
      {errorMessage && (
        <div className="text-red-500 p-4 text-center">
          {errorMessage}
        </div>
      )}

      <SearchGrid loading={loading} handleSearch={handleSearch} />
    </>
  );
};

export default Search;
