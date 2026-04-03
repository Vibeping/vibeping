# 🏓 VibePing

**The AI Growth Co-Pilot for Vibe-Coded Apps**

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

## Quick Start

### Option 1: Script Tag (easiest)

```html
<script src="https://cdn.vibeping.dev/v1.js" data-id="vp_your_project_id"></script>
```

That's it. Analytics, errors, and vitals are now tracked.

### Option 2: NPM Package

```bash
npm install @vibeping/sdk
```

```typescript
import { vibeping } from '@vibeping/sdk'

vibeping.init({ id: 'vp_your_project_id' })

// Optional: track custom events
vibeping.track('signup_completed', { plan: 'free' })
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

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

VibePing is open source under the [AGPL-3.0 License](LICENSE).

---

**Built with 🏓 for vibe coders everywhere.**
