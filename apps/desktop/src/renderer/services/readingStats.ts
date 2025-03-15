import { ReadingSession, ReadingStats } from '../state/readingStatsTypes';
import storeKeys from '@/common/constants/storeKeys.json';

interface CompletedChapter {
  seriesId: string;
  chapterId: string;
  completedAt: number;
}

class ReadingStatsService {
  private persistentStore = {
    write(key: string, data: unknown) {
      window.localStorage.setItem(key, JSON.stringify(data));
    },
    read(key: string) {
      const data = window.localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    },
  };

  startSession(seriesId: string, chapterId: string): ReadingSession {
    const session: ReadingSession = {
      seriesId,
      chapterId,
      startTime: Date.now(),
      endTime: 0,
      pagesRead: 0,
    };
    console.debug('Starting new reading session:', session);
    return session;
  }

  markChapterAsCompleted(seriesId: string, chapterId: string) {
    const completedChapters: CompletedChapter[] = this.getCompletedChapters();
    if (!completedChapters.some(c => c.seriesId === seriesId && c.chapterId === chapterId)) {
      completedChapters.push({
        seriesId,
        chapterId,
        completedAt: Date.now()
      });
      this.persistentStore.write(storeKeys.READING_STATS.COMPLETED_CHAPTERS, completedChapters);
      
      // Update stats for completed chapter
      const stats = this.getStats();
      const updatedStats = {
        ...stats,
        chaptersRead: stats.chaptersRead + 1
      };
      this.persistentStore.write(storeKeys.READING_STATS.DAILY_STATS, updatedStats);
    }
  }

  private getCompletedChapters(): CompletedChapter[] {
    return this.persistentStore.read(storeKeys.READING_STATS.COMPLETED_CHAPTERS) || [];
  }

  endSession(session: ReadingSession, pagesRead: number): ReadingSession {
    console.debug('Ending reading session with pages:', pagesRead);
    const updatedSession = {
      ...session,
      endTime: Date.now(),
      pagesRead: pagesRead,
    };
    
    // Only save sessions that have actual reading time and pages
    const sessionTime = updatedSession.endTime - updatedSession.startTime;
    if (sessionTime > 1000 && pagesRead > 0) { // Minimum 1 second and 1 page
      const sessions = this.getSessions();
      sessions.push(updatedSession);
      this.persistentStore.write(storeKeys.READING_STATS.SESSIONS, sessions);
      console.debug('Saved session to storage:', updatedSession);
      
      // Update daily stats
      this.updateDailyStats(updatedSession);
    } else {
      console.debug('Skipping short or empty session:', { sessionTime, pagesRead });
    }
    
    return updatedSession;
  }

  private getSessions(): ReadingSession[] {
    return this.persistentStore.read(storeKeys.READING_STATS.SESSIONS) || [];
  }

  private updateDailyStats(session: ReadingSession) {
    console.debug('Updating daily stats for session:', session);
    const currentStats = this.getStats();
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate new values
    const sessionTime = session.endTime - session.startTime;
    const minutesRead = Math.max(sessionTime / (1000 * 60), 1/60); // Minimum 1 second converted to minutes
    const pagesPerMinute = session.pagesRead / minutesRead;
    
    console.debug('Session stats:', {
      sessionTime,
      minutesRead,
      pagesPerMinute,
      currentTotalTime: currentStats.totalReadingTime,
      currentChaptersRead: currentStats.chaptersRead
    });

    // Create new stats object with updated values
    const updatedStats: ReadingStats = {
      ...currentStats,
      totalReadingTime: currentStats.totalReadingTime + sessionTime,
    };

    // Update average reading speed
    const sessions = this.getSessions();
    const validSessions = sessions.filter(s => 
      (s.endTime - s.startTime) >= 1000 && s.pagesRead > 0
    );

    if (validSessions.length > 0) {
      const totalPages = validSessions.reduce((sum, s) => sum + s.pagesRead, 0);
      const totalMinutes = validSessions.reduce((sum, s) => sum + (s.endTime - s.startTime) / (1000 * 60), 0);
      updatedStats.averageReadingSpeed = totalPages / Math.max(totalMinutes, 1/60);
    }

    // Update streak
    if (currentStats.lastReadDate !== today) {
      const lastDate = new Date(currentStats.lastReadDate || today);
      const currentDate = new Date(today);
      const dayDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        updatedStats.dailyStreak += 1;
      } else if (dayDiff > 1) {
        updatedStats.dailyStreak = 1;
      }
      updatedStats.lastReadDate = today;
    }

    console.debug('Saving updated stats:', updatedStats);
    this.persistentStore.write(storeKeys.READING_STATS.DAILY_STATS, updatedStats);
  }

  getStats(): ReadingStats {
    const stats = this.persistentStore.read(storeKeys.READING_STATS.DAILY_STATS) || {
      totalReadingTime: 0,
      chaptersRead: 0,
      averageReadingSpeed: 0,
      dailyStreak: 0,
      lastReadDate: '',
    };
    console.debug('Retrieved stats:', stats);
    return stats;
  }
}

export const readingStatsService = new ReadingStatsService(); 