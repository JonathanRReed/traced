// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// TRACED is fully static, so it needs no adapter: Cloudflare Pages serves
// `dist/` as plain files, and `public/_headers` is copied through untouched.
// https://astro.build/config
export default defineConfig({
  site: 'https://traced.jonathanrreed.com',
  output: 'static',
  trailingSlash: 'always',
  // Astro 7 defaults to JSX-style whitespace, which glues inline elements
  // together. The pages here are prose, so keep HTML whitespace rules.
  compressHTML: true,
  build: {
    // Each page's own few hundred bytes of CSS ride along in the HTML instead
    // of costing a second render-blocking request. The shared sheet stays a file.
    inlineStylesheets: 'auto',
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
