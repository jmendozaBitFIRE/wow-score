# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Next.js version

This project runs **Next.js 16.2.4**. APIs, file conventions, and behavior differ from older versions in your training data. **Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.** Heed deprecation notices in those docs.

Key breaking changes already in effect:
- `middleware.ts` is deprecated and renamed to **`proxy.ts`** with a named export `proxy` (not `default middleware`). See `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
- `params` and `searchParams` props in pages are **Promises** — always `await` them.
- `cookies()` and `headers()` from `next/headers` are **async** — always `await` them.

## Commands

```bash
npm run dev       # development server (http://localhost:3000)
npm run build     # production build — requires real env vars (see below)
npm run lint      # ESLint
npm start         # production server (run after build)
```

There is no `test` script. TypeScript checking: `npx tsc --noEmit`.

**Build note:** `npm run build` fails with `Invalid supabaseUrl` if `.env.local` contains placeholder values. The build requires a real Supabase URL. Copy `.env.local.example` and fill all variables before building.

## Architecture

### Multi-tenant SaaS model

The app is a multitenant ad-creative scoring tool. The tenant unit is **`company`**, not the individual user. Every data isolation decision flows from this:

```
auth.users (Supabase Auth)
    └── profiles  (one per user, belongs to exactly one company, role: owner|member)
            └── companies  (the tenant: holds Stripe subscription, max_members)
                    └── evaluations  (ad analysis results, scoped to company)
```

**Critical rule:** `company_id` used in any DB query must **always** be derived server-side via `getUser() → profile → company_id`. Never trust a `company_id` from request body or URL params.

### Supabase client pattern

Three clients, each with a specific purpose:

| File | Export | When to use |
|---|---|---|
| `lib/supabase/server.ts` | `async createClient()` | Server Components, Route Handlers, Server Actions — reads/writes session cookies |
| `lib/supabase/client.ts` | `createClient()` | Client Components only |
| `lib/supabase/admin.ts` | `createAdminClient()` | Server-only operations that must bypass RLS: registration inserts, webhook updates, storage uploads |

`createAdminClient()` is a **factory function**, not a singleton. Never call it at module level — it must be called inside the handler/component function body to avoid build-time failures.

### Route protection

`proxy.ts` (the Next.js 16 equivalent of middleware) protects `/dashboard/*` routes. It:
1. Creates a `createServerClient` instance that refreshes the session token via cookies
2. Redirects unauthenticated requests to `/login`

API routes (`/api/*`) each independently call `createClient()` → `getUser()` and return 401 if no session. They do not rely solely on the proxy.

### WOW Score formula system

`lib/wow-formulas.ts` contains `WOW_FORMULAS` — a map of 42 entries keyed `${Medio}_${Objetivo}` (7 medios × 6 objetivos). Each entry has `bondad` (string describing the medium's nature) and `pesos` (10 weighted dimensions summing to 100). This data is used exclusively server-side to build the OpenAI system prompt in `/api/analyze`. The weights and formula logic are never sent to the client.

### Stripe integration

- `/api/stripe/checkout` — creates Checkout Sessions; `plan` is validated against `PLAN_PRICE_MAP` in `lib/stripe.ts`
- `/api/stripe/webhook` — must read body with `request.text()` (raw, not parsed) before calling `stripe.webhooks.constructEventAsync`. Identifies company by `stripe_customer_id`, not by metadata
- `/api/stripe/portal` — restricted to `role === 'owner'`

### Server Actions

Auth flows use Server Actions in `lib/actions/auth.ts` with `useActionState` in client form components. The register action uses `createAdminClient()` for DB inserts because the user has no active session yet when those inserts run.

### Page patterns

Pages under `(dashboard)` that need server-side auth use this pattern:

```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

Pages under `(auth)` are Server Components that pass `searchParams` (awaited Promise) as props to Client Component forms.

### Storage

Uploaded ad images go to bucket `ad-images` with path `{company_id}/{user_id}/{timestamp}-{filename}`. File type is validated against magic bytes server-side; the `file.type` header from multipart is not trusted alone.
