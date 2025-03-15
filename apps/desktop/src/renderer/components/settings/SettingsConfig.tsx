import React, { useState } from 'react';
import { useRecoilState } from 'recoil';
import { ApplicationTheme } from '@/common/models/types';
import { themeState, autoCheckForUpdatesState } from '@/renderer/state/settingStates';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@comicers/ui/components/Dialog';
import { Button } from '@comicers/ui/components/Button';
import { Switch } from '@comicers/ui/components/Switch';
import { Label } from '@comicers/ui/components/Label';
import { Separator } from '@comicers/ui/components/Separator';
import { RadioGroup } from '@comicers/ui/components/RadioGroup';
import { cn } from '@comicers/ui/util';
import { RefreshCwIcon, BarChartIcon } from 'lucide-react';

interface SettingsConfigProps {
  isOpen: boolean;
  onComplete: (settings: {
    theme: ApplicationTheme;
    autoUpdate: boolean;
    telemetry: boolean;
  }) => void;
  onCancel?: () => void;
  initialSettings?: {
    theme: ApplicationTheme;
    autoUpdate: boolean;
    telemetry: boolean;
  };
  isPreLaunch?: boolean;
}

export function SettingsConfig({ 
  isOpen, 
  onComplete, 
  onCancel, 
  initialSettings,
  isPreLaunch = false 
}: SettingsConfigProps) {
  const [theme, setTheme] = useRecoilState(themeState);
  const [autoCheckForUpdates, setAutoCheckForUpdates] = useRecoilState(autoCheckForUpdatesState);
  const [telemetry, setTelemetry] = useState(initialSettings?.telemetry || false);

  const handleComplete = () => {
    onComplete({
      theme,
      autoUpdate: autoCheckForUpdates,
      telemetry,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={isPreLaunch ? undefined : onCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isPreLaunch ? "Welcome to Comicers!" : "Settings"}
          </DialogTitle>
          {isPreLaunch && (
            <DialogDescription className="text-muted-foreground">
              Let's get you set up with your preferred settings before we begin.
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div>
                <Label className="text-base font-medium">Appearance</Label>
                <p className="text-sm text-muted-foreground">
                  Choose how Comicers looks to you
                </p>
              </div>

              <RadioGroup className="grid max-w-md grid-cols-2 gap-8 pt-2">
                <div className="cursor-pointer" onClick={() => setTheme(ApplicationTheme.Light)}>
                  <div
                    className={cn(
                      'items-center rounded-md border-2 p-1',
                      theme === ApplicationTheme.Light ? 'border-foreground' : 'border-muted',
                    )}
                  >
                    <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                      <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                        <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                        <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                      </div>
                      <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                        <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                        <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                      </div>
                    </div>
                  </div>
                  <span className="block w-full text-center text-sm font-medium pt-1">Light</span>
                </div>
                <div className="cursor-pointer" onClick={() => setTheme(ApplicationTheme.Dark)}>
                  <div
                    className={cn(
                      'items-center rounded-md border-2 p-1',
                      theme === ApplicationTheme.Dark ? 'border-foreground' : 'border-muted',
                    )}
                  >
                    <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                      <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                        <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                        <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                      </div>
                      <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                        <div className="h-4 w-4 rounded-full bg-slate-400" />
                        <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                      </div>
                    </div>
                  </div>
                  <span className="block w-full text-center text-sm font-medium pt-1">Dark</span>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Keep Comicers up to date automatically
                </p>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCwIcon className="h-4 w-4 text-muted-foreground" />
                <Switch
                  id="auto-update"
                  checked={autoCheckForUpdates}
                  onCheckedChange={(checked: boolean) => setAutoCheckForUpdates(checked)}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Usage Data</Label>
                <p className="text-sm text-muted-foreground">
                  Help us improve by sending anonymous usage statistics
                </p>
              </div>
              <div className="flex items-center gap-2">
                <BarChartIcon className="h-4 w-4 text-muted-foreground" />
                <Switch
                  id="telemetry"
                  checked={telemetry}
                  onCheckedChange={(checked: boolean) => setTelemetry(checked)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {!isPreLaunch && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleComplete} className="min-w-[100px]">
            {isPreLaunch ? "Get Started" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 