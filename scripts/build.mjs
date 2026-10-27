import { createServer, build, loadEnv } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

await build();
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [], entries: [] } });
try {
  const { render } = await server.ssrLoadModule('/src/entry-server.tsx');
  const rendered = render();
  const indexPath = resolve('dist/index.html');
  const html = await readFile(indexPath, 'utf8');
  let output = html.replace('<div id="root"></div>', `<div id="root">${rendered}</div>`);
  await writeFile(indexPath, output);
  const siteUrl = loadEnv('production', process.cwd(), 'VITE_').VITE_SITE_URL?.replace(/\/$/, '');
  if (siteUrl) {
    const parsedUrl = new URL(siteUrl);
    if (parsedUrl.protocol !== 'https:' || parsedUrl.pathname !== '/' || parsedUrl.search || parsedUrl.hash) throw new Error('VITE_SITE_URL must be an HTTPS origin without a path.');
    output = output.replace('</head>', `    <link rel="canonical" href="${siteUrl}/" />\n    <meta property="og:url" content="${siteUrl}/" />\n    <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'ProfessionalService', name: 'CultStudio', url: `${siteUrl}/`, description: 'An independent creative technology studio offering web development, AI automation, digital growth and creative design.', logo: `${siteUrl}/assets/cultstudio-logo-128.webp`, knowsAbout: ['Web development', 'AI workflow automation', 'Digital marketing', 'Creative design and branding'] })}</script>\n  </head>`);
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url><url><loc>${siteUrl}/privacy.html</loc></url></urlset>`;
    await writeFile(resolve('dist/sitemap.xml'), sitemap);
    const robotsPath = resolve('dist/robots.txt');
    const robots = await readFile(robotsPath, 'utf8');
    await writeFile(robotsPath, `${robots.trim()}\nSitemap: ${siteUrl}/sitemap.xml\n`);
  }
} finally {
  await server.close();
}
