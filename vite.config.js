import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

let publicBase = '/'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'public-image-base',
      apply: 'build',
      configResolved(config) {
        publicBase = config.base
      },
      renderChunk(code) {
        if (publicBase === '/') return null
        // Vite rewrites static assets. Dynamic public image paths are strings.
        const updated = code.replace(/(?<![\w/])\/images\//g, `${publicBase}images/`)
        return updated === code ? null : { code: updated, map: null }
      },
    },
  ],
  build: { outDir: 'release' },
})
