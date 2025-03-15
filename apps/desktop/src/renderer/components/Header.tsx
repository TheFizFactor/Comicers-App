import { Button } from '@comicers/ui/components/Button';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { useRecoilState } from 'recoil';
import { SettingsConfig } from './settings/SettingsConfig';
import { ApplicationTheme } from '@/common/models/types';
import { themeState, autoCheckForUpdatesState } from '@/renderer/state/settingStates';

interface Settings {
  theme: ApplicationTheme;
  autoUpdate: boolean;
  telemetry: boolean;
}

export function Header() {
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useRecoilState(themeState);
  const [autoCheckForUpdates, setAutoCheckForUpdates] = useRecoilState(autoCheckForUpdatesState);
  
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
      
      <SettingsConfig
        isOpen={showSettings}
        onComplete={(newSettings: Settings) => {
          setTheme(newSettings.theme);
          setAutoCheckForUpdates(newSettings.autoUpdate);
          localStorage.setItem('telemetry', String(newSettings.telemetry));
          setShowSettings(false);
        }}
        onCancel={() => setShowSettings(false)}
        initialSettings={{
          theme,
          autoUpdate: autoCheckForUpdates,
          telemetry: localStorage.getItem('telemetry') === 'true',
        }}
      />
    </header>
  );
} 