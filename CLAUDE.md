# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ARCADIA is an SSR web app for a bar-restaurant (Lloret de Mar), built with Astro. It covers the full flow: public catalog/menu, online ordering with product customization, checkout, customer accounts, loyalty, and a full operational backoffice (admin) for staff. Public copy is multilingual (`es`, `ca`, `en`, `fr` — see `src/lib/i18n.ts`), with `es` as default.

## Commands

```bash
npm run dev                  # local dev server (astro dev)
npm run build                # SSR build against remote DB (astro build --remote)
npm run preview              # preview local build
npm run db:push              # apply db/config.ts schema to local Astro DB
npm run db:seed              # run db/seed.ts locally (destructive, see below)
npm run db:bootstrap         # run db/bootstrap.ts locally
npm run db:push:remote       # apply schema to remote DB
npm run db:seed:remote       # run db/seed.ts against remote (destructive — avoid if real data exists)
npm run db:bootstrap:remote  # run db/bootstrap.ts against remote
npm run build:vercel         # push+bootstrap remote, then build (used by Vercel deploys)
```

There is no lint/test script configured in `package.json` — type-checking is via `@astrojs/check`/`tsc` (strict Astro tsconfig), there is no test runner in this repo currently.

Local setup:
```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```
Then open `http://localhost:4321` and `http://localhost:4321/admin`.

### Seeds — important distinction
- `db/seed.ts`: catalog/base-data seed for dev/reset. **Destructive** — clears key tables before rebuilding catalog + config. Never run against remote if real orders/payments/data exist.
- `db/seed.runtime.ts`: non-destructive runtime defaults (`AppSetting`, `OpeningHour`, `LoyaltyTier`, plus legacy→V2 menu migration if empty). Not wired into the npm scripts by default.
- `db/bootstrap.ts`: what actually runs on Vercel builds (`build:vercel`), separate from `seed.ts`.

## Environment variables

Production (Vercel) build **fails on purpose** if Upstash Redis vars are missing, to avoid shipping broken sessions/cart/auth (enforced in `astro.config.mjs`):
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
Locally, sessions fall back to an in-memory `unstorage` driver when Upstash vars are absent.

