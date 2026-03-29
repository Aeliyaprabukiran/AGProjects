import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// The app is deployed to GitHub Pages under a repo subpath (e.g. https://<user>.github.io/multi-tool-dashboard/).
// Setting base ensures generated asset URLs include the repo name and prevent 404s.
export default defineConfig({
  base: '/multi-tool-dashboard/',
  plugins: [react()],
})
