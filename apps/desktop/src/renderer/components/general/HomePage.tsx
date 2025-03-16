import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const { ipcRenderer } = require('electron');
import ipcChannels from '@/common/constants/ipcChannels.json';
import { useRecoilValue, useRecoilState } from 'recoil';
import { seriesListState, importQueueState } from '@/renderer/state/libraryStates';
import { Series, ExtensionMetadata } from '@tiyo/common';
import { 
    BookOpen, 
    TrendingUp,
    Flame,
    ThumbsUp,
    History,
    Search,
    Clock
} from 'lucide-react';
import { readingStatsService } from '@/renderer/services/readingStats';
import library from '@/renderer/services/library';
import { Chapter } from '@tiyo/common';
import React from 'react';

// Simple welcome messages
const quotes = [
    "Discover your next favorite series",
    "Find something new to read",
    "Explore endless stories",
    "Your reading journey starts here",
    "Browse through our collection",
    "Dive into new adventures",
    "Uncover hidden gems",
    "Join the reading community",
    "Start your collection today",
    "Find your perfect match"
];

interface SeriesWithRating extends Series {
    // rating removed as it's not real data
}

// Update interface
interface ContinueReadingSeries extends SeriesWithRating {
    lastReadChapter: string;
    progress: number;
    lastReadAt: number;
}

