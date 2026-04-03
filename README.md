# DataBridge Analytics

Data pipeline & analytics platform built for marketing agencies that manage multiple clients. Think of it as a self-hosted alternative to tools like Supermetrics or Funnel — connect data sources, build ETL pipelines, create dashboards, and auto-generate client reports.

## Setup

```bash
git clone https://github.com/databridge-io/analytics.git
cd analytics
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Then open http://localhost:3000. Default login is `admin@databridge.io` / `admin123`.

## What's included

- **Data connectors** — GA4, Meta Ads, Google Ads, LinkedIn, CSV import, custom API
- **Pipeline builder** — visual ETL with configurable transform steps
- **Dashboards** — KPI cards, time-series charts, drill-downs, per-client views
- **Reports** — scheduled or on-demand export (PDF, CSV, XLSX, JSON)
- **Multi-tenant RBAC** — Super Admin > Agency Admin > SME user
- **White-label** — agency-level branding (colors, logo)
- **Data assistant** — natural language queries over your connected data
- **Dark mode** — because why not

## Tech

Next.js 16 (App Router) + TypeScript 5 + Tailwind 4 + shadcn/ui + Recharts + Prisma (SQLite) + Zustand + TanStack Query + Framer Motion.

## Docker

```bash
docker compose build
docker compose up -d

# First run only — seed the database
docker compose exec databridge npx prisma db push
docker compose exec databridge npx prisma db seed
```

The Dockerfile is multi-stage (Alpine) and the compose file has health checks + restart policies. SQLite data lives in a named volume so it persists across container recreations.

## Project layout

```
src/
├── app/api/       # route handlers
├── components/    # pages + shared + ui (shadcn)
├── lib/           # db client, fetch wrapper, config, seed logic
└── stores/        # zustand (auth, app state, chat, pipelines)
prisma/
├── schema.prisma  # 16 models
└── seed.ts        # ~120K rows of demo data
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm run lint` | eslint |
| `npm run db:push` | push schema to sqlite |
| `npm run db:seed` | seed demo data |
| `npm run db:reset` | wipe + re-seed |
| `npm run db:studio` | prisma studio (db gui) |

## Env vars

Copy `.env.example` to `.env`. The important ones:

- `DATABASE_URL` — sqlite path (default: `file:./db/databridge.db`)
- `JWT_SECRET` — required in production
- `CORS_ORIGINS` — defaults to `*`

## API

Everything is under `/api` and returns JSON. Key endpoints:

- `/api/dashboard/stats` — aggregate KPIs
- `/api/dashboard/chart` — time-series for charts
- `/api/clients` — CRUD
- `/api/sources` — data source CRUD
- `/api/pipelines` — pipeline CRUD
- `/api/reports` — generate/schedule reports
- `/api/templates` — dashboard/report templates
- `/api/agencies` — agency management
- `/api/users` — user CRUD
- `/api/activity` — audit log
- `/api/branding` — per-agency branding settings
- `/api/export` — CSV data export

## License

Proprietary — all rights reserved.
