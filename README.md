# BTMS – Banking Transaction Management System

Full-stack banking app: Express/TypeScript backend · PostgreSQL · React/Vite frontend · Docker Compose.

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env and set a strong JWT_SECRET

docker compose up --build
```

Then open http://localhost in your browser.

**Push the DB schema on first run:**
```bash
docker compose exec backend npm run db:push
```

## Demo Credentials

| Email | Password |
|---|---|
| (register a new account) | — |

## Dev Without Docker

**Backend:**
```bash
cd backend
npm install
cp ../.env.example .env   # edit DATABASE_URL to point to your local Postgres
npm run dev               # runs on :8080
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev               # runs on :3000, proxies /api → :8080
```

## Structure

```
btms-docker/
├── backend/          Express + TypeScript API
│   ├── src/
│   │   ├── db/       Drizzle schema + connection
│   │   ├── routes/   Express route handlers
│   │   ├── lib/      JWT, audit log, logger
│   │   └── middlewares/  Auth middleware
│   └── Dockerfile
├── frontend/         React + Vite + Tailwind
│   ├── src/
│   │   ├── lib/      api.ts (all hooks), auth context
│   │   ├── pages/    login, dashboard, transfer, etc.
│   │   └── components/
│   ├── nginx.conf    Production nginx config
│   └── Dockerfile
└── docker-compose.yml
```
