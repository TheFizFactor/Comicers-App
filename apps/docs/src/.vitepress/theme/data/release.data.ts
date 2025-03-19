// Using native fetch API
interface Asset {
  name: string
  size: number
  browser_download_url: string
}

interface ReleaseData {
  version: string
  releaseDate: string
  assets: Asset[]
}

function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

function getPlatformFromAsset(assetName: string): string {
  if (assetName.includes('win32')) return 'Windows'
  if (assetName.includes('darwin')) return 'macOS'
  if (assetName.includes('linux')) return 'Linux'
  return 'Unknown'
}

export async function load(): Promise<ReleaseData | null> {
  try {
    const response = await fetch('https://api.github.com/repos/TheFizFactor/Comicers-App/releases/latest', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Comicers-Docs'
      }
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    if (!data) {
      throw new Error('No release data found')
    }

    return {
      version: data.tag_name || 'Unknown',
      releaseDate: data.published_at ? new Date(data.published_at).toLocaleDateString() : 'Unknown',
      assets: data.assets.map((asset: any) => ({
        name: asset.name,
        size: asset.size,
        browser_download_url: asset.browser_download_url
      }))
    }
  } catch (error) {
    console.error('Error fetching release data:', error)
    return null
  }
}