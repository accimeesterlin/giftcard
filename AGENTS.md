# AGENTS.md — Seller Giftplace

> **Purpose:** Make AI coding assistants (Claude Code, GitHub Copilot, Cursor, etc.) and human contributors follow the same rules. Treat this file as the single source of truth for patterns, naming, and quality gates.

---

## 0) Project Snapshot

- **App:** Seller‑centric gift‑card marketplace (list, sell, fulfill via codes or Reloadly)
- **Architecture:** **Multi‑tenant** — sellers create and manage multiple companies; each company operates independently with its own listings, inventory, and branding
- **Stack:** Next.js (App Router, TypeScript), shadcn/ui + Tailwind, Node API route handlers, API **versioning**, Stripe + PayPal + Crypto + PGPay, DynamoDB (or your chosen DB), S3 for secure code storage, SQS for jobs
- **Foundations:** Mobile‑first responsive UI, accessibility (WCAG 2.1 AA), strict TypeScript, ESLint + Prettier, testing (Vitest/Playwright)

---

## 1) Golden Rules (read first)

1. **TypeScript strict** everywhere (`"strict": true`). No `any` unless justified with comment.
2. **API versioning is mandatory.** All external API routes are namespaced by version (e.g., `/api/v1/...`). No unversioned public endpoints.
3. **Mobile‑first.** Design smallest breakpoints first; scale up with Tailwind responsive utilities. Never ship UI that overflows on 320px.
4. **shadcn/ui only** for components; do not mix ad‑hoc CSS unless inside `components/ui/*` tokens. Use Tailwind for layout.
5. **Security by default.** Cookies > tokens in localStorage. Secrets in env + Secrets Manager; zero secrets committed. KMS encrypt gift codes at rest.
6. **Payments abstracted.** One provider‑agnostic `PaymentService` with adapters for Stripe, PayPal, Crypto, PGPay. Webhooks are idempotent and signed.
7. **Observability.** Structured logs, correlation IDs per request, error boundaries on FE, Sentry on FE/BE.
8. **Docs or it didn't happen.** Update this file + `/docs/*` when adding patterns, endpoints, envs, runbooks.

---

## 2) Multi‑Tenancy Architecture

**Core Concept:** One seller account can own/manage multiple **companies** (tenants). Each company is an independent selling entity with its own branding, listings, inventory, and payment settings.

### Data Model

- **Seller** (User): Authenticates; can create/join companies; has global settings (email, preferences).
- **Company**: The tenant unit. Has:
  - Unique slug/ID (e.g., `acme-cards`, `bob-marketplace`)
  - Display name, logo, bio
  - Payment provider configs (Stripe account, PayPal merchant ID, crypto wallet, PGPay key)
  - Subscription tier (optional for SaaS model)
- **Listing**: Belongs to one company; scoped by `companyId`.
- **Inventory/Codes**: Scoped by listing → company.
- **Orders**: Reference `companyId` for commission/payout logic.

### Access Control

- **Sellers** have roles per company: `owner`, `admin`, `manager`, `viewer`.
- Company owners can invite other sellers to collaborate.
- UI route pattern: `/dashboard/[companySlug]/...` for seller views.
- API pattern: `/api/v1/companies/{companyId}/listings`, etc. Must verify caller has access to that company.

### Isolation & Security

- **Row‑level security**: All DB queries for listings, inventory, orders filter by `companyId` and verify caller's membership.
- **No cross‑tenant leaks**: A seller with access to Company A cannot view/edit Company B's data unless explicitly granted.
- **Audit logs**: Track which seller (under which company) performed sensitive actions (code reveals, price changes, payouts).

### UI/UX

- Dashboard landing: list all companies user can access; select one to enter.
- Company switcher in nav bar (dropdown with company logos).
- Public storefront URLs: `/<companySlug>` or subdomain model (`acme.marketplace.com`) (optional).

### Migration & Onboarding

- Default: first‑time seller creates their first company during signup.
- Advanced sellers can create additional companies from dashboard settings.

---

## 3) Next.js Conventions

- **App Router** with RSC. Keep server components default; client components only when needed (`"use client"`).
- **Route Handlers** for API: `app/api/v1/.../route.ts`. Export `GET/POST` etc.
- **Caching**: Use `revalidate` + `cache: 'no-store'` for sensitive endpoints; do not cache codes.
- **Error handling**: Throw `AppError` with `statusCode`; map to JSON problem details in route handlers.
- **Zod** for all input validation (server & client forms). No unvalidated input reaches business logic.

---

## 4) UI & shadcn Standards

