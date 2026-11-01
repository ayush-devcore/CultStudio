import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'https://cult-studio-tau.vercel.app';
const expected = [
  ['/', 'WE MAKEDIGITALMATTER.', 'CultStudio — Ideas into digital experiences'],
  ['/services', 'Services with a point of view.', 'Services with a point of view — CultStudio'],
  ['/services/web-development', 'Websites built to do more.', 'Web Development — CultStudio'],
  ['/services/ai-automation', 'Make repetitive work flow.', 'AI & Automation — CultStudio'],
  ['/services/digital-growth', 'Build clearer paths to growth.', 'Digital Growth — CultStudio'],
  ['/services/creative-branding', 'Give good ideas a visual voice.', 'Creative & Branding — CultStudio'],
  ['/work', 'Concepts made to think with.', 'Selected Concept Work — CultStudio'],
  ['/work/kinform', 'KINFORM — move with purpose.', 'KINFORM Website Concept — CultStudio'],
  ['/work/flowstate', 'FLOWSTATE — make the next step flow.', 'FLOWSTATE Automation Concept — CultStudio'],
  ['/work/forme', 'FORME — form follows feeling.', 'FORME Brand Concept — CultStudio'],
  ['/studio', 'A small studio for big ideas.', 'About CultStudio — Creative Technology Studio'],
  ['/contact', 'Let’s make something matter.', 'Contact CultStudio — Start a Project'],
];
const titles = new Set();
for (const [route, h1, title] of expected) {
  const file = resolve('dist', route === '/' ? 'index.html' : `${route.slice(1)}/index.html`);
  const html = await readFile(file, 'utf8');
  const pageH1 = (html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/<[^>]*>/g, '');
  const pageTitle = html.match(/<title>(.*?)<\/title>/i)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  if (pageH1 !== h1 || pageTitle !== title || !description || canonical !== `${origin}${route === '/' ? '/' : `${route}/`}`) throw new Error(`Prerender mismatch at ${route}: H1=${pageH1}; title=${pageTitle}; canonical=${canonical}`);
  if (titles.has(pageTitle)) throw new Error(`Duplicate title: ${pageTitle}`);
  titles.add(pageTitle);
  if (route === '/contact' && (!html.includes('class="contact-form"') || !html.includes('contact-page-form') || !html.includes('name="_gotcha"'))) throw new Error('Contact form markup is missing shared AJAX form features.');
  if (route !== '/' && html.includes('hero-brand-title')) throw new Error(`Homepage hero leaked into ${route}`);
  for (const asset of html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)) await access(resolve('dist', asset[1].slice(1)));
  console.log(`OK ${route}: ${pageTitle}`);
}
for (const path of ['dist/services/index.html','dist/work/index.html','dist/studio/index.html','dist/contact/index.html','dist/privacy.html','dist/404.html','dist/.well-known/ard.json','dist/llms.txt','dist/sitemap.xml','dist/robots.txt']) await access(resolve(path));
const privacy = await readFile(resolve('dist/privacy.html'), 'utf8');
if (!privacy.includes(`href="${origin}/privacy.html"`)) throw new Error('Privacy canonical missing.');
const sitemap = await readFile(resolve('dist/sitemap.xml'), 'utf8');
if ((sitemap.match(/<loc>/g) || []).length !== 13 || sitemap.includes('404.html')) throw new Error('Unexpected sitemap route set.');
const robots = await readFile(resolve('dist/robots.txt'), 'utf8');
if (!robots.includes(`${origin}/sitemap.xml`)) throw new Error('Sitemap directive missing from robots.txt.');
const ard = JSON.parse(await readFile(resolve('dist/.well-known/ard.json'), 'utf8'));
if (!Array.isArray(ard.entries)) throw new Error('ARD manifest entries array missing.');
const notFound = await readFile(resolve('dist/404.html'), 'utf8');
if (!notFound.includes('That page wandered off.') || notFound.includes('hero-brand-title')) throw new Error('404 document does not contain the custom 404 page.');
console.log('OK metadata, assets, sitemap, privacy, robots, ARD and 404');
