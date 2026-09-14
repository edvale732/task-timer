<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TaskTimer Agent Guidance

## Project Commands

- Use `pnpm` (the repository pins `pnpm@11.24.0` in `package.json`).
- Start local development with `pnpm dev`.
- Run validation with `pnpm lint` and `pnpm build`.
- There is currently no test script; do not invent one unless the task requires test infrastructure.

## Architecture

- This is a Next.js 16 App Router application. Route UI lives under `app/`; shared global styles are in `app/globals.css`.
- `app/page.tsx` is the public authentication entry point and renders the client-side login/sign-up UI from `app/ui/login.tsx`.
- `app/dashboard/` is the authenticated product area. Keep route metadata and server components in the route files unless client state or browser APIs require a separate `"use client"` component.
- `app/api/auth/[...all]/route.ts` is the Better Auth route handler. Authentication configuration belongs in `app/lib/auth.ts`; browser auth helpers belong in `app/lib/auth-client.ts` and the adjacent sign-in/sign-up modules.
- Use the `@/*` path alias for imports rooted at the repository, matching the existing auth imports.

## Conventions And Pitfalls

- Read the relevant Next.js guide in `node_modules/next/dist/docs/` before changing framework behavior, as required by the generated guidance above.
- Preserve strict TypeScript settings and the existing ESLint configuration. Prefer typed React props and avoid weakening compiler settings to silence errors.
- Keep secrets and connection strings in local environment variables. Never commit `.env.local`, credentials, OAuth secrets, or database URLs; use the variable names already consumed by `app/lib/auth.ts` (`DATABASE_URL`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`).
- Authentication redirects currently target `/dashboard`; changes to auth flows should be checked at both the login page and the callback/API route.
- Keep client-only code narrowly scoped. Components using `authClient`, router hooks, event handlers, or browser APIs need `"use client"`; server route files should remain server-side.
