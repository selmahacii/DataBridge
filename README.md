# DataBridge: Strategic Analytics & ETL Orchestration Blueprint

DataBridge is a high-fidelity, industrial-grade data engineering platform designed for marketing agencies managing complex multi-tenant ecosystems. It facilitates seamless extraction, transformation, and reconciliation of marketing telemetry into verifiable business intelligence.

---

## 🏗️ System Architecture (C4 Model)

DataBridge is architected as a **Distributed Microservices System** (transitioning from a Modular Monolith) to ensure extreme scalability, fault tolerance, and multi-tenant isolation. Below is the C4 visualization of the platform.

### 1. Level 1: System Context
Focuses on the actors (Users) and how DataBridge interacts with external ecosystems.

```mermaid
C4Context
    title System Context Diagram for DataBridge

    Person(user, "Marketing Manager / Agency Admin", "A user who needs to monitor marketing performance and manage ETL pipelines.")
    System(databridge, "DataBridge System", "Aggregates, reconciles, and analyzes multi-tenant marketing data for high-fidelity intelligence.")

    System_Ext(ga4, "Google Analytics 4 API", "External data source for web traffic metrics.")
    System_Ext(meta, "Meta Ads API", "External data source for social media ad performance.")
    System_Ext(gads, "Google Ads API", "External data source for search engine advertising.")
    System_Ext(s3, "Cloud Object Storage (S3/GCS)", "Long-term cold storage for raw event data.")

    Rel(user, databridge, "Uses", "HTTPS/WSS")
    Rel(databridge, ga4, "Fetches data from", "REST/OAuth2")
    Rel(databridge, meta, "Fetches data from", "REST/SDK")
    Rel(databridge, gads, "Fetches data from", "gRPC/REST")
    Rel(databridge, s3, "Archives raw data to", "HTTPS")
```

### 2. Level 2: Containers
Describes the main technical building blocks and their interactions through the event-driven backbone.

```mermaid
C4Container
    title Container Diagram for DataBridge

    Person(user, "User", "Marketing Manager / Agency Admin")

    Container_Boundary(databridge_boundary, "DataBridge System") {
        Container(web_app, "Web Dashboard", "Next.js, TypeScript", "Provides the user interface for monitoring KPIs and configuring pipelines.")
        Container(api_gateway, "API Gateway", "Kong / Nginx", "Entry point for authentication, rate limiting, and request routing.")
        Container(query_api, "Reporting & Analytics API", "Go (Fiber)", "Handles complex analytical queries and dashboard telemetry.")
        Container(ingestion_worker, "Ingestion Worker", "Go / Python", "Asynchronous service for fetching data from external APIs.")
        Container(stream_processor, "Stream Processor", "Apache Flink", "Validates schemas, calculates DQ scores, and enriches events.")
        Container(message_broker, "Message Broker", "Apache Kafka", "The event-driven backbone for decoupled communication.")
        
        ContainerDb(sql_db, "Meta & Auth Database", "PostgreSQL", "Stores user profiles, tenant configs, and pipeline metadata.")
        ContainerDb(olap_db, "Analytical Warehouse", "ClickHouse", "High-performance columnar storage for billions of telemetry rows.")
        ContainerDb(cache, "Serving Cache", "Redis", "Caches hot metrics and session data for sub-second responses.")
    }

    Rel(user, api_gateway, "Uses", "HTTPS")
    Rel(api_gateway, web_app, "Routes to", "HTTPS")
    Rel(api_gateway, query_api, "Routes to", "gRPC/REST")
    
    Rel(query_api, cache, "Reads/Writes", "Redis Protocol")
    Rel(query_api, olap_db, "Queries", "Native Protocol")
    
    Rel(ingestion_worker, message_broker, "Publishes raw events", "Kafka Protocol")
    Rel(message_broker, stream_processor, "Stream events", "Kafka Protocol")
    Rel(stream_processor, olap_db, "Sinks normalized data", "Native Protocol")
```

### 3. Level 3: Components (Ingestion Worker)
Deep dive into the core logic of the Ingestion Workers that power the data fetch operations.

```mermaid
C4Component
    title Component Diagram for Ingestion Worker

    Container(broker, "Message Broker", "Apache Kafka", "Receives raw event streams.")
    Container_Ext(ext_api, "External Marketing APIs", "REST/gRPC", "Data sources (GA4, Meta).")

    Container_Boundary(ingestion_boundary, "Ingestion Worker") {
        Component(adapter, "Source Adapters", "Go Interface", "Normalizes diverse API responses into internal data structures.")
        Component(rate_limit, "Rate Controller", "Go Channel", "Ensures compliance with external API quota limits.")
        Component(breaker, "Circuit Breaker", "Hystrix-like pattern", "Prevents system collapse during external API outages.")
        Component(publisher, "Kafka Producer", "Confluent-Kafka", "Serializes and publishes events to the raw_events topic.")
    }

    Rel(adapter, ext_api, "Requests Data", "HTTPS")
    Rel(adapter, rate_limit, "Checks Quota")
    Rel(adapter, breaker, "Monitors Health")
    Rel(adapter, publisher, "Sends Payload")
    Rel(publisher, broker, "Publishes", "Kafka Protocol")
```

