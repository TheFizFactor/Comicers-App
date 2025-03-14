import { atom } from 'recoil';
import { ReadingSession, ReadingStats } from './readingStatsTypes';

export const currentReadingSessionState = atom<ReadingSession | null>({
  key: 'currentReadingSessionState',
  default: null,
});

export const readingStatsState = atom<ReadingStats>({
  key: 'readingStatsState',
  default: {
    totalReadingTime: 0,
    chaptersRead: 0,
    averageReadingSpeed: 0,
    dailyStreak: 0,
    lastReadDate: '',
  },
}); 