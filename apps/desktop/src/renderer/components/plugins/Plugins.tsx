import React, { useEffect, useState } from 'react';
const aki = require('aki-plugin-manager');
import { useLocation } from 'react-router-dom';
const { ipcRenderer } = require('electron');
import { gt } from 'semver';
import ipcChannels from '@/common/constants/ipcChannels.json';
import PluginSettingsModal from './PluginSettingsModal';
import { Button } from '@comicers/ui/components/Button';
import { Loader2, Blocks, RefreshCw, Settings, ArrowUpCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@comicers/ui/components/Card';
import { Badge } from '@comicers/ui/components/Badge';

interface AkiSearchResult {
  objects: Array<{
    package: {
      name: string;
      version: string;
      description?: string;
      author?: string;
    };
  }>;
}

const Plugins: React.FC = () => {
  const [currentTiyoVersion, setCurrentTiyoVersion] = useState<string | undefined>(undefined);
  const [availableTiyoVersion, setAvailableTiyoVersion] = useState<string | undefined>(undefined);
  const [showingSettingsModal, setShowingSettingsModal] = useState(false);
  const [installingPlugins, setInstallingPlugins] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reloading, setReloading] = useState(false);
  const location = useLocation();

  const refreshMetadata = async () => {
    setRefreshing(true);
    setCurrentTiyoVersion(undefined);
    setAvailableTiyoVersion(undefined);

    const currentVersion = await ipcRenderer.invoke(ipcChannels.EXTENSION_MANAGER.GET_TIYO_VERSION);
    setCurrentTiyoVersion(currentVersion);

    await aki
      .search('author:TheFizFactor @tiyo/core', '', 1)
      .then((results: AkiSearchResult) => {
        if (results.objects.length > 0) {
          setAvailableTiyoVersion(results.objects[0].package.version);
        }
      })
      .catch(console.error);
    setRefreshing(false);
  };

  const handleInstall = (pkgName: string, version: string) => {
    console.info(`Installing plugin ${pkgName}@${version}`);
    setInstallingPlugins([...installingPlugins, pkgName]);

    ipcRenderer
      .invoke(ipcChannels.EXTENSION_MANAGER.INSTALL, pkgName, version)
      .then(() => ipcRenderer.invoke(ipcChannels.EXTENSION_MANAGER.RELOAD))
      .then(() => refreshMetadata())
      .catch((e) => console.error(e))
      .finally(() => setInstallingPlugins(installingPlugins.filter((item) => item !== pkgName)))
      .catch((e) => console.error(e));
  };

  const handleRemove = (pkgName: string) => {
    console.info(`Removing plugin ${pkgName}...`);

    ipcRenderer
      .invoke(ipcChannels.EXTENSION_MANAGER.UNINSTALL, pkgName)
      .then(() => ipcRenderer.invoke(ipcChannels.EXTENSION_MANAGER.RELOAD))
      .then(() => refreshMetadata())
      .catch((e) => console.error(e));
  };

  const reloadPlugins = async () => {
    setReloading(true);
    await ipcRenderer.invoke(ipcChannels.EXTENSION_MANAGER.RELOAD).catch((e) => console.error(e));
    setReloading(false);
    refreshMetadata();
  };

  const renderInstallOrUninstallButton = () => {
    const isNotInstalled = currentTiyoVersion === undefined && availableTiyoVersion !== undefined;
    const loading = installingPlugins.includes('@tiyo/core');

    if (isNotInstalled) {
      return (
        <Button
          disabled={loading}
          onClick={() => handleInstall('@tiyo/core', availableTiyoVersion)}
          className="gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {installingPlugins.includes('@tiyo/core') ? 'Installing...' : 'Install Plugin'}
        </Button>
      );
    }

    return (
      <Button variant="destructive" onClick={() => handleRemove('@tiyo/core')} className="gap-2">
        <Trash2 className="h-4 w-4" />
        Uninstall
      </Button>
    );
  };

  useEffect(() => {
    refreshMetadata();
  }, [location]);

  const tiyoCanUpdate =
    currentTiyoVersion && availableTiyoVersion && gt(currentTiyoVersion, availableTiyoVersion);

  return (
    <>
      <PluginSettingsModal showing={showingSettingsModal} setShowing={setShowingSettingsModal} />

      {/* Hero Section */}
      <div className="relative -mt-4 px-8 py-16 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden rounded-b-3xl border-b">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Blocks className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
            Plugin Manager
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Enhance your manga reading experience with powerful plugins and extensions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Action Buttons */}
        <div className="flex justify-start gap-4 mb-8">
          <Button disabled={refreshing} onClick={() => refreshMetadata()} className="gap-2">
            {refreshing && <Loader2 className="h-4 w-4 animate-spin" />}
            <RefreshCw className="h-4 w-4" />
            Check for Updates
          </Button>
          <Button
            variant="outline"
            disabled={reloading || currentTiyoVersion === undefined}
            onClick={() => reloadPlugins()}
            className="gap-2"
          >
            {reloading && <Loader2 className="h-4 w-4 animate-spin" />}
            <RefreshCw className="h-4 w-4" />
            Reload Plugins
          </Button>
        </div>

        {/* Plugin Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Tiyo Extension Manager</CardTitle>
                <CardDescription className="mt-2">
                  The core plugin that enables importing manga from various online sources
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {currentTiyoVersion !== undefined ? (
                  <Button variant="outline" onClick={() => setShowingSettingsModal(true)} className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                ) : undefined}
                {tiyoCanUpdate ? (
                  <Button onClick={() => handleInstall('@tiyo/core', availableTiyoVersion)} className="gap-2">
                    <ArrowUpCircle className="h-4 w-4" />
                    Update
                  </Button>
                ) : undefined}
                {renderInstallOrUninstallButton()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Version</Badge>
                <span className="font-mono">
                  {availableTiyoVersion === currentTiyoVersion || !currentTiyoVersion ? (
                    availableTiyoVersion
                  ) : (
                    <>
                      {currentTiyoVersion} →
                      <span className="font-bold text-primary">{availableTiyoVersion}</span>
                    </>
                  )}
                </span>
              </div>
              <div className="prose prose-sm dark:prose-invert">
                <p>
                  Tiyo is the core extension manager that enables Comicers to import manga from various online sources.
                  It provides a unified interface for browsing and importing content from supported websites.
                </p>
                <ul>
                  <li>Browse and search manga from multiple sources</li>
                  <li>Import series directly to your library</li>
                  <li>Customizable settings for each source</li>
                  <li>Regular updates with new features and sources</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Section */}
        <Card>
          <CardHeader>
            <CardTitle>More Plugins Coming Soon</CardTitle>
            <CardDescription>
              We're working on bringing more exciting plugins to enhance your manga reading experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border bg-muted/50">
                <h3 className="font-semibold mb-2">Reading Progress Sync</h3>
                <p className="text-sm text-muted-foreground">
                  Sync your reading progress across devices and platforms
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/50">
                <h3 className="font-semibold mb-2">Enhanced Reading Experience</h3>
                <p className="text-sm text-muted-foreground">
                  Additional reading modes and customization options
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/50">
                <h3 className="font-semibold mb-2">Community Features</h3>
                <p className="text-sm text-muted-foreground">
                  Share recommendations and discuss with other readers
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/50">
                <h3 className="font-semibold mb-2">Advanced Library Management</h3>
                <p className="text-sm text-muted-foreground">
                  Powerful tools for organizing and managing your collection
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Plugins;
