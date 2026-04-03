# 🏓 VibePing

**The AI Growth Co-Pilot for Vibe-Coded Apps**

[![npm version](https://img.shields.io/npm/v/@vibeping/sdk.svg)](https://www.npmjs.com/package/@vibeping/sdk)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@vibeping/sdk)](https://bundlephobia.com/package/@vibeping/sdk)
[![CI](https://github.com/Vibeping/vibeping/actions/workflows/ci.yml/badge.svg)](https://github.com/Vibeping/vibeping/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/Vibeping/vibeping)](https://github.com/Vibeping/vibeping/stargazers)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Analytics, error tracking, and uptime monitoring — all in one script tag.
Built for vibe coders using **Lovable**, **Bolt.new**, **Cursor**, and **Replit**.

---

## Features

- **📊 Visitor Analytics** — Pageviews, unique visitors, referrers, countries. Auto-detects React Router & Next.js.
- **🔴 Error Tracking** — Auto-captures JS errors with stack traces. No setup required.
- **💚 Uptime Monitoring** — Is your app online? Response times + alerts when it goes down.
- **⚡ Web Vitals** — LCP, FID, CLS tracked automatically.
- **🎯 Custom Events** — Track signups, clicks, conversions with `vibeping.track()`.
- **🔒 Privacy-First** — No cookies. No PII. No consent banners needed.

## Dashboard Screenshots

<!-- screenshots coming soon -->

## Quick Start

### Hosted Version (easiest)

Use the hosted version at **[app.vibeping.dev](https://app.vibeping.dev)** — no setup required.
Sign up, create a project, and add the script tag:

```html
<script src="https://app.vibeping.dev/sdk/v1.js" data-id="vp_your_api_key"></script>
```

That's it. Analytics, errors, and vitals are now tracked.

### NPM Package

```bash
npm install @vibeping/sdk
```

```typescript
import { vibeping } from '@vibeping/sdk';

vibeping.init({ id: 'vp_your_project_id' });
// By default, events are sent to https://app.vibeping.dev
// For self-hosted, pass apiUrl: vibeping.init({ id: '...', apiUrl: 'https://your-instance.com' })

// Optional: track custom events
vibeping.track('signup_completed', { plan: 'free' });
```

## Supported Frameworks

VibePing works anywhere JavaScript runs. Tested with:

| Framework        | Support | Notes                                       |
| ---------------- | ------- | ------------------------------------------- |
| **React**        | ✅      | Auto-detects React Router for SPA pageviews |
| **Next.js**      | ✅      | Works with App Router and Pages Router      |
| **Vue**          | ✅      | Works with Vue Router                       |
| **Svelte**       | ✅      | Works with SvelteKit                        |
| **Vanilla HTML** | ✅      | Just drop in the script tag                 |

The SDK is framework-agnostic. If your app runs in a browser, VibePing works.

## API Reference

### `vibeping.init(options)`

Initialize VibePing. Call this once, as early as possible.

```typescript
vibeping.init({
  id: 'vp_your_project_id', // Required. Your project ID from the dashboard.
  trackErrors: true, // Default: true. Auto-capture JS errors.
  trackVitals: true, // Default: true. Track Core Web Vitals.
  debug: false, // Default: false. Log events to console.
});
```

### `vibeping.track(event, properties?)`

Track a custom event.

```typescript
vibeping.track('button_clicked', { label: 'Buy Now' });
vibeping.track('signup_completed', { plan: 'pro', source: 'landing' });
```

### `vibeping.identify(userId, traits?)`

Associate events with a user. Call after login.

```typescript
vibeping.identify('user_123', { email: 'dev@example.com', plan: 'pro' });
```

## Self-Hosting

> **Prefer not to self-host?** Use the hosted version at [app.vibeping.dev](https://app.vibeping.dev) — free tier available.

Run VibePing on your own infrastructure. VibePing requires **Supabase** for authentication and database (the schema uses Supabase Auth features like `auth.users` and Row Level Security).

### Prerequisites

1. **Create a Supabase project** — use [Supabase Cloud](https://supabase.com) (free tier works) or [self-host Supabase](https://supabase.com/docs/guides/self-hosting)
2. **Run database migrations** — apply the SQL files in `supabase/migrations/` to your Supabase project (via the Supabase dashboard SQL editor or CLI)

### Deploy with Docker

```bash
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

Then start the dashboard:

```bash
docker compose up -d
```

Open `http://localhost:3000` and start tracking.

## CDN Options

You can load the VibePing SDK via a `<script>` tag from several CDN sources:

| Option                     | URL                                                               | Notes                                       |
| -------------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| **jsDelivr** (recommended) | `https://cdn.jsdelivr.net/npm/@vibeping/sdk/dist/vibeping.umd.js` | Free, fast, no setup needed                 |
| **unpkg**                  | `https://unpkg.com/@vibeping/sdk/dist/vibeping.umd.js`            | Free alternative CDN                        |
| **Self-host**              | Download from npm and serve from your own origin                  | Full control over caching & availability    |
| **cdn.vibeping.dev**       | `https://cdn.vibeping.dev/v1.js`                                  | 🚧 Coming soon — custom CDN with SRI hashes |

Pin a specific version to avoid unexpected changes:

```html
<script
  src="https://cdn.jsdelivr.net/npm/@vibeping/sdk@0.1.0/dist/vibeping.umd.js"
  data-id="vp_your_api_key"
></script>
```

To build CDN-ready files locally, run:

```bash
./scripts/publish-cdn.sh
```

## Tech Stack

- **SDK**: TypeScript, <5KB gzipped, zero dependencies
- **Dashboard**: Next.js 14 (App Router), Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Monorepo**: pnpm workspaces + Turborepo

## Project Structure

```
vibeping/
├── packages/sdk/          # Tracking snippet (<5KB)
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

Have an idea? [Open an issue](https://github.com/Vibeping/vibeping/issues) or start a [discussion](https://github.com/Vibeping/vibeping/discussions).

## Community

- 💬 [GitHub Discussions](https://github.com/Vibeping/vibeping/discussions) — Ask questions, share ideas
- 🐛 [Issues](https://github.com/Vibeping/vibeping/issues) — Report bugs or request features
- 𝕏 [@VibePingDev](https://x.com/VibePingDev) — Updates and announcements
- 🌐 [vibeping.dev](https://vibeping.dev) — Product site

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

## License

VibePing is open source under the [AGPL-3.0 License](LICENSE).

---

**Built with 🏓 for vibe coders everywhere.**
