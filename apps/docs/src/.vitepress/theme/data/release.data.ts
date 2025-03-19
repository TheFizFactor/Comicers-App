import fetch from 'node-fetch'

interface Asset {
  name: string
  browser_download_url: string
  size: number
  platform?: 'windows' | 'mac' | 'linux'
}

interface ReleaseData {
  version: string
  name: string
  publishedAt: string
  daysAgo: number
  assets: Asset[]
}

export async function load(): Promise<{ release: ReleaseData | null }> {
  try {
    const response = await fetch('https://api.github.com/repos/TheFizFactor/Comicers-App/releases/latest', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Comicers-Docs'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`)
    }

    const data = await response.json()

    // Process assets to determine platform
    const assets = data.assets.map((asset: any) => {
      const assetData: Asset = {
        name: asset.name,
        browser_download_url: asset.browser_download_url,
        size: asset.size
      }

      if (asset.name.endsWith('.exe')) {
        assetData.platform = 'windows'
      } else if (asset.name.endsWith('.dmg')) {
        assetData.platform = 'mac'
      } else if (asset.name.endsWith('.AppImage') || asset.name.endsWith('.deb') || asset.name.endsWith('.rpm')) {
        assetData.platform = 'linux'
      }

      return assetData
    })

    // Calculate days ago
    const publishedDate = new Date(data.published_at || Date.now())
    const now = new Date()
    const daysAgo = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24))

    return {
      release: {
        version: data.tag_name,
        name: data.name || `Release ${data.tag_name}`,
        publishedAt: publishedDate.toLocaleDateString(),
        daysAgo,
        assets
      }
    }
  } catch (error) {
    console.error('Failed to fetch latest release:', error)
    return { release: null }
  }
}