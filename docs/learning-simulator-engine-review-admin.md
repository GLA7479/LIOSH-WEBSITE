# Engine Expert Review Pack — internal admin (remote)

Internal tooling only. Not parent-facing. Not student UI.

## Route

- `/learning/dev/engine-review` — visible only when `NEXT_PUBLIC_ENABLE_ENGINE_REVIEW_ADMIN=true` at **build** time.

## Vercel environment variables

In **Vercel → Project → Settings → Environment Variables**, add:

| Variable | Value | Notes |
|----------|--------|--------|
| `NEXT_PUBLIC_ENABLE_ENGINE_REVIEW_ADMIN` | `true` | Public flag; required at build so the route is included. |
| `ENGINE_REVIEW_ADMIN_TOKEN` | `7479` (or your secret) | Server-only. Same value must be sent as HTTP header `x-engine-review-token` when calling **Generate** from the admin page. |

Redeploy after changing env vars (especially `NEXT_PUBLIC_*`).

## Local development

Copy `.env.example` to `.env.local` and adjust; **do not commit `.env.local`** (gitignored via `.env*.local`).

## CLI source of truth

For a durable expert review pack on disk, run locally:

```bash
npm run qa:learning-simulator:expert-review-pack
```

Serverless deployments may not persist `reports/` between invocations; use CLI or CI artifacts for permanent packs.
