import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: 'https://gpsarathy.github.io',
  // base: '/site',
  integrations: [mdx(), sitemap(), react(),
  tailwind(
    {
      applyBaseStyles: false,
    }
  ),
  ],
  redirects: {
    '/': '/about'
  }
});