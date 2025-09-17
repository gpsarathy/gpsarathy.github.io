import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

import solidJs from "@astrojs/solid-js";

import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  site: 'https://gpsarathy.github.io',
  integrations: [mdx(), sitemap(), react(
    {
      include: ['**/react/*'],
    }
  ), solidJs({
    include: ['**/solid/*'],
  }), vue()],
  redirects: {
    '/': '/about'
  },
  vite: {    plugins: [tailwindcss()],  },
});