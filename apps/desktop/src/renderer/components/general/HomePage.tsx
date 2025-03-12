import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@comicers/ui/components/Button';
import { ScrollArea } from '@comicers/ui/components/ScrollArea';
import { Card, CardContent, CardHeader, CardTitle } from '@comicers/ui/components/Card';
const { ipcRenderer } = require('electron');
import ipcChannels from '@/common/constants/ipcChannels.json';
import { SidebarProvider } from '@comicers/ui/components/Sidebar';
import { DashboardSidebar } from './DashboardSidebar';

interface ReleaseInfo {
    version: string;
    releaseDate: string;
    notes: string;
}

export default function HomePage() {
    const [releases, setReleases] = useState<ReleaseInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch the latest releases from GitHub
        ipcRenderer
            .invoke(ipcChannels.APP.GET_RELEASE_NOTES)
            .then((notes: string) => {
                // For now, we'll just show the latest release
                setReleases([
                    {
                        version: 'Latest',
                        releaseDate: new Date().toLocaleDateString(),
                        notes: notes
                    }
                ]);
                setLoading(false);
            })
            .catch(console.error);
    }, []);

    return (

        <div className="px-2 w-full">
            <div className="container mx-auto p-6 space-y-8 mb-3">
                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-lg shadow-lg bg-[#9CEE69] border-4 border-black p-8">
                    <div className="relative z-10">
                        <h1 className="text-4xl font-bold mb-4 text-black">Welcome to Comicers</h1>
                        <p className="text-lg mb-6 text-black/80">
                            Your ultimate comic reading and management companion. Start exploring your library or discover new comics today.
                        </p>
                        <div className="flex gap-4">
                            <Button variant={'secondary'}>
                                <Link to="/library">Browse Library</Link>
                            </Button>
                            <Button variant={'secondary'}>
                                <Link to="/search">Discover Comics</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Release Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Latest Updates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center p-4">Loading release notes...</div>
                        ) : (
                            <ScrollArea className="h-[400px]">
                                {releases.map((release, index) => (
                                    <div key={index} className="mb-6 last:mb-0">
                                        <h3 className="text-lg font-semibold mb-2">
                                            Version {release.version} • {release.releaseDate}
                                        </h3>
                                        <div className="prose prose-sm max-w-none">
                                            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                                                {release.notes}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 