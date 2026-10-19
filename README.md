# TMBill - Multi-Store Restaurant Order Management System

A production-ready, multi-store Restaurant Order Management System built with a high-performance Node.js/Express TypeScript backend, Prisma ORM, PostgreSQL, Redis, Socket.IO, and a Next.js (App Router) Material-UI frontend.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js (v20+), Express.js, TypeScript, Prisma ORM, PostgreSQL 16, Redis 7, Socket.IO, Zod, Winston, Jest, Supertest |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Material-UI (MUI v5), TanStack React Query v5, Socket.IO Client |
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

## 🔑 Demo Logins & Role-Based Access Control (RBAC)

The system features end-to-end JWT authentication and authorization with 3 distinct access levels:

| Role | Email | Password | Capabilities & Access |
| :--- | :--- | :--- | :--- |
| **👑 SuperAdmin** | `admin@storepulse.com` | `admin123` | **Full Platform Access**: Live analytics across all 4 stores, store creation/deletion, menu editing, staff & store admin creation, 30-day order archival, and live POS terminal. |
| **🛡️ Store Admin** | `central_admin@storepulse.com` | `admin123` | **Store Management**: Manage assigned store menu items, categories, view live incoming orders, and execute row-locked status updates (`PLACED` → `PREPARED`). |
| **👤 Customer** | `user@storepulse.com` | `user123` | **Customer Ordering**: Interactive POS ordering, promotional coupon application, cart discounts, and real-time private order tracking alerts. |

> **💡 One-Click Demo Sign-in:** On the login page (`http://localhost:3001/login`), click the quick-fill chips (**👑 SuperAdmin**, **🛡️ Admin**, or **👤 Customer**) to populate the credentials and test immediately with one click.

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

The test suite contains 28 comprehensive unit and integration tests across 4 test suites:
- **Validation Schemas:** Zod schemas for order creation, pagination query, status update, and archival.
- **Order Endpoints:** End-to-end testing of `POST /orders`, `GET /orders` cursor pagination, `GET /orders/:id` retrieval, and `PATCH /orders/:id/status`.
- **Concurrency & Row Locking:** Simultaneous concurrent updates to the same order to verify `SELECT ... FOR UPDATE` transactions.
- **Archival & Analytics:** Atomic CTE moving records to `orders_archive` and multi-store analytics with Redis caching.

```bash
cd backend
npm run test
```

Sample output:
```text
PASS tests/order.test.ts (10 tests)
PASS tests/analytics-archive.test.ts (3 tests)
PASS tests/concurrency.test.ts (1 test)
PASS tests/validation.test.ts (14 tests)

Test Suites: 4 passed, 4 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        2.118 s
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
