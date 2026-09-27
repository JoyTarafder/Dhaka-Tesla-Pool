# Dhaka Tesla Pool — Architecture.md

## 1. High-level architecture
```
Passenger/Driver Browser
          │
          ▼
   Next.js Frontend (App Router + TypeScript)
          │  HTTPS / REST
          ▼
   Express REST API (Node.js + TypeScript)
   ├── Auth module
   ├── Users module
   ├── Vehicles module
   ├── Ride module
   ├── Pool module
   ├── Fare service
   └── Audit/history
          │  ORM (Prisma) / SQL
          ▼
      PostgreSQL
```
Do **not** add microservices, Kafka, Kubernetes, Redis, or message queues just to look impressive — the PRD explicitly flags this as a negative signal for an MVP of this size.

## 2. Recommended stack

| Layer | Choice |
|---|---|
| Frontend | Next.js App Router + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Auth | JWT + bcrypt/argon2 |
| Testing | Vitest/Jest + Supertest |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Logging | Pino |
| Containers | Docker Compose |
| API style | REST |

## 3. Repo structure — frontend and backend are separate folders
This is a **two-app monorepo**, not one combined app. `frontend/` and `backend/` are independent projects (their own `package.json`, `tsconfig.json`, `node_modules`, `Dockerfile`), each with its own container in Docker Compose.
```
dhaka-tesla-pool/
├── frontend/                 # Next.js app
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── backend/                  # Express API
│   ├── src/
│   │   ├── config/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── vehicles/
│   │   │   ├── rides/
│   │   │   ├── pools/
│   │   │   └── payments/
│   │   ├── middleware/
│   │   ├── shared/
│   │   ├── db/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── prisma/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml         # orchestrates frontend + backend + postgres
├── .env.example
└── README.md
```
Each module inside `backend/src/modules/*` follows:
Each module: `controller`, `service`, `repository`, `validation schema`, `routes`, `types`, `tests`.

Responsibility split:
- **Controller** — request/response handling
- **Service** — business rules
- **Repository/ORM** — database access
- **Validation** — input checking
- **Middleware** — auth, role checks, error handling
- **Database constraints** — last line of integrity defense

Business logic must not leak into controllers.

## 4. API endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Passenger ride
```
POST   /api/ride-requests
GET    /api/ride-requests/me
GET    /api/ride-requests/:id
POST   /api/ride-requests/:id/cancel
GET    /api/ride-requests/:id/history
```

### Fare
```
POST /api/fares/estimate
```
```json
{ "pickupZone": "BANANI", "destinationZone": "MOHAKHALI", "seatCount": 1, "isPooled": true }
```

### Driver
```
GET   /api/driver/vehicle
PATCH /api/driver/availability
GET   /api/driver/pools
POST  /api/pools/:id/accept
POST  /api/pools/:id/arrive
POST  /api/pools/:id/start
POST  /api/pools/:id/complete
```

### Health
```
GET /health  → { "status": "ok", "database": "connected" }
```

## 5. Database schema

### `users`
`id, name, email, password_hash, role, created_at, updated_at`
- `role`: `PASSENGER | DRIVER | ADMIN`
- Constraints: email unique, password never plain text, valid role required

### `vehicles`
`id, driver_id, name, registration_number, capacity, is_online, created_at, updated_at`
- Example: `name=Bullet, capacity=3, driver_id=Jashim`
- Constraints: `capacity > 0`, registration unique, driver FK

### `ride_requests`
`id, passenger_id, pickup_zone, destination_zone, seat_count, estimated_distance_km, fare_amount_poisha, status, created_at, updated_at, cancelled_at`
- Constraints: `seat_count > 0`, pickup ≠ destination, fare ≥ 0, passenger FK

### `pools`
`id, vehicle_id, driver_id, status, total_capacity, occupied_seats, pickup_zone, route_code, version, created_at, updated_at, started_at, completed_at`
- `version` for optimistic locking
- Rule: `0 <= occupied_seats <= total_capacity`

### `pool_memberships` (join table)
`id, pool_id, ride_request_id, seats_reserved, fare_amount_poisha, membership_status, joined_at, left_at`
- Constraints: `(pool_id, ride_request_id)` unique, `seats_reserved > 0`

### `ride_status_history` (audit trail)
`id, ride_request_id, pool_id, from_status, to_status, changed_by_user_id, reason, created_at`

### `payments` (optional)
`id, ride_request_id, method, amount_poisha, status, transaction_reference, created_at, paid_at`
- `method`: `CASH | TESLA_PAY`

## 6. ERD relationships
```
User (Driver) 1 ─── 1..N Vehicle
User (Passenger) 1 ─── N RideRequest
Vehicle 1 ─── N Pool
Pool 1 ─── N PoolMembership
RideRequest 1 ─── 0..1 PoolMembership
RideRequest 1 ─── N RideStatusHistory
RideRequest 1 ─── 0..1 Payment
```
Show PKs, FKs, cardinality, key unique constraints, and status/fare/seat fields. Keep the ERD and the actual implementation in sync.

## 7. Indexes
```
users(email)
vehicles(driver_id)
vehicles(is_online)
ride_requests(passenger_id, created_at)
ride_requests(status, pickup_zone)
pools(status, pickup_zone)
pool_memberships(pool_id)
ride_status_history(ride_request_id, created_at)
```
`status + pickup_zone` composite index on `pools` is important for fast matching queries.

## 8. Concurrency — the core engineering problem
Scenario: Bullet capacity 3, 2 seats occupied, 1 left. Nusrat and Shirin both read `availableSeats = 1` at the same time. Naive read-then-write allows both to succeed, overbooking the vehicle.

### Solution A — transaction + row lock
```sql
BEGIN;
SELECT * FROM pools WHERE id = $1 FOR UPDATE;
-- re-check: available = total_capacity - occupied_seats
-- if enough seats: insert membership, update occupied_seats, update ride status, insert history
COMMIT; -- else ROLLBACK + 409 Conflict
```
`FOR UPDATE` locks the pool row; the second concurrent request waits, then re-reads updated capacity and is correctly rejected.

### Solution B — atomic conditional update
```sql
UPDATE pools
SET occupied_seats = occupied_seats + $requestedSeats
WHERE id = $poolId
  AND occupied_seats + $requestedSeats <= total_capacity;
```
Zero affected rows ⇒ no capacity. Membership insert and seat update must be in the same transaction.

### At scale (bonus discussion, not MVP-required)
Optimistic locking/version column, retry policy, idempotency keys, partitioned matching workers, short-lived reservations, event queues, distributed locks — none needed for this MVP.

## 9. Non-functional considerations (bonus scaling discussion)
- **Caching:** static zones, pricing config, short-lived driver availability cache — capacity source of truth stays in the DB.
- **Geospatial (production scale):** PostGIS, geohash, spatial indexes.
- **Queue/events:** notifications, analytics, payment reconciliation — core seat reservation stays a synchronous transaction.
- **Real-time:** WebSocket / SSE / push notifications for live status.
- **DB contention:** reservation partitioning, smaller transactions, zone-based matching, short lock duration.
- **Retry/failure:** bounded retries, exponential backoff, dead-letter handling, idempotent consumers.

## 10. Docker
```bash
docker compose up
```
Three separate services, matching the `frontend/` and `backend/` folders:
```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
  backend:
    build: ./backend
    ports: ["4000:4000"]
    depends_on: [postgres]
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: dhaka_tesla_pool
      POSTGRES_PASSWORD: postgres
    volumes: ["pgdata:/var/lib/postgresql/data"]
volumes:
  pgdata:
```
Each of `frontend/` and `backend/` has its **own** `Dockerfile`; `docker-compose.yml` sits at the repo root and builds both.

Required files: `frontend/Dockerfile`, `backend/Dockerfile`, root `docker-compose.yml`, `.env.example`, migration files, seed script, `README.md`.

`.env.example`:
```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/dhaka_tesla_pool
JWT_SECRET=replace-with-a-local-secret
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```
`/health` should confirm DB connectivity and backend readiness.

## 11. Seed data
```
Driver: Jashim
Vehicle: Bullet (capacity 3)
Passengers: Nusrat, Rafiq, Shirin
Zones: Banani, Mohakhali, Gulshan 1
```
Seed script must be safe to re-run without creating duplicates.
