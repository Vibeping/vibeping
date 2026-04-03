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

### Option 1: Script Tag (easiest)

```html
<script src="https://cdn.vibeping.dev/v1.js" data-id="vp_your_api_key"></script>
```

That's it. Analytics, errors, and vitals are now tracked.

### Option 2: NPM Package

```bash
npm install @vibeping/sdk
```

```typescript
import { vibeping } from '@vibeping/sdk';

vibeping.init({ id: 'vp_your_project_id' });

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

Run VibePing on your own infrastructure:

```bash
git clone https://github.com/Vibeping/vibeping.git
cd vibeping
cp .env.example .env  # Configure your environment
docker compose up -d
```

Open `http://localhost:3000` and start tracking.

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