---

## 🧩 Architectural Rationale

### Modular Monolith vs. Microservices
DataBridge is currently undergoing a strategic evolution. While the initial MVP is built as a **Modular Monolith** (using Next.js and Prisma), the production-ready blueprint defines a **Distributed Microservices Architecture**.

**Why the transition?**
*   **Scalability**: Analytical workloads (especially high-cardinality aggregations) require dedicated compute resources decoupled from the web-serving tier.
*   **Fault Tolerance**: By using a Message Broker (Kafka), data ingestion can continue even if the database or downstream processors are temporarily offline.
*   **Polyglot Development**: Go is used for high-concurrency workers, while Python is optimized for ML-driven predictive modeling.

### Layer Breakdown
1.  **System Context**: Identifies DataBridge as the central intelligence hub that acts as a bridge between marketing specialists and complex upstream data providers (Google, Meta).
2.  **Containers**: High-level technical units. Note the separation between the **Transactional DB** (PostgreSQL) for user state and the **OLAP DB** (ClickHouse) for analytical telemetry—a standard pattern for high-performance data platforms.
3.  **Components**: Specific implementation details. The **Ingestion Worker** is highlighted here as it is the most critical subsystem, employing industrial patterns like Circuit Breakers and Rate Control to survive unstable external API environments.

---

## 🛠️ Performance & Technical Specifications

### 1. High-Fidelity Technology Stack
- **Frontend Core**: Next.js 15 (App Router Architecture), TypeScript 5.4.
- **Styling Engine**: Tailwind CSS 4.0 with Custom Industrial Glassmorphism Presets.
- **Persistence Layer**: PostgreSQL (Target Environment) / SQLite (Initial Seed).
- **ORM / Projection**: Prisma ORM with procedural context-switching.
- **Distributed Cache**: Redis 7.0 for API response caching (30s-300s TTLs) and session state.
- **Async State**: TanStack Query v5 with stale-while-revalidate (SWR) patterns.

### 2. Multi-Tenant Context Isolation (MTCI)
The platform implements a **Strict Context Scoping** model to prevent data leakage across agency clients:
- **Procedural Scoping**: Every API route (e.g., `stats/platform`) parses a mandatory `clientId` or `orgId`.
- **Relationship Hierarchy**: `Agency` > `SMEClient` (orgId) > `User` / `DataSource` / `Pipeline`. 
- **RBAC Matrix**:
    - `SUPER_ADMIN`: Global observability and infrastructure management.
    - `AGENCY_ADMIN`: Full control over clients, sources, and reports within their agency.
    - `SME`: Limited access to specific client dashboards and performance metrics.

---

## 📊 Analytical Modeling & KPI Engine

### I. ROAS (Return on Ad Spend) Optimization
**Formula**: $\frac{\sum Metrics.value \text{ (type: revenue)}}{\sum Metrics.value \text{ (type: spend)}}$
*Aggregated daily and month-to-date (MTD) with automated currency normalization.*

### II. Handshake Match Rate (Reconciliation Accuracy)
Matches transactional orders to marketing touchpoints using the `OrderMatching` engine:
- **Phone Match**: Linking by hashed contact vectors.
- **Time Match**: Temporal proximity across data points.
- **Campaign Match**: Direct UTM attribution tagging.
- **Confidence Scoring**: 0.0 to 1.0 probability index per match.

### III. Data Fidelity Score
A dynamic index calculated as:
$$Fidelity = \frac{ValidatedRows}{TotalIngestedRows} \times SyncFrequencyWeight$$
This score reflects the integrity of the data stream and the reliability of the derived insights.

---

## ⚡ Caching & Invalidation Strategy

| Dataset Type | Cache TTL | Invalidation Trigger |
|---|---|---|
| **KPI Metrics** | 30 Seconds | Pipeline Completion |
| **Activity Log** | 30 Seconds | New System Event |
| **User Profiles** | 60 Seconds | Profile Update / Role Change |
| **Reports/Exports** | 300 Seconds | Manual Generation Request |
| **Branding/Asset** | 3600 Seconds | Agency Settings Modification |

---

## 🚀 Deployment & Operations

### Database Synchronization
```bash
# Push schema topology
npx prisma db push

# Generate industrial test dataset (~125,000 data points)
npx prisma db seed
```

### Local Development Environment
```bash
# Start Next.js development server
npm run dev

# Launch Prisma Studio for direct data observation
npx prisma studio
```

---

## 📜 Intellectual Property & Auditing
Proprietary Industrial Framework. Built for high-growth agencies requiring auditable, high-fidelity marketing intelligence. 
All event flows are logged to the `ActivityLog` table with IP-address and principal verification for absolute traceability.
