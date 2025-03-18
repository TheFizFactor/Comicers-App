import React from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { userPreferencesService } from '@/renderer/services/userPreferences';
import { Series } from '@tiyo/common';
import library from '@/renderer/services/library';

interface FavoritesProps {
    onNavigate: (path: string, series: Series) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({ onNavigate }) => {
    const [favorites, setFavorites] = React.useState<Series[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadFavorites = async () => {
            try {
                const favoriteIds = userPreferencesService.getFavorites();
                const favoriteSeries = await Promise.all(
                    favoriteIds.map(async (id) => {
                        const series = library.fetchSeries(id);
                        return series;
                    })
                );

                setFavorites(favoriteSeries.filter((series): series is Series => series !== null));
            } catch (error) {
                console.error('Error loading favorites:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();
    }, []);

    const handleRemoveFavorite = (seriesId: string) => {
        userPreferencesService.removeFromFavorites(seriesId);
        setFavorites(prev => prev.filter(series => series.id !== seriesId));
    };

    const handleClearFavorites = () => {
        if (window.confirm('Are you sure you want to clear your favorites?')) {
            userPreferencesService.clearFavorites();
            setFavorites([]);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="text-center py-12">
                <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Favorites</h3>
                <p className="text-muted-foreground">
                    Your favorite series will appear here once you add them
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Favorites</h2>
                <button
                    onClick={handleClearFavorites}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Clear favorites"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                {favorites.map((series) => (
                    <div
                        key={series.id}
                        className="group relative flex flex-col cursor-pointer"
                        onClick={() => series?.sourceId && series?.extensionId && 
                            onNavigate(`${series.extensionId}/${series.sourceId}`, series)}
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
                                    <Heart className="h-6 w-6 text-muted-foreground" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                <h3 className="text-sm font-medium text-white line-clamp-2">
                                    {series.title}
                                </h3>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFavorite(series.id || '');
                                }}
                                className="absolute top-2 right-2 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                                title="Remove from favorites"
                            >
                                <Heart className="w-4 h-4 text-destructive fill-current" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}; 