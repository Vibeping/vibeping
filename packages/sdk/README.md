# @vibeping/sdk

Analytics, error tracking, and uptime monitoring for vibe-coded apps. One script tag, zero cookies, 3.3KB gzipped.

Built for apps made with [Lovable](https://lovable.dev), [Bolt.new](https://bolt.new), [Cursor](https://cursor.sh), and [Replit](https://replit.com).

## Quick Start

### Option A: Script Tag (recommended)

```html
<script src="https://cdn.vibeping.dev/v1.js" data-project="YOUR_PROJECT_ID"></script>
```

That's it. Page views, errors, and Web Vitals are captured automatically.

### Option B: npm

```bash
npm install @vibeping/sdk
```

```typescript
import { init } from '@vibeping/sdk';

init({ projectId: 'YOUR_PROJECT_ID' });
```

## What It Tracks

- **Page views** — automatic, works with SPAs
- **JavaScript errors** — caught and uncaught, with stack traces
- **Web Vitals** — LCP, CLS, FID, TTFB, INP
- **Custom events** — track signups, purchases, anything

## Privacy First

- No cookies
- No personal data collection
- GDPR compliant by default
- Self-hostable under AGPL-3.0

## Configuration

```typescript
init({
  projectId: 'YOUR_PROJECT_ID',
  endpoint: 'https://app.vibeping.dev', // or your self-hosted URL
  debug: false,
  trackPageViews: true, // default: true
  trackErrors: true, // default: true
  trackWebVitals: true, // default: true
});
```

## Custom Events

```typescript
import { track } from '@vibeping/sdk';

track('signup', { plan: 'pro', source: 'landing-page' });
track('purchase', { amount: 29, currency: 'USD' });
```

## Links

- [Documentation](https://vibeping.dev/docs)
- [Dashboard](https://app.vibeping.dev)
- [GitHub](https://github.com/Vibeping/vibeping)
- [Website](https://vibeping.dev)

## License

AGPL-3.0 — see [LICENSE](../../LICENSE) for details.
