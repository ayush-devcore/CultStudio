import { createServer, build, loadEnv } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const routes = ['/', '/services', '/services/web-development', '/services/ai-automation', '/services/digital-growth', '/services/creative-branding', '/work', '/work/kinform', '/work/flowstate', '/work/forme', '/studio', '/contact'];
const pageMeta = {
  '/': ['CultStudio — Ideas into digital experiences', 'CultStudio builds thoughtful websites, software, AI-powered workflows and creative digital experiences for ambitious businesses.'],
  '/services': ['Services with a point of view — CultStudio', 'Explore CultStudio services across web development, AI and automation, digital growth and creative branding.'],
  '/services/web-development': ['Web Development — CultStudio', 'Responsive websites, web applications, e-commerce and custom software from CultStudio.'],
  '/services/ai-automation': ['AI & Automation — CultStudio', 'Practical AI and workflow automation planned around real business processes.'],
  '/services/digital-growth': ['Digital Growth — CultStudio', 'SEO foundations, conversion improvements and growth strategy shaped around your business.'],
  '/services/creative-branding': ['Creative & Branding — CultStudio', 'Visual identity, graphic design, creative campaigns and digital experiences.'],
  '/work': ['Selected Concept Work — CultStudio', 'Explore CultStudio concept explorations in web design, automation and visual identity.'],
  '/work/kinform': ['KINFORM Website Concept — CultStudio', 'A fitness business website concept exploration by CultStudio.'],
  '/work/flowstate': ['FLOWSTATE Automation Concept — CultStudio', 'A lead and workflow automation concept exploration by CultStudio.'],
  '/work/forme': ['FORME Brand Concept — CultStudio', 'A creative identity concept exploration by CultStudio.'],
  '/studio': ['About CultStudio — Creative Technology Studio', 'Learn about CultStudio philosophy and approach to creative technology.'],
  '/contact': ['Contact CultStudio — Start a Project', 'Contact CultStudio about a website, software, automation, growth or creative project.'],
};

await build();
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [], entries: [] } });
try {
  const { render } = await server.ssrLoadModule('/src/entry-server.tsx');
  const template = await readFile(resolve('dist/index.html'), 'utf8');
  const env = loadEnv('production', process.cwd(), 'VITE_');
  const siteUrl = (env.VITE_SITE_URL || 'https://cult-studio-tau.vercel.app').replace(/\/$/, '');
  if (siteUrl) {
    const u = new URL(siteUrl);
    if (u.protocol !== 'https:' || u.pathname !== '/' || u.search || u.hash) throw new Error('VITE_SITE_URL must be an HTTPS origin without a path.');
  }
  for (const route of routes) {
    const [title, description] = pageMeta[route];
    let html = template.replace('<div id="root"></div>', `<div id="root">${render(route)}</div>`)
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`)
      .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${title}" />`)
      .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${description}" />`);
    html = html.replace(/\s*<link rel="canonical"[^>]*>/g, '').replace(/\s*<meta property="og:url"[^>]*>/g, '');
    const canonicalPath = route === '/' ? '/' : `${route}/`;
    if (siteUrl) html = html.replace('</head>', `    <link rel="canonical" href="${siteUrl}${canonicalPath}" />\n    <meta property="og:url" content="${siteUrl}${canonicalPath}" />\n  </head>`);
    const file = route === '/' ? resolve('dist/index.html') : resolve('dist', route.slice(1), 'index.html');
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }
  // Genuine not-found document, excluded from the sitemap and marked noindex.
  const notFound = template.replace('<div id="root"></div>', `<div id="root">${render('/__not-found__')}</div>`)
    .replace(/<title>[^<]*<\/title>/, '<title>Page not found — CultStudio</title>')
    .replace('</head>', '    <meta name="robots" content="noindex, nofollow" />\n  </head>');
  await writeFile(resolve('dist/404.html'), notFound);
  if (siteUrl) {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...routes, '/privacy.html'].map(route => `<url><loc>${siteUrl}${route === '/' ? '/' : route.endsWith('.html') ? route : `${route}/`}</loc></url>`).join('')}</urlset>`;
    await writeFile(resolve('dist/sitemap.xml'), sitemap);
    const robotsFile = resolve('dist/robots.txt');
    const robots = (await readFile(robotsFile, 'utf8')).replace(/^Sitemap:.*\r?\n/gm, '').trim();
    await writeFile(robotsFile, `${robots}\nSitemap: ${siteUrl}/sitemap.xml\n`);
    const privacyPath = resolve('dist/privacy.html');
    let privacy = await readFile(privacyPath, 'utf8');
    privacy = privacy.replace(/\s*<link rel="canonical"[^>]*>/g, '');
    privacy = privacy.replace('</head>', `    <link rel="canonical" href="${siteUrl}/privacy.html" />\n  </head>`);
    await writeFile(privacyPath, privacy);
  }
} finally { await server.close(); }