- Generate via `npx shadcn-ui@latest add button input form ...`.
- **Design tokens:** Tailwind config defines colors, radii, spacing. Dark mode supported.
- **Accessibility:** All interactive components keyboard‑navigable; `aria-*` where appropriate.
- **Forms:** React Hook Form + Zod resolver; reusable `<FormField>` wrappers.
- **Responsive:** Start at mobile; use `sm: md: lg:` utilities to progressively enhance.

---

## 5) API Versioning Policy

- **URL versioning**: `/api/v1/...` (public). Internal server components may call internal util functions without version.
- **Breaking changes** → bump minor version (v2) and maintain v1 for deprecation window.
- **Headers**: Return `X-API-Version: v1`; optional `Sunset` header when deprecating.
- **Changelog**: Update `/docs/API_V1.md` with endpoints, request/response, error codes.

---

## 6) Payments Abstraction

- Implement `PaymentService` interface:
  - `createIntent(orderId, amount, currency, provider)`
  - `captureOrConfirm(providerRef)`
  - `refund(providerRef, amount?)`
  - `getStatus(providerRef)`

- Providers live under `lib/payments/{stripe|paypal|crypto|pgpay}.ts`.
- **Webhooks**: `app/api/v1/payments/{provider}/webhook/route.ts` verifies signatures and upserts a normalized `PaymentEvent`.
- **Idempotency**: use provider idempotency keys + internal `PaymentEvent` de‑dup by `eventId`.

---

## 7) Security & Privacy

- Auth cookies: HTTP‑only, Secure, SameSite=Lax (Strict for dashboards). No tokens in localStorage.
- Gift codes at rest: KMS‑encrypted. In transit: never log or echo full code.
- Masked reveals with watermark; log reveal events (user, IP, device, ts).
- RBAC via OpenFGA (optional), or role flags on session (`buyer`, `seller`, `admin`).
- Secrets from process env for local; cloud via Secrets Manager with rotation. **Never** commit secrets.

---

## 8) Testing & Quality Gates

- **Unit**: Vitest + ts‑jest if needed. Coverage ≥ 80% for lib/payments + API handlers.
- **E2E**: Playwright for checkout flows (Stripe/PayPal sandbox), code reveal, and Reloadly stub.
- **Static**: ESLint (next, security, unicorn), Prettier. Type‑check CI must pass.
- **PR Checklist** (required in description):
  - [ ] Added/updated Zod schemas
  - [ ] Tests added/updated
  - [ ] Docs updated (`/docs/*`)
  - [ ] Mobile views verified (≤375px)
  - [ ] a11y check (tab order, labels)

---

## 9) Branching, Commits & PRs

- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`.
- Conventional Commits: `feat(api): add v1 order refund`.
- Small PRs (< 400 LoC). Link to issue/story. Include screenshots for UI diffs.

---

## 10) Environment & Tooling

- `.env.example` must list all vars (e.g., `STRIPE_KEY`, `PAYPAL_CLIENT_ID`, `PGPAY_SECRET`, `CRYPTO_RPC`, `KMS_KEY_ID`).
- `pnpm` preferred (or yarn). Node ≥ 20.
- Scripts:
  - `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `prepare` (husky), `analyze` (bundle).

---

## 11) How to ask Claude Code for help (house prompts)

> Put this at the top of your Claude Code chat when working in this repo.

**SYSTEM (pin this):**

```
You are an expert Next.js + TypeScript engineer working on a multi‑tenant, seller‑centric gift‑card marketplace. Always:
- Use Next.js App Router conventions. Prefer server components; client components only when necessary.
- Enforce multi‑tenancy: sellers can create/manage multiple companies (tenants); all listings, inventory, and orders are scoped by companyId with strict access control.
- Enforce mobile‑first responsive design and accessibility with shadcn/ui + Tailwind.
- Respect API versioning. All public endpoints live under /app/api/v1 and return typed JSON with Zod validation.
- Implement payment flows via a provider‑agnostic PaymentService (stripe, paypal, crypto, pgpay) with signed, idempotent webhooks.
- Never store secrets or payment data in client. Never log gift card codes. Use masked reveals with audit trails.
- Write tests (Vitest/Playwright) for new features and update docs under /docs/.
Return complete, production‑ready code with minimal external dependencies.
```

**DEVELOPER (use per task):**

```
Task: <describe the change>
Constraints: TypeScript strict, mobile‑first, a11y, performance p95 < 400ms for search.
Deliverables: code diffs (files, paths), tests, and documentation updates.
```

**CHECKLIST prompt (paste before finishing a PR):**

