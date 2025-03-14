export interface ReadingSession {
  seriesId: string;
  chapterId: string;
  startTime: number;
  endTime: number;
  pagesRead: number;
}

export interface ReadingStats {
  totalReadingTime: number;
  chaptersRead: number;
  averageReadingSpeed: number;
  dailyStreak: number;
  lastReadDate: string;
} 