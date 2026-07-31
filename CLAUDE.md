# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

QuickDine is a restaurant discovery and booking app split into two independent npm packages (no root workspace — install and run each separately):

- `client/` — Vite + React 19 + TypeScript SPA, styled with Tailwind CSS v4 (via `@tailwindcss/vite`, no `tailwind.config`). Routing with `react-router-dom` v7, HTTP via `axios`, toasts via `react-hot-toast`.
- `server/` — Express 5 + Mongoose REST API in TypeScript, run directly with `tsx` (no build step in the normal dev loop).

## Commands

Client (`cd client`):
- `npm run dev` — Vite dev server
- `npm run build` — type-check (`tsc -b`) then `vite build`
- `npm run lint` — ESLint (flat config, `eslint.config.js`)
- `npm run preview` — serve the production build

Server (`cd server`):
- `npm run server` — dev with auto-reload (`nodemon --exec tsx server.ts`)
- `npm start` — run once (`tsx server.ts`)
- `npm run build` — `tsc` compile (not used for running; runtime is `tsx`)
- Type-check without emitting: `npx tsc --noEmit`

There is **no test framework** configured in either package.

## Server environment

`server/.env` (loaded via `import "dotenv/config"`):
- `MONGODB_URI` — if unset or unreachable, the server logs a warning and **starts anyway without a DB connection** (see `config/db.ts`); it does not crash. Requests that hit the DB will then fail at query time.
- `JWT_SECRET` — required for auth to work; used to sign/verify tokens.
- `PORT` — defaults to `5000`.

## Backend architecture

- Entry `server/server.ts`: connects DB, mounts `cors()` + `express.json()`, mounts routers at `/api/auth` and `/api/restaurant`, and registers a **global error handler as the last middleware** (returns `{ message, error }`; `error` detail only when `NODE_ENV === "development"`).
- Layering is route → controller → Mongoose model. Controllers live in `controllers/`, models in `models/`, route definitions in `routes/`.
- **Auth & roles** (`middlewares/auth.ts`): `protect` reads `Authorization: Bearer <token>`, verifies the JWT, loads the user (minus password) onto `req.user` (typed via `AuthRequest`). `authorizeRoles(...roles)` gates by role; prebuilt guards `adminOnly`, `ownerOnly`, `userOrOwner`. Roles are `"user" | "admin" | "owner"`.
- **Models**: `User` (password hashed with bcrypt; a `toJSON` transform strips `password`), `Restaurant` (has `owner` ref, a `status` approval workflow `pending|approved|rejected`, unique `slug`), `Booking` (human-readable `bookingId` generated in a `pre("save")` hook). Restaurants are fetched publicly by `slug`; mutations require `protect`.

### ESM + `.ts` gotcha (important)

Both packages are `"type": "module"`. The server runs `.ts` files through `tsx`, but **relative imports must still use `.js` extensions** (e.g. `import connectDb from "./config/db.js"` even though the file is `db.ts`). Match this convention in any new server file — omitting the extension or using `.ts` will break resolution.

## Frontend architecture

- `App.tsx` defines all routes. `ProtectedRoute` wraps auth-gated pages and accepts an `allowedRoles` prop for role-restricted routes (`/owner/dashboard`, `/admin/dashboard`).
- Global auth state lives in `context/AppContext.tsx` (`useAppContext()` hook): exposes `user`, `token` (persisted to `localStorage`), `isAuthenticated`, the auth modal toggle, and `login`/`register`/`logout`.
- Components are grouped by feature area under `components/` (`admin/`, `owner/`, `booking/`, `restaurant/`, `home/`); pages under `pages/`.

### Frontend auth is currently stubbed (important)

`AppContext`'s `login`/`register` do **not** call the backend yet — they set a hardcoded `dummyUser` from `assets/assets.ts`. When wiring real auth, replace these with `axios` calls to `/api/auth/login` and `/api/auth/register` and store the returned token. There is no Vite dev proxy configured, so the client needs the full API base URL (backend defaults to `http://localhost:5000`).
