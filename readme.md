**Project Overview**

This Express backend uses Prisma for database access and Redis for simple session storage. It implements user signup, login, logout, and a basic todos API protected by a custom `auth` middleware.

----

## What is implemented

- Session storage: Redis. Sessions are stored under keys `session:<sid>` and contain a JSON object `{ userId }`.
- Session id generation: UUID (the app generates `sid` with `uuid`).
- Cookie: the server sets `sid` as an HttpOnly cookie with `SameSite=lax` and a 24h expiry (development `secure: false`).
- Controllers: implemented in `controller.ts`.
- Middleware: `auth` in `middleware.ts` reads the cookie, fetches the Redis key, and attaches the parsed session as `req.user`.

----

## Routes (in `index.ts`)

- `GET /health` — health check.
- `POST /signup` — create a user. Body: `{ name, email, password }`.
- `POST /login` — login. Body: `{ email, password }`. On success the server:
  - creates a UUID `sid`, stores `session:<sid>` = `{"userId": "..."}` in Redis with TTL 24h,
  - sets cookie `sid=<sid>` (HttpOnly, SameSite=lax, expires in 1 day).
- `POST /logout` — reads `sid` cookie, deletes `session:<sid>` from Redis, clears cookie.
- `GET /todos` — protected by `auth`, returns todos for current user.
- `POST /add-todo` — protected by `auth`, creates a todo for current user.

----

## Key files

- `index.ts` — app bootstrapping and routes.
- `controller.ts` — implementations of signup/login/logout and todo handlers.
- `middleware.ts` — `auth` middleware that resolves the Redis session and attaches `req.user`.
- `lib/prisma.ts` — Prisma client export.
- `lib/redis.ts` — Redis client export.
- `prisma/schema.prisma` & `generated/prisma` — Prisma schema and generated client.

----

## How to run

1. Install dependencies:

```bash
npm install
```

2. Environment variables (example `.env`):

```
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
```

3. Generate Prisma client and build TypeScript:

```bash
npx prisma generate
tsc -b
```

4. Start the app (built output):

```bash
node dist/index.js
```

----

## Implementation notes & recommended improvements

- Cookie parsing is currently done by splitting `req.headers.cookie` (fragile). Install `cookie-parser` and use `req.cookies.sid` for reliable parsing.
- Both `auth` and `logoutController` assume a single cookie and use `req.headers.cookie?.split('=')[1]`; this fails when multiple cookies exist or order changes.
- `res.cookie(..., { secure: false })` must be `true` in production over HTTPS.
- Consider regenerating session ids after login (prevents session fixation).
- Improve TypeScript typing by augmenting `Express.Request` with a `user` property instead of `// @ts-ignore`.
- For standard middleware features (rotation, destroy, cookie handling), consider migrating to `express-session` + `connect-redis`.


