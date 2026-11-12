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
      // The ASP.NET Core API (backend/Meridian.Api). Override with VITE_API_PROXY.
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:5080',
          changeOrigin: true,
          // When the API is not running Vite would answer with a bare "500";
          // send a 503 problem response the app can explain instead.
          configure: (proxy) => {
            proxy.on('error', (err, _req, res) => {
              if (!res || res.headersSent || res.writableEnded || typeof res.writeHead !== 'function') return;
              res.writeHead(503, { 'Content-Type': 'application/problem+json' });
              res.end(JSON.stringify({
                title: 'The Meridian API is not running. Start it with "npm run dev" (starts the website and the API) or "npm run dev:api".',
                status: 503,
                code: 'api_unavailable',
              }));
            });
          },
        },
      },
    },
  };
});
