import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://empleo-ai.anlakstudio.com',
  output: 'static',
  integrations: [
    react(),
    tailwind(),
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-ES', en: 'en-US' },
      },
      serialize: (item) => {
        if (item.url.includes('/ocupacion/')) {
          item.changefreq = 'monthly';
          item.priority = 0.8;
        } else if (item.url.includes('/sector/')) {
          item.changefreq = 'monthly';
          item.priority = 0.9;
        } else if (item.url.includes('llms')) {
          item.changefreq = 'monthly';
          item.priority = 0.7;
        }
        return item;
      },
    }),
  ],
  vite: {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    ssr: {
      noExternal: ['react-i18next', 'i18next'],
    },
  },
});
