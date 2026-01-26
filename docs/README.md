# BCH Creator Hub — Documentation

This folder and the repo root contain all project documentation. Use this index to find the right doc for your task.

## Quick links

| If you want to… | Read this |
|-----------------|-----------|
| Get the app running | [Main README](../README.md) → Quick Start |
| Understand the system design | [Main README – Architecture](../README.md#architecture) and [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Configure env vars | [ENVIRONMENT.md](./ENVIRONMENT.md) |
| Integrate with the API | [API_INTEGRATION_IMPROVEMENTS.md](./API_INTEGRATION_IMPROVEMENTS.md) |
| Set up NFTs (EVM contracts) | [NFT_SETUP.md](./NFT_SETUP.md) |
| Use demo/mock mode | [DEMO_INTEGRATION.md](../DEMO_INTEGRATION.md) |
| Understand Web3/BCH integration | [WEB3_INTEGRATION.md](../WEB3_INTEGRATION.md) |
| See BCH ecosystem fit | [BCH_ECOSYSTEM_INTEGRATION.md](./BCH_ECOSYSTEM_INTEGRATION.md) |
| Contribute code | [CONTRIBUTING.md](../CONTRIBUTING.md) |

---

## In this folder (`docs/`)

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Technical architecture and implementation plan (BCH Paywall Router), data models, security, deployment, and testing.
- **[API_INTEGRATION_IMPROVEMENTS.md](./API_INTEGRATION_IMPROVEMENTS.md)** — Frontend–backend API integration: unified service, endpoint mapping, migration from legacy clients.
- **[BCH_ECOSYSTEM_INTEGRATION.md](./BCH_ECOSYSTEM_INTEGRATION.md)** — How the app fits the Bitcoin Cash ecosystem (UTXOs, CashScript, CashTokens, indexing, UX).
- **[ENVIRONMENT.md](./ENVIRONMENT.md)** — Environment variables for frontend, backend, contracts, and external services.
- **[NFT_SETUP.md](./NFT_SETUP.md)** — NFT marketplace setup: EVM contracts (ERC-721, lazy mint, IPFS), frontend config, voucher flow.

---

## In the repo root

- **[README.md](../README.md)** — Main entry point: overview, features, quick start, architecture, API, DB, deployment, security, troubleshooting.
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** — How to contribute: setup, style, tests, PRs.
- **[DEMO_INTEGRATION.md](../DEMO_INTEGRATION.md)** — Demo mode: mock data, `DEMO_MODE` toggle, wallet/API behavior.
- **[WEB3_INTEGRATION.md](../WEB3_INTEGRATION.md)** — Web3 layer: BCHProvider, API/WebSocket clients, hooks, WalletConnect/PaymentFlow.
- **[IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md)** — NFT marketplace implementation summary (CREATE2, EIP-712, batch/Merkle).
- **[README_NFT.md](../README_NFT.md)** — NFT-focused readme (if present).

---

## Other doc locations

- **Backend:** `backend/README.md`, `backend/docs/SECURITY.md`, and backend-specific READMEs in `backend/`.
- **Contracts:** `contracts/README.md`, `contracts/README_NFT_MARKETPLACE.md`.
- **Demo:** `src/demo/README.md`, `demo/README.md`.

---

## Diagram and TOC reference

The [main README – Technical diagrams](../README.md#technical-diagrams) table lists all Mermaid diagrams (system topology, ZMQ pipeline, OP_RETURN, security, ERD, etc.) and links to their sections.
