<div align="center">

# 🍽️ QuickDine

### Restaurant Discovery & Booking Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express_5-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](client/LICENSE.md)

</div>

---

## Overview

**QuickDine** is a full-stack restaurant discovery and booking platform with role-based access for three types of users:

- **Diners** — browse restaurants, check availability, and make reservations
- **Owners** — manage a restaurant profile and its incoming bookings
- **Admins** — approve restaurants and monitor platform stats

## Tech Stack

**Client** — React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Axios, React Hot Toast

**Server** — Node.js (ESM), Express 5, TypeScript (run via `tsx`), Mongoose, JWT, Bcrypt, Cloudinary, Multer

**Infra** — MongoDB, Docker Compose, nginx

## Project Structure

```
QuickDine/
├── client/              # React SPA (Vite)
│   └── src/
│       ├── components/  # UI grouped by feature (admin, owner, booking, home, restaurant)
│       ├── context/     # Global auth state (AppContext)
│       ├── lib/         # Axios API client
│       └── pages/       # Route pages
├── server/              # Express REST API
│   ├── config/          # DB + Multer setup
│   ├── controllers/     # Route handlers
│   ├── middlewares/     # Auth + role guards
│   ├── models/          # Mongoose schemas (User, Restaurant, Booking)
│   ├── routes/          # API routes
│   └── seed.ts          # Database seeder
└── docker-compose.yml   # Full-stack orchestration
```

## Getting Started

**Prerequisites:** Node.js 18+, MongoDB 7+ (local or Docker).

```bash
# Backend
cd server
npm install
# create server/.env (see Environment Variables below)
npm run server        # dev with auto-reload → http://localhost:5000

# Frontend (in a second terminal)
cd client
npm install
echo 'VITE_API_URL="http://localhost:5000/api"' > .env
npm run dev           # → http://localhost:5173
```

Optionally seed sample data with `npm run seed` (from `server/`).

## Environment Variables

**`server/.env`**

```bash
MONGODB_URI=mongodb://localhost:27017/quick-dine
JWT_SECRET=your_long_random_secret
PORT=5000
NODE_ENV=development
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>   # for image uploads
```

**`client/.env`**

```bash
VITE_API_URL="http://localhost:5000/api"
```

> If `MONGODB_URI` is unset or unreachable, the server logs a warning and starts anyway (DB requests fail at query time).

## API Reference

Base URL: `http://localhost:5000/api` · Protected routes require `Authorization: Bearer <token>`.

**Auth** (`/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register a new user |
| POST | `/login` | — | Log in, receive a JWT |
| GET | `/me` | ✅ | Current user profile |

**Restaurants** (`/restaurant`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | — | List approved restaurants (filters: `search`, `priceRange`, `rating`, `location`, `sort`) |
| GET | `/featured` | — | Featured restaurants |
| GET | `/:slug` | — | Restaurant by slug |
| GET | `/:id/availability?date=` | — | Seat availability per time slot |
| POST · PUT · DELETE | `/` · `/:id` · `/:id` | ✅ | Create / update / delete |

**Bookings** (`/booking`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Create a booking |
| GET | `/my` | ✅ | My bookings |
| PUT | `/:id/cancel` | ✅ | Cancel a booking |

**Owner** (`/owner`, owner role) · **Admin** (`/admin`, admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET · POST · PUT | `/owner/restaurant` | Get / create / update own restaurant (multipart image upload) |
| GET | `/owner/bookings` | Bookings for the owner's restaurant |
| PUT | `/owner/bookings/:id/status` | Update a booking's status |
| GET | `/admin/restaurants` | All restaurants (any status) |
| PUT | `/admin/restaurants/:id/approve` | Approve or reject a restaurant |
| GET | `/admin/stats` | Platform statistics |

## Docker

```bash
cp server/.env.docker.example server/.env.docker   # fill in JWT_SECRET, CLOUDINARY_URL
docker compose up -d                                # client :5173 · server :5000 · db :27017
docker compose --profile seed run --rm seed         # optional: seed the database
```

## Seed Accounts

`npm run seed` **wipes** the database and inserts sample data plus these accounts (dev only):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@quickdine.com` | `admin123` |
| User | `jordan@quickdine.com` | `user123` |
| Owner | `maya@quickdine.com` | `owner123` |

## Scripts

| | Client (`cd client`) | Server (`cd server`) |
|--|----------------------|----------------------|
| Dev | `npm run dev` | `npm run server` |
| Build | `npm run build` | `npm run build` |
| Lint | `npm run lint` | — |
| Other | `npm run preview` | `npm start`, `npm run seed` |

## License

[MIT](client/LICENSE.md)
