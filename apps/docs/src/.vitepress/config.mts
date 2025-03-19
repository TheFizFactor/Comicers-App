import { defineConfig } from 'vitepress';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Comicers',
  description: 'Free manga reader for the desktop',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#7048E8' }]
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Download', link: '/download' },
      { text: 'Documentation', link: '/guides/getting-started' },
    ],

    logo: '/logo.png',

    sidebar: [
      {
        text: 'Download',
        link: '/download',
      },
      {
        text: 'Repository',
        link: 'https://github.com/TheFizFactor/Comicers-App',
      },
      {
        text: 'Guides',
        items: [
          { text: 'Getting Started', link: '/guides/getting-started' },
          {
            text: 'Adding Content',
            collapsed: false,
            items: [
              { text: 'Adding from Filesystem', link: '/guides/adding-content/filesystem' },
              { text: 'Adding from Websites', link: '/guides/adding-content/websites' },
            ],
          },
          { text: 'Customize', link: '/guides/customize' },
          { text: 'Offline Downloading', link: '/guides/offline-download' },
          { text: 'Trackers', link: '/guides/trackers' },
          { text: 'Reading List Management', link: '/guides/reading-list' },
          { text: 'Experimental Features', link: '/guides/experimental-features' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/TheFizFactor/Comicers-App' }],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the Comicers License.',
      copyright: 'Copyright © 2018-present TheFizFactor'
    }
  },
  markdown: {
    config: (md: any) => {
      md.use(tabsMarkdownPlugin);
    },
  },
  vite: {
    optimizeDeps: {
      include: ['@octokit/core', '@octokit/rest']
    },
    ssr: {
      noExternal: ['@octokit/core', '@octokit/rest']
    }
  }
});