const FeaturedCard: React.FC<{ 
    series: SeriesWithRating;
    onNavigate: (id: string, series: SeriesWithRating) => void;
}> = ({ series, onNavigate }) => {
    const handleClick = () => {
        console.log('Featured Card Click - Series:', series);
        if (series?.sourceId && series?.extensionId) {
            const seriesPath = `${series.extensionId}/${series.sourceId}`;
            console.log('Navigating to:', seriesPath);
            onNavigate(seriesPath, series);
        }
    };

    return (
        <div 
            className="group relative cursor-pointer h-full min-h-[300px] rounded-xl overflow-hidden"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleClick();
                }
            }}
        >
            {series.remoteCoverUrl ? (
                <img 
                    src={series.remoteCoverUrl} 
                    alt={series.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            ) : (
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium text-orange-400">Featured Series</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2">
                    {series.title}
                </h2>
            </div>
        </div>
    );
};

const SeriesCard: React.FC<{ 
    series: SeriesWithRating;
    onNavigate: (id: string, series: SeriesWithRating) => void;
}> = ({ series, onNavigate }) => {
    const handleClick = () => {
        console.log('Series Card Click - Series:', series);
        if (series?.sourceId && series?.extensionId) {
            const seriesPath = `${series.extensionId}/${series.sourceId}`;
            console.log('Navigating to:', seriesPath);
            onNavigate(seriesPath, series);
        }
    };

    return (
        <div 
            className="group relative flex flex-col cursor-pointer"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleClick();
                }
            }}
        >
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                {series.remoteCoverUrl ? (
                    <img 
                        src={series.remoteCoverUrl} 
                        alt={series.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm font-medium text-white line-clamp-2">
                        {series.title}
                    </h3>
                </div>
            </div>
        </div>
    );
};

const SeriesSection: React.FC<{
    title: string;
    description: string;
    series: SeriesWithRating[];
    onNavigate: (id: string, series: SeriesWithRating) => void;
    icon?: React.ReactNode;
}> = ({ title, description, series, onNavigate, icon }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="w-full">
            <button 
                onClick={() => setIsCollapsed(prev => !prev)}
                className="w-full text-left group"
            >
                <div className="flex items-start gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        {icon && <div className="text-primary mt-1">{icon}</div>}
                        <div>
                            <h2 className="text-2xl font-bold flex items-center mb-2 group-hover:text-primary transition-colors">
                                {title}
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className={`w-6 h-6 ml-2 transition-transform duration-200 text-muted-foreground ${isCollapsed ? '-rotate-90' : ''}`}
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth="2" 
                                        d="m6 9 6 6 6-6"
                                    />
                                </svg>
                            </h2>
                            <p className="text-base text-muted-foreground">{description}</p>
                        </div>
                    </div>
                </div>
            </button>
            <div 
                className={`grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 transition-all duration-300 origin-top ${
                    isCollapsed 
                        ? 'h-0 opacity-0 scale-95 pointer-events-none' 
                        : 'h-auto opacity-100 scale-100'
                }`}
            >
                {series.map((series, index) => (
                    <div key={index} className="transition-transform duration-200 hover:scale-[1.02]">
                        <SeriesCard series={series} onNavigate={onNavigate} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Add new components
const SearchBar: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
    const [value, setValue] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(value);
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [value, onSearch]);

    return (
        <div className="relative w-full max-w-2xl mx-auto">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                    type="text"
                    value={value}
                    placeholder="Search for series..."
                    className="w-full h-12 pl-12 pr-12 rounded-full bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                    onChange={(e) => setValue(e.target.value)}
                />
                {value && (
                    <button
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            setValue('');
                            onSearch('');
                        }}
                        aria-label="Clear search"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

const CategoryFilters: React.FC<{ onSelect: (category: string) => void; selected: string }> = ({ onSelect, selected }) => {
    // Get unique tags from all series
    const seriesList = useRecoilValue(seriesListState);
    const allTags = React.useMemo(() => {
        const tags = new Set<string>();
        seriesList.forEach(series => {
            series.tags?.forEach(tag => tags.add(tag.toLowerCase()));
        });
        return Array.from(tags).sort();
    }, [seriesList]);

    // Function to get tag size class based on frequency
    const getTagStyle = (tag: string) => {
        const count = seriesList.filter(series => 
            series.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
        ).length;
        
        // Base styles
        const baseStyle = "inline-flex items-center justify-center m-1 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer hover:scale-105";
        
        // Selected state
        if (selected.toLowerCase() === tag.toLowerCase()) {
            return `${baseStyle} bg-primary text-primary-foreground shadow-lg`;
        }
        
        // Size variations based on frequency
        if (count >= 10) {
            return `${baseStyle} bg-muted/80 text-foreground text-base font-medium`;
        } else if (count >= 5) {
            return `${baseStyle} bg-muted/60 text-foreground/90 text-sm`;
        } else {
            return `${baseStyle} bg-muted/40 text-foreground/80 text-xs`;
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-2 p-4">
                <button
                    onClick={() => onSelect('All')}
                    className={`${getTagStyle('all')} ${selected === 'All' ? 'bg-primary text-primary-foreground' : 'bg-muted/90 text-foreground'} font-semibold text-base`}
                >
                    All
                </button>
                {allTags.map((tag) => (
                    <button
                        key={tag}
                        onClick={() => onSelect(tag)}
                        className={getTagStyle(tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
};

const ContinueReadingCard: React.FC<{ 
    series: ContinueReadingSeries;
    onNavigate: (id: string, series: ContinueReadingSeries) => void;
}> = ({ series, onNavigate }) => {
    return (
        <div 
            className="group relative flex flex-col cursor-pointer bg-muted/50 rounded-lg overflow-hidden"
            onClick={() => series?.sourceId && series?.extensionId && onNavigate(`${series.extensionId}/${series.sourceId}`, series)}
            role="button"
            tabIndex={0}
        >
            <div className="flex p-4 gap-4">
                <div className="relative w-20 h-28 overflow-hidden rounded-md">
                    {series.remoteCoverUrl ? (
                        <img 
                            src={series.remoteCoverUrl} 
                            alt={series.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col flex-1">
                    <h3 className="font-medium mb-2 line-clamp-2">{series.title}</h3>
                    <div className="text-sm text-muted-foreground mb-2">
                        {series.lastReadChapter || 'Chapter 1'}
                    </div>
                    <div className="mt-auto">
                        <div className="w-full bg-muted rounded-full h-1.5">
                            <div 
                                className="bg-primary h-full rounded-full transition-all"
                                style={{ width: `${series.progress || 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const seriesList = useRecoilValue(seriesListState);
    const [, setImportQueue] = useRecoilState(importQueueState);
    const [popularSeries, setPopularSeries] = useState<SeriesWithRating[]>([]);
    const [recommendedSeries, setRecommendedSeries] = useState<SeriesWithRating[]>([]);
    const [trendingSeries, setTrendingSeries] = useState<SeriesWithRating[]>([]);
    const [continueReading, setContinueReading] = useState<ContinueReadingSeries[]>([]);
    const [recentlyAdded, setRecentlyAdded] = useState<SeriesWithRating[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [isQuoteVisible, setIsQuoteVisible] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [filteredSeries, setFilteredSeries] = useState<SeriesWithRating[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Filter series based on search and category
    useEffect(() => {
        const allSeries = [...popularSeries, ...recommendedSeries, ...trendingSeries];
        let filtered = allSeries;

        setIsSearching(true);

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(series => 
                series.title.toLowerCase().includes(query) ||
                series.description?.toLowerCase().includes(query) ||
                series.authors?.some(author => author.toLowerCase().includes(query)) ||
                series.artists?.some(artist => artist.toLowerCase().includes(query)) ||
                series.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Apply category filter
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(series => 
                series.tags?.some(tag => tag.toLowerCase() === selectedCategory.toLowerCase())
            );
        }

        setFilteredSeries(filtered);
        setIsSearching(false);
    }, [searchQuery, selectedCategory, popularSeries, recommendedSeries, trendingSeries]);

    // Cycle through quotes
    useEffect(() => {
        const quoteTimer = setInterval(() => {
            setIsQuoteVisible(false);
            setTimeout(() => {
                setCurrentQuoteIndex(prev => (prev + 1) % quotes.length);
                setIsQuoteVisible(true);
            }, 200); // Wait for fade out before changing quote
        }, 2000); // Change quote every 2 seconds

        return () => clearInterval(quoteTimer);
    }, []);

    useEffect(() => {
        // Get list of extensions
        ipcRenderer
            .invoke(ipcChannels.EXTENSION_MANAGER.GET_ALL)
            .then((list: ExtensionMetadata[]) => {
                const filteredList = list.filter(ext => ext.id !== 'filesystem');

                // Initialize enabled providers if empty
                const defaultProviders = filteredList.filter(ext => 
                    ext.name.toLowerCase().includes('mangadex') ||
                    ext.name.toLowerCase().includes('guya') ||
                    ext.name.toLowerCase().includes('comick')
                );
                
                return defaultProviders;
            })
            .then(async (providers) => {
                setLoading(true);
                try {
                    if (providers.length === 0) {
                        throw new Error('No enabled providers available');
                    }

                    // Get popular series from each extension
                    const popularResults = await Promise.all(
                        providers.map(ext => 
                            ipcRenderer.invoke(
                                ipcChannels.EXTENSION.DIRECTORY,
                                ext.id,
                                1,
                                {}
                            )
                        )
                    );

                    // Combine and process results
                    const allSeries = popularResults.flatMap((result: { seriesList: Series[] }) => 
                        result.seriesList.map((series: Series) => ({
                            ...series
                        }))
                    );

                    // Split into different sections - showing more items per section
                    const shuffled = allSeries.sort(() => Math.random() - 0.5);
                    setPopularSeries(shuffled.slice(0, 20));
                    setRecommendedSeries(shuffled.slice(20, 40));
                    setTrendingSeries(shuffled.slice(40, 60));
                } catch (error) {
                    console.error('Error fetching series:', error);
                    // Fallback to library series if extension fetching fails
                    const mockPopular = seriesList
                        .filter(series => series.id)
                        .slice(0, 20)
                        .map(series => ({
                            ...series
                        }));
                    setPopularSeries(mockPopular);

                    const mockRecommended = seriesList
                        .filter(series => series.id)
                        .slice(20, 40)
                        .map(series => ({
                            ...series
                        }));
                    setRecommendedSeries(mockRecommended);

                    const mockTrending = seriesList
                        .filter(series => series.id)
                        .slice(40, 60)
                        .map(series => ({
                            ...series
                        }));
                    setTrendingSeries(mockTrending);
                } finally {
                    setLoading(false);
                }
            });
    }, [seriesList]);

    // Add new useEffect for continue reading
    useEffect(() => {
        // Get series with in-progress chapters
        const seriesWithProgress = seriesList.map(series => {
            // Get all chapters for this series
            const chapters = library.fetchChapters(series.id || '');
            if (!chapters || chapters.length === 0) return null;

            // Sort chapters by number
            const sortedChapters = chapters
                .slice()
                .sort((a: Chapter, b: Chapter) => parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber));
            
            // Find the last read chapter
            const lastReadChapter = sortedChapters
                .filter((chapter: Chapter) => chapter.read)
                .sort((a: Chapter, b: Chapter) => parseFloat(b.chapterNumber) - parseFloat(a.chapterNumber))[0];

            // If no chapters are read, or all chapters are read, skip this series
            if (!lastReadChapter || sortedChapters.every((c: Chapter) => c.read)) return null;

            // Calculate progress
            const totalChapters = sortedChapters.length;
            const readChapters = sortedChapters.filter((c: Chapter) => c.read).length;
            const progress = Math.round((readChapters / totalChapters) * 100);

            // Get reading stats for this series
            const stats = readingStatsService.getStats();
            const lastReadDate = stats.lastReadDate;

            const result: ContinueReadingSeries = {
                ...series,
                lastReadChapter: `Chapter ${lastReadChapter.chapterNumber}`,
                progress,
                lastReadAt: lastReadDate ? new Date(lastReadDate).getTime() : 0
            };

            return result;
        })
        .filter((s): s is ContinueReadingSeries => s !== null)
        .sort((a, b) => b.lastReadAt - a.lastReadAt)
        .slice(0, 5);

        setContinueReading(seriesWithProgress);
    }, [seriesList]);

    // Set recently added series
    useEffect(() => {
        const randomSeries = [...seriesList].sort(() => Math.random() - 0.5);
        setRecentlyAdded(randomSeries.slice(0, 8));
    }, [seriesList]);

    const handleSeriesClick = (path: string, series: SeriesWithRating) => {
        console.log('Handling series click:', path);
        if (!path) {
            console.error('No series path provided');
            return;
        }
        try {
            // Generate a unique ID using extensionId and sourceId
            const uniqueId = `${series.extensionId}-${series.sourceId}`;
            
            // Create a temporary preview series
            const tempPreviewSeries = {
                ...series,
                id: uniqueId, // Use the generated unique ID
                sourceId: series.sourceId,
                extensionId: series.extensionId,
                title: series.title,
                remoteCoverUrl: series.remoteCoverUrl,
                description: series.description || '',
                status: series.status || 'Unknown',
                originalLanguageKey: series.originalLanguageKey || 'UNKNOWN',
                authors: series.authors || [],
                artists: series.artists || [],
                tags: series.tags || [],
                altTitles: series.altTitles || [],
                preview: true
            };

            // Add to import queue for preview and navigate
            setImportQueue(prev => [...prev, { series: tempPreviewSeries, getFirst: false }]);
            navigate(`/series/${encodeURIComponent(uniqueId)}`);
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
    };

    return (
        <div className="flex flex-col w-full max-w-[1800px] mx-auto px-4 py-6 pb-12 space-y-12">
            {/* Welcome Banner */}
            <div className="w-full max-w-3xl mx-auto text-center space-y-6 py-8">
                <h1 className="text-3xl font-semibold">
                    Welcome to Comicers
                </h1>
                <p 
                    className={`text-muted-foreground transition-opacity duration-200 ease-in-out ${
                        isQuoteVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    {quotes[currentQuoteIndex]}
                </p>
            </div>

            {/* Search and Filters */}
            <div className="space-y-6 max-w-[1200px] mx-auto w-full">
                <SearchBar onSearch={handleSearch} />
                <div className="w-full px-4">
                    <CategoryFilters onSelect={handleCategorySelect} selected={selectedCategory} />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="space-y-16">
                    {/* Search Results */}
                    {(searchQuery || selectedCategory !== 'All') && (
                        <>
                            {isSearching ? (
                                <div className="flex justify-center items-center h-[200px]">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : filteredSeries.length > 0 ? (
                                <SeriesSection
                                    title="Search Results"
                                    description={`Found ${filteredSeries.length} series matching your criteria`}
                                    series={filteredSeries}
                                    onNavigate={handleSeriesClick}
                                    icon={<Search className="w-5 h-5" />}
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
                                    <p className="text-muted-foreground">
                                        Try adjusting your search or filters to find what you're looking for
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Only show other sections if not searching */}
                    {!searchQuery && selectedCategory === 'All' && (
                        <>
                            {/* Continue Reading Section */}
                            {continueReading.length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <History className="w-5 h-5 text-primary mt-1" />
                                        <div>
                                            <h2 className="text-2xl font-bold mb-2">Continue Reading</h2>
                                            <p className="text-base text-muted-foreground">Pick up where you left off</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {continueReading.map((series, index) => (
                                            <ContinueReadingCard 
                                                key={series.id || index} 
                                                series={series} 
                                                onNavigate={handleSeriesClick}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recently Added Section */}
                            <SeriesSection
                                title="Recently Added"
                                description="Latest additions to the library"
                                series={recentlyAdded}
                                onNavigate={handleSeriesClick}
                                icon={<Clock className="w-5 h-5" />}
                            />

                            {/* Featured Series */}
                            {popularSeries.length > 0 && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[300px]">
                                    <div className="h-full">
                                        <FeaturedCard 
                                            series={popularSeries[0]} 
                                            onNavigate={handleSeriesClick}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                                        {popularSeries.slice(1, 7).map((series, index) => (
                                            <SeriesCard 
                                                key={series.id || index} 
                                                series={series} 
                                                onNavigate={handleSeriesClick}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <SeriesSection
                                title="Popular Series"
                                description="Top rated series from all sources"
                                series={popularSeries.slice(5)}
                                onNavigate={handleSeriesClick}
                                icon={<Flame className="w-5 h-5" />}
                            />

                            <SeriesSection
                                title="Recommended For You"
                                description="Based on your reading history"
                                series={recommendedSeries}
                                onNavigate={handleSeriesClick}
                                icon={<ThumbsUp className="w-5 h-5" />}
                            />

                            <SeriesSection
                                title="Trending Now"
                                description="What's hot right now"
                                series={trendingSeries}
                                onNavigate={handleSeriesClick}
                                icon={<TrendingUp className="w-5 h-5" />}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}