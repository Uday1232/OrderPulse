# StorePulse (TMBill) - Multi-Store Restaurant Order Management System

A production-ready, full-stack multi-store Restaurant Order Management & POS platform built with Node.js/Express, TypeScript, Prisma ORM, PostgreSQL, Redis, Socket.IO, and a mobile-responsive Next.js 14 App Router frontend with Material-UI.

---

## 🌐 Live Deployments

- **Frontend (Vercel):** [https://orderpulse-frontend-three.vercel.app](https://orderpulse-frontend-three.vercel.app)
- **Backend API (Render):** [https://orderpulse-b6de.onrender.com](https://orderpulse-b6de.onrender.com)
- **Health Check:** [https://orderpulse-b6de.onrender.com/health](https://orderpulse-b6de.onrender.com/health)
- **GitHub Repository:** [https://github.com/Uday1232/OrderPulse](https://github.com/Uday1232/OrderPulse)

---

## 📋 Assessment Task Compliance Matrix

| Requirement | Implementation & File Path | Assessment Status |
| :--- | :--- | :---: |
| **Task 1: Multi-Store Order Management** | | |
| `POST /orders` (Create order) | `backend/src/controllers/order.controller.ts` (`createOrder`) | ✅ Complete |
| `GET /orders?store_id=` (Pagination) | Cursor-based deterministic pagination + Redis caching | ✅ Complete |
| `PATCH /orders/:id/status` (Update status) | Row-level locking `SELECT ... FOR UPDATE` inside atomic `$transaction` | ✅ Complete |
| Order Schema with strict types | `backend/prisma/schema.prisma` (`PLACED`, `PREPARING`, `COMPLETED`) | ✅ Complete |
| Database Indexes on `store_id` & `created_at` | Added composite & individual B-Tree indexes in PostgreSQL | ✅ Complete |
| Page 1: Create Order | `frontend/src/app/pos/page.tsx` & `/create-order` (Interactive POS) | ✅ Complete |
| Page 2: Orders List (filter by store) | `frontend/src/app/orders/page.tsx` (Real-time live filtering) | ✅ Complete |
| Page 3: Update Order Status | `frontend/src/app/update-order-status/page.tsx` & `/orders/[id]` | ✅ Complete |
| **Task 2: Real-Time Notification System** | | |
| Socket.IO Backend Architecture | `backend/src/socket/socket.server.ts` | ✅ Complete |
| Store-Based Event Filtering (Rooms) | Clients join `store:${store_id}` rooms automatically | ✅ Complete |
| Events: `order:created` & `order:updated` | Emitted on order creation and state transitions | ✅ Complete |
| Frontend Auto-Update without refresh | React Query cache invalidation + instant UI reactivity | ✅ Complete |
| Reconnect & Heartbeat Logic | Handled in `SocketContext.tsx` with reconnection fallback | ✅ Complete |
| Audio/Visual Real-Time Alerts | Sound chime + visual badge notifications across navbar | ✅ Complete |
| **Task 3: Data Archival & Analytics** | | |
| Two Tables: `orders` & `orders_archive` | Defined in Prisma with identical indexes + `archived_at` | ✅ Complete |
| `POST /archive-old-orders` | Atomic single-query PostgreSQL CTE transaction (> 30 days) | ✅ Complete |
| Orders per day aggregation | `backend/src/services/analytics.service.ts` (`DATE(created_at)`) | ✅ Complete |
| Total revenue per store | `GROUP BY store_id` with average order value calculations | ✅ Complete |
| Top 5 selling items | PostgreSQL `jsonb_to_recordset` query on nested JSON items | ✅ Complete |
| Analytics Caching | Redis caching with 10-min TTL & instant cache-busting | ✅ Complete |
| **Bonus Criteria** | | |
| 100% TypeScript Coverage | Strict mode enabled in both frontend and backend | ✅ Complete |
| Docker & Docker Compose | Multi-stage Dockerfiles + `docker-compose.yml` | ✅ Complete |
| Cloud Database & Redis | Neon Serverless PostgreSQL + Upstash Redis TLS | ✅ Complete |
| Mobile Responsiveness | Fully responsive mobile POS, bottom sheets, drawer navigation | ✅ Complete |
| 42 Automated Tests | Jest + Supertest covering RBAC, auth, validation, concurrency & endpoints | ✅ Complete |

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js (v20+), Express.js, TypeScript, Prisma ORM, PostgreSQL 16, Redis 7, Socket.IO, Zod, Winston, Jest, Supertest |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Material-UI (MUI v5), TanStack React Query v5, Socket.IO Client |
| **Cloud & Deployment** | Vercel (Frontend), Render (Backend), Neon (PostgreSQL), Upstash (Redis) |
| **Infrastructure** | Docker, Docker Compose (Multi-stage lightweight images) |

---

## 🌟 Key Architecture & Highlights

1. **Row-Level Locking Concurrency Protection:**
   - Status transitions on `PATCH /orders/:id/status` use explicit raw SQL `SELECT ... FOR UPDATE` inside a Prisma atomic transaction (`$transaction`).
   - Ensures that concurrent updates to the same order are serialized without race conditions, lost updates, or deadlocks.

2. **Cursor-Based Pagination & Redis Caching:**
   - Orders endpoint (`GET /orders`) implements cursor pagination using UUID/timestamp ordering for deterministic performance on large datasets.
   - Results are automatically cached in Redis with automated invalidation when orders are created or updated.

3. **Store-Based Real-Time WebSockets:**
   - Socket.IO clients automatically join dedicated store rooms (`store:${store_id}`).
   - New orders (`order:created`) and status updates (`order:updated`) are instantly broadcast to managers viewing that store.
   - Seamless auto-reconnection with room re-subscription logic and client-side heartbeat.

4. **Atomic Archival Pipeline:**
   - `POST /archive-old-orders` moves orders older than 30 days from `orders` into `orders_archive` in a single PostgreSQL Common Table Expression (CTE) transaction.

5. **JSONB Analytics Aggregations:**
   - Aggregates daily order trends, store revenue, and extracts top 5 selling dishes directly from the PostgreSQL `JSONB` items column using `jsonb_to_recordset`.
   - Results are cached in Redis with a 10-minute TTL and cache-busting capabilities.

6. **Search Debounce Hook:**
   - Custom `useDebounce` React hook (500ms delay) prevents rapid typing from flooding the backend.

---

## 🚀 Quick Start with Docker Compose

To spin up the entire application (PostgreSQL, Redis, Backend, and Frontend) in one command:

```bash
# 1. Clone or navigate to the repository
cd d:/TMBill

# 2. Launch all services via Docker Compose
docker compose up -d --build

# 3. Access the applications
# Frontend Dashboard: http://localhost:3001
# Backend API:        http://localhost:5001
# Backend Health:     http://localhost:5001/health
```

To stop all services:
```bash
docker compose down
```

---

## 🔑 Access Credentials & Role-Based Access Control (RBAC)

The application enforces a strict, production-grade Role-Based Access Control (RBAC) policy powered by JWT authentication and cryptographic password hashing (bcrypt):

| Role | Email | Password | Access Level & Capabilities |
| :--- | :--- | :--- | :--- |
| **👑 SuperAdmin** *(Single Master)* | `admin@storepulse.com` | `admin123` | **Full Platform Authority**: Sole account permitted to create new Store Admins and modify staff roles. Full access to multi-store analytics, store creation/deletion, menu editing, order archival, and live POS terminal. |
| **🛡️ Store Admin** *(Store Manager)* | `central_admin@storepulse.com` | `admin123` | **Store Operations**: Manage menu items, categories, view live incoming store orders, and execute row-locked status updates (`PLACED` → `PREPARED`). Cannot create admins or modify staff roles. |
| **👤 Customer / User** | `user@storepulse.com` | `user123` | **Customer POS Ordering**: Interactive POS menu, promotional coupon application, cart discounts, checkout, and private real-time order tracking. |

### 🔒 Security & Authorization Highlights
- **Single SuperAdmin Architecture**: The platform allows only **one** master SuperAdmin (`admin@storepulse.com`). The SuperAdmin account is strictly protected from modification, deletion, or demotion.
- **SuperAdmin-Only Admin Provisioning**: Store Admins **cannot** be registered publicly. They can **only** be provisioned by an authenticated SuperAdmin via the Staff Management portal (`/admin/users`) with auto-generated credentials or via `POST /api/v1/auth/admins`.
- **Public Registration Role-Lock**: Any user registering via the public registration form (`/login`) is strictly assigned the `USER` (Customer) role. Any client payload attempting to specify an elevated role is unconditionally ignored.
- **Secure Email/Password Sign-In**: Quick-fill demo preset buttons were removed from the login screen to prevent unauthorized privilege escalation. Both Admins and Customers authenticate securely via email and password:
  - SuperAdmin and Store Admins are redirected directly to the Admin Dashboard (`/dashboard`).
  - Customers are redirected directly to the POS Menu (`/pos`).

---

## 💻 Local Development Setup

If running services directly on your host machine:

### 1. Prerequisites
- Node.js v18+ (tested on Node v22)
- Docker Desktop or local PostgreSQL and Redis instances

### 2. Start PostgreSQL and Redis
```bash
# Start PostgreSQL (port 5433) and Redis (port 6379)
docker compose up -d postgres redis
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Push schema to PostgreSQL
npx prisma db push

# Seed 4 stores, 24 menu items (with matched photos), and 7-day analytics orders
npm run prisma:seed

# Run Jest test suite (25 tests covering validation, concurrency, and endpoints)
npm run test

# Start backend dev server (port 5001)
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server (port 3001)
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## ⚙️ Environment Variables

### Root / Docker (`.env` or `.env.example`)
| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | `tmbill_user` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `tmbill_password` | PostgreSQL password |
| `POSTGRES_DB` | `tmbill_orders` | PostgreSQL database name |
| `POSTGRES_PORT` | `5433` | Host port for PostgreSQL |
| `REDIS_PORT` | `6379` | Host port for Redis |
| `BACKEND_PORT` | `5001` | Host port for Backend API |
| `FRONTEND_PORT` | `3001` | Host port for Next.js Frontend |

### Backend (`backend/.env`)
| Variable | Example | Description |
|---|---|---|
| `PORT` | `5001` | HTTP port for Express & Socket.IO |
| `NODE_ENV` | `development` | Runtime environment |
| `DATABASE_URL` | `postgresql://tmbill_user:tmbill_password@127.0.0.1:5433/tmbill_orders?schema=public` | PostgreSQL connection string |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis connection URI |
| `CORS_ORIGIN` | `http://localhost:3000,http://localhost:3001` | Allowed CORS origins |
| `LOG_LEVEL` | `info` | Winston logging level |

### Frontend (`frontend/.env.local`)
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5001` | Backend HTTP API base URL |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:5001` | Socket.IO WebSocket base URL |

---

## 🗄️ Database Schema (Prisma)

### Table `orders`
```prisma
model Order {
  id           String      @id @default(uuid()) @db.Uuid
  store_id     String      @map("store_id")
  items        Json        @map("items")
  total_amount Float       @map("total_amount")
  status       OrderStatus @default(PLACED)
  created_at   DateTime    @default(now()) @map("created_at")

  @@index([store_id])
  @@index([created_at])
  @@index([store_id, created_at])
  @@map("orders")
}
```

### Table `orders_archive`
Identical schema to `orders`, with an additional `archived_at` timestamp:
```prisma
model OrderArchive {
  id           String      @id @db.Uuid
  store_id     String      @map("store_id")
  items        Json        @map("items")
  total_amount Float       @map("total_amount")
  status       OrderStatus
  created_at   DateTime    @map("created_at")
  archived_at  DateTime    @default(now()) @map("archived_at")

  @@index([store_id])
  @@index([created_at])
  @@map("orders_archive")
}
```

---

## 📡 REST API Documentation

### 1. Create Order
**`POST /orders`**
Creates a new order, calculates totals, validates with Zod, invalidates Redis caches, and emits an `order:created` WebSocket event.

**Request Body:**
```json
{
  "store_id": "store-downtown-01",
  "items": [
    {
      "name": "Margherita Pizza",
      "quantity": 2,
      "unit_price": 14.99
    },
    {
      "name": "Espresso",
      "quantity": 1,
      "unit_price": 3.50
    }
  ]
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "e2a22be1-dca9-48fe-897b-b3531b40ca04",
    "store_id": "store-downtown-01",
    "items": [
      { "name": "Margherita Pizza", "quantity": 2, "unit_price": 14.99, "subtotal": 29.98 },
      { "name": "Espresso", "quantity": 1, "unit_price": 3.50, "subtotal": 3.50 }
    ],
    "total_amount": 33.48,
    "status": "PLACED",
    "created_at": "2026-10-18T16:45:00.000Z"
  }
}
```

---

### 2. Get Single Order by ID
**`GET /orders/:id`**
Fetches a single order by its UUID.

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "e2a22be1-dca9-48fe-897b-b3531b40ca04",
    "store_id": "store-downtown-01",
    "items": [
      { "name": "Margherita Pizza", "quantity": 2, "unit_price": 14.99, "subtotal": 29.98 }
    ],
    "total_amount": 29.98,
    "status": "PLACED",
    "created_at": "2026-10-18T16:45:00.000Z"
  }
}
```

---

### 3. Get Orders (Cursor-Based Pagination & Caching)
**`GET /orders?store_id=store-downtown-01&limit=10&cursor=<UUID>&status=PLACED`**

**Query Parameters:**
- `store_id` *(required)*: Store identifier.
- `limit` *(optional, default 10, max 100)*: Items per page.
- `cursor` *(optional)*: Order UUID to fetch records after.
- `status` *(optional)*: Filter by `PLACED`, `PREPARING`, or `COMPLETED`.

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "nextCursor": "b0a6e021-0a68-4d56-a149-1d43a6d7f8d1",
    "hasMore": true,
    "totalReturned": 10
  }
}
```

---

### 4. Update Order Status (Row-Level Locking)
**`PATCH /orders/:id/status`**

Executes inside a database transaction with `SELECT ... FOR UPDATE` row-level lock. Broadcasts `order:updated` to the store room.

**Request Body:**
```json
{
  "status": "PREPARING"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Order status updated to PREPARING",
  "data": {
    "id": "e2a22be1-dca9-48fe-897b-b3531b40ca04",
    "status": "PREPARING"
  }
}
```

---

### 5. Archive Old Orders (Atomic Transaction)
**`POST /archive-old-orders`**

Atomically moves orders older than `days_threshold` (default 30) from `orders` to `orders_archive`.

**Request Body (optional):**
```json
{
  "days_threshold": 30
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Successfully archived 10 orders older than 30 days",
  "data": {
    "archivedCount": 10,
    "daysThreshold": 30,
    "timestamp": "2026-10-18T16:50:00.000Z"
  }
}
```

---

### 6. Analytics Aggregations (Redis Cached)
**`GET /analytics`** (or `GET /analytics?refresh=true` to bust cache)

Aggregates orders per day, revenue per store, and top 5 selling items.

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOrders": 85,
      "totalRevenue": 2845.50,
      "totalStores": 3
    },
    "ordersPerDay": [
      { "date": "2026-10-18", "order_count": 9, "daily_revenue": 312.50 }
    ],
    "revenuePerStore": [
      { "store_id": "store-downtown-01", "total_orders": 30, "total_revenue": 1020.00, "avg_order_value": 34.00 }
    ],
    "topSellingItems": [
      { "item_name": "Margherita Pizza", "total_quantity_sold": 42, "total_revenue": 629.58 }
    ],
    "cachedAt": "2026-10-18T16:48:00.000Z",
    "fromCache": true
  }
}
```

---

### 7. Authentication & Staff Management Endpoints

| Endpoint | Method | Required Role | Description |
|---|---|---|---|
| `/api/v1/auth/login` | `POST` | Public | Authenticates credentials and returns a signed JWT token |
| `/api/v1/auth/register` | `POST` | Public | Registers a new customer account (strictly creates `USER` role only) |
| `/api/v1/auth/admins` | `POST` | **`SUPERADMIN` Only** | Provisions a new Store Admin with auto-generated credentials |
| `/api/v1/auth/users/:id/role` | `PATCH` | **`SUPERADMIN` Only** | Promotes/demotes role (`ADMIN` ↔ `USER`). Master SuperAdmin cannot be altered |
| `/api/v1/auth/users` | `GET` | `ADMIN` / `SUPERADMIN` | Retrieves registered staff and customer accounts directory |
| `/api/v1/auth/me` | `GET` | Authenticated | Returns current authenticated profile session |

---

## ⚡ Real-Time WebSocket Events

The server uses Socket.IO and groups connections by store rooms:

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join:store` | Client ➔ Server | `storeId: string` | Subscribe to real-time events for a store |
| `leave:store` | Client ➔ Server | `storeId: string` | Unsubscribe from a store |
| `order:created` | Server ➔ Client | `Order` | Dispatched to room `store:${store_id}` on order creation |
| `order:updated` | Server ➔ Client | `Order` | Dispatched to room `store:${store_id}` on status change |

