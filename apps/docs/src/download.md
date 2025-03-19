---
editLink: false
prev: false
next: false
---
<script setup>
import { useData } from 'vitepress'
import { ref, onMounted } from 'vue'
import VPButton from "vitepress/dist/client/theme-default/components/VPButton.vue"
import * as releaseData from '@theme/data/release.data'

const { theme } = useData()
const release = ref({
  version: '0.0.0',
  releaseDateStr: new Date().toLocaleDateString(),
  releaseDaysAgo: 0,
  assets: []
})
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    release.value = await releaseData.load()
  } catch (e) {
    console.error('Failed to load release data:', e)
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

# Download Comicers

<div class="custom-container tip">
  <p class="title">Recommended Installation</p>
  <p>For the best experience, download Comicers directly from our website. This ensures you get the official release with all security updates.</p>
</div>

<div v-if="loading" class="custom-container loading">
  <p class="title">Loading Release Information</p>
  <p>Please wait while we fetch the latest version information...</p>
</div>

<div v-else-if="error" class="custom-container danger">
  <p class="title">Error Loading Release Information</p>
  <p>We're having trouble loading the release information. Please try again later or visit our <a href="https://github.com/TheFizFactor/Comicers-App/releases">GitHub releases page</a>.</p>
</div>

<div v-else>
  <div class="custom-container info">
    <p class="title">Latest Release</p>
    <p>Comicers version {{ release.version }} was released on {{ release.releaseDateStr }} ({{ release.releaseDaysAgo }} days ago).</p>
  </div>

  <div class="download-section">
    <h2>Download for Your Platform</h2>
    <table class="downloadTable" v-if="release.assets && release.assets.length">
      <thead>
        <tr>
          <th>Platform</th>
          <th>Download</th>
          <th>Built</th>
          <th>Size</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="asset in release.assets" :key="asset.platform">
          <td>{{ asset.platform }}</td>
          <td><VPButton :href="asset.browser_download_url" :text="asset.name" theme="brand" /></td>
          <td>{{ asset.buildTimeStr }}</td>
          <td>{{ asset.size }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="custom-container warning">No downloads are currently available.</p>
  </div>

  <div class="custom-container warning">
    <p class="title">Alternative Downloads</p>
    <p>Additional versions and previous releases are available from the <a href="https://github.com/TheFizFactor/Comicers-App/releases">GitHub releases page</a>.</p>
  </div>

  <div class="system-requirements">
    <h2>System Requirements</h2>
    <div class="requirements-grid">
      <div class="requirement-item">
        <h3>Windows</h3>
        <ul>
          <li>Windows 10 or later</li>
          <li>4GB RAM minimum</li>
          <li>500MB free disk space</li>
        </ul>
      </div>
      <div class="requirement-item">
        <h3>macOS</h3>
        <ul>
          <li>macOS 10.15 or later</li>
          <li>4GB RAM minimum</li>
          <li>500MB free disk space</li>
        </ul>
      </div>
      <div class="requirement-item">
        <h3>Linux</h3>
        <ul>
          <li>Most modern distributions</li>
          <li>4GB RAM minimum</li>
          <li>500MB free disk space</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="installation-guide">
    <h2>Installation Guide</h2>
    <div class="guide-steps">
      <div class="step">
        <h3>1. Download</h3>
        <p>Click the download button for your platform above to get the latest version.</p>
      </div>
      <div class="step">
        <h3>2. Install</h3>
        <ul>
          <li><strong>Windows:</strong> Run the installer (.exe) and follow the prompts</li>
          <li><strong>macOS:</strong> Open the .dmg file and drag Comicers to Applications</li>
          <li><strong>Linux:</strong> Use your package manager or run the AppImage</li>
        </ul>
      </div>
      <div class="step">
        <h3>3. First Launch</h3>
        <p>On first launch, you'll be guided through the initial setup process.</p>
      </div>
    </div>
  </div>

  <div class="custom-container tip">
    <p class="title">Next Steps</p>
    <p>After installation, check out our <a href="./guides/getting-started">Getting Started Guide</a> to learn how to use Comicers effectively.</p>
  </div>
</div>

<style scoped>
.downloadTable {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.downloadTable th,
.downloadTable td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-divider);
}

.downloadTable th {
  font-weight: 600;
  background-color: var(--vp-c-bg-soft);
}

.requirements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 1rem 0;
}

.requirement-item {
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
}

.requirement-item h3 {
  margin-top: 0;
  color: var(--vp-c-brand);
}

.requirement-item ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.guide-steps {
  display: grid;
  gap: 1.5rem;
  margin: 1rem 0;
}

.step {
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
}

.step h3 {
  margin-top: 0;
  color: var(--vp-c-brand);
}

.step ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.custom-container {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 8px;
}

.loading {
  background-color: var(--vp-c-bg-soft);
  border-left: 4px solid var(--vp-c-brand);
}

.danger {
  background-color: var(--vp-c-red-soft);
  border-left: 4px solid var(--vp-c-red);
}

.info {
  background-color: var(--vp-c-brand-soft);
  border-left: 4px solid var(--vp-c-brand);
}
</style>