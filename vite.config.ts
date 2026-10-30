import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps asset paths relative so the build works on GitHub Pages
// (served from /<repo-name>/) as well as at a domain root.
export default defineConfig({
  base: './',
  plugins: [react()],
});
