import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@comicers/ui/components/Button';
import { ScrollArea } from '@comicers/ui/components/ScrollArea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@comicers/ui/components/Card';
import { Dialog, DialogTrigger } from '@comicers/ui/components/Dialog';
import { SettingsDialogContent } from '../settings/SettingsDialogContent';
import { SettingsPage } from '../settings/SettingsDialogContent';
const { ipcRenderer } = require('electron');
import ipcChannels from '@/common/constants/ipcChannels.json';
import { useRecoilValue } from 'recoil';
import { seriesListState, readingListsState } from '@/renderer/state/libraryStates';
import { SeriesStatus } from '@tiyo/common';
import { ReadingList } from '@/common/models/types';
import { readingStatsService } from '@/renderer/services/readingStats';
import { 
    BookOpen, 
    Library, 
    Download, 
    BarChart,
    BookMarked,
    ListTodo,
    Bookmark,
    History,
    Compass
} from 'lucide-react';
import { Progress } from '@comicers/ui/components/Progress';

interface ReleaseInfo {
    version: string;
    releaseDate: string;
    notes: string;
}

interface QuickStat {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    description?: string;
}

interface ReadingListWithProgress extends ReadingList {
    progress: number;
    totalSeries: number;
}

interface RecentlyRead {
    id: string;
    title: string;
    chapter: string;
    timestamp: number;
}

// Overview welcome messages
const quotes = [
    "Track your reading progress",
    "Organize your collection",
    "Discover new favorites",
    "Keep up with your series",
    "Build your reading lists",
    "Monitor your reading stats",
    "Stay up to date with updates",
    "Manage your library easily",
    "Keep track of what you love",
    "Your reading, your way"
];

