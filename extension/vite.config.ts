import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const outDir = resolve(projectRoot, "dist");

function copyManifest(): Plugin {
  return {
    name: "copy-extension-manifest",
    async closeBundle() {
      await mkdir(outDir, { recursive: true });
      await cp(resolve(projectRoot, "manifest.json"), resolve(outDir, "manifest.json"));
    }
  };
}

export default defineConfig({
  plugins: [react(), copyManifest()],
  build: {
    outDir,
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        background: resolve(projectRoot, "src/background/service-worker.ts"),
        content: resolve(projectRoot, "src/content/index.ts")
      },
      output: {
        entryFileNames(chunk) {
          if (chunk.name === "background") {
            return "background/service-worker.js";
          }

          if (chunk.name === "content") {
            return "content/index.js";
          }

          return "assets/[name].js";
        },
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});