---

## 🧪 Testing

The test suite contains **42 comprehensive unit and integration tests across 5 test suites**:
- **Authentication & RBAC (`tests/auth-store.test.ts`):** Verifies that public registration strictly enforces the `USER` role (ignoring any requested `ADMIN` role), SuperAdmin can log in and provision Store Admins via `POST /admins`, Store Admins can log in, profile authentication guards, and role-based store access.
- **Order Endpoints (`tests/order.test.ts`):** End-to-end integration testing of `POST /orders`, Zod validation rejections, `GET /orders` cursor-based pagination, single order retrieval (`GET /orders/:id`), and status transitions (`PATCH /orders/:id/status`).
- **Concurrency & Row-Level Locking (`tests/concurrency.test.ts`):** 5 simultaneous concurrent status updates against the same order to verify `SELECT ... FOR UPDATE` transactional row locking without race conditions or deadlocks.
- **Data Archival & Analytics (`tests/analytics-archive.test.ts`):** Verifies atomic CTE transaction moving orders older than 30 days to `orders_archive`, daily order aggregation, revenue per store, top-selling items, and Redis caching.
- **Validation Schemas (`tests/validation.test.ts`):** Zod schemas for order creation, items array validation, cursor pagination parameters, status enums, UUID format, and archival threshold.

