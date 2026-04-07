# DataBridge Analytics

Data pipeline & analytics platform for marketing agencies that manage multiple clients. Connect data sources (GA4, Meta Ads, Google Ads, LinkedIn), build ETL pipelines, create dashboards, and auto-generate client reports. Self-hosted alternative to Supermetrics / Funnel.

---

## Quick Start (Local Development)

```bash
git clone https://github.com/databridge-io/analytics.git
cd analytics
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Open **http://localhost:3000** — default login: `admin@databridge.io` / `admin123`

> **Redis is optional for local dev.** Without `REDIS_URL` in `.env`, the app uses an in-memory cache. Everything works fine — Redis is only required in production/Docker.

---

## Redis Setup

### Why Redis

DataBridge uses Redis for:
- **API response caching** — dashboard stats, charts, entity lists (30s–5min TTLs)
- **Session storage** — auth tokens stored in Redis with automatic expiry (24h)
- **Cache invalidation** — write operations (POST/PUT/DELETE) automatically clear related cache keys

Without Redis, the app falls back to in-memory caching. This works fine for single-instance dev setups but won't work for:
- Multi-container deployments (each container has its own memory)
- Horizontal scaling
- Session persistence across restarts

### Option A: Local Redis (Docker)

```bash
docker run -d \
  --name redis-local \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
```

Then add to your `.env`:
```env
REDIS_URL=redis://localhost:6379
```

### Option B: Local Redis (Native)

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**Verify it works:**
```bash
redis-cli ping  # should return PONG
```

### Verify Redis Connection

After starting the app, check the health endpoint:

```bash
curl http://localhost:3000/api
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-05-23T14:30:00.000Z",
  "cache": {
    "driver": "redis",
    "redis": true
  }
}
```

- `driver: "redis"` + `redis: true` → Redis is connected and being used
- `driver: "memory"` + `redis: true` → Redis not configured, in-memory fallback active

---

## Docker Deployment (From Scratch)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) >= 20.10
- [Docker Compose](https://docs.docker.com/compose/install/) >= 2.0
- ~2 GB free disk space (app image ~350 MB, Redis ~15 MB, database ~30 MB seeded)
- Port 3000 available on the host

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌─────────────────┐     ┌──────────────────────────┐   │
│  │   databridge-     │     │   databridge-redis         │  │
│  │   analytics       │────▶│   Redis 7 Alpine           │  │
│  │   (Next.js)       │     │   Port 6379 (internal)     │  │
│  │   Port 3000       │     │   128MB max memory         │  │
│  └────────┬──────────┘     └──────────────────────────┘   │
│           │                                               │
│  ┌────────┴──────────┐                                   │
│  │  SQLite            │                                   │
│  │  /app/db/*.db      │                                   │
│  │  (named volume)    │                                   │
│  └────────────────────┘                                   │
└──────────────────────────────────────────────────────────┘
         │
         ▼
    Host :3000
```

The app connects to Redis via `redis://redis:6379` (Docker internal network). The health endpoint at `/api` reports Redis status in real-time.

### 1. Clone & Configure

```bash
git clone https://github.com/databridge-io/analytics.git
cd analytics
cp .env.example .env
```

Edit `.env` — change at minimum the `JWT_SECRET`:

```bash
openssl rand -hex 32
```

```env
JWT_SECRET=your-generated-secret-here
REDIS_URL=redis://localhost:6379   # overridden by docker-compose
```

> The `REDIS_URL` in `.env` is overridden by docker-compose to `redis://redis:6379`.

### 2. Build & Start

```bash
docker compose build
docker compose up -d
```

On **first start**, the entrypoint automatically:
1. Waits for Redis to be ready (up to 10s, falls back gracefully)
2. Creates the SQLite database schema (`prisma db push`)
3. Seeds ~125,000 demo data points
4. Starts the server

```
==> DataBridge Analytics starting...
    Waiting for Redis at redis://redis:6379...
    Redis is ready.
==> First run detected — no database found.
    Creating schema...
    Seeding demo data (this may take a minute)...
    Seed complete.
==> Database ready.
==> Launching server on port 3000...
    Redis: redis://redis:6379
```

### 3. Verify

```bash
# Container status
docker compose ps

# Both containers should be healthy
docker compose ps --format "table {{.Name}}\t{{.Status}}"

# Health check
curl http://localhost:3000/api
# {"status":"ok","cache":{"driver":"redis","redis":true}}

# View logs
docker compose logs -f app
docker compose logs -f redis
```

