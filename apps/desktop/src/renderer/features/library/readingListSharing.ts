import { ReadingList } from '@/common/models/types';
import { Series, SeriesStatus, LanguageKey } from '@tiyo/common';
import { toast } from '@comicers/ui/hooks/use-toast';
import library from '@/renderer/services/library';
const { ipcRenderer } = require('electron');

/**
 * Generates a shareable data URL for a reading list
 */
export function generateShareableUrl(readingList: ReadingList): string {
  // Create a minimal version of the reading list with only essential data
  const shareableData = {
    name: readingList.name,
    series: readingList.series.map(series => ({
      title: series.title,
      sourceId: series.sourceId,
      extensionId: series.extensionId
    }))
  };

  // Convert to base64
  const encodedData = btoa(JSON.stringify(shareableData));
  return `comicers://reading-list/${encodedData}`;
}

/**
 * Copies the shareable URL to clipboard
 */
export async function copyShareableUrl(readingList: ReadingList): Promise<void> {
  try {
    const url = generateShareableUrl(readingList);
    await navigator.clipboard.writeText(url);
    toast({
      title: 'Success',
      description: 'Shareable link copied to clipboard',
    });
  } catch (error) {
    console.error('Error copying shareable URL:', error);
    toast({
      title: 'Error',
      description: 'Failed to copy shareable link',
      variant: 'destructive',
    });
  }
}

/**
 * Imports a reading list from a shareable URL
 */
export async function importFromUrl(url: string): Promise<ReadingList | null> {
  try {
    // Extract base64 data from URL
    const match = url.match(/comicers:\/\/reading-list\/(.+)/);
    if (!match) {
      throw new Error('Invalid URL format');
    }

    // Decode the data
    const encodedData = match[1];
    const decodedData = JSON.parse(atob(encodedData));

    // Add each series to the library and get the full series objects
    const seriesList = decodedData.series.map((seriesInfo: { title: string; sourceId: string; extensionId: string }) => {
      const series: Series = {
        title: seriesInfo.title,
        sourceId: seriesInfo.sourceId,
        extensionId: seriesInfo.extensionId,
        status: SeriesStatus.ONGOING,
        tags: [],
        categories: [],
        altTitles: [],
        description: '',
        authors: [],
        artists: [],
        originalLanguageKey: LanguageKey.ENGLISH,
        numberUnread: 0,
        remoteCoverUrl: ''
      };
      return library.upsertSeries(series);
    });

    if (seriesList.length === 0) {
      throw new Error('No series could be added');
    }

    // Create a new reading list with the added series
    const newList: ReadingList = {
      id: crypto.randomUUID(),
      name: decodedData.name,
      series: seriesList,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return newList;
  } catch (error) {
    console.error('Error importing from URL:', error);
    toast({
      title: 'Error',
      description: 'Failed to import reading list from URL',
      variant: 'destructive',
    });
    return null;
  }
}

/**
 * Generates a QR code for the reading list
 */
export async function generateQRCode(readingList: ReadingList): Promise<string> {
  try {
    const url = generateShareableUrl(readingList);
    const qrCode = await ipcRenderer.invoke('qr:generate', url);
    return qrCode;
  } catch (error) {
    console.error('Error generating QR code:', error);
    toast({
      title: 'Error',
      description: 'Failed to generate QR code',
      variant: 'destructive',
    });
    return '';
  }
} 