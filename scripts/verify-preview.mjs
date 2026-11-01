const base = process.env.PREVIEW_ORIGIN || 'http://127.0.0.1:4176';
const routes = [
  ['/', 'WE MAKE'], ['/services', 'Services with a point of view.'], ['/work', 'Concepts made to think with.'],
  ['/studio', 'A small studio for big ideas.'], ['/contact', 'Let’s make something matter.'],
  ['/services/web-development', 'Websites built to do more.'], ['/services/ai-automation', 'Make repetitive work flow.'],
  ['/services/digital-growth', 'Build clearer paths to growth.'], ['/services/creative-branding', 'Give good ideas a visual voice.'],
  ['/work/kinform', 'KINFORM — move with purpose.'], ['/work/flowstate', 'FLOWSTATE — make the next step flow.'],
  ['/work/forme', 'FORME — form follows feeling.'], ['/privacy.html', 'Privacy'],
];
for (const [path, expected] of routes) {
  const requestPath = path === '/' || path.endsWith('.html') ? path : `${path}/`;
  const response = await fetch(`${base}${requestPath}`);
  const html = await response.text();
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]*>/g, '') || '';
  const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || '';
  if (response.status !== 200) throw new Error(`${path}: HTTP ${response.status}`);
  if (path !== '/privacy.html' && !h1.includes(expected)) throw new Error(`${path}: unexpected H1 ${h1}`);
  if (path === '/contact' && (!html.includes('contact-page-form') || !html.includes('name="_gotcha"'))) throw new Error('Contact AJAX form markup absent.');
  console.log(`HTTP ${response.status} ${requestPath} | ${h1 || 'static page'} | ${title}`);
}
for (const asset of ['/assets/cultstudio-logo-64.webp', '/fonts/space-grotesk-latin.woff2', '/.well-known/ard.json', '/sitemap.xml', '/robots.txt']) {
  const response = await fetch(`${base}${asset}`);
  if (response.status !== 200) throw new Error(`${asset}: HTTP ${response.status}`);
  if (asset.endsWith('ard.json')) { const json = await response.json(); if (!Array.isArray(json.entries)) throw new Error('ARD JSON malformed'); }
  console.log(`HTTP ${response.status} ${asset} | ${response.headers.get('content-type')}`);
}
const unknown = await fetch(`${base}/__unknown_route__`);
const body = await unknown.text();
console.log(`HTTP ${unknown.status} /__unknown_route__ | custom404=${body.includes('That page wandered off.')} | homepage=${body.includes('hero-brand-title')}`);