Open **http://localhost:3000** — login: `admin@databridge.io` / `admin123`

### 4. Common Operations

```bash
# Stop
docker compose down           # keep data
docker compose down -v        # delete volumes (DB + Redis data)

# Rebuild after code changes
docker compose build --no-cache
docker compose up -d

# Reset everything
docker compose down -v
docker compose up -d

# View Redis stats
docker compose exec redis redis-cli info stats
docker compose exec redis redis-cli info memory

# View cached keys
docker compose exec redis redis-cli keys "db:*"
docker compose exec redis redis-cli keys "session:*"

# Manually flush cache
docker compose exec redis redis-cli flushdb

# Access SQLite
docker compose exec app sh
sqlite3 /app/db/databridge.db "SELECT COUNT(*) FROM DataPoint;"
```

### Redis Configuration

Redis runs with these defaults (configured in `docker-compose.yml`):
- **Memory limit:** 128 MB with LRU eviction
- **Persistence:** AOF (append-only file) — survives restarts
- **Network:** Internal only (not exposed to host)

To customize:
```yaml
# docker-compose.yml
redis:
  command: redis-server --maxmemory 256mb --maxmemory-policy volatile-ttl
  ports:
    - "6379:6379"  # expose to host for debugging (remove in production)
```

---

## Caching Strategy

### Cache Layers

| Layer | TTL | Purpose |
|---|---|---|
| Dashboard stats | 30s | Aggregate KPIs — change with every data sync |
| Chart / time-series | 30s | Medium freshness for acceptable staleness |
| Entity lists (clients, sources, etc.) | 60s | CRUD-heavy endpoints |
| Activity log | 30s | New events arrive frequently |
| Templates, branding | 300s | Rarely changes |
| User sessions | 24h | Matches token expiry |

### Cache Invalidation

Write operations automatically invalidate related caches:

| Operation | Cache keys cleared |
|---|---|
| Create/update/delete client | `clients:*`, `dashboard:stats` |
| Create/update/delete source | `sources:*`, `dashboard:stats`, `chart:*` |
| Create/update/delete pipeline | `pipelines:*`, `dashboard:stats` |
| Create/update/delete user | `users:*`, `auth:users`, `dashboard:stats` |
| Create/update/delete report | `reports:*` |
| Create/update/delete template | `templates:*` |
| Update branding | `branding:*` |
| Login | New session created (24h TTL) |
| Logout | Session deleted |

### Cache-Aside Pattern

All caching uses the cache-aside pattern:

