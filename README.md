# CultStudio Website

CultStudio is a static React + TypeScript + Vite site with an animated Three.js hero, responsive service and concept sections, an accessible mobile menu, a five-step process, and an AJAX project enquiry form connected to Formspree.

## Run locally

Node.js 20+ is recommended. From this folder:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Configure before launch

1. The supplied Formspree form ID (`xzeeeklz`) is configured as the default. Set the target notification email for that form in the Formspree dashboard. To use another form, set `VITE_FORMSPREE_FORM_ID` in `.env` and in your hosting environment. The ID is public; never add a Formspree API key to a `VITE_` variable.
2. Replace `VITE_SITE_URL` with the final HTTPS site origin, such as `https://cultstudio.example`. The build uses it to add canonical and Open Graph URLs, Organization/ProfessionalService JSON-LD, and a sitemap entry for `/` and `/privacy.html`. Without a verified domain, these domain-dependent values are intentionally omitted.
3. Keep the project tiles labelled as concept explorations until real client work is approved for publication. Add only verified contact and social details.
4. Review the privacy notice against the actual business process and applicable requirements before launch.

## Build and preview

```bash
npm run build
npm run preview
```

The build runs TypeScript project checks, creates Vite's optimized production assets, and prerenders the homepage to `dist/index.html` for crawlable initial HTML. Browser hydration keeps the React interactions available. The output is static and deploys from `dist/`.

## Deploy

For Vercel, use the Vite preset with build command `npm run build` and output directory `dist`. Set both `VITE_SITE_URL` and `VITE_FORMSPREE_FORM_ID` in the Vercel project environment before the production build. For Netlify, use the same build command and publish directory, with both variables set in the site's environment variables.

## Integrations and limits

- Form submissions are sent directly from the browser to Formspree over HTTPS. Formspree stores submissions in the connected account and may send email notifications according to its dashboard settings.
- The form ID and `VITE_SITE_URL` are public configuration, not secrets. Do not place API keys or credentials in any `VITE_` variable.
- A Formspree form ID, target email configured in Formspree, public domain, and final privacy/legal review are required before launch. Search Console submission and indexing checks require the domain to be deployed and verified.
- The 3D hero is lazy-loaded and has a CSS fallback for browsers without WebGL. No test or lint scripts are configured in the project. `npm run build` includes TypeScript checking and production bundling.
