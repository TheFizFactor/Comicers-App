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
    Clock,
    Heart
} from 'lucide-react';
import { readingStatsService } from '@/renderer/services/readingStats';
import library from '@/renderer/services/library';
import { Chapter } from '@tiyo/common';
import React from 'react';
import { userPreferencesService } from '@/renderer/services/userPreferences';
import { ReadingHistory } from '@/renderer/components/library/ReadingHistory';
import { Favorites } from '@/renderer/components/library/Favorites';

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
    const [isFavorite, setIsFavorite] = React.useState(false);

    React.useEffect(() => {
        if (series.id) {
            setIsFavorite(userPreferencesService.isFavorite(series.id));
        }
    }, [series.id]);

    const handleClick = () => {
        console.log('Featured Card Click - Series:', series);
        if (series?.sourceId && series?.extensionId) {
            const seriesPath = `${series.extensionId}/${series.sourceId}`;
            console.log('Navigating to:', seriesPath);
            onNavigate(seriesPath, series);
        }
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (series.id) {
            if (isFavorite) {
                userPreferencesService.removeFromFavorites(series.id);
            } else {
                userPreferencesService.addToFavorites(series.id);
            }
            setIsFavorite(!isFavorite);
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
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-medium text-orange-400">Featured Series</span>
                    </div>
                    <button
                        onClick={handleFavoriteClick}
                        className="p-1.5 bg-background/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-md"
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'text-destructive fill-current' : 'text-muted-foreground'}`} />
                    </button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    {series.status && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            {series.status}
                        </span>
                    )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2">
                    {series.title}
                </h2>
                {series.authors && series.authors.length > 0 && (
                    <p className="text-sm text-white/80 mb-2">
                        by {series.authors[0]}
                    </p>
                )}
                {series.description && (
                    <p className="text-sm text-white/70 line-clamp-2">
                        {series.description}
                    </p>
                )}
            </div>
        </div>
    );
};

const SeriesCard: React.FC<{ 
    series: SeriesWithRating;
    onNavigate: (id: string, series: SeriesWithRating) => void;
}> = ({ series, onNavigate }) => {
    const [isFavorite, setIsFavorite] = React.useState(false);

    React.useEffect(() => {
        if (series.id) {
            setIsFavorite(userPreferencesService.isFavorite(series.id));
        }
    }, [series.id]);

    const handleClick = () => {
        console.log('Series Card Click - Series:', series);
        if (series?.sourceId && series?.extensionId) {
            const seriesPath = `${series.extensionId}/${series.sourceId}`;
            console.log('Navigating to:', seriesPath);
            onNavigate(seriesPath, series);
        }
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (series.id) {
            if (isFavorite) {
                userPreferencesService.removeFromFavorites(series.id);
            } else {
                userPreferencesService.addToFavorites(series.id);
            }
            setIsFavorite(!isFavorite);
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-2 mb-1">
                        {series.status && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                                {series.status}
                            </span>
                        )}
                    </div>
                    <h3 className="text-sm font-medium text-white line-clamp-2 mb-1">
                        {series.title}
                    </h3>
                    {series.authors && series.authors.length > 0 && (
                        <p className="text-xs text-white/80 line-clamp-1">
                            by {series.authors[0]}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleFavoriteClick}
                    className="absolute top-2 right-2 p-1.5 bg-background/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-md"
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'text-destructive fill-current' : 'text-muted-foreground'}`} />
                </button>
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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(series.length / itemsPerPage);
    const displayedSeries = series.slice(0, currentPage * itemsPerPage);

    const loadMore = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    return (
        <div className="w-full">
            <div className="flex items-start justify-between gap-4 mb-6">
                <button 
                    onClick={() => setIsCollapsed(prev => !prev)}
                    className="flex items-center gap-4 text-left group"
                >
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
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {displayedSeries.length} of {series.length}
                    </span>
                    {currentPage < totalPages && (
                        <button
                            onClick={loadMore}
                            className="px-4 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                        >
                            Show More
                        </button>
                    )}
                </div>
            </div>
            <div 
                className={`grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 transition-all duration-300 origin-top ${
                    isCollapsed 
                        ? 'h-0 opacity-0 scale-95 pointer-events-none' 
                        : 'h-auto opacity-100 scale-100'
                }`}
            >
                {displayedSeries.map((series, index) => (
                    <div key={index} className="transition-transform duration-200 hover:scale-[1.02]">
                        <SeriesCard series={series} onNavigate={onNavigate} />
                    </div>
                ))}
            </div>
            {!isCollapsed && currentPage < totalPages && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={loadMore}
                        className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center gap-2"
                    >
                        Load More
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="w-4 h-4" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                    </button>
                </div>
            )}
            {!isCollapsed && displayedSeries.length > itemsPerPage && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                    currentPage === i + 1
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            )}
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

