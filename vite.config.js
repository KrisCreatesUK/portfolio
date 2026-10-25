import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5188,
    strictPort: true,
  },
  /* School Chromebooks past their update date are stuck on old Chrome for
     good. Vite's default target is newer than that, so the script would not
     even parse there and the page never got past its loading screen. */
  build: {
    target: ['es2020', 'chrome87', 'edge88', 'firefox78', 'safari14'],
  },
})
