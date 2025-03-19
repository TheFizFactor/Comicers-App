import { Octokit } from '@octokit/rest';

interface Asset {
  platform: string;
  name: string;
  browser_download_url: string;
  buildTimeStr: string;
  size: string;
}

interface ReleaseData {
  version: string;
  releaseDateStr: string;
  releaseDaysAgo: number;
  assets: Asset[];
}

export async function load(): Promise<ReleaseData> {
  try {
    const octokit = new Octokit();
    const { data: releases } = await octokit.repos.listReleases({
      owner: 'TheFizFactor',
      repo: 'Comicers-App',
      per_page: 1
    });

    if (!releases.length) {
      return {
        version: '0.0.0',
        releaseDateStr: new Date().toLocaleDateString(),
        releaseDaysAgo: 0,
        assets: []
      };
    }

    const latestRelease = releases[0];
    const releaseDate = new Date(latestRelease.published_at || latestRelease.created_at);
    const daysAgo = Math.floor((Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));

    const assets: Asset[] = latestRelease.assets.map(asset => {
      const size = formatSize(asset.size);
      const buildTime = new Date(asset.updated_at);
      
      return {
        platform: getPlatformFromAsset(asset.name),
        name: asset.name,
        browser_download_url: asset.browser_download_url,
        buildTimeStr: buildTime.toLocaleDateString(),
        size
      };
    });

    return {
      version: latestRelease.tag_name.replace(/^v/, ''),
      releaseDateStr: releaseDate.toLocaleDateString(),
      releaseDaysAgo: daysAgo,
      assets
    };
  } catch (error) {
    console.error('Error loading release data:', error);
    throw error;
  }
}

function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function getPlatformFromAsset(filename: string): string {
  if (filename.includes('win32') || filename.endsWith('.exe')) return 'Windows';
  if (filename.includes('darwin') || filename.endsWith('.dmg')) return 'macOS';
  if (filename.includes('linux') || filename.endsWith('.AppImage')) return 'Linux';
  return 'Unknown';
} 