# Project Submission & Review Dashboard

A full-stack monorepo application for student project submissions and mentor reviews. Built with TypeScript across the entire stack, featuring strict input validation, role-based access control, secure JWT cookie authentication, and a clean, responsive UI.

---

## Architecture Overview

```
student-submission-portal/
├── server/                 # Express.js + Prisma + TypeScript API
│   ├── prisma/             # Schema & Seed script
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── app/
│       │   ├── config/     # Environment variable validation
│       │   ├── middleware/ # Auth, rate limiters, error handling
│       │   ├── modules/
│       │   │   ├── auth/   # Signup, login, logout, me
│       │   │   └── submissions/ # Submit, review, mine, list, stats
│       │   └── lib/        # Prisma client instance
│       ├── app.ts          # Express app configuration
│       └── server.ts       # Server entrypoint
└── client/                 # Next.js (App Router) + TailwindCSS + TanStack Query
    └── src/
        ├── app/
        │   ├── (auth)/     # /login, /signup
        │   ├── submit/     # Student project submission portal
        │   └── dashboard/  # Mentor review dashboard
        ├── components/     # UI primitives (shadcn-inspired) & Navbar
        └── lib/            # TanStack Query, fetch client, server auth guards
```

---

## Tech Stack

### Backend
- **Runtime & Language:** Node.js / Bun, TypeScript
- **Framework:** Express.js (v5)
- **Database & ORM:** PostgreSQL via Prisma (v7) with `@prisma/adapter-pg`
- **Validation:** Zod
- **Authentication:** `jsonwebtoken`, `bcryptjs`, `cookie-parser` (httpOnly cookie, sameSite=lax)
- **Security & Reliability:** `helmet`, `cors`, `express-rate-limit`

### Frontend
- **Framework:** Next.js (App Router, Turbopack)
- **State & Data Fetching:** TanStack Query (React Query v5)
- **Forms & Validation:** `react-hook-form` + `@hookform/resolvers/zod` + Zod
- **Styling & UI:** TailwindCSS v4, Radix UI primitives, Lucide React, Sonner (toasts)
- **First-Party Cookie Forwarding:** Next.js `rewrites` proxying `/api/*` to the Express backend

---

## Getting Started