```
Review the diff against these gates:
- API routes under /api/v1 with Zod validation and typed responses
- Payment adapter isolated; no provider logic leaked into route handlers
- Mobile views verified at 320–375px; a11y labels and focus states applied
- Error boundaries + graceful fallback UI
- ESLint/TS passes; tests added; docs updated
```

---

## 12) API V1 Skeleton (documented contract)

### Multi‑Tenant (Company) Endpoints

- `POST /api/v1/companies` (seller auth) → create new company; caller becomes owner
- `GET /api/v1/companies` (seller auth) → list companies user has access to
- `GET /api/v1/companies/{companyId}` (seller auth) → get company details
- `PATCH /api/v1/companies/{companyId}` (seller auth, role ≥ admin) → update company settings
- `POST /api/v1/companies/{companyId}/members` (seller auth, role = owner) → invite seller to company
- `DELETE /api/v1/companies/{companyId}/members/{userId}` (seller auth, role = owner) → remove member

### Listings & Inventory (scoped by company)

- `POST /api/v1/companies/{companyId}/listings` (seller auth, role ≥ manager) → create listing
- `GET /api/v1/companies/{companyId}/listings` (seller auth) → list company's listings
- `PATCH /api/v1/companies/{companyId}/listings/{id}` (seller auth, role ≥ manager) → update listing
- `POST /api/v1/companies/{companyId}/listings/{id}/inventory` (seller auth, role ≥ manager) → bulk codes (encrypted)

### Buyer/Public Endpoints

- `GET /api/v1/listings` → public; filter by company, brand, category; paginated
- `GET /api/v1/listings/{id}` → public listing detail
- `POST /api/v1/cart` → create cart from listing/qty (server‑side)
- `GET /api/v1/buyer/orders` (buyer auth) → list user orders

### Payments & Orders

- `POST /api/v1/payments/intent` → `{ provider, orderId }` → `{ clientSecret | approvalUrl | address }`
- `POST /api/v1/orders/{id}/confirm` → finalize after provider approve/capture
- `POST /api/v1/payments/{stripe|paypal|crypto|pgpay}/webhook` → signed; updates `PaymentEvent` + `Order`

_All endpoints must: (a) authenticate, (b) validate with Zod, (c) return problem+JSON on errors, (d) verify company access for scoped routes._

---

## 13) Coding Patterns

- **Service layer** in `lib/*` (pure TS): business logic, easy to test.
- **Route handlers**: thin; parse → call service → map result → HTTP.
- **Adapters**: one file per provider (payments, Reloadly). Expose a minimal interface.
- **Errors**: `AppError(code, httpStatus, message, details?)` only.
- **Logging**: `logger.info({ event, orderId, provider })` JSON lines; never sensitive data.

---

## 14) Playbooks (Claude quick macros)

- **Generate a new API endpoint**
  1. Create `app/api/v1/<domain>/route.ts`
  2. Add Zod schema for body/query
  3. Call service in `lib/<domain>.ts`
  4. Add unit tests under `tests/api/<domain>.test.ts`
  5. Document in `/docs/API_V1.md`

- **Add a payment provider**
  1. Implement adapter in `lib/payments/<provider>.ts`
  2. Add webhook route + signature verify
  3. Register in `PaymentService`
  4. E2E sandbox test + docs `/docs/PAYMENTS.md`

---

## 15) Definition of Done (MVP)

- Feature works across **mobile** and desktop
- Tests pass; coverage unchanged or better
- a11y checked; no console errors
- API v1 contract respected; docs updated
- Logs observable; errors handled

---

## 16) Deprecation & Version Bumps

- Announce in `/docs/API_V1.md` with `Sunset` date
- Keep old version for at least one full minor release cycle
- Provide migration notes + codemods if feasible

---

# .claude/agent.md (optional, for Claude Code or Cursor)

Create a folder `.claude/` and add this file to bias the assistant for this repo.

```
# Role
Expert Next.js + TypeScript full‑stack engineer for a multi‑tenant gift‑card marketplace. Follow AGENTS.md strictly.

# Guardrails
- Multi‑tenant architecture: sellers own/manage multiple companies; scope all data by companyId with strict access control.
- Mobile‑first UI with shadcn/ui; no inline styles unless necessary.
- Versioned API only (/api/v1). Zod validation on all inputs.
- Payments through PaymentService adapters (stripe, paypal, crypto, pgpay). Idempotent, signed webhooks.
- Never log or expose gift card codes; use KMS at rest and masked reveal UX.

# Output Style
- Provide file paths, full code blocks, and brief rationale. Include tests and doc updates.
```

---

**End of AGENTS.md**
