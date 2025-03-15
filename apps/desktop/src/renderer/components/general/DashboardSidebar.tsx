import * as React from 'react';
const { ipcRenderer } = require('electron');
import ipcChannels from '@/common/constants/ipcChannels.json';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@comicers/ui/components/Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import routes from '@/common/constants/routes.json';
import {
  ChevronRight,
  FolderDown,
  GitFork,
  Heart,
  Home,
  Info,
  LibraryBig,
  PencilIcon,
  Settings,
  Compass,
  Trash2Icon,
  MessageCircle,
  ChartBar,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@comicers/ui/components/Collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@comicers/ui/components/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@comicers/ui/components/Dialog';
import { Button } from '@comicers/ui/components/Button';
import { Badge } from '@comicers/ui/components/Badge';
import packageJson from '../../../../package.json';
import { SettingsDialogContent } from '../settings/SettingsDialogContent';
import { categoryListState } from '@/renderer/state/libraryStates';
import { useRecoilValue, useRecoilState } from 'recoil';
import { useState } from 'react';
import { libraryFilterCategoryState } from '@/renderer/state/settingStates';
import { NewCategoryDialog } from './NewCategoryDialog';
import { Category } from '@/common/models/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@comicers/ui/components/ContextMenu';
import { EditCategoryDialog } from './EditCategoryDialog';
import { RemoveCategoryDialog } from './RemoveCategoryDialog';
import { cn } from '@/renderer/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@comicers/ui/components/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@comicers/ui/components/Tabs';
import { Bitcoin, Coins, Github } from 'lucide-react';
import { Label } from '@comicers/ui/components/Label';

export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingForUpdate, setCheckingForUpdate] = useState(false);
  const [showingNewCategoryDialog, setShowingNewCategoryDialog] = useState(false);
  const [showingEditCategoryDialog, setShowingEditCategoryDialog] = useState(false);
  const [showingRemoveCategoryDialog, setShowingRemoveCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const categories = useRecoilValue(categoryListState);
  const [libraryFilterCategory, setLibraryFilterCategory] = useRecoilState(libraryFilterCategoryState);

  const handleUpdateCheck = () => {
    if (!checkingForUpdate) {
      setCheckingForUpdate(true);
      ipcRenderer
        .invoke(ipcChannels.APP.CHECK_FOR_UPDATES)
        .finally(() => setCheckingForUpdate(false))
        .catch(console.error);
    }
  };

  return (
    <Sidebar className="bg-card border-r-0" {...props}>
      <SidebarHeader className="pt-8 px-6">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 flex items-center justify-center overflow-hidden">
            <img src="https://media-hosting.imagekit.io//3acb2ec681f44f4b/Untitled%20(5).png?Expires=1836599631&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=rh3fJn6M-yXX958UXoOeKvljc6zlHQMP-kJNo4cowkF~KcbRqP5Zyd5DV2gHMAIErZ0kWeplMnBfWxQxSVF0M3TOphEQgtlVmeZltk4W1HGHnoTfuxp7yfq5M9YMGtS-35QX3YzWukX3ndzsetfJVqFydvIfN97nW0aYdkSCWUdzed5PFgBjMKU~Md4FWgWfFUTF3chsWXwZcWnzJjvyR9o3nYBd2A~wUZVI3Y73wORv-bCFfSfaBUlrlr9Tis-MatiLiQZJ6FrX8llNl2TckdPZMd9SOlrS7TwFjOCzRS~dwPYHbrMG31oRQjxn9ZbvySo7XMjaf77IbtJ-LdXyhg__" alt="Comicers" className="h-full w-full object-contain" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Comicers</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <NewCategoryDialog
          open={showingNewCategoryDialog}
          onOpenChange={setShowingNewCategoryDialog}
        />
        {selectedCategory && (
          <EditCategoryDialog
            open={showingEditCategoryDialog}
            onOpenChange={setShowingEditCategoryDialog}
            category={selectedCategory!}
          />
        )}
        {selectedCategory && (
          <RemoveCategoryDialog
            open={showingRemoveCategoryDialog}
            onOpenChange={setShowingRemoveCategoryDialog}
            category={selectedCategory!}
          />
        )}

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/')}
                className={cn(
                  "px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors",
                  (location.pathname === '/' || location.pathname === '') && "bg-accent"
                )}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate(routes.OVERVIEW)}
                className={cn(
                  "px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors",
                  location.pathname === routes.OVERVIEW && "bg-accent"
                )}
              >
                <ChartBar className="h-4 w-4" />
                <span>Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate(routes.FORUM)}
                className={cn(
                  "px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors",
                  location.pathname === routes.FORUM && "bg-accent"
                )}
              >
                <MessageCircle className="h-4 w-4" />
                <span>Community</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible asChild defaultOpen={true} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className={cn(
                    "px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors",
                    location.pathname.startsWith(routes.SEARCH) && "bg-accent"
                  )}>
                    <Compass className="h-4 w-4" />
                    <span>Explorer</span>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 opacity-50" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 pb-1">
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className="px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(routes.SEARCH)}
                      >
                        <span>Browse All</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className="px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(routes.PLUGINS)}
                      >
                        <span>Plugins</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <Collapsible asChild defaultOpen={true} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className={cn(
                    "px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors",
                    location.pathname.startsWith(routes.LIBRARY) && "bg-accent"
                  )}>
                    <LibraryBig className="h-4 w-4" />
                    <span>Library</span>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 opacity-50" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 pb-1">
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={cn(
                          "px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-sm text-muted-foreground hover:text-foreground",
                          location.pathname === routes.LIBRARY && !libraryFilterCategory && "bg-accent text-foreground"
                        )}
                        onClick={() => {
                          setLibraryFilterCategory('');
                          navigate(routes.LIBRARY);
                        }}
                      >
                        <span>All Series</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    {categories.map((category) => (
                      <SidebarMenuSubItem key={category.id}>
                        <ContextMenu>
                          <ContextMenuTrigger>
                            <SidebarMenuSubButton
                              className={cn(
                                "px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-sm text-muted-foreground hover:text-foreground group/item",
                                location.pathname === routes.LIBRARY && libraryFilterCategory === category.id && "bg-accent text-foreground"
                              )}
                              onClick={() => {
                                setLibraryFilterCategory(category.id);
                                navigate(routes.LIBRARY);
                              }}
                            >
                              <span>{category.label}</span>
                              <div className="ml-auto hidden group-hover/item:flex gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-accent"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCategory(category);
                                    setShowingEditCategoryDialog(true);
                                  }}
                                >
                                  <PencilIcon className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-accent"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCategory(category);
                                    setShowingRemoveCategoryDialog(true);
                                  }}
                                >
                                  <Trash2Icon className="h-3 w-3" />
                                </Button>
                              </div>
                            </SidebarMenuSubButton>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-40">
                            <ContextMenuItem
                              onClick={() => {
                                setSelectedCategory(category);
                                setShowingEditCategoryDialog(true);
                              }}
                            >
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Edit category
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() => {
                                setSelectedCategory(category);
                                setShowingRemoveCategoryDialog(true);
                              }}
                            >
                              <Trash2Icon className="h-4 w-4 mr-2" />
                              Delete category
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </SidebarMenuSubItem>
                    ))}
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className="px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-sm text-muted-foreground/50 hover:text-muted-foreground"
                        onClick={() => setShowingNewCategoryDialog(true)}
                      >
                        <span>New category...</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate(routes.DOWNLOADS)}
                className={cn(
                  "px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors",
                  location.pathname === routes.DOWNLOADS && "bg-accent"
                )}
              >
                <FolderDown className="h-4 w-4" />
                <span>Downloads</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <Dialog>
              <DialogTrigger asChild>
                <SidebarMenuButton className="px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <SettingsDialogContent />
            </Dialog>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Dialog>
              <DialogTrigger asChild>
                <SidebarMenuButton
                  className="px-3 py-3 rounded-lg bg-primary hover:bg-primary/90 transition-colors text-primary-foreground hover:text-primary-foreground/90"
                >
                  <Heart className="h-4 w-4 fill-current" />
                  <span className="font-medium">Support Comicers</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Support Comicers Development</DialogTitle>
                  <DialogDescription>
                    Help us make Comicers even better by supporting the project
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Benefit</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Feature Voting</TableCell>
                        <TableCell>Get a vote on upcoming features and influence development priorities</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Discord Role</TableCell>
                        <TableCell>Exclusive Supporter role in our Discord community</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Early Access</TableCell>
                        <TableCell>Test new features before they're released</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Priority Support</TableCell>
                        <TableCell>Get faster responses to your questions and issues</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  <Tabs defaultValue="github" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="github" className="flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        GitHub
                      </TabsTrigger>
                      <TabsTrigger value="crypto" className="flex items-center gap-2">
                        <Bitcoin className="h-4 w-4" />
                        Crypto
                      </TabsTrigger>
                      <TabsTrigger value="other" className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Other
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="github" className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Support us through GitHub Sponsors with monthly or one-time donations.
                      </p>
                      <Button 
                        className="w-full"
                        onClick={() => window.open('https://github.com/sponsors/TheFizFactor', '_blank')}
                      >
                        <Github className="mr-2 h-4 w-4" />
                        Sponsor on GitHub
                      </Button>
                    </TabsContent>
                    <TabsContent value="crypto" className="space-y-4">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label>Bitcoin (BTC)</Label>
                          <code className="relative block w-full rounded bg-muted p-3 font-mono text-sm">
                            bc1qpwvvrjzdwjgw94wknas7yk0qlurh46exwqjvdp
                          </code>
                        </div>
                        <div className="space-y-2">
                          <Label>Litecoin (LTC)</Label>
                          <code className="relative block w-full rounded bg-muted p-3 font-mono text-sm">
                            LNrQarKkQqm4GVLk7yAz3vic7cXhKqFXjz
                          </code>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="other" className="space-y-4">
                      <div className="grid gap-4">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.open('https://www.buymeacoffee.com/comicers', '_blank')}
                        >
                          Buy Me a Coffee
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.open('https://ko-fi.com/comicers', '_blank')}
                        >
                          Support on Ko-fi
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors text-xs text-muted-foreground">
                    <span>v{packageJson.version}</span>
                    <Info className="ml-auto h-3 w-3" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] rounded-lg"
                  side="right"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuItem 
                      onClick={() => handleUpdateCheck()}
                      disabled={checkingForUpdate}
                      className="cursor-pointer"
                    >
                      {checkingForUpdate ? 'Checking...' : 'Check for updates'}
                    </DropdownMenuItem>
                    <DialogTrigger asChild>
                      <DropdownMenuItem className="cursor-pointer">
                        About Comicers
                      </DropdownMenuItem>
                    </DialogTrigger>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About Comicers</DialogTitle>
                  <DialogDescription>v{packageJson.version}</DialogDescription>
                </DialogHeader>
                <div>
                  <p className="text-muted-foreground">
                    Comicers is a desktop manga reader. To add a series to your library, click the{' '}
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                      Explorer
                    </code>{' '}
                    tab on the left panel and search for the series from a supported content source.
                    To add more content sources, install a{' '}
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                      Plugin
                    </code>
                    .
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="secondary" asChild>
                    <a href={packageJson.repository.url} target="_blank" className="inline-flex items-center">
                      <GitFork className="mr-2 h-4 w-4" />
                      Repository
                    </a>
                  </Button>
                  <Button asChild>
                    <a href={packageJson.homepage} target="_blank" className="inline-flex items-center">
                      <Home className="mr-2 h-4 w-4" />
                      Official Website
                    </a>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
