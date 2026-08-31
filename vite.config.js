// Polyfill crypto.getRandomValues for Node.js environment
import crypto from 'node:crypto'
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = {}
}
if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = (array) => {
    const bytes = crypto.randomBytes(array.length)
    for (let i = 0; i < bytes.length; i++) {
      array[i] = bytes[i]
    }
    return array
  }
}

import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    uni()
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/minimax': {
        target: 'http://103.143.81.165:9527',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/minimax/, '')
      },
      '/volcano': {
        target: 'https://ark.cn-beijing.volces.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/volcano/, '')
      },
      '/agnes': {
        target: 'https://apihub.agnes-ai.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/agnes/, '')
      },
      '/agnes-cdn': {
        target: 'https://platform-outputs.agnes-ai.space',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/agnes-cdn/, '')
      }
    }
  }
})
