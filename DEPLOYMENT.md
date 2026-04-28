# Deployment Guide

## Static hosting

This project is a static site and can be deployed to platforms like Netlify, Vercel static hosting, Cloudflare Pages, GitHub Pages, or any standard web server.

## Before go-live

1. Confirm the production domain and update the canonical URLs in `index.html`, `privacy.html`, `terms.html`, `sitemap.xml`, and `llms.txt` if the domain is not `https://www.amburax.com/`.
2. Configure the inquiry destination.
3. Configure analytics if you want third-party reporting.
4. Verify legal copy and business contact details.
5. Re-run the QA checklist in `QA_CHECKLIST.md`.

## Contact flow configuration

The site uses `window.AMBURAX_CONFIG` for runtime overrides. If no direct form endpoint is configured, the inquiry form falls back to drafting an email to `hello@amburax.com`.

## Cloudflare + Resend variables

Use these in Cloudflare Pages:

- Secret: `RESEND_API_KEY`
- Variable: `RESEND_FROM_EMAIL`
- Variable: `CONTACT_TO_EMAIL`
- Optional variable: `CONTACT_ALLOWED_ORIGIN`

Recommended values:

- `RESEND_FROM_EMAIL`: a verified sender on your Resend domain, for example `website@yourdomain.com`
- `CONTACT_TO_EMAIL`: the inbox that should receive inquiries, for example `hello@yourdomain.com`
- `CONTACT_ALLOWED_ORIGIN`: your production origin, for example `https://www.amburax.com`

If you want to allow both the root domain and `www`, set:

`CONTACT_ALLOWED_ORIGIN=https://amburax.com,https://www.amburax.com`

Reference file: `site-config.example.js`

Example:

```html
<script>
  window.AMBURAX_CONFIG = {
    contact: {
      endpoint: "https://your-secure-form-endpoint.example.com/inquiries",
      recipient: "hello@amburax.com"
    },
    analytics: {
      enabled: true,
      debug: false
    }
  };
</script>
<script type="module" src="script.js"></script>
```

## Analytics

The site emits vendor-neutral events through:

- `window.dataLayer`
- `window.gtag(...)` when present
- `window.plausible(...)` when present
- `window` custom event `amburax:analytics`

This lets you connect Google Tag Manager, Google Analytics, Plausible, or a custom listener without changing the markup again.

## Recommended headers

- `Cache-Control` for static assets
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` trimmed to only what the site needs

## Recommended production checks

- HTTPS enabled
- Favicon, OG image, manifest, and sitemap resolving
- `privacy.html` and `terms.html` linked in footer and crawlable
- Inquiry endpoint tested with a real secure destination
- Analytics events verified in the chosen provider