### 1. Prerequisites
- [Bun](https://bun.sh/) (or Node.js v20+)
- PostgreSQL database instance

### 2. Backend Setup
```bash
cd server

# Install dependencies (if not already installed)
bun install

# Configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Push schema to database and generate client
bunx --bun prisma db push

# Seed demo accounts for both roles
bun prisma/seed.ts

# Start backend development server (runs on http://localhost:5000)
bun dev
```

### 3. Frontend Setup
```bash
cd client

# Install dependencies (if not already installed)
bun install

# Start Next.js development server (runs on http://localhost:3000)
bun dev
```

Visit **`http://localhost:3000`** in your browser.

---

## Environment Variables

### Server (`server/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `NODE_ENV` | Application environment | `development` |
| `PORT` | Express listening port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `FRONTEND_URL` | Client origin for CORS | `http://localhost:3000` |
| `BCRYPT_SALT_ROUNDS` | Salt rounds for hashing passwords | `10` |
| `JWT_SECRET` | Secret key for signing auth tokens | `super_secret_jwt_key_here` |
| `JWT_EXPIRES_IN` | Token duration | `1d` |
| `SEED_MENTOR_EMAIL` | Default mentor email for seed | `mentor@example.com` |
| `SEED_MENTOR_PASSWORD` | Default mentor password for seed | `Mentor@123` |
| `SEED_STUDENT_EMAIL` | Default student email for seed | `student@example.com` |
| `SEED_STUDENT_PASSWORD` | Default student password for seed | `Student@123` |

### Client (`client/.env.local` - optional)
| Variable | Description | Default |
|---|---|---|
| `BACKEND_URL` | Internal backend URL for Next.js SSR / rewrites | `http://localhost:5000` |

---

## Demo Logins

The login page includes a demo button for each role. Seed the demo users with
`bun prisma/seed.ts` from the `server` directory, then use the defaults below:

- **Student:** `student@example.com` / `Student@123` (accesses `/submit`)
- **Mentor:** `mentor@example.com` / `Mentor@123` (accesses `/dashboard`)

These defaults can be changed with the `SEED_STUDENT_*` and `SEED_MENTOR_*`
environment variables. To create a separate student account, navigate to
`/signup`; all self-registered users are assigned the `STUDENT` role.

---

## API Specification

All protected routes authenticate via the `token` httpOnly cookie set during login/signup.

### Authentication (`/auth`)
| Method | Endpoint | Access | Rate Limit | Description | Response Status |
|---|---|---|---|---|---|
| `POST` | `/auth/signup` | Public | 10 / 15 min / IP | Registers a new STUDENT. Body `role` is ignored. Sets auth cookie. | `201 Created` |
| `POST` | `/auth/login` | Public | 10 / 15 min / IP | Authenticates user; returns generic "Invalid credentials" on mismatch. Sets auth cookie. | `200 OK` |
| `POST` | `/auth/logout` | Authenticated | None | Clears the `token` cookie. | `200 OK` |
| `GET` | `/auth/me` | Authenticated | None | Returns current user profile (id, name, email, role). | `200 OK` |

### Submissions (`/submissions`)
| Method | Endpoint | Access | Rate Limit | Description | Response Status |
|---|---|---|---|---|---|
| `POST` | `/submissions` | STUDENT | 5 / hr / User ID | Submits a project. Normalizes GitHub repo URL and enforces DB unique constraint. | `201 Created` / `409 Conflict` |
| `GET` | `/submissions/mine` | STUDENT | None | Fetches all submissions created by the authenticated student along with mentor feedbacks. | `200 OK` |
| `GET` | `/submissions` | MENTOR | None | Paginated submissions list. Query params: `status` (`PENDING`, `APPROVED`, `REJECTED`), `page` (default 1), `limit` (default 10, max 50). | `200 OK` |
| `PATCH` | `/submissions/:id/review` | MENTOR | None | Updates status to `APPROVED` or `REJECTED` and records feedback inside a transaction. Comment is mandatory on reject. Only allowed from `PENDING`. | `200 OK` / `409 Conflict` |
| `GET` | `/submissions/stats` | MENTOR | None | Global submission metrics: `{ pending, approved, rejected, total }`. Independent of list filters. | `200 OK` |

---

## Validation Rules (Zod)

- **`projectName`:** 3 to 80 characters, trimmed of whitespace.
- **`repoUrl`:** Must match GitHub repository URL pattern: `^https://github.com/{owner}/{repo}$`
  - Normalized on ingestion: converted to lowercase, enforces `https://`, strips `www.`, strips trailing slash, and strips `.git`.
- **`liveUrl`:** Valid HTTP or HTTPS URL.
- **`description`:** 20 to 1,000 characters.
- **`review.comment`:** Required when rejecting a submission; optional when approving.

---

## Assumptions

1. **Role Model:** Only two roles exist in the system: `STUDENT` and `MENTOR`. Anyone who signs up via `/auth/signup` is automatically given `STUDENT` permissions. Mentor accounts cannot be self-registered and are provisioned via database seeds or administrator tools.
2. **Duplicate Definition:** Duplicate projects are determined strictly by the normalized `repoUrl`. A repository can only be submitted once across the entire platform. Submitting a duplicate URL relies on PostgreSQL's unique index constraint (`P2002`), returning HTTP `409 Conflict`.
3. **Rate Limiting Strategy:** 
   - Authentication routes (`/auth/login`, `/auth/signup`) are limited to **10 requests per 15 minutes per IP** to mitigate brute force credential stuffing.
   - Project submission (`POST /submissions`) is rate limited to **5 submissions per hour per user ID** (derived from the validated JWT claims).
4. **No Resubmit After Review:** Once a submission moves from `PENDING` to `APPROVED` or `REJECTED`, its state is immutable. Mentors cannot re-review a decided project (attempts return `409 Conflict`), and students must submit fresh iterations under a new repository.

---

## Known Limitations

1. **In-Memory Rate Limiting:** The current rate limiting uses Express memory store (`MemoryStore`). In a production multi-replica or clustered deployment, rate limits will not be synchronized across instances. Production setups should use a distributed store such as Redis (`rate-limit-redis`).
2. **First-Party Proxy Cookie Scope:** The Next.js client uses `rewrites` to route `/api/*` to Express. In local development where both run under `localhost` on different ports, `sameSite="lax"` works seamlessly. In cross-domain cloud environments, either deploy them behind a shared reverse proxy (e.g. Nginx, Cloudflare) or configure custom domain cookies (`domain: ".example.com"`).
