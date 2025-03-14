import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { readingStatsState } from '@/renderer/state/readingStatsStates';
import { Card, CardContent, CardHeader, CardTitle } from '@comicers/ui/components/Card';
import { BookOpenIcon, ClockIcon, ZapIcon, FlameIcon } from 'lucide-react';
import { readingStatsService } from '@/renderer/services/readingStats';

export const SettingsStats: React.FC = () => {
  const [stats, setStats] = useRecoilState(readingStatsState);

  // Update stats when component mounts or becomes visible
  useEffect(() => {
    const currentStats = readingStatsService.getStats();
    console.debug('SettingsStats: Updating stats from service:', currentStats);
    setStats(currentStats);
  }, []);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Reading Time</CardTitle>
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(stats.totalReadingTime)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chapters Read</CardTitle>
          <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.chaptersRead}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reading Speed</CardTitle>
          <ZapIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageReadingSpeed.toFixed(1)} <span className="text-sm font-normal">pages/min</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reading Streak</CardTitle>
          <FlameIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.dailyStreak} <span className="text-sm font-normal">days</span></div>
        </CardContent>
      </Card>
    </div>
  );
}; 