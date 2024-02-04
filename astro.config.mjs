import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

import solidJs from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
  site: 'https://gpsarathy.github.io',
  base: '/site',
  integrations: [mdx(), sitemap(), react(
    {
      include: ['**/react/*'],
    }
  ), tailwind({
    applyBaseStyles: false
  }), solidJs({
    include: ['**/solid/*'],
  })],
  redirects: {
    '/': '/about'
  }
});