# Tolik's Poems

A small WordPress-powered poetry site with a dummy-data fallback.

## Scripts

- install: `pnpm install`
- dev: `pnpm dev`
- build: `pnpm build`
- start: `pnpm start`
- lint: `pnpm lint`
- types: `pnpm check-types`

## Runtime

- Node: `24.x`
- Package manager: `pnpm@10.21.0`

## Env

Copy `env.example` to `.env.local`.

### WordPress

Set these to enable live WordPress content:

- `WP_BASE_URL`
- `WP_USERNAME`
- `WP_APP_PASSWORD`

If those values are missing, the app falls back to local dummy poems.

### Clerk

Set these to keep auth enabled:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Unlike the WordPress integration, Clerk does not have a local fallback mode here. `pnpm build` requires valid Clerk env values to be present.

## Standalone Notes

This app is being extracted from a monorepo into an app-owned standalone repo.

That means this repo now owns:

- its own package name: `toliks-poems`
- its own TypeScript config
- its own ESLint and PostCSS config
- its own local UI/core helpers instead of `@turbodima/*` imports
