import React from 'react';
import { History, Trash2 } from 'lucide-react';
import { userPreferencesService } from '@/renderer/services/userPreferences';
import { Series } from '@tiyo/common';
import library from '@/renderer/services/library';

interface ReadingHistoryProps {
    onNavigate: (path: string, series: Series) => void;
}

export const ReadingHistory: React.FC<ReadingHistoryProps> = ({ onNavigate }) => {
    const [history, setHistory] = React.useState<Array<{
        series: Series;
        timestamp: number;
        chapterNumber: string;
        progress: number;
    }>>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadHistory = async () => {
            try {
                const historyItems = userPreferencesService.getReadingHistory();
                const seriesWithHistory = await Promise.all(
                    historyItems.map(async (item) => {
                        const series = library.fetchSeries(item.seriesId);
                        if (!series) return null;
                        return {
                            series,
                            timestamp: item.timestamp,
                            chapterNumber: item.chapterNumber,
                            progress: item.progress
                        };
                    })
                );

                setHistory(seriesWithHistory.filter((item): item is NonNullable<typeof item> => item !== null));
            } catch (error) {
                console.error('Error loading reading history:', error);
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, []);

    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to clear your reading history?')) {
            userPreferencesService.clearReadingHistory();
            setHistory([]);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Reading History</h3>
                <p className="text-muted-foreground">
                    Your reading history will appear here once you start reading series
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Reading History</h2>
                <button
                    onClick={handleClearHistory}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Clear history"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((item) => (
                    <div
                        key={item.series.id}
                        className="group relative flex flex-col cursor-pointer bg-muted/50 rounded-lg overflow-hidden"
                        onClick={() => item.series?.sourceId && item.series?.extensionId && 
                            onNavigate(`${item.series.extensionId}/${item.series.sourceId}`, item.series)}
                    >
                        <div className="flex p-4 gap-4">
                            <div className="relative w-20 h-28 overflow-hidden rounded-md">
                                {item.series.remoteCoverUrl ? (
                                    <img
                                        src={item.series.remoteCoverUrl}
                                        alt={item.series.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <History className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col flex-1">
                                <h3 className="font-medium mb-2 line-clamp-2">{item.series.title}</h3>
                                <div className="text-sm text-muted-foreground mb-2">
                                    Chapter {item.chapterNumber}
                                </div>
                                <div className="mt-auto">
                                    <div className="w-full bg-muted rounded-full h-1.5">
                                        <div
                                            className="bg-primary h-full rounded-full transition-all"
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}; 