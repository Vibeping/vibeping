# Contributing to VibePing

Thanks for wanting to contribute to VibePing! 🏓

This doc covers everything you need to get set up and submit a PR.

## Prerequisites

- **Node.js 20+** — We use modern Node features. Check with `node -v`.
- **pnpm 9+** — This is a pnpm workspace monorepo. Install with `corepack enable` or `npm install -g pnpm`.
- **Docker** (optional) — Only needed if you're running the full stack locally with Supabase.

## Development Setup

```bash
# 1. Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/vibeping.git
cd vibeping

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase keys (or use the defaults for local dev)

# 4. Start the dev server
pnpm dev            # Starts the dashboard at http://localhost:3000

# 5. Build everything
pnpm build

# 6. Run tests
pnpm test
```

### Working on the SDK only

```bash
cd packages/sdk
pnpm dev            # Watch mode, rebuilds on changes
pnpm test           # Run SDK tests
pnpm build          # Build the SDK bundle
```

### Working on the Dashboard only

```bash
cd apps/dashboard
pnpm dev            # Next.js dev server at localhost:3000
```

## Project Structure

```
vibeping/
├── packages/
│   └── sdk/               # The tracking SDK (<5KB gzipped)
│       ├── src/            # SDK source code
│       ├── test/           # SDK tests
│       └── tsconfig.json
├── apps/
│   └── dashboard/         # Next.js dashboard (self-hostable)
│       ├── app/           # Next.js App Router pages
│       ├── components/    # React components
│       └── lib/           # Utilities and API helpers
├── supabase/
│   └── migrations/        # SQL migration files
├── docker-compose.yml     # Full-stack local setup
├── turbo.json             # Turborepo config
├── pnpm-workspace.yaml    # Workspace config
└── .env.example           # Environment variable template
```

**Key things to know:**

- The SDK in `packages/sdk` is the script tag / npm package that runs on end-user sites. It must stay under 5KB gzipped. Every byte counts.
- The dashboard in `apps/dashboard` is what developers use to view their analytics. It's a standard Next.js app.
- Supabase migrations in `supabase/migrations` are applied in order. Never edit an existing migration — create a new one.

## Running Tests

```bash
pnpm test           # Run all tests across the monorepo
pnpm test:sdk       # Run SDK tests only (if available)
pnpm lint           # Lint all packages
pnpm typecheck      # TypeScript type checking
```

Write tests for new features. If you're fixing a bug, add a test that would have caught it.

## Code Style

We keep it simple:

- **TypeScript strict mode** — No exceptions.
- **No `any` types** — Use `unknown` with type guards instead.
- **Functional React components** — No class components.
- **Named exports** — Prefer `export function Thing()` over `export default`.
- **No unnecessary abstractions** — Write clear, direct code. If a function is only used once and isn't complex, maybe it doesn't need to be extracted.
- **Formatting** — We use the project's ESLint and Prettier config. Run `pnpm lint` before submitting.

For the SDK specifically:

- **Zero dependencies** — Don't add npm packages. The SDK must have no runtime dependencies.
- **Size budget** — Keep it under 5KB gzipped. Run `pnpm build` in `packages/sdk` and check the output size.

## Branch Naming

- `feat/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation changes
- `chore/description` — Maintenance tasks

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add error auto-capture
fix: resolve pageview double-counting
docs: update SDK installation guide
chore: bump typescript to 5.5
```

## Pull Request Guidelines

1. **Target the `dev` branch** — Not `main`.
2. **Keep PRs focused** — One feature or fix per PR. Smaller PRs get reviewed faster.
3. **Write a clear description** — What does this change? Why? Include screenshots for UI changes.
4. **Make sure CI passes** — Tests, linting, type checking, and build must all be green.
5. **Add tests** — New features need tests. Bug fixes should include a regression test.
6. **Don't break the size budget** — If you're touching the SDK, check the bundle size.

## Reporting Issues

When opening an issue, include:

- **What happened** — Clear description of the bug or unexpected behavior.
- **What you expected** — What should have happened instead.
- **Steps to reproduce** — Minimal reproduction steps. A link to a repo or CodeSandbox is ideal.
- **Environment** — Browser, OS, Node version, SDK version, framework.

For feature requests, describe the use case, not just the solution you have in mind.

## Questions?

- Open a [GitHub Discussion](https://github.com/Vibeping/vibeping/discussions) for questions or ideas
- Reach out on X at [@VibePingDev](https://x.com/VibePingDev)
- Email: hello@vibeping.dev

---

Thanks for helping make VibePing better. 🏓
