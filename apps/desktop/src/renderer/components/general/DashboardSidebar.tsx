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
  Search,
  LibraryBig,
  PencilIcon,
  Settings,
  Compass,
  Plus,
  BookOpen,
  Blocks,
  Trash2Icon,
  MessageCircle,
  ChartBar,
  Star,
  Vote,
  Sparkles,
  Headphones,
  Wallet,
  Copy,
  Coffee,
  History,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@comicers/ui/components/Tabs';
import { Bitcoin, Coins, Github } from 'lucide-react';
import { Label } from '@comicers/ui/components/Label';
import { Separator } from '@comicers/ui/components/Separator';
import { useToast } from '@comicers/ui/hooks/use-toast';

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
  const { toast } = useToast();

  const handleUpdateCheck = () => {
    if (!checkingForUpdate) {
      setCheckingForUpdate(true);
      ipcRenderer
        .invoke(ipcChannels.APP.CHECK_FOR_UPDATES)
        .then((result) => {
          if (result?.error) {
            // Handle specific update errors
            if (result.error.includes('not signed') || result.error.includes('SignerCertificate')) {
              toast({
                title: "Update Error",
                description: "Unable to install update - the new version isn't properly signed. Please download the latest version manually from our website.",
                variant: "destructive"
              });
            } else {
              toast({
                title: "Update Error",
                description: "Failed to check for updates. Please try again later or download manually from our website.",
                variant: "destructive"
              });
            }
          }
        })
        .catch((error) => {
          console.error('Update check error:', error);
          toast({
            title: "Update Error",
            description: "Failed to check for updates. Please try again later or download manually from our website.",
            variant: "destructive"
          });
        })
        .finally(() => setCheckingForUpdate(false));
    }
  };

  return (
    <Sidebar className="bg-card border-r-0 shadow-sm" {...props}>
      <SidebarHeader className="pt-8 px-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center overflow-hidden rounded-xl hover:scale-105 transition-transform duration-300">
            <img src="https://i.ibb.co/nNTCkn0C/Untitled-6.png" alt="Comicers" 
              className="h-16 w-16 object-contain" 
            />
          </div>
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
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate('/')}
                className={cn(
                  "px-3 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out group",
                  (location.pathname === '/' || location.pathname === '') && "bg-accent text-accent-foreground shadow-sm"
                )}
              >
                <Home className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate(routes.OVERVIEW)}
                className={cn(
                  "px-3 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out group",
                  location.pathname === routes.OVERVIEW && "bg-accent text-accent-foreground shadow-sm"
                )}
              >
                <ChartBar className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-[2px]" />
                <span>Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => navigate(routes.FORUM)}
                className={cn(
                  "px-3 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out group",
                  location.pathname === routes.FORUM && "bg-accent text-accent-foreground shadow-sm"
                )}
              >
                <MessageCircle className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                <span>Community</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible asChild defaultOpen={true} className="collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className={cn(
                    "px-3 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out group",
                    location.pathname.startsWith(routes.SEARCH) && "bg-accent text-accent-foreground shadow-sm"
                  )}>
                    <Compass className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
                    <span>Explorer</span>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-90 opacity-50" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 pb-1">
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={cn(
                          "px-3 py-2 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out text-sm text-muted-foreground hover:text-foreground group",
                          location.pathname === routes.SEARCH && "bg-accent text-accent-foreground shadow-sm"
                        )}
                        onClick={() => navigate(routes.SEARCH)}
                      >
                        <Search className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12" />
                        <span>Browse All</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={cn(
                          "px-3 py-2 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out text-sm text-muted-foreground hover:text-foreground group",
                          location.pathname === routes.PLUGINS && "bg-accent text-accent-foreground shadow-sm"
                        )}
                        onClick={() => navigate(routes.PLUGINS)}
                      >
                        <Blocks className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-180" />
                        <span>Plugins</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <Collapsible asChild defaultOpen={true} className="collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className={cn(
                    "px-3 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out group",
                    location.pathname.startsWith(routes.LIBRARY) && "bg-accent text-accent-foreground shadow-sm"
                  )}>
                    <LibraryBig className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    <span>Library</span>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-90 opacity-50" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 pb-1">
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={cn(
                          "px-3 py-2 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out text-sm text-muted-foreground hover:text-foreground group",
                          location.pathname === routes.LIBRARY && !libraryFilterCategory && "bg-accent text-accent-foreground shadow-sm"
                        )}
                        onClick={() => {
                          setLibraryFilterCategory('');
                          navigate(routes.LIBRARY);
                        }}
                      >
                        <BookOpen className="h-4 w-4 transition-all duration-300 group-hover:-rotate-12 group-hover:scale-110" />
                        <span>All Series</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>

                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={cn(
                          "px-3 py-2 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out text-sm text-muted-foreground hover:text-foreground group",
                          location.pathname === `${routes.LIBRARY}/favorites` && "bg-accent text-accent-foreground shadow-sm"
                        )}
                        onClick={() => navigate(`${routes.LIBRARY}/favorites`)}
                      >
                        <Heart className="h-4 w-4 mr-2 transition-all duration-300 group-hover:scale-125 group-hover:text-red-500 group-hover:fill-red-500" />
                        <span>Favorites</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>

                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={cn(
                          "px-3 py-2 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out text-sm text-muted-foreground hover:text-foreground group",
                          location.pathname === `${routes.LIBRARY}/history` && "bg-accent text-accent-foreground shadow-sm"
                        )}
                        onClick={() => navigate(`${routes.LIBRARY}/history`)}
                      >
                        <History className="h-4 w-4 mr-2 transition-all duration-300 group-hover:-rotate-360" />
                        <span>Reading History</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>

                    {categories.map((category) => (
                      <SidebarMenuSubItem key={category.id}>
                        <ContextMenu>
                          <ContextMenuTrigger>
                            <SidebarMenuSubButton
                              className={cn(
                                "px-3 py-2 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out text-sm text-muted-foreground hover:text-foreground group",
                                location.pathname === routes.LIBRARY && libraryFilterCategory === category.id && "bg-accent text-accent-foreground shadow-sm"
                              )}
                              onClick={() => {
                                setLibraryFilterCategory(category.id);
                                navigate(routes.LIBRARY);
                              }}
                            >
                              <span>{category.label}</span>
                              <div className="ml-auto hidden hover:flex gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-accent/50 transition-colors duration-200"
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
                                  className="h-6 w-6 hover:bg-accent/50 transition-colors duration-200"
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
                        className="px-3 py-2 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out text-sm text-muted-foreground hover:text-foreground group"
                        onClick={() => setShowingNewCategoryDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
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
                  "px-3 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out group",
                  location.pathname === routes.DOWNLOADS && "bg-accent text-accent-foreground shadow-sm"
                )}
              >
                <FolderDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-[2px]" />
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
                <SidebarMenuButton className="px-3 py-5 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out group">
                  <Settings className="h-4 w-4 transition-transform duration-500 ease-in-out group-hover:rotate-180" />
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
                  className="px-3 py-3 rounded-lg bg-primary hover:bg-primary/90 transition-all duration-200 ease-in-out text-primary-foreground hover:text-primary-foreground/90 shadow-sm group"
                >
                  <Heart className="h-4 w-4 fill-current transition-all duration-300 group-hover:scale-125 group-hover:text-red-300" />
                  <span className="font-medium">Support Comicers</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-2xl">
                    <Heart className="h-6 w-6 text-primary fill-primary" />
                    Support Comicers
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Help us make Comicers even better by supporting the project
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="bg-muted/50 rounded-lg p-4 border shadow-sm">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary fill-primary" />
                      Supporter Benefits
                    </h3>
                    <div className="grid gap-3">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Vote className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Feature Voting</p>
                          <p className="text-sm text-muted-foreground">Get a vote on upcoming features and influence development priorities</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Discord Role</p>
                          <p className="text-sm text-muted-foreground">Exclusive Supporter role in our Discord community</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Early Access</p>
                          <p className="text-sm text-muted-foreground">Test new features before they're released</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Headphones className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Priority Support</p>
                          <p className="text-sm text-muted-foreground">Get faster responses to your questions and issues</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Support Options
                    </h3>
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
                          <Coffee className="h-4 w-4" />
                          Other
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="github" className="space-y-4">
                        <div className="bg-muted/30 rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-muted-foreground">
                            Support us through GitHub Sponsors with monthly or one-time donations. GitHub Sponsors is the preferred way to support Comicers as it helps us maintain and improve the project.
                          </p>
                        </div>
                        <Button 
                          className="w-full shadow-sm"
                          onClick={() => window.open('https://github.com/sponsors/TheFizFactor', '_blank')}
                        >
                          <Github className="mr-2 h-4 w-4" />
                          Sponsor on GitHub
                        </Button>
                      </TabsContent>
                      <TabsContent value="crypto" className="space-y-4">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Bitcoin className="h-4 w-4" />
                              Bitcoin (BTC)
                            </Label>
                            <div className="relative">
                              <code className="relative block w-full rounded bg-muted p-3 font-mono text-sm shadow-sm">
                                bc1qpwvvrjzdwjgw94wknas7yk0qlurh46exwqjvdp
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-2 h-6 hover:bg-accent/50 transition-colors duration-200"
                                onClick={() => {
                                  navigator.clipboard.writeText('bc1qpwvvrjzdwjgw94wknas7yk0qlurh46exwqjvdp');
                                  toast({
                                    title: "Copied to clipboard",
                                    description: "BTC address has been copied to your clipboard"
                                  });
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Coins className="h-4 w-4" />
                              Litecoin (LTC)
                            </Label>
                            <div className="relative">
                              <code className="relative block w-full rounded bg-muted p-3 font-mono text-sm shadow-sm">
                                LNrQarKkQqm4GVLk7yAz3vic7cXhKqFXjz
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-2 h-6 hover:bg-accent/50 transition-colors duration-200"
                                onClick={() => {
                                  navigator.clipboard.writeText('LNrQarKkQqm4GVLk7yAz3vic7cXhKqFXjz');
                                  toast({
                                    title: "Copied to clipboard",
                                    description: "LTC address has been copied to your clipboard"
                                  });
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="other" className="space-y-4">
                        <div className="grid gap-4">
                          <Button 
                            variant="outline" 
                            className="w-full shadow-sm"
                            onClick={() => window.open('https://www.buymeacoffee.com/comicers', '_blank')}
                          >
                            <Coffee className="mr-2 h-4 w-4" />
                            Buy Me a Coffee
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full shadow-sm"
                            onClick={() => window.open('https://ko-fi.com/comicers', '_blank')}
                          >
                            <Coffee className="mr-2 h-4 w-4" />
                            Support on Ko-fi
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="px-3 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out text-xs text-muted-foreground group">
                    <span>v{packageJson.version}</span>
                    <Info className="ml-auto h-3 w-3 transition-transform duration-300 group-hover:rotate-12" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] rounded-lg shadow-sm"
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
