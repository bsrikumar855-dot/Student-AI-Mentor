# Production Readiness Notes

This file tracks what changed to make the backend deployable, and what still
needs an operator decision before a real internet-facing deployment.

## What's enforced automatically

Set `APP_ENV=production` and the app will, at import/boot time:

- **Refuse to start** if `DRISHTA_API_KEY` is unset or still the shipped
  default, if no signing secret is configured for login tokens, or if
  `CORS_ALLOWED_ORIGINS` is unset (see `backend/main.py:_run_production_safety_checks`).
- **Hide** `/docs`, `/redoc`, and `/openapi.json`.
- **Default demo endpoints (`/demo/drift-hero`, `/demo/reset`) to OFF** (override
  with `ALLOW_DEMO_ENDPOINTS=true` if you deliberately want them, e.g. a staging
  demo environment).
- **Warn** (not block) if the built-in demo login accounts
  (`alex.mercer@university.edu` / `password123`, etc.) are still enabled —
  set `DRISHTA_ALLOW_DEMO_USERS=false` and provide `DRISHTA_AUTH_USERS` to turn
  them off.

`GET /health` is unauthenticated (no `X-API-Key` needed) for load balancer /
container orchestrator liveness checks, and the Dockerfile's `HEALTHCHECK`
uses it.

## Required environment variables

See `.env.example` for the full list with explanations. At minimum, in
production, set: `APP_ENV=production`, `DRISHTA_API_KEY`, `CORS_ALLOWED_ORIGINS`.

## Known limitations an operator should account for

- **Single-process state.** Rate limiting (`backend/rate_limit.py`) and the
  in-memory Codeforces cache (`backend/coding.py`) live in process memory.
  Running multiple Uvicorn/Gunicorn workers (or multiple replicas) means each
  process enforces rate limits independently — a client could get up to
  `limit × worker_count` requests through. The student/plan data store itself
  is fine across workers as long as `POLARIS_PERSIST_PATH` points at a shared
  SQLite file (WAL mode is already enabled), but for true horizontal scaling,
  the rate limiter and coding cache should move to a shared backend (Redis is
  the natural choice) before running more than one worker process.
- **`/auth/login` is a minimal credential store**, not a full identity
  provider (see `backend/auth.py`'s module docstring). It's suitable for a
  small, operator-managed user list; swap it for real SSO/OAuth before this
  is a multi-tenant, self-serve product.
- **Login tokens are not server-side revocable.** They're signed
  (HMAC-SHA256) and self-contained with an expiry (`DRISHTA_TOKEN_TTL_SECONDS`,
  default 24h); there's no server-side session store to invalidate a token
  early (e.g. on logout or password change) short of rotating
  `DRISHTA_TOKEN_SECRET`, which invalidates *all* outstanding tokens at once.
- **Trust `X-Forwarded-For` only behind a real proxy.** `DRISHTA_TRUST_PROXY=true`
  makes the rate limiter key off that header; only enable it when a proxy you
  control actually sets it, or a client can spoof its own rate-limit identity.
- **No structured request logging / tracing / metrics** beyond the existing
  `logging.basicConfig` setup. Fine for a single instance; add a proper
  logging/metrics stack (e.g. `structlog` + OpenTelemetry) if this needs to be
  observable across multiple instances.
