import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const { ipcRenderer } = require('electron');
import ipcChannels from '@/common/constants/ipcChannels.json';
import { useRecoilValue, useRecoilState } from 'recoil';
import { seriesListState, importQueueState } from '@/renderer/state/libraryStates';
import { Series } from '@tiyo/common';
import { 
    BookOpen, 
    TrendingUp,
    Flame,
    ThumbsUp
} from 'lucide-react';

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
    return (
        <div className="w-full">
            <div className="flex items-start gap-4 mb-6">
                {icon && <div className="text-primary mt-1">{icon}</div>}
                <div>
                    <h2 className="text-2xl font-bold flex items-center mb-2">{title}</h2>
                    <p className="text-base text-muted-foreground">{description}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                {series.map((series, index) => (
                    <div key={index} className="transition-transform duration-200 hover:scale-[1.02]">
                        <SeriesCard series={series} onNavigate={onNavigate} />
                    </div>
                ))}
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
    const [loading, setLoading] = useState(true);
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [isQuoteVisible, setIsQuoteVisible] = useState(true);

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
            .then((list: any[]) => {
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

    return (
        <div className="flex flex-col w-full max-w-[1800px] mx-auto px-4 py-6 pb-12 space-y-12">
            {/* Simple Welcome Banner */}
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

            {loading ? (
                <div className="flex justify-center items-center h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="space-y-16">
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
                </div>
            )}
        </div>
    );
}