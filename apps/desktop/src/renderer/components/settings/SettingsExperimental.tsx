import React from 'react';
import { useRecoilState } from 'recoil';
import {
  experimentalFeaturesEnabledState,
  aiEnhancedReadingState,
  realtimeCollaborationState,
  advancedPanelDetectionState,
  smartLibraryOrganizationState,
  pwaModeState,
} from '@/renderer/state/settingStates';
import { Checkbox } from '@comicers/ui/components/Checkbox';
import { Label } from '@comicers/ui/components/Label';
import { Badge } from '@comicers/ui/components/Badge';
import { Alert, AlertDescription } from '@comicers/ui/components/Alert';
import { AlertTriangle } from 'lucide-react';
import { Separator } from '@comicers/ui/components/Separator';

// Features that are currently disabled by the development team
const DISABLED_FEATURES = {
  aiEnhancedReading: true,
  realtimeCollaboration: true,
  advancedPanelDetection: false,
  smartLibraryOrganization: false,
  pwaMode: true,
};

export const SettingsExperimental: React.FC = () => {
  const [experimentalFeaturesEnabled, setExperimentalFeaturesEnabled] = useRecoilState(experimentalFeaturesEnabledState);
  const [aiEnhancedReading, setAIEnhancedReading] = useRecoilState(aiEnhancedReadingState);
  const [realtimeCollaboration, setRealtimeCollaboration] = useRecoilState(realtimeCollaborationState);
  const [advancedPanelDetection, setAdvancedPanelDetection] = useRecoilState(advancedPanelDetectionState);
  const [smartLibrary, setSmartLibrary] = useRecoilState(smartLibraryOrganizationState);
  const [pwaMode, setPWAMode] = useRecoilState(pwaModeState);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="checkboxExperimentalFeatures"
            checked={experimentalFeaturesEnabled}
            onCheckedChange={(checked) => setExperimentalFeaturesEnabled(!!checked)}
          />
          <Label htmlFor="checkboxExperimentalFeatures" className="font-normal">
            Enable experimental features <Badge variant="secondary">BETA</Badge>
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Enable experimental features that are still in development. These features may be unstable or incomplete.
        </p>
      </div>

      {experimentalFeaturesEnabled ? (
        <>
          <Separator />
          
          <Alert className="bg-red-950 border-red-500">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-200 font-semibold">
              These features are experimental and may be unstable. Use at your own risk.
            </AlertDescription>
          </Alert>

          {/* AI-Enhanced Reading */}
          <div className="flex flex-col space-y-2 opacity-50">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="aiEnhancedReading" 
                checked={aiEnhancedReading}
                onCheckedChange={(checked) => setAIEnhancedReading(!!checked)}
                disabled={DISABLED_FEATURES.aiEnhancedReading}
              />
              <Label htmlFor="aiEnhancedReading" className="font-normal">
                AI-Enhanced Reading <Badge variant="secondary">ALPHA</Badge> <Badge variant="outline" className="text-red-500 border-red-500">DISABLED</Badge>
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Use AI to enhance your reading experience with smart panel transitions, automatic text translation, and content recommendations.
              <br />
              <span className="text-red-500">Currently disabled: AI model training in progress.</span>
            </p>
          </div>

          {/* Real-time Collaboration */}
          <div className="flex flex-col space-y-2 opacity-50">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="realtimeCollaboration" 
                checked={realtimeCollaboration}
                onCheckedChange={(checked) => setRealtimeCollaboration(!!checked)}
                disabled={DISABLED_FEATURES.realtimeCollaboration}
              />
              <Label htmlFor="realtimeCollaboration" className="font-normal">
                Real-time Reading Sessions <Badge variant="secondary">BETA</Badge> <Badge variant="outline" className="text-red-500 border-red-500">DISABLED</Badge>
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Read comics together with friends in synchronized reading sessions with shared annotations and reactions.
              <br />
              <span className="text-red-500">Currently disabled: Under maintenance for server infrastructure upgrades.</span>
            </p>
          </div>

          {/* Advanced Panel Detection */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="advancedPanelDetection" 
                checked={advancedPanelDetection}
                onCheckedChange={(checked) => setAdvancedPanelDetection(!!checked)}
              />
              <Label htmlFor="advancedPanelDetection" className="font-normal">
                Advanced Panel Detection <Badge variant="secondary">BETA</Badge>
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Use machine learning to automatically detect and enhance comic panels for smoother navigation and better reading flow.
            </p>
          </div>

          {/* Smart Library Organization */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="smartLibrary" 
                checked={smartLibrary}
                onCheckedChange={(checked) => setSmartLibrary(!!checked)}
              />
              <Label htmlFor="smartLibrary" className="font-normal">
                Smart Library Organization <Badge variant="secondary">ALPHA</Badge>
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically organize your library using AI-powered content analysis, genre detection, and smart tagging.
            </p>
          </div>

          {/* Progressive Web App Mode */}
          <div className="flex flex-col space-y-2 opacity-50">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="pwaMode" 
                checked={pwaMode}
                onCheckedChange={(checked) => setPWAMode(!!checked)}
                disabled={DISABLED_FEATURES.pwaMode}
              />
              <Label htmlFor="pwaMode" className="font-normal">
                Progressive Web App Mode <Badge variant="secondary">ALPHA</Badge> <Badge variant="outline" className="text-red-500 border-red-500">DISABLED</Badge>
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Access your library through a web browser with offline support and synchronized reading progress.
              <br />
              <span className="text-red-500">Currently disabled: PWA implementation pending security review.</span>
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}; 