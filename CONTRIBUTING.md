# Contributing to BCH Creator Hub

Thanks for your interest in contributing. This document covers how to set up the project, follow our conventions, and submit changes.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

Be respectful and constructive. We aim to keep the project welcoming and focused on building non-custodial tools for Bitcoin Cash creators.

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** and add the upstream remote:
   ```bash
   git clone https://github.com/YOUR_USERNAME/bch-creator-hub.git
   cd bch-creator-hub
   git remote add upstream https://github.com/ORIGINAL_OWNER/bch-creator-hub.git
   ```
3. **Follow [Development Setup](#development-setup)** below.

## Development Setup

Detailed instructions are in the main [README – Installation & Setup](README.md#installation--setup). Summary:

- **Prerequisites:** Node.js 18+, PostgreSQL 14+, Redis 6+
- **Backend:** `cd backend && npm install && cp .env.example .env` (edit `.env`), then `npm run db:migrate` and `npm run dev`
- **Frontend:** From repo root, `npm install`, create `.env` with `VITE_API_URL`, `VITE_WS_URL`, `VITE_BCH_NETWORK`, then `npm run dev`

Environment variables are described in [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

## Code Style

- **ESLint** — Run `npm run lint` (root) or the backend lint script. Fix lint errors before submitting.
- **Prettier** — Use the project formatter where configured.
- **TypeScript** — Frontend uses TypeScript; run `npm run typecheck` and keep types accurate.
- **Naming** — Use clear, consistent names; follow existing patterns in the file you’re editing.
- **Commits** — Use clear, present-tense messages (e.g. `Add withdrawal error handling`, `Fix QR URL for payment links`).

## Testing

- **Frontend:** From repo root, `npm test` or `npm run test:watch`.
- **Backend:** `cd backend && npm test` (or `npm run test:watch` if available).

Add or update tests when you add or change behavior. Ensure existing tests pass before opening a PR.

## Pull Request Process

1. **Branch** — Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Implement** — Make your changes, following [Code Style](#code-style) and [Testing](#testing).
3. **Docs** — Update README, `docs/`, or code comments if you change behavior, APIs, or setup.
4. **Push** — Push to your fork and open a Pull Request against the upstream `main` branch.
5. **Description** — In the PR description, briefly explain the change and reference any related issues.
6. **Review** — Address review feedback; maintainers will merge when the PR is approved and CI (if any) passes.

### What we look for

- Consistency with existing architecture and patterns
- Tests for new or altered behavior
- Documentation updates where users or devs are affected
- No breaking changes to public APIs or env vars without notice and migration notes

## Documentation

- **Main entry:** [README.md](README.md)
- **Doc index:** [docs/README.md](docs/README.md) — links to architecture, API, env vars, NFT setup, demo mode, etc.
- **API integration:** [docs/API_INTEGRATION_IMPROVEMENTS.md](docs/API_INTEGRATION_IMPROVEMENTS.md) — frontend–backend API and unified service.

If you add or move docs, update [docs/README.md](docs/README.md) so the index stays accurate.

## Questions

Open a [GitHub Issue](https://github.com/yourusername/bch-creator-hub/issues) for bugs, features, or questions. For security-sensitive topics, prefer a private channel if the project provides one.