Other vars (see `.env.example`): `ASTRO_DB_REMOTE_URL`/`ASTRO_DB_APP_TOKEN` (remote DB), `SMTP_*` (newsletter/admin mail via nodemailer), `BLOB_READ_WRITE_TOKEN` (Vercel Blob for product images), `PUBLIC_RECAPTCHA_SITE_KEY`/`RECAPTCHA_SECRET_KEY`, `GOOGLE_PLACES_API_KEY`/`GOOGLE_PLACE_ID` (home reviews), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URI` (Sign in with Google), `CONTACT_TO`.

## Stack

Astro 6 (`output: "server"`, `@astrojs/vercel` adapter) + TypeScript + Preact islands + Tailwind CSS 4 + Astro DB (libSQL-based) + Upstash Redis sessions (prod) + Vercel Blob (images) + Nodemailer.

Path aliases (`tsconfig.json`): `@/*` → `src/*`, plus `@/pages`, `@/sections`, `@/components`, `@/islands`, `@/features`, `@/server`, `@/lib`, `@/styles`.

## Architecture

### Rendering model: Astro pages + Preact islands
Pages under `src/pages/**` are server-rendered `.astro` files (layouts in `src/layouts/{SiteLayout,AdminLayout}.astro`). Interactive pieces are Preact islands under `src/islands/<domain>/*.tsx` (e.g. `cart`, `checkout`, `product`, `admin`, `auth`, `loyalty`, `upsell`, `menu`, `order`, `account`, `home`). Islands talk to the backend exclusively through the JSON API routes in `src/pages/api/**` — there is no separate API server. `src/islands/_shared/{http,lang}.ts` hold shared fetch/i18n helpers for islands.

Business logic that isn't trivial CRUD lives in `src/server/**`, organized by domain (`auth`, `checkout` (coupons), `delivery` (zone/area validation), `loyalty` (points engine + tier progress), `media` (product image resolution), `menu` (public menu assembly), `payments` (payment method settings), `time` (Madrid-timezone opening-hours/availability logic), `audit` (audit log writer)). API routes call into `src/server/**` rather than embedding logic inline where the logic is shared. There's also `src/features/{cart,hours}/server/*` for a couple of cross-cutting server helpers (cart summary, weekly hours) — a slightly separate convention from `src/server`, worth checking both when working on cart/hours behavior.

### Data model (`db/config.ts`, Astro DB)
Single schema file defines every table. Key conventions stated in the file's header comment: **money is stored in cents**, order-related rows (`OrderItem`, `Order.addressSnapshot`) store **snapshots** so historical orders don't change if catalog/address data changes later, and session storage holds `cart` and `user` (see `App.SessionData` in `src/env.d.ts`).

Domains in the schema: identity (`User`, `UserProfile`, `Address`, `NewsletterSubscriber`), catalog (`Category`, `Product`, `ProductVariant`, `Ingredient`, `ProductIngredient`, `CategoryIngredient`, `Allergen`, `ProductAllergen`, `ModifierGroup`/`ModifierOption`/`ProductModifierGroup`, `TaxRate`), daily/holiday menus (`Menu`, `MenuItem`, `MenuDish`, `MenuDishAssignment` — a "V2" menu system, see note below), operations (`OpeningHour`, `SpecialDate`, `DeliveryZone`, `AppSetting`), commerce (`Order`, `OrderItem`, `Payment`, `Refund`, `Coupon`), loyalty (`LoyaltyTier`, `LoyaltyLedger`), and misc (`MediaAsset`, `AuditLog`, `UpsellItem`).

Note: the README and seed comments reference a legacy menu system being migrated to "menu V2" (`Menu`/`MenuItem` referencing `MenuDish`/`MenuDishAssignment`); `db/seed.runtime.ts` has the migration logic and is not wired into default scripts — check current admin usage (`src/pages/admin/menu.astro`, `src/pages/api/admin/menu-v2.ts` vs `menus.ts`) before assuming which system is live.

### Auth, sessions, and route protection
`src/middleware.ts` is the single access-control choke point: it resolves `context.locals.lang` from the `arcadia_lang` cookie, loads `session.get("user")` into `context.locals.user`, and gates routes into three tiers — `public`, `account` (`/cuenta/**`, redirects to `/login`), `admin` (`/admin/**` except `/admin/login`, requires role `ADMIN` or `STAFF`, redirects to `/admin/login`). `User.role` is `ADMIN | STAFF | CUSTOMER`. Auth endpoints: `src/pages/api/auth/{login,register,logout}.ts` and Google OAuth (`src/pages/api/auth/google/{start,callback}.ts`); separate admin login/logout at `src/pages/api/admin/{login,logout}.ts`.

### Ordering flow
1. Customer browses `/pedir`, `/carta`, or `/menu`; product customization happens in `src/islands/product/ProductConfiguratorModal.tsx` (remove base ingredients, add common ingredients, pick modifier group options, see running total).
2. Cart is session-based (`src/islands/cart/*`, `src/pages/api/cart/*`, session key `cart` — see `CartItemSession` shape in `src/env.d.ts`).
3. Checkout (`src/islands/checkout/CheckoutForm.tsx` → `POST /api/checkout/submit`) re-validates everything server-side: opening-hour/kitchen availability and forced-pickup logic (`src/server/time/madrid.ts`), delivery address vs. delivery zones (`src/server/delivery/area.ts`), coupon validity (`src/server/checkout/coupons.ts`), and re-prices every line from current DB rows (never trusts client-sent prices) before inserting `Order`/`OrderItem` snapshots.
4. **Payments are not live**: `normalizePaymentMethod` only distinguishes `CASH`/`CARD`; the `Payment` row created for `CARD` is explicitly a fake/manual test gateway (`raw.mode: "test-gateway"`, comment "Pago con pasarela de prueba sin cobro real"), redirecting to `/pasarela/prueba/[publicId]` (see `src/pages/api/payments/test/{confirm,cancel}.ts` and `src/pages/pasarela/**`). There is no real Stripe wiring yet despite the `Payment.provider` enum being `"stripe"`.
5. Loyalty points are awarded once per order via `awardOrderPointsOnce` (`src/server/loyalty/engine.ts`) only for authenticated `CUSTOMER` orders.
6. Order confirmation/tracking at `/pedido/[publicId]`.

### Admin / backoffice
`src/pages/admin/**` (protected by middleware) + `src/pages/api/admin/**` cover: dashboard, catalog management (categories, products incl. variants/ingredients/allergens/modifier-groups per product, ingredients, allergens, compatibilities/category-ingredients, modifiers), operativa (opening hours, special dates, fees, payment method toggles), menu (daily/holiday menus), upsell, users, loyalty tiers, coupons, newsletter, kitchen board (`src/islands/admin/KitchenBoard.tsx`, `src/pages/admin/cocina.astro`, `src/pages/api/admin/kitchen/orders.ts`), and audit log (`src/server/audit/log.ts`, `src/pages/admin/audit.astro`). Nearly every admin mutation should write an `AuditLog` entry — check `src/server/audit/log.ts` usage when adding new admin write endpoints.

### Time/availability logic
`src/server/time/madrid.ts` is the source of truth for "is the restaurant open / is delivery available right now," resolving in priority order: pause-orders app setting → special dates (closures/exceptions) → weekly `OpeningHour` per channel (`DINE_IN`/`DELIVERY`/`PICKUP`). Its output (`getArcadiaAvailability`) drives both public-facing messaging (`src/server/time/publicMessages.ts`) and hard checkout validation — don't duplicate availability logic elsewhere.

### i18n
`src/lib/i18n.ts` holds `SUPPORTED_LANGS` (`es`, `ca`, `en`, `fr`) and all static public copy (footer, header nav, FAQ, contact, legal, privacy) per language as a big nested object (`siteCopy`). Language is resolved from the `arcadia_lang` cookie in middleware into `locals.lang`; there's no route-based i18n (`/en/...`), it's cookie-driven single-path.

### Images
Product images live in `public/images/products`; ingredient images in `public/images/ingredients` (falls back to `placeholder.svg`, with some hardcoded family-matching rules for things like `queso`/`pollo`/`beicon`/`salsas` — see `src/server/media/product-images.ts`). Admin can override `imageUrl` per ingredient/product directly. New product/ingredient images uploaded via admin go through Vercel Blob (`BLOB_READ_WRITE_TOKEN`).

## Deploy notes (Vercel)
- `output: "server"` with `@astrojs/vercel`; build command is `build:vercel` (`db:push:remote` → `db:bootstrap:remote` → `astro build --remote`). Remote seeds (`db:seed:remote`) are **not** run automatically on deploy — an empty remote DB will be missing catalog, images, hours, loyalty tiers, and operational config until seeded deliberately.
