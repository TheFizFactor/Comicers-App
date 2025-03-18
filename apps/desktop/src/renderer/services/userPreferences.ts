interface ReadingHistoryItem {
    seriesId: string;
    timestamp: number;
    chapterNumber: string;
    progress: number;
}

interface UserPreferences {
    readingHistory: ReadingHistoryItem[];
    favorites: string[];
}

class UserPreferencesService {
    private static instance: UserPreferencesService;
    private preferences: UserPreferences;

    private constructor() {
        this.preferences = this.loadPreferences();
    }

    public static getInstance(): UserPreferencesService {
        if (!UserPreferencesService.instance) {
            UserPreferencesService.instance = new UserPreferencesService();
        }
        return UserPreferencesService.instance;
    }

    private loadPreferences(): UserPreferences {
        try {
            const saved = localStorage.getItem('userPreferences');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
        return {
            readingHistory: [],
            favorites: []
        };
    }

    private savePreferences() {
        try {
            localStorage.setItem('userPreferences', JSON.stringify(this.preferences));
        } catch (error) {
            console.error('Error saving user preferences:', error);
        }
    }

    // Reading History Methods
    public addToHistory(seriesId: string, chapterNumber: string, progress: number) {
        const historyItem: ReadingHistoryItem = {
            seriesId,
            timestamp: Date.now(),
            chapterNumber,
            progress
        };

        // Remove existing entry for this series if it exists
        this.preferences.readingHistory = this.preferences.readingHistory.filter(
            item => item.seriesId !== seriesId
        );

        // Add new entry at the beginning
        this.preferences.readingHistory.unshift(historyItem);

        // Keep only the last 50 entries
        this.preferences.readingHistory = this.preferences.readingHistory.slice(0, 50);

        this.savePreferences();
    }

    public getReadingHistory(): ReadingHistoryItem[] {
        return this.preferences.readingHistory;
    }

    public clearReadingHistory() {
        this.preferences.readingHistory = [];
        this.savePreferences();
    }

    // Favorites Methods
    public addToFavorites(seriesId: string) {
        if (!this.preferences.favorites.includes(seriesId)) {
            this.preferences.favorites.push(seriesId);
            this.savePreferences();
        }
    }

    public removeFromFavorites(seriesId: string) {
        this.preferences.favorites = this.preferences.favorites.filter(id => id !== seriesId);
        this.savePreferences();
    }

    public isFavorite(seriesId: string): boolean {
        return this.preferences.favorites.includes(seriesId);
    }

    public getFavorites(): string[] {
        return this.preferences.favorites;
    }

    public clearFavorites() {
        this.preferences.favorites = [];
        this.savePreferences();
    }
}

export const userPreferencesService = UserPreferencesService.getInstance(); 