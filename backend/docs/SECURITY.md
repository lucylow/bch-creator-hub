# Security

## Environment Variables (required in production)

Set these in production; the server will not start if they are missing when `NODE_ENV=production`:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret for signing JWTs. Use a long, random value (e.g. `openssl rand -hex 32`). Never use the default in production. |

Recommended for production:

| Variable | Description |
|----------|-------------|
| `ALLOWED_ORIGINS` | Comma-separated list of origins for CORS (e.g. `https://app.example.com`). Avoid `*` when using credentials. |
| `JWT_EXPIRES_IN` | JWT lifetime (e.g. `7d`, `24h`). Default: `7d`. |
| `API_RATE_LIMIT_WINDOW_MS` | Rate limit window in ms. Default: 900000 (15 min). |
| `API_RATE_LIMIT_MAX_REQUESTS` | Max requests per IP per window. Default: 100. |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Auth rate limit window. Default: 900000. |
| `AUTH_RATE_LIMIT_MAX` | Max login/challenge attempts per window. Default: 20. |
| `PAYMENT_RATE_LIMIT_MAX` | Max payment-record attempts per minute. Default: 10. |
| `WITHDRAWAL_RATE_LIMIT_MAX` | Max withdrawal/contract-withdraw attempts per minute. Default: 5. |

## Implemented measures

- **Authentication**: BIP-322 message signing; no server-side private keys. JWTs use HS256 and configurable expiry.
- **Rate limiting**: Global API limit, stricter auth limit, payment and withdrawal limits per endpoint group.
- **CORS**: Configurable via `ALLOWED_ORIGINS`; explicit methods and headers.
- **Helmet**: HSTS, XSS filter, no-sniff, referrer policy, permitted cross-domain policies.
- **Input validation**: express-validator on auth, payments, withdrawals, and other inputs.
- **Audit logging**: Financial and auth events written to `logs/audit.log` and the main logger. Events include payments, withdrawals, contract withdraws, and auth success/failure.
- **Secrets**: No hardcoded JWT secret in production; startup asserts required vars when `NODE_ENV=production`.

## Audit log

Audit entries are written to `logs/audit.log` and to the normal log stream. Each line is JSON with `audit: true`, `event`, `at`, and context (e.g. `creatorId`, `txid`, `amountSats`). Use for compliance and to alert on suspicious activity.

## Backup and monitoring

- Prefer automated database backups and point-in-time recovery where available.
- Monitor audit logs and error rates; alert on repeated auth failures or spikes in financial actions.
- Keep dependencies updated (`npm audit`, `npm update`).
