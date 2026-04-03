<div align="center">

# 🏓 VibePing

### The AI Growth Co-Pilot for Vibe-Coded Apps

Analytics · Error Tracking · Uptime Monitoring — one script tag, zero cookies.

[![npm version](https://img.shields.io/npm/v/@vibeping/sdk.svg)](https://www.npmjs.com/package/@vibeping/sdk)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@vibeping/sdk)](https://bundlephobia.com/package/@vibeping/sdk)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Vibeping/vibeping)](https://github.com/Vibeping/vibeping/stargazers)
[![CI](https://github.com/Vibeping/vibeping/actions/workflows/ci.yml/badge.svg)](https://github.com/Vibeping/vibeping/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Docs](https://vibeping.dev/docs) · [Dashboard](https://app.vibeping.dev) · [Website](https://vibeping.dev)

</div>

---

Built for devs shipping with **Lovable**, **Bolt.new**, **Cursor**, and **Replit**. Drop in a 3.3KB script and get the full picture — pageviews, errors, vitals, uptime — without the bloat of Mixpanel or the complexity of PostHog.

No cookies. No PII. No consent banners. GDPR-friendly out of the box.

<!--
## Demo

![VibePing Dashboard Demo](assets/demo.gif)

TODO: Record a ~30s GIF showing: add script tag → see first pageview → error captured → vitals dashboard.
Place the file at assets/demo.gif.
-->

## Quickstart

### Option A: Script Tag (fastest)

```html
<script
  src="https://cdn.jsdelivr.net/npm/@vibeping/sdk@latest/dist/vibeping.umd.js"
  data-id="vp_your_project_id"
></script>
```

Done. Pageviews, errors, and vitals are now tracked.

### Option B: npm

```bash
npm install @vibeping/sdk
```

```typescript
import { vibeping } from '@vibeping/sdk';

vibeping.init({ id: 'vp_your_project_id' });

// Track custom events
vibeping.track('signup_completed', { plan: 'free' });
```

> **Want the hosted version?** Skip setup entirely at [app.vibeping.dev](https://app.vibeping.dev) — free tier available.

## Features

- 📊 **Visitor Analytics** — Pageviews, uniques, referrers, countries. Auto-detects React Router & Next.js SPA navigation.
- 🔴 **Error Tracking** — JS errors with stack traces, caught automatically. Zero config.
- 💚 **Uptime Monitoring** — Response times + alerts when your app goes down.
- ⚡ **Web Vitals** — LCP, FID, CLS tracked out of the box.
- 🎯 **Custom Events** — `vibeping.track('signup', { plan: 'pro' })` — that's it.
- 🔒 **Privacy-First** — No cookies. No PII. No consent banners needed.
- 🪶 **Tiny** — 3.3KB gzipped. Zero dependencies. Ships as UMD + ESM.

## Framework Support

Works anywhere JavaScript runs. Tested with:

| Framework        | Notes                                       |
| ---------------- | ------------------------------------------- |
| **React**        | Auto-detects React Router for SPA pageviews |
| **Next.js**      | App Router + Pages Router                   |
| **Vue**          | Works with Vue Router                       |
| **Svelte**       | Works with SvelteKit                        |
| **Vanilla HTML** | Just drop in the script tag                 |

## API Reference

### `vibeping.init(options)`

Initialize VibePing. Call once, as early as possible.

```typescript
vibeping.init({
  id: 'vp_your_project_id', // Required
  trackErrors: true, // Default: true
  trackVitals: true, // Default: true
  debug: false, // Default: false — logs events to console
});
```

### `vibeping.track(event, properties?)`

```typescript
vibeping.track('button_clicked', { label: 'Buy Now' });
vibeping.track('signup_completed', { plan: 'pro', source: 'landing' });
```

### `vibeping.identify(userId, traits?)`

```typescript
vibeping.identify('user_123', { email: 'dev@example.com', plan: 'pro' });
```

## Self-Hosting

VibePing is fully self-hostable. You'll need a **Supabase** project (free tier works) for auth + database.

```bash
# 1. Clone & configure
git clone https://github.com/Vibeping/vibeping.git
cd vibeping
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

```bash
# 2. Run migrations (apply SQL files in supabase/migrations/ via Supabase CLI or dashboard)

# 3. Start
docker compose up -d
```

Open `http://localhost:3000` and start tracking.

> **Don't want to self-host?** [app.vibeping.dev](https://app.vibeping.dev) is free to start.

## CDN Options

| Source                     | URL                                                                      |
| -------------------------- | ------------------------------------------------------------------------ |
| **jsDelivr** (recommended) | `https://cdn.jsdelivr.net/npm/@vibeping/sdk@latest/dist/vibeping.umd.js` |
| **unpkg**                  | `https://unpkg.com/@vibeping/sdk/dist/vibeping.umd.js`                   |
| **Self-host**              | Download from npm, serve from your own origin                            |

## Tech Stack

- **SDK**: TypeScript, 3.3KB gzipped, zero dependencies
- **Dashboard**: Next.js 14 (App Router), Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Monorepo**: pnpm workspaces + Turborepo

```
vibeping/
├── packages/sdk/          # Tracking SDK (3.3KB gzipped)
├── apps/dashboard/        # Self-hostable dashboard
├── supabase/              # Database migrations
└── docker-compose.yml     # One-command self-host
```

## Roadmap

- [x] Visitor analytics (pageviews, referrers, countries)
- [x] Auto error tracking with stack traces
- [x] Core Web Vitals (LCP, FID, CLS)
- [x] Custom event tracking
- [x] Self-hosting with Docker
- [ ] Session replay
- [ ] Funnel analysis
- [ ] A/B testing helpers
- [ ] AI-powered anomaly alerts
- [ ] Mobile SDK (React Native)
- [ ] Slack / Discord alert integrations
- [ ] Export to CSV / webhooks

[Open an issue](https://github.com/Vibeping/vibeping/issues) or start a [discussion](https://github.com/Vibeping/vibeping/discussions) if you have ideas.

## Contributing

We welcome contributions. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for setup instructions and guidelines.

## Community

- 💬 [GitHub Discussions](https://github.com/Vibeping/vibeping/discussions) — Questions & ideas
- 🐛 [Issues](https://github.com/Vibeping/vibeping/issues) — Bugs & feature requests
- 𝕏 [@VibePingDev](https://x.com/VibePingDev) — Updates
- 🌐 [vibeping.dev](https://vibeping.dev) — Product site
- 📖 [Docs](https://vibeping.dev/docs) — Full documentation

## License

AGPL-3.0 — see [LICENSE](LICENSE).

---

<div align="center">

**Built with 🏓 for vibe coders everywhere.**

[Get Started](https://app.vibeping.dev) · [Read the Docs](https://vibeping.dev/docs) · [Star on GitHub](https://github.com/Vibeping/vibeping)

</div>
