# joey-landing

The public marketing site for **Joey AI** — the page a visitor sees before they sign up.

Static HTML, CSS, and vanilla JS. No build step, no dependencies, no framework. Open
`index.html` in a browser and it works.

```
joey-landing/
├── index.html          Landing page
├── privacy.html        Privacy Policy
├── terms.html          Terms of Service
├── disclaimer.html     Veterinary disclaimer
├── styles.css          Design system + all page styles
├── app.js              Nav, FAQ, food checker, analytics
├── config.js           URLs and analytics ids — edit this, not the markup
├── robots.txt
├── sitemap.xml
├── site.webmanifest
└── assets/             Logo + optimised images (WebP with JPEG fallbacks)
```

## Local preview

Any static server works. From this directory:

```bash
python -m http.server 8899      # then open http://127.0.0.1:8899
# or
npx serve .
```

Opening `index.html` directly via `file://` also works, but `site.webmanifest` will 404
and `localStorage` behaves differently — prefer a server.

## Configuration

**`config.js` is the only file you should need to edit for a deploy.**

```js
window.JOEY_CONFIG = {
  appUrl: 'https://joey.ai',    // where every CTA points
  supportEmail: 'support@joey.ai',
  gaId: '',                     // empty = no script loaded, no request made
  clarityId: '',
};
```

Every CTA in the HTML ships with a real `href`, so the page still converts with JS
disabled. `app.js` rewrites any element carrying `data-cta` to `appUrl + paths[key]`,
which is what lets you point a staging deploy at a different origin without touching
markup:

```html
<script>window.JOEY_CONFIG = { appUrl: 'http://localhost:4444' };</script>
<script src="config.js"></script>
```

Analytics are opt-in. With `gaId` and `clarityId` empty, no third-party request is made
at all — the same no-op behaviour as the app's `GoogleAnalytics` / `MicrosoftClarity`
components.

## Design system

`styles.css` mirrors the product's theme one-for-one, so a visitor crossing from this
page into the app sees the same brand rather than two different companies:

| Token | Value | Source |
| --- | --- | --- |
| Background | `#F7F1E6` cream | `tailwind.config.ts` |
| Card | `#FFFDF8` | `tailwind.config.ts` |
| Ink / muted | `#231C14` / `#7A7266` | `tailwind.config.ts` |
| Primary | `#C1633F` terracotta | `tailwind.config.ts` |
| Secondary | `#3E6B4C` sage | `tailwind.config.ts` |
| Display font | Fredoka | `app/layout.tsx` |
| Body font | Inter | `app/layout.tsx` |
| Buttons, cards | chunky shadow, pill radius | `styles/globals.css` |

Triage chip colours come from `TRIAGE` in `MeetJoey_be_forntend/lib/constants.ts`
(emergency / urgent / monitor / routine). The logo is the real `joey-logo.svg` copied
from the app's `public/`.

**If you change a brand token in the app, change it here too.** There is no shared
build, so nothing will warn you.

## Content accuracy

Plan limits and prices on this page are taken from the backend seed
(`src/migrations/20260612010000-seed-default-plans.js`) and the app's pricing page:

- Free — 1 pet, 1 AI chat/day, 2 scans/week
- Premium — ₹199/month or ₹1,799/year, 7-day trial, up to 3 pets, unlimited chat + scans
- One-off reports — ₹49 to ₹149

The Family plan is **deliberately not advertised**: both `family_monthly` and
`family_annual` are seeded with `is_active: false`, so nobody can buy it yet. Add it here
once it goes live.

Scan types are the six in `src/validations/scan.validation.ts`: skin, eye, ear, wound,
dental, stool.

## The food checker

The checker on the landing page is a **demo** of the one inside the app. It matches on
whole words and phrases — never substrings — and follows two rules that matter because
this is health-adjacent content:

1. **Unsafe wins.** If a query names both a safe and an unsafe food, the unsafe answer is
   shown ("chicken with onion gravy" is an onion answer).
2. **"Safe" is never the fallback.** An unrecognised food, or a safe ingredient inside a
   prepared dish ("chicken curry", "carrot cake"), resolves to *"check before you feed
   it"* — never to *"generally fine"*.

Severity levels mirror the `toxicity_level` enum on the backend's `toxic_foods` table
(`mild | moderate | severe | lethal`), and entries are drawn from its seed data so the
demo and the product agree.

There is one deliberate addition not in the backend seed: **human painkillers**
(paracetamol / ibuprofen / aspirin). It is among the most common real poisoning
emergencies, and it is worth adding to the `toxic_foods` seed too.

## Before going live

- [ ] Replace the highlighted placeholders in `privacy.html` and `terms.html` — registered
      entity name, address, hosting region, grievance officer, jurisdiction — and have both
      reviewed by a lawyer. They are a solid starting draft, not legal advice.
- [ ] Confirm `joey.ai` resolves to the app, or change `appUrl` in `config.js`.
- [ ] Set `gaId` / `clarityId` if you want funnel measurement.
- [ ] Update the absolute URLs in `sitemap.xml`, `robots.txt`, and the `og:` / `canonical`
      tags if the domain differs.
- [ ] Re-check the OG card with the [Facebook debugger](https://developers.facebook.com/tools/debug/)
      and [X validator](https://cards-dev.twitter.com/validator).
- [ ] Submit `sitemap.xml` in Google Search Console.

## Deploying

It is a folder of static files — any host works (Vercel, Netlify, Cloudflare Pages, S3 +
CloudFront, nginx). No build command; publish directory is this folder.

Recommended headers:

```
Cache-Control: public, max-age=31536000, immutable   # /assets/*
Cache-Control: public, max-age=0, must-revalidate     # *.html
```

If you later fold this into the Next.js app instead, it becomes a `(marketing)` route
group and `app/page.tsx` stops redirecting straight to `/login`.

## Accessibility & performance notes

- Skip link, visible focus rings, 44px+ touch targets, one `h1`, all ARIA references resolve.
- The FAQ accordion, mobile menu, and announcement bar are all keyboard operable; Escape
  closes the menu and focus returns to the toggle.
- `prefers-reduced-motion` is honoured in both CSS and JS.
- No horizontal overflow from 265px upward.
- Images are self-hosted WebP with JPEG fallbacks and explicit `width`/`height`; the LCP
  hero is ~30 KB and preloaded.
- Fonts come from Google Fonts with `display=swap` and preconnect — the only third-party
  request the page makes by default.