const ContinueReadingCard: React.FC<{ 
    series: ContinueReadingSeries;
    onNavigate: (id: string, series: ContinueReadingSeries) => void;
}> = ({ series, onNavigate }) => {
    const [isFavorite, setIsFavorite] = React.useState(false);

    React.useEffect(() => {
        if (series.id) {
            setIsFavorite(userPreferencesService.isFavorite(series.id));
        }
    }, [series.id]);

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (series.id) {
            if (isFavorite) {
                userPreferencesService.removeFromFavorites(series.id);
            } else {
                userPreferencesService.addToFavorites(series.id);
            }
            setIsFavorite(!isFavorite);
        }
    };

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
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium mb-2 line-clamp-2">{series.title}</h3>
                        <button
                            onClick={handleFavoriteClick}
                            className="p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background flex-shrink-0"
                            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'text-destructive fill-current' : 'text-muted-foreground'}`} />
                        </button>
                    </div>
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

// Add new components after the existing ones
const LoadingSkeleton: React.FC = () => {
    return (
        <div className="space-y-16 animate-pulse">
            {/* Featured Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[300px]">
                <div className="h-full bg-muted rounded-xl" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-[2/3] bg-muted rounded-lg" />
                    ))}
                </div>
            </div>

            {/* Section Skeletons */}
            {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-muted rounded-full" />
                        <div className="space-y-2">
                            <div className="w-48 h-6 bg-muted rounded" />
                            <div className="w-32 h-4 bg-muted rounded" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                        {[...Array(8)].map((_, j) => (
                            <div key={j} className="aspect-[2/3] bg-muted rounded-lg" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const QuickActions: React.FC = () => {
    const navigate = useNavigate();
    const actions = [
        { icon: <BookOpen className="w-5 h-5" />, label: 'Browse Library', path: '/library' },
        { icon: <Search className="w-5 h-5" />, label: 'Search Series', path: '/search' }
    ];

    return (
        <div className="grid grid-cols-2 gap-4">
            {actions.map((action, index) => (
                <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                >
                    <div className="text-primary mb-2 group-hover:scale-110 transition-transform">
                        {action.icon}
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                </button>
            ))}
        </div>
    );
};

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => {
    return (
        <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-4">{message}</p>
            <button
                onClick={onRetry}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
                Try Again
            </button>
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
    const [filteredSeries, setFilteredSeries] = useState<SeriesWithRating[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'home' | 'history' | 'favorites'>('home');

    // Filter series based on search
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
                series.artists?.some(artist => artist.toLowerCase().includes(query))
            );
        }

        setFilteredSeries(filtered);
        setIsSearching(false);
    }, [searchQuery, popularSeries, recommendedSeries, trendingSeries]);

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

    // Add debounced search suggestions
    useEffect(() => {
        if (searchQuery.length >= 2) {
            const suggestions = seriesList
                .filter(series => 
                    series.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    series.description?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(series => series.title)
                .slice(0, 5);
            setSearchSuggestions(suggestions);
        } else {
            setSearchSuggestions([]);
        }
    }, [searchQuery, seriesList]);

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

    return (
        <div className="flex flex-col w-full max-w-[1800px] mx-auto px-4 py-6 pb-12 space-y-12">
            {/* Welcome Banner */}
            <div className="w-full max-w-3xl mx-auto text-center space-y-6 py-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Welcome to Comicers
                </h1>
                <p 
                    className={`text-lg text-muted-foreground transition-opacity duration-200 ease-in-out ${
                        isQuoteVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    {quotes[currentQuoteIndex]}
                </p>
            </div>

            {/* Quick Actions */}
            <div className="w-full max-w-[1200px] mx-auto">
                <QuickActions />
            </div>

            {/* Search */}
            <div className="space-y-6 max-w-[1200px] mx-auto w-full">
                <div className="relative">
                    <SearchBar onSearch={handleSearch} />
                    {searchSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50">
                            {searchSuggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setSearchQuery(suggestion);
                                        setSearchSuggestions([]);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center space-x-4 border-b">
                <button
                    onClick={() => setActiveTab('home')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'home'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Home
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'history'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Reading History
                </button>
                <button
                    onClick={() => setActiveTab('favorites')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'favorites'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Favorites
                </button>
            </div>

            {error ? (
                <ErrorState message={error} onRetry={() => setError(null)} />
            ) : loading ? (
                <LoadingSkeleton />
            ) : (
                <div className="space-y-16">
                    {activeTab === 'home' && (
                        <>
                            {/* Search Results */}
                            {searchQuery && (
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
                                                Try adjusting your search to find what you're looking for
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Only show other sections if not searching */}
                            {!searchQuery && (
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

                                    {/* Featured Series */}
                                    {popularSeries.length > 0 && (
                                        <div className="space-y-6">
                                            <div className="flex items-start gap-4">
                                                <Flame className="w-5 h-5 text-primary mt-1" />
                                                <div>
                                                    <h2 className="text-2xl font-bold mb-2">Featured Series</h2>
                                                    <p className="text-base text-muted-foreground">Handpicked series for you</p>
                                                </div>
                                            </div>
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

                                    {/* Popular Series */}
                                    <SeriesSection
                                        title="Popular Series"
                                        description="Top rated series from all sources"
                                        series={popularSeries.slice(5)}
                                        onNavigate={handleSeriesClick}
                                        icon={<Flame className="w-5 h-5" />}
                                    />

                                    {/* Recommended For You */}
                                    <SeriesSection
                                        title="Recommended For You"
                                        description="Based on your reading history and preferences"
                                        series={recommendedSeries}
                                        onNavigate={handleSeriesClick}
                                        icon={<ThumbsUp className="w-5 h-5" />}
                                    />

                                    {/* Trending Now */}
                                    <SeriesSection
                                        title="Trending Now"
                                        description="What's hot right now across all sources"
                                        series={trendingSeries}
                                        onNavigate={handleSeriesClick}
                                        icon={<TrendingUp className="w-5 h-5" />}
                                    />
                                </>
                            )}
                        </>
                    )}

                    {activeTab === 'history' && (
                        <ReadingHistory onNavigate={handleSeriesClick} />
                    )}

                    {activeTab === 'favorites' && (
                        <Favorites onNavigate={handleSeriesClick} />
                    )}
                </div>
            )}
        </div>
    );
}