declare module 'vitepress' {
  import { ComponentOptions } from 'vue'
  
  export interface Theme {
    Layout: ComponentOptions
    NotFound?: ComponentOptions
    enhanceApp?: (ctx: { app: any, router: any, siteData: any }) => void | Promise<void>
  }

  export function defineConfig(config: any): any
}

declare module '*.vue' {
  import type { ComponentOptions } from 'vue'
  const Component: ComponentOptions
  export default Component
}

declare module '*.md' {
  import type { ComponentOptions } from 'vue'
  const Component: ComponentOptions
  export default Component
}

declare module '@theme/*' {
  const content: any
  export default content
}

declare module 'vitepress/dist/client/*' {
  const content: any
  export default content
}

declare module 'vitepress-plugin-tabs' {
  const content: any
  export const tabsMarkdownPlugin: any
  export default content
} 