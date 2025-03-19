import { Octokit } from '@octokit/rest'

const octokit = new Octokit()

interface Asset {
  name: string
  browser_download_url: string
  created_at: string
  platform: string
}

export interface ReleaseData {
  version: string
  releaseDateStr: string
  releaseDaysAgo: number
  assets: Asset[]
}

export async function load(): Promise<ReleaseData> {
  try {
    const { data } = await octokit.repos.getLatestRelease({
      owner: 'TheFizFactor',
      repo: 'Comicers-App'
    })

    const releaseDate = new Date(data.published_at || data.created_at)
    const daysAgo = Math.floor((Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24))

    const assets = data.assets.map(asset => {
      let platform = 'Unknown'
      if (asset.name.includes('win') || asset.name.endsWith('.exe')) {
        platform = 'Windows'
      } else if (asset.name.includes('mac') || asset.name.endsWith('.dmg')) {
        platform = 'macOS'
      } else if (asset.name.includes('linux') || asset.name.endsWith('.AppImage') || asset.name.endsWith('.deb') || asset.name.endsWith('.rpm')) {
        platform = 'Linux'
      }

      return {
        name: asset.name,
        browser_download_url: asset.browser_download_url,
        created_at: new Date(asset.created_at).toLocaleDateString(),
        platform
      }
    })

    return {
      version: data.tag_name.replace(/^v/, ''),
      releaseDateStr: releaseDate.toLocaleDateString(),
      releaseDaysAgo: daysAgo,
      assets
    }
  } catch (error) {
    console.error('Failed to fetch release data:', error)
    throw error
  }
}