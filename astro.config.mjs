// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  adapter: cloudflare(),
  build: {
    inlineStylesheets: 'never',
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
