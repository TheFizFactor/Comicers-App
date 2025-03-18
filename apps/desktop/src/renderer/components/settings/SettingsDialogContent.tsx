import * as React from 'react';
import {
  BookOpenIcon,
  KeyboardIcon,
  LibraryBigIcon,
  LucideProps,
  NotebookTextIcon,
  SettingsIcon,
  ToyBrickIcon,
  FlaskConicalIcon,
  ChevronRight,
} from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@comicers/ui/components/Breadcrumb';
import { DialogContent, DialogTitle, DialogDescription } from '@comicers/ui/components/Dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@comicers/ui/components/Sidebar';
import { useState } from 'react';
import { SettingsGeneral } from './SettingsGeneral';
import { SettingsLibrary } from './SettingsLibrary';
import { SettingsReader } from './SettingsReader';
import { SettingsKeybinds } from './SettingsKeybinds';
import { SettingsIntegrations } from './SettingsIntegrations';
import { SettingsTrackers } from './SettingsTrackers';
import { SettingsExperimental } from './SettingsExperimental';
import { Separator } from '@comicers/ui/components/Separator';
import { ScrollArea } from '@comicers/ui/components/ScrollArea';

export enum SettingsPage {
  General = 'General',
  Library = 'Library',
  Reader = 'Reader',
  Keybinds = 'Keybinds',
  Trackers = 'Trackers',
  Integrations = 'Integrations',
  Experimental = 'Experimental',
}

type SettingsPageProps = {
  name: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >;
  component: React.FC;
  description: string;
};

const PAGES: { [key in SettingsPage]: SettingsPageProps } = {
  [SettingsPage.General]: {
    name: 'General',
    icon: SettingsIcon,
    component: SettingsGeneral,
    description: 'Basic application settings and preferences',
  },
  [SettingsPage.Library]: {
    name: 'Library',
    icon: LibraryBigIcon,
    component: SettingsLibrary,
    description: 'Configure your manga library settings',
  },
  [SettingsPage.Reader]: {
    name: 'Reader',
    icon: BookOpenIcon,
    component: SettingsReader,
    description: 'Customize your reading experience',
  },
  [SettingsPage.Keybinds]: {
    name: 'Keybinds',
    icon: KeyboardIcon,
    component: SettingsKeybinds,
    description: 'Set up keyboard shortcuts',
  },
  [SettingsPage.Trackers]: {
    name: 'Trackers',
    icon: NotebookTextIcon,
    component: SettingsTrackers,
    description: 'Manage your reading progress tracking',
  },
  [SettingsPage.Integrations]: {
    name: 'Integrations',
    icon: ToyBrickIcon,
    component: SettingsIntegrations,
    description: 'Connect with external services',
  },
  [SettingsPage.Experimental]: {
    name: 'Experimental',
    icon: FlaskConicalIcon,
    component: SettingsExperimental,
    description: 'Try out new features and options',
  },
};

type SettingsDialogContentProps = {
  defaultPage?: SettingsPage;
};

export function SettingsDialogContent(props: SettingsDialogContentProps) {
  const [activePage, setActivePage] = useState<SettingsPage>(
    props.defaultPage ?? SettingsPage.General,
  );

  return (
    <DialogContent className="overflow-hidden !p-0 md:max-h-[600px] md:max-w-[800px] lg:max-w-[900px] text-foreground">
      <DialogTitle className="sr-only">Settings</DialogTitle>
      <DialogDescription className="sr-only">
        Configure application settings and preferences
      </DialogDescription>
      <SidebarProvider className="items-start">
        <Sidebar collapsible="none" className="w-64 border-r">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-2">Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    Customize your Comicers experience
                  </p>
                </div>
                <Separator className="my-2" />
                <SidebarMenu>
                  {Object.entries(PAGES).map(([page, pageProps]) => {
                    const pageKey: SettingsPage = page as SettingsPage;
                    return (
                      <SidebarMenuItem key={PAGES[pageKey].name}>
                        <SidebarMenuButton
                          isActive={pageKey === activePage}
                          onClick={() => setActivePage(pageKey)}
                          className="flex items-center justify-between w-full"
                        >
                          <div className="flex items-center gap-2">
                            {<pageProps.icon className="h-4 w-4" />}
                            <span>{pageProps.name}</span>
                          </div>
                          {pageKey === activePage && (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex h-[600px] flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
            <div className="flex items-center gap-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink>Settings</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{PAGES[activePage].name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="p-6 pb-2">
              <h2 className="text-2xl font-semibold tracking-tight">{PAGES[activePage].name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {PAGES[activePage].description}
              </p>
            </div>
            <ScrollArea className="flex-1 px-6">
              <div className="py-4">
                {React.createElement(PAGES[activePage].component)}
              </div>
            </ScrollArea>
          </div>
        </main>
      </SidebarProvider>
    </DialogContent>
  );
}
