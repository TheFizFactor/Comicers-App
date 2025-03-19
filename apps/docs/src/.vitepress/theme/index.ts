// https://vitepress.dev/guide/custom-theme
import DefaultTheme from 'vitepress/theme';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import './styles/vars.css';
import './styles/custom.css';

export default {
  ...DefaultTheme,
  enhanceApp({ app, router, siteData }: { 
    app: any, 
    router: any, 
    siteData: any 
  }) {
    enhanceAppWithTabs(app);
  },
};