```bash
cd backend
npm run test
```

Sample output:
```text
PASS tests/order.test.ts (11 tests)
PASS tests/concurrency.test.ts (1 test)
PASS tests/auth-store.test.ts (12 tests)
PASS tests/analytics-archive.test.ts (3 tests)
PASS tests/validation.test.ts (15 tests)

Test Suites: 5 passed, 5 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        84.19 s
Ran all test suites.
```

---

## 📁 Repository Structure

```text
d:/TMBill/
├── docker-compose.yml          # Root multi-container orchestration
├── package.json                # Root package with helper scripts
├── .env.example                # Root environment template
├── README.md                   # Complete documentation & API guide
├── backend/
│   ├── Dockerfile              # Multi-stage production image
│   ├── .env                    # Local environment config
│   ├── prisma/
│   │   └── schema.prisma       # Orders & OrdersArchive schema + indexes
│   ├── src/
│   │   ├── app.ts              # Express configuration & middleware
│   │   ├── server.ts           # HTTP & Socket.IO server entrypoint
│   │   ├── config/             # DB (Prisma), Redis, and Env config
│   │   ├── controllers/        # Order, Analytics, Archive controllers
│   │   ├── services/           # Business logic, Redis caching, locking
│   │   ├── socket/             # Socket.IO room manager & event emitters
│   │   ├── middlewares/        # Centralized error handler & Zod validator
│   │   ├── validators/         # Zod schemas
│   │   ├── scripts/            # Database demo seeder
│   │   └── utils/              # Structured Winston logger
│   └── tests/                  # Jest & Supertest test suites
└── frontend/
    ├── Dockerfile              # Multi-stage Next.js production image
    ├── next.config.mjs         # Next.js standalone & env configuration
    └── src/
        ├── app/
        │   ├── layout.tsx      # App shell with Theme, Query, Socket providers
        │   ├── page.tsx        # Orders list with debounced search & pagination
        │   ├── create-order/   # Dynamic order creation page
        │   └── analytics/      # Aggregated metrics & archival tool
        ├── components/         # Navbar, StatusBadge, TransitionMenu, Alert
        ├── context/            # SocketContext & QueryClientProvider
        ├── hooks/              # Custom useDebounce hook
        ├── services/           # Frontend API client
        ├── theme/              # Custom MUI theme & ThemeRegistry
        └── types/              # TypeScript order & store types
```

---

## 📄 License
MIT
