// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://www.dsdshouse.com',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // 구 경로 보호 — 자동화 카테고리를 Works로 합치면서 이동했습니다.
  // /automation/church-bulletin/{editor,print}는 실제 페이지라 영향받지 않습니다.
  redirects: {
    '/automation': '/works',
    '/automation/church-bulletin': '/works/church-bulletin',
    // 예배 PPT 페이지를 교회솔루션으로 넓히면서 경로 변경
    '/worship-ppt': '/church',
  },
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
