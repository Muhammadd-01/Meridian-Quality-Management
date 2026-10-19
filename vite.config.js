import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { SITEMAP_ROUTES } from './src/lib/seoRoutes.js';

/**
 * SEO at build time. When VITE_SITE_URL is set (e.g. https://meridian.example.com):
 *  - writes sitemap.xml for every app route,
 *  - adds the Sitemap line to robots.txt,
 *  - makes social-preview and structured-data URLs in index.html absolute.
 */
function seoPlugin(siteUrl) {
  const base = (siteUrl || '').replace(/\/$/, '');
  return {
    name: 'meridian-seo',
    transformIndexHtml(html) {
      if (!base) return html;
      return html
        .replace(/content="\/og-image\.png"/g, `content="${base}/og-image.png"`)
        .replace(/"logo": "\/apple-touch-icon\.png"/, `"logo": "${base}/apple-touch-icon.png"`)
        .replace(/"url": "\/"/g, `"url": "${base}/"`)
        .replace('<meta property="og:type"', `<link rel="canonical" href="${base}/" />\n    <meta property="og:url" content="${base}/" />\n    <meta property="og:type"`);
    },
    generateBundle() {
      if (!base) return;
      const today = new Date().toISOString().slice(0, 10);
      const urls = SITEMAP_ROUTES.map(path => `  <url><loc>${base}${path}</loc><lastmod>${today}</lastmod><priority>${['/login', '/register', '/dashboard'].includes(path) ? '1.0' : '0.6'}</priority></url>`).join('\n');
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
    },
    writeBundle(options) {
      if (!base) return;
      // Append the absolute sitemap location to the copied robots.txt.
      return import('node:fs').then(({ readFileSync, writeFileSync, existsSync }) => {
        const file = `${options.dir}/robots.txt`;
        if (!existsSync(file)) return;
        const txt = readFileSync(file, 'utf8');
        if (!txt.includes('Sitemap:')) writeFileSync(file, `${txt.trimEnd()}\n\nSitemap: ${base}/sitemap.xml\n`);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), seoPlugin(env.VITE_SITE_URL)],
    server: {
      port: 5173,
      open: true,
    },
  };
});
