import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './scripts/site-url.mjs';

// Live production URL. Override with SITE_URL at build time if the site moves.
const site = SITE_URL;

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/admin') && !page.includes('/shop/order'),
    }),
  ],
});