```typescript
// Example from src/app/api/dashboard/stats/route.ts
const data = await cacheOrFetch(
  "dashboard:stats",
  async () => {
    // Expensive query — only runs on cache miss
    const [totalClients, totalSources, ...] = await Promise.all([...]);
    return { totalClients, totalSources, ... };
  },
  { ttl: CACHE_TTL.STATS }  // 30 seconds
);
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | No | `file:./db/databridge.db` | SQLite database path |
| `REDIS_URL` | Production | *(none — in-memory fallback)* | Redis connection URL |
| `JWT_SECRET` | Yes (prod) | `change-me-in-production` | Secret for signing tokens |
| `CORS_ORIGINS` | No | `*` | Allowed CORS origins |
| `NODE_ENV` | No | `development` | Set to `production` in Docker |
| `PORT` | No | `3000` | Server port |
| `APP_PORT` | No | `3000` | Host port mapping (Docker only) |

---

## What's Included

- **Data connectors** — GA4, Meta Ads, Google Ads, LinkedIn, CSV import, custom API
- **Pipeline builder** — visual ETL with configurable transform steps
- **Dashboards** — KPI cards, time-series charts, drill-downs, per-client views
- **Reports** — scheduled or on-demand export (PDF, CSV, XLSX, JSON)
- **Multi-tenant RBAC** — Super Admin > Agency Admin > SME user
- **White-label** — agency-level branding (colors, logo)
- **Data assistant** — natural language queries over your connected data
- **Redis caching** — automatic API response caching with invalidation
- **Session management** — Redis-backed auth sessions with TTL
- **Dark mode**

---

## Tech Stack

Next.js 15 (App Router) · TypeScript 5 · Tailwind 4 · shadcn/ui · Recharts · Prisma (SQLite) · Redis 7 (ioredis) · Zustand · TanStack Query · Framer Motion

---

## API Endpoints

| Method | Endpoint | Description | Cached |
|---|---|---|---|
| GET | `/api` | Health check (Redis status) | No |
| POST | `/api/auth/login` | Login + create Redis session | No |
| DELETE | `/api/auth/login` | Logout + delete session | No |
| GET | `/api/auth/users` | Available users for login | 60s |
| GET | `/api/dashboard/stats` | Aggregate KPIs | 30s |
| GET | `/api/dashboard/chart` | Time-series data | 30s |
| GET | `/api/clients` | List clients | 60s |
| POST | `/api/clients` | Create client (invalidates cache) | — |
| PUT | `/api/clients/:id` | Update client (invalidates cache) | — |
| DELETE | `/api/clients/:id` | Delete client (invalidates cache) | — |
| GET | `/api/sources` | List data sources | 60s |
| POST | `/api/sources` | Create source (invalidates cache) | — |
| PUT | `/api/sources/:id` | Update source (invalidates cache) | — |
| DELETE | `/api/sources/:id` | Delete source (invalidates cache) | — |
| GET | `/api/pipelines` | List pipelines | 60s |
| POST | `/api/pipelines` | Create pipeline (invalidates cache) | — |
| PUT | `/api/pipelines/:id` | Update pipeline (invalidates cache) | — |
| DELETE | `/api/pipelines/:id` | Delete pipeline (invalidates cache) | — |
| GET | `/api/reports` | List reports | 60s |
| POST | `/api/reports` | Create report (invalidates cache) | — |
| DELETE | `/api/reports/:id` | Delete report (invalidates cache) | — |
| GET | `/api/templates` | List templates | 300s |
| POST | `/api/templates` | Create template (invalidates cache) | — |
| PUT | `/api/templates/:id` | Update template (invalidates cache) | — |
| DELETE | `/api/templates/:id` | Delete template (invalidates cache) | — |
| GET | `/api/agencies` | List agencies | 60s |
| POST | `/api/agencies` | Create agency (invalidates cache) | — |
| PUT | `/api/agencies/:id` | Update agency (invalidates cache) | — |
| DELETE | `/api/agencies/:id` | Delete agency (invalidates cache) | — |
| GET | `/api/users` | List users | 60s |
| POST | `/api/users` | Create user (invalidates cache) | — |
| PUT | `/api/users/:id` | Update user (invalidates cache) | — |
| DELETE | `/api/users/:id` | Delete user (invalidates cache) | — |
| GET | `/api/activity` | Activity log | 30s |
| GET | `/api/branding` | Branding settings | 300s |
| PUT | `/api/branding` | Update branding (invalidates cache) | — |
| GET | `/api/export` | CSV data export | No |

---

## Project Structure

```
├── Dockerfile              # 3-stage production build
├── docker-compose.yml      # App + Redis orchestration
├── docker-entrypoint.sh    # First-run DB init + Redis wait
├── next.config.ts          # Next.js config (standalone output)
├── package.json
├── prisma/
│   ├── schema.prisma       # 16 models
│   └── seed.ts             # Demo data generator (~125K rows)
├── db/                     # SQLite database files (gitignored)
├── public/                 # Static assets
└── src/
    ├── app/
    │   ├── page.tsx        # SPA entry point
    │   ├── layout.tsx      # Root layout
    │   ├── login/          # Auth pages
    │   └── api/            # 22+ API route handlers (Redis-cached)
    ├── components/
    │   ├── dashboard/      # Main app views
    │   ├── ui/             # shadcn/ui components
    │   └── ...             # Layout, sidebar, providers
    ├── lib/
    │   ├── db.ts           # Prisma client
    │   ├── redis.ts        # Redis client (ioredis)
    │   ├── cache.ts        # Cache layer (Redis + in-memory fallback)
    │   ├── session.ts      # Redis session management
    │   ├── api.ts          # Frontend fetch wrapper
    │   └── ...             # Config, utils
    └── stores/             # Zustand state (auth, app, chat, pipelines)
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema changes to SQLite |
| `npm run db:seed` | Seed demo data (~125K rows) |
| `npm run db:reset` | Wipe database and re-seed |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

---

## Troubleshooting

### "port 3000 already in use"
```env
APP_PORT=8080
```

### Redis connection refused (Docker)
Check Redis is healthy: `docker compose ps`. The app waits up to 10s for Redis on startup and falls back to in-memory cache if it can't connect.

