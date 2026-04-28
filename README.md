# Amburax Homepage

Static marketing site for Amburax, built without a framework or bundler.

## Structure

- `index.html`: content, metadata, structured data, and page sections
- `script.js`: small module entrypoint
- `js/environment.js`: viewport and performance profile helpers
- `js/site-config.js`: runtime config defaults for analytics and contact flow
- `js/analytics.js`: vendor-neutral event tracking hooks
- `js/navigation.js`: mobile nav behavior
- `js/scroll-effects.js`: reveal animations, marquee, and anchor scrolling
- `js/contact-form.js`: contact brief flow with consent, anti-spam checks, and endpoint fallback
- `js/utils.js`: debounce and non-critical scheduling helpers
- `js/hero-effects.js`: canvas field, hover effects, and animation lifecycle
- `js/main.js`: page bootstrap
- `functions/api/inquiries.js`: Cloudflare Pages Function for secure inquiry delivery via Resend
- `css/base.css`: reset, tokens, shared layout, hero, and common components
- `css/sections.css`: section-specific styling
- `css/performance.css`: rendering containment and below-the-fold optimizations
- `css/responsive.css`: animations, breakpoints, and reduced-motion rules
- `css/legal.css`: privacy and terms page layout
- `favicon.svg`, `og-image.svg`: branding and social preview assets
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, `llms.txt`: discovery assets
- `privacy.html`, `terms.html`: client-facing legal pages
- `site-config.example.js`: production config reference
- `DEPLOYMENT.md`, `QA_CHECKLIST.md`: launch guidance

## Authoring hooks

- `data-reveal`: opt an element into scroll-in reveal behavior
- `data-contained`: opt a card or panel into containment rules
- `data-defer-section`: mark below-the-fold sections for `content-visibility`
- `data-service-card`: opt cards into the hero hover-glow behavior
- `data-marquee-track`: marks the marquee row that should be cloned for looping

## Local preview

Use any static file server. Example:

```powershell
python -m http.server 8921 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8921/`.

## Production setup

- Runtime overrides can be provided with `window.AMBURAX_CONFIG`.
- The inquiry form can send to a secure endpoint when `contact.endpoint` is configured.
- Analytics hooks emit to `dataLayer`, `gtag`, `plausible`, and the custom `amburax:analytics` event when those integrations are present.
- See `DEPLOYMENT.md` and `QA_CHECKLIST.md` before launch.

## Performance notes

- Hero canvas motion scales down on lower-power devices.
- Hero animation pauses when the tab is hidden or the hero is off-screen.
- Decorative hero animation is imported lazily so the first render can prioritize content and navigation.
- Heavy below-the-fold sections use `content-visibility` and containment to reduce initial rendering cost.