export const OverviewPage: React.FC = () => {
    const navigate = useNavigate();
    const [releases, setReleases] = useState<ReleaseInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const seriesList = useRecoilValue(seriesListState);
    const readingLists = useRecoilValue(readingListsState);
    const [recentlyRead, setRecentlyRead] = useState<RecentlyRead[]>([]);
    const [stats, setStats] = useState(() => readingStatsService.getStats());
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

    const fetchReleaseNotes = async () => {
        setLoading(true);
        try {
            const notes = await ipcRenderer.invoke(ipcChannels.APP.GET_RELEASE_NOTES);
            setReleases([{
                version: 'Latest',
                releaseDate: new Date().toLocaleDateString(),
                notes: notes
            }]);
        } catch (error: unknown) {
            console.error('Failed to fetch release notes:', error);
            setReleases([{
                version: 'Latest',
                releaseDate: new Date().toLocaleDateString(),
                notes: error instanceof Error && error.message === 'GitHub API rate limit exceeded. Please try again in a few minutes.'
                    ? 'GitHub API rate limit exceeded. Please try again in a few minutes.'
                    : 'Failed to load release notes. Please check your connection.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        fetchReleaseNotes();
    };

    useEffect(() => {
        fetchReleaseNotes();

        // Get recently read series (placeholder - implement actual tracking)
        const recent = seriesList
            .slice(0, 5)
            .map(series => ({
                id: series.id || 'unknown',
                title: series.title,
                chapter: 'Chapter 1', // Default chapter
                timestamp: Date.now()
            }));
        setRecentlyRead(recent);

        // Get actual reading stats
        const currentStats = readingStatsService.getStats();
        setStats(currentStats);
    }, [seriesList]);

    const quickStats: QuickStat[] = [
        {
            label: 'Total Series',
            value: seriesList.length,
            icon: <Library className="w-4 h-4" />,
            description: 'Series in your library'
        },
        {
            label: 'Reading Now',
            value: recentlyRead.length,
            icon: <BookOpen className="w-4 h-4" />,
            description: 'Recently opened series'
        },
        {
            label: 'Reading Streak',
            value: `${stats.dailyStreak} days`,
            icon: <History className="w-4 h-4" />,
            description: 'Current reading streak'
        },
        {
            label: 'Completed',
            value: seriesList.filter(s => s.status === SeriesStatus.COMPLETED).length,
            icon: <BookMarked className="w-4 h-4" />,
            description: 'Completed series'
        }
    ];

    // Calculate reading list progress
    const readingListsWithProgress: ReadingListWithProgress[] = readingLists.map(list => {
        const completedSeries = list.series.filter(s => s.status === SeriesStatus.COMPLETED).length;
        return {
            ...list,
            progress: Math.round((completedSeries / list.series.length) * 100),
            totalSeries: list.series.length
        };
    }).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

    return (
        <div className="container mx-auto mb-4 p-6 space-y-8">
            {/* Simple Welcome Banner */}
            <div className="w-full max-w-3xl mx-auto text-center space-y-6 py-8">
                <h1 className="text-3xl font-semibold">
                    Overview
                </h1>
                <p 
                    className={`text-muted-foreground transition-opacity duration-200 ease-in-out ${
                        isQuoteVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    {quotes[currentQuoteIndex]}
                </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickStats.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.label}
                            </CardTitle>
                            {stat.icon}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => navigate('/search')}
                            >
                                <Compass className="w-4 h-4" />
                                <span className="ml-2">Explorer</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => navigate('/library')}
                            >
                                <ListTodo className="w-4 h-4" />
                                <span className="ml-2">Create List</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => navigate('/downloads')}
                            >
                                <Download className="w-4 h-4" />
                                <span className="ml-2">Downloads</span>
                            </Button>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                    >
                                        <BarChart className="w-4 h-4" />
                                        <span className="ml-2">Reading Stats</span>
                                    </Button>
                                </DialogTrigger>
                                <SettingsDialogContent defaultPage={SettingsPage.Stats} />
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>

                {/* Reading Lists */}
                <Card>
                    <CardHeader>
                        <CardTitle>Reading Lists</CardTitle>
                        <CardDescription>Your curated collections</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[200px]">
                            <div className="space-y-4">
                                {readingListsWithProgress.length === 0 ? (
                                    <div className="text-center text-muted-foreground">
                                        <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No reading lists yet</p>
                                        <Button 
                                            variant="link" 
                                            className="mt-2"
                                            onClick={() => navigate('/library')}
                                        >
                                            Create your first list
                                        </Button>
                                    </div>
                                ) : (
                                    readingListsWithProgress.map((list, index) => (
                                        <div
                                            key={index}
                                            className="space-y-2 cursor-pointer hover:bg-accent rounded-lg p-2"
                                            onClick={() => navigate(`/library?list=${list.id}`)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-medium">{list.name}</p>
                                                <span className="text-xs text-muted-foreground">
                                                    {list.totalSeries} series
                                                </span>
                                            </div>
                                            <Progress value={list.progress} className="h-1" />
                                            <p className="text-xs text-muted-foreground">
                                                {list.progress}% completed
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recently Read */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recently Read</CardTitle>
                        <CardDescription>Continue where you left off</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[200px]">
                            <div className="space-y-4">
                                {recentlyRead.map((series, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center space-x-4 cursor-pointer hover:bg-accent rounded-lg p-2"
                                        onClick={() => navigate(`/series/${series.id}`)}
                                    >
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {series.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Last read: {new Date(series.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Release Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Latest Updates</CardTitle>
                        <CardDescription>What's new in Comicers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center p-4">Loading release notes...</div>
                        ) : (
                            <ScrollArea className="h-[200px]">
                                {releases.map((release, index) => (
                                    <div key={index} className="mb-6 last:mb-0">
                                        <h3 className="text-lg font-semibold mb-2">
                                            Version {release.version} • {release.releaseDate}
                                        </h3>
                                        <div className="prose prose-sm max-w-none">
                                            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                                                {release.notes}
                                                {release.notes.includes('rate limit exceeded') && (
                                                    <Button
                                                        variant="link"
                                                        className="mt-2 p-0"
                                                        onClick={handleRetry}
                                                        disabled={loading}
                                                    >
                                                        Retry
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 