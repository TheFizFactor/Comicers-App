import { ReadingList } from '@/common/models/types';
import { v4 as uuidv4 } from 'uuid';
const { ipcRenderer } = require('electron');
import library from '@/renderer/services/library';
import { toast } from '@comicers/ui/hooks/use-toast';
import { importSeries } from './utils';
import { LanguageKey, Series } from '@tiyo/common';

export async function exportReadingList(readingList: ReadingList): Promise<void> {
  // Include full series data in the export
  const exportData = JSON.stringify({
    ...readingList,
    series: readingList.series.map(series => ({
      ...series,
      chapters: series.id ? library.fetchChapters(series.id) : []
    }))
  }, null, 2);
  
  const fileFilter = { name: 'Reading List', extensions: ['json'] };
  
  try {
    const filePath = await ipcRenderer.invoke('dialog:showSaveDialog', {
      filters: [fileFilter],
      defaultPath: `${readingList.name}.json`,
    });
    
    if (!filePath.canceled) {
      await ipcRenderer.invoke('fs:writeFile', filePath.filePath, exportData);
      toast({
        title: 'Success',
        description: `Reading list "${readingList.name}" exported successfully`,
      });
    }
  } catch (error) {
    console.error('Error exporting reading list:', error);
    toast({
      title: 'Error',
      description: 'Failed to export reading list',
      variant: 'destructive',
    });
  }
}

export async function importReadingList(): Promise<ReadingList | null> {
  const fileFilter = { name: 'Reading List', extensions: ['json'] };
  
  try {
    const filePath = await ipcRenderer.invoke('dialog:showOpenDialog', {
      filters: [fileFilter],
      properties: ['openFile'],
    });
    
    if (!filePath.canceled && filePath.filePaths.length > 0) {
      const fileContent = await ipcRenderer.invoke('fs:readFile', filePath.filePaths[0]);
      const importedList = JSON.parse(fileContent);
      
      // Validate the imported data
      if (!importedList.name || !Array.isArray(importedList.series)) {
        throw new Error('Invalid reading list format');
      }

      // Get local library series
      const localSeries = library.fetchSeriesList();
      
      // Import series that don't exist locally
      const mappedSeries = await Promise.all(
        importedList.series.map(async (importedSeries: Series) => {
          let series = localSeries.find(
            s => s.sourceId === importedSeries.sourceId && s.extensionId === importedSeries.extensionId
          );
          
          if (!series) {
            // Import the series if it doesn't exist locally
            try {
              series = await importSeries(importedSeries, [] as LanguageKey[], true);
            } catch (error) {
              console.error(`Failed to import series: ${importedSeries.title}`, error);
              return null;
            }
          }
          
          return series;
        })
      );
      
      // Filter out failed imports and generate new list
      const validSeries = mappedSeries.filter(s => s !== null);
      const newList: ReadingList = {
        ...importedList,
        id: uuidv4(),
        series: validSeries,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      // Save to storage
      library.upsertReadingList(newList);
      
      toast({
        title: 'Success',
        description: `Reading list "${newList.name}" imported with ${validSeries.length} series`,
      });
      
      return newList;
    }
  } catch (error) {
    console.error('Error importing reading list:', error);
    toast({
      title: 'Error',
      description: 'Failed to import reading list',
      variant: 'destructive',
    });
  }
  
  return null;
}