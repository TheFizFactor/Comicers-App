// electron.vite.config.ts
import path from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
var __electron_vite_injected_dirname = "C:\\Users\\GOD\\Videos\\comicers-2.16.0\\apps\\desktop";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@": path.join(__electron_vite_injected_dirname, "src")
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        "@": path.join(__electron_vite_injected_dirname, "src")
      }
    }
  },
  renderer: {
    plugins: [
      nodePolyfills({
        include: ["path", "fs", "constants", "stream", "util", "zlib"]
      })
    ],
    resolve: {
      alias: {
        "@": path.join(__electron_vite_injected_dirname, "src")
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
