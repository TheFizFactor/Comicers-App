import { ReadingList } from '@/common/models/types';
import { v4 as uuidv4 } from 'uuid';
const { ipcRenderer } = require('electron');
import library from '@/renderer/services/library';
import { toast } from '@comicers/ui/hooks/use-toast';

export async function exportReadingList(readingList: ReadingList): Promise<void> {
  const exportData = JSON.stringify(readingList, null, 2);
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
      const importedList: ReadingList = JSON.parse(fileContent);
      
      // Validate the imported data
      if (!importedList.name || !Array.isArray(importedList.series)) {
        throw new Error('Invalid reading list format');
      }

      // Get local library series
      const localSeries = library.fetchSeriesList();
      
      // Map imported series to local series by matching source IDs and titles
      const mappedSeries = importedList.series
        .map(importedSeries => {
          const matchingSeries = localSeries.find(
            s => s.sourceId === importedSeries.sourceId && s.extensionId === importedSeries.extensionId
          ) || localSeries.find(
            s => s.title.toLowerCase() === importedSeries.title.toLowerCase()
          );
          return matchingSeries;
        })
        .filter(s => s !== undefined);
      
      // Generate new list with mapped series
      const newList: ReadingList = {
        ...importedList,
        id: uuidv4(),
        series: mappedSeries,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      // Save to storage
      library.upsertReadingList(newList);
      
      toast({
        title: 'Success',
        description: `Reading list "${newList.name}" imported with ${mappedSeries.length} series`,
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