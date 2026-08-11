// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://www.dsdshouse.com',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    sitemap({
      // 비공개 도구·인쇄뷰·구 경로 리다이렉트는 색인 대상이 아닙니다.
      filter: (page) =>
        !page.includes("/church-bulletin/editor") &&
        !page.includes("/church-bulletin/print") &&
        !page.includes("/storage"),
    }),
  ],
  vite: { plugins: [tailwind()] },
});