### Cache not invalidating
Check Redis keys: `docker compose exec redis redis-cli keys "db:*"`. If stale data persists, flush: `docker compose exec redis redis-cli flushdb`.

### Session lost after restart
Without Redis, sessions are in-memory and lost on restart. Configure `REDIS_URL` to persist sessions across container restarts.

### Redis OOM (out of memory)
Increase `--maxmemory` in `docker-compose.yml` or switch eviction policy to `volatile-ttl` to prefer evicting keys with TTL.

---

## License

Proprietary — all rights reserved.





ajoute dans la dashboard Pipeline Health Score avec sous-détails : Circuit Breaker status, DLQ size, Kafka lag.ur chaque carte KPI : ajoute un petit badge "Data Freshness : il y a 2 min"Dans le grand graphique TRAFFIC VELOCITY : ajoute un toggle en haut à droite "Real-time / Historical" (Real-time = flux direct de Kafka normalized_events, Historical = ClickHouse materialized views).
Ajoute une nouvelle carte à droite : Data Quality Score (pourcentage global + breakdown GA4 / Meta / Google Ads). ouvelle section dans la Sidebar (sous OPERATIONS)
Ajoute ces deux entrées :

Pipeline Status
Data Quality Center

Détails à ajouter dans Pipeline Status (nouvelle page)

En haut : 4-6 cartes live
Throughput (events/min)
End-to-End Latency
Error Rate & DLQ volume
Circuit Breaker (état + nombre d’ouvertures)
Kafka Topics lag (raw_events vs normalized_events)

Au centre : Flow Visualization (diagramme horizontal ou vertical simplifié) montrant :
Ingestion Workers (Go) → Kafka raw_events → Flink DQ Validator → Kafka normalized_events → ClickHouse → Feature Store → ML Inference
Chaque nœud avec pastille de couleur (vert = healthy, orange = degraded, rouge = error) + clic pour détails/logs.
En bas : tableau des Active Jobs (Temporal Orchestrator) avec colonnes : Job Name, Trigger, Status, Dernière exécution, Retry count.

Détails à ajouter dans Data Quality Center (nouvelle page)

Score global de qualité + évolution sur 7 jours (graphique).
Tableau des règles de validation Flink (nom de règle, % validé, source concernée, statut).
Section Rejected Events : liste paginée des événements en DLQ (Validation DLQ) avec raison du rejet + bouton "Replay" (un ou plusieurs).
Onglet Schema Registry : liste des versions Avro avec date et évolution.
Graphique comparatif : raw vs normalized par source.

Améliorations dans Integration Hub

Dans le tableau des Connected Sources : ajoute colonnes
Last Sync (avec freshness badge)
Volume ingéré ce jour
Status live (Active + petit indicateur de latence)
Bouton "Force Sync" qui trigger le Temporal job.


Améliorations dans Intelligence & ML (ajoute cette section sous INTELLIGENCE)

Feature Store : tableau des features (nom, type, dernière mise à jour, cardinalité).
Inference Results : graphiques Prophet (actual vs forecast + bande de confiance) + SHAP summary plot (feature importance).
Bouton global "Run Full Inference" (sur tout ou par client).

Améliorations transversales (à appliquer partout)

En haut à droite (près du search) : Client Selector (dropdown ou chips) pour filtrer tout par client/agence.
Sur tous les graphiques : bouton Export (XLSX + PDF + Raw JSON).
Ajoute des tooltips riches au hover : exemple sur un KPI → "Données provenant de ClickHouse materialized view – dernière mise à jour via Flink sink".
Dans les rapports (Automated Reports) : preview live du rendu + indication "Generated from normalized_events + ML inference".
Partout où il y a des stats : petit indicateur "Sourced from" (Kafka / ClickHouse / Redis cache).

Petits détails premium à ajouter rapidement

Auto-refresh toutes les 30 secondes sur les pages Pipeline Status et Data Quality (avec option pause).
Pastilles de statut (vert/orange/rouge) partout où il y a un composant backend (sources, pipelines, jobs).
Dans le menu utilisateur (Selma Haci) : lien direct vers Audit Trail (historique complet des flux + lineage).
Sur la page Clients : colonne "Pipeline Health" par client.

Ces ajouts rendent l’interface cohérente avec tout le backend (Kafka, Flink, ClickH
