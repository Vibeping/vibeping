# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-03

### Added

- TypeScript SDK (<5KB gzipped) with zero dependencies
- Auto-capture: pageviews, errors, web vitals, sessions
- Custom event tracking via `vibeping.track()`
- User identification via `vibeping.identify()`
- SPA support (React Router, Next.js, Vue Router)
- Next.js 14 dashboard with App Router
- Supabase auth (login/signup)
- Event ingestion API (POST /api/v1/event)
- Stats API with period filtering (GET /api/v1/stats)
- Project management with API key generation
- Uptime monitoring page
- Errors page with stack traces
- Events explorer page
- Settings page with project CRUD
- Docker self-hosting support (docker-compose + Dockerfile)
- Supabase database schema with Row Level Security
- CI pipeline (typecheck, test, build)
- 87 tests (51 SDK unit tests + 36 API route tests)
- AGPL-3.0 license

[0.1.0]: https://github.com/Vibeping/vibeping/releases/tag/v0.1.0
