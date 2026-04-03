# Contributing to VibePing

Thanks for your interest in contributing to VibePing! 🏓

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/vibeping.git`
3. **Install dependencies**: `pnpm install`
4. **Create a branch**: `git checkout -b feat/your-feature`
5. **Make your changes**
6. **Run tests**: `pnpm test`
7. **Submit a PR** against the `dev` branch

## Development

```bash
pnpm install        # Install all dependencies
pnpm dev            # Start dashboard in dev mode
pnpm build          # Build everything
pnpm test           # Run tests
pnpm lint           # Lint code
```

## Branch Naming

- `feat/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation changes
- `chore/description` — Maintenance tasks

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add error auto-capture`
- `fix: resolve pageview double-counting`
- `docs: update SDK installation guide`

## Code Style

- TypeScript strict mode
- No `any` types (use `unknown` + type guards)
- Functional React components
- Named exports preferred

## Pull Requests

- PRs should target the `dev` branch
- Include a clear description of changes
- Add tests for new features
- Ensure CI passes

## Questions?

Open an issue or reach out at hello@vibeping.dev.
