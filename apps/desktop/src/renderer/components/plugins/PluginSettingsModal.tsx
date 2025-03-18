import React, { useEffect, useState } from 'react';
const { ipcRenderer } = require('electron');
import ipcChannels from '@/common/constants/ipcChannels.json';
import storeKeys from '@/common/constants/storeKeys.json';
import persistantStore from '../../util/persistantStore';
import { ExtensionMetadata, SettingType } from '@tiyo/common';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@comicers/ui/components/Dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@comicers/ui/components/Accordion';
import { Loader2, Settings, Save, X } from 'lucide-react';
import { Switch } from '@comicers/ui/components/Switch';
import { Input } from '@comicers/ui/components/Input';
import { Button } from '@comicers/ui/components/Button';
import { Label } from '@comicers/ui/components/Label';
import { Separator } from '@comicers/ui/components/Separator';
import { ScrollArea } from '@comicers/ui/components/ScrollArea';
import { Badge } from '@comicers/ui/components/Badge';

type SettingTypes = {
  [key: string]: SettingType;
};

type Settings = {
  // biome-ignore lint/suspicious/noExplicitAny: arbitrary schema
  [key: string]: any;
};

type SettingTypesMap = { [extensionId: string]: SettingTypes };
type SettingsMap = { [extensionId: string]: Settings };

type Props = {
  showing: boolean;
  setShowing: (showing: boolean) => void;
};

const PluginSettingsModal: React.FC<Props> = (props: Props) => {
  const [loading, setLoading] = useState(true);
  const [extensions, setExtensions] = useState<ExtensionMetadata[]>([]);
  const [settingTypesMap, setSettingTypesMap] = useState<SettingTypesMap>({});
  const [settingsMap, setSettingsMap] = useState<SettingsMap>({});
  const [hasChanges, setHasChanges] = useState(false);

  const loadExtensionSettings = async () => {
    const newExtensions: ExtensionMetadata[] = await ipcRenderer.invoke(
      ipcChannels.EXTENSION_MANAGER.GET_ALL,
    );

    const newSettingTypesMap: SettingTypesMap = {};
    const newSettingsMap: SettingsMap = {};

    for (const extension of newExtensions) {
      const settingTypes = await ipcRenderer.invoke(
        ipcChannels.EXTENSION.GET_SETTING_TYPES,
        extension.id,
      );

      if (Object.keys(settingTypes).length > 0) {
        const settings = await ipcRenderer.invoke(ipcChannels.EXTENSION.GET_SETTINGS, extension.id);
        newSettingTypesMap[extension.id] = settingTypes;
        newSettingsMap[extension.id] = settings;
      }
    }

    setExtensions(newExtensions);
    setSettingTypesMap(newSettingTypesMap);
    setSettingsMap(newSettingsMap);
    setHasChanges(false);
  };

  const updateSetting = (extensionId: string, key: string, value: unknown) => {
    const newSettingsMap = { ...settingsMap };
    newSettingsMap[extensionId][key] = value;
    setSettingsMap(newSettingsMap);
    setHasChanges(true);
  };

  const saveExtensionSettings = async () => {
    for (const extension of extensions) {
      await ipcRenderer.invoke(
        ipcChannels.EXTENSION.SET_SETTINGS,
        extension.id,
        settingsMap[extension.id],
      );
      persistantStore.write(
        `${storeKeys.EXTENSION_SETTINGS_PREFIX}${extension.id}`,
        JSON.stringify(settingsMap[extension.id]),
      );
    }
    setHasChanges(false);
  };

  const renderControl = (
    settingType: SettingType,
    // biome-ignore lint/suspicious/noExplicitAny: arbitrary schema
    curVal: any,
    onChangeFn: (newValue: unknown) => void,
    label: string,
  ) => {
    switch (settingType) {
      case SettingType.BOOLEAN:
        return (
          <div className="flex items-center space-x-2">
            <Switch checked={curVal} onCheckedChange={(checked) => onChangeFn(checked)} />
            <Label className="text-sm text-muted-foreground">{label}</Label>
          </div>
        );
      case SettingType.STRING:
        return (
          <div className="flex flex-col space-y-2">
            <Label className="text-sm">{label}</Label>
            <Input
              className="max-w-52"
              value={curVal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeFn(e.target.value)}
            />
          </div>
        );
      default:
        return <></>;
    }
  };

  const renderRows = () => {
    return Object.entries(settingTypesMap).map(([extensionId, settingTypes]) => {
      const extension = extensions.find((ext) => ext.id === extensionId);
      const extensionName = extension?.name;
      const settingKeys = Object.keys(settingTypes);

      return (
        <AccordionItem key={extensionId} value={extensionId}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>{extensionName}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 py-2">
              {settingKeys.map((key) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{key}</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure {key.toLowerCase().replace(/_/g, ' ')}
                      </p>
                    </div>
                    {renderControl(
                      settingTypes[key],
                      settingsMap[extensionId][key],
                      (newValue: unknown) => updateSetting(extensionId, key, newValue),
                      key,
                    )}
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      );
    });
  };

  useEffect(() => {
    if (props.showing) {
      setLoading(true);
      loadExtensionSettings()
        .finally(() => setLoading(false))
        .catch(console.error);
    }
  }, [props.showing]);

  return (
    <Dialog open={props.showing} onOpenChange={props.setShowing} defaultOpen={false}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Plugin Settings
          </DialogTitle>
          <DialogDescription>
            Configure settings for your installed plugins and extensions
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="w-full flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <Accordion type="single" collapsible className="w-full">
              {renderRows()}
            </Accordion>
          </ScrollArea>
        )}
        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="animate-pulse">
                Unsaved changes
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => props.setShowing(false)} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => saveExtensionSettings().then(() => props.setShowing(false))}
              disabled={!hasChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PluginSettingsModal;
