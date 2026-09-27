# Dhaka Tesla Pool — Product Requirements Document (PRD)

## 1. One-line summary
A small **ride-pooling MVP** for Dhaka. "Tesla" is not the car brand — in-story it's **Bullet**, a 3-seat battery-powered rickshaw/vehicle. Multiple passengers with nearby pickups and compatible destinations share the same vehicle, each pays their own fare, and vehicle capacity is never exceeded.

This is not a UI-polish exercise. It is evaluated on: problem understanding, architecture & DB design, auth/authorization, ride lifecycle, pooling & capacity enforcement, concurrency/data consistency, Git workflow, testing, Docker/deployment, documentation, and the ability to explain and modify your own code.

## 2. Story cast (use these names in seed data, tests, demos — not `user1`/`test-user`)

| Character | Role |
|---|---|
| **Jashim** | Driver |
| **Bullet** | Jashim's 3-seat battery-powered vehicle |
| **Nusrat** | Passenger, Banani → Mohakhali |
| **Rafiq** | Passenger, Banani → Gulshan 1 |
| **Shirin** | Passenger who tries to claim the last seat around the same time — triggers the concurrency scenario |

### Reference scenario
08:41, Banani Road 11. Nusrat requests a ride to Mohakhali. Two minutes later Rafiq requests a ride to Gulshan 1. Their pickups are close and routes partially overlap — the system must decide if they can pool, how many seats are needed, whether capacity is exceeded, each passenger's fare, and each passenger's status. Shortly after, Shirin tries to grab the last seat at nearly the same time — this is the concurrency test case.

## 3. Product problem — questions the system must answer reliably
1. How does a passenger request a ride?
2. When can two passengers with different destinations share the same pool?
3. How many seats are available on a given vehicle right now?
4. If two people claim the last seat simultaneously, who gets it?
5. How is each passenger's own fare calculated?
6. How does a driver see their assigned passengers?
7. When does a ride move through requested → matched → arrived → started → completed?
8. Can a passenger see another passenger's private fare/status? (No.)
9. How is history kept after a ride completes?
10. How are invalid/unauthorized state changes prevented?

> Key principle: showing "available seats" on screen is not enough — overbooking must be prevented at the **database level**.

## 4. Core domains

### 4.1 Passenger
Can: sign up, sign in, select pickup, select destination, specify seat count, see estimated fare, request a ride, track ride status, view own ride history, cancel per rules.

Status flow: `REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED`, with `REQUESTED/MATCHED → CANCELLED` as an escape path.

Passengers only ever see their **own** fare, status, request, and payment info — never another passenger's.

### 4.2 Driver / Vehicle
Can: sign in, go online/offline, view own vehicle, view relevant ride requests/pools, accept a ride/pool, see assigned passengers and booked seats, mark arrival, start trip, complete trip, view ride history.

Vehicle record: unique ID, name (e.g. `Bullet`), fixed capacity (e.g. `3`), driver reference, online/offline status, availability status.

A driver can only update the lifecycle of their **own** assigned pool.

### 4.3 Ride / Pool
A pool is a shared-trip container holding multiple ride requests:
```
Pool A
├── Nusrat's request: 1 seat
├── Rafiq's request: 1 seat
└── Shirin's request: 1 seat
```
Core business rule:
```
sum(active booked seats) <= vehicle capacity
```
Each passenger has their own request, fare, cancellation state, and pool membership.

## 5. Ride lifecycle / state machine
Recommended (splitting MATCHED and ACCEPTED for clarity):
```
REQUESTED → MATCHED → ACCEPTED → DRIVER_ARRIVED → STARTED → COMPLETED
                                                            ↘ CANCELLED (from REQUESTED/MATCHED/ACCEPTED/DRIVER_ARRIVED)
```
- **REQUESTED** — submitted, no vehicle/pool confirmed yet
- **MATCHED** — system found a compatible pool/vehicle
- **ACCEPTED** — driver accepted the request/pool
- **DRIVER_ARRIVED** — driver reached the pickup zone
- **STARTED** — trip in progress
- **COMPLETED** — trip finished successfully
- **CANCELLED** — cancelled by passenger, or by driver/system where allowed

Enforce transitions via an explicit map (invalid moves like `REQUESTED → COMPLETED` or `STARTED → REQUESTED` must be rejected). Once `STARTED`, passenger cancellation is not allowed (document this as an assumption).

## 6. Geography — keep it simple
No real routing engine required. Use a predefined Dhaka zone list, zone-based matching, static lat/lng, and predefined route-corridor compatibility.

Example zones: Banani, Gulshan 1, Gulshan 2, Mohakhali, Farmgate, Dhanmondi, Mirpur, Uttara, Bashundhara.

### Matching rule (MVP)
A new ride joins an existing pool if:
1. Pickup zone matches;
2. Destination is within the pool's approved route corridor;
3. Enough seats are available;
4. Pool has not yet `STARTED`;
5. Departure-time difference is ≤ 5 minutes.

Example corridor `Banani → Mohakhali → Gulshan 1` lets Nusrat (Banani→Mohakhali) and Rafiq (Banani→Gulshan 1) share a pool.

## 7. Fare model
```
passengerFare = baseFare + distanceCharge - poolDiscount
```
Suggested concrete values: base fare ৳30, per-km ৳12, pool discount 20% of gross fare.

Example — Nusrat, 4 km: gross ৳78, discount ৳15.60, final **৳62.40**.
Example — Rafiq, 5 km: gross ৳90, discount ৳18, final **৳72.00**.

Same vehicle, different distance ⇒ different fare per passenger.

**Store money as integer poisha** (e.g. ৳62.40 = `6240`), never float, to avoid rounding errors.

## 8. Payment scope
MVP needs: cash or a simulated `TeslaPay` wallet. Not needed: bKash/Nagad live gateway, Stripe, SSLCommerz, real card processing. If simulated: `PENDING / PAID / FAILED / REFUNDED`. Payment is optional — pooling integrity comes first.

## 9. Mandated / recommended tech stack
- **Frontend:** React or Next.js (Next.js App Router recommended, not mandatory)
- **Backend:** Node.js (Express recommended for MVP simplicity; NestJS/Fastify acceptable alternatives)
- **Database:** candidate's choice, but a relational DB (PostgreSQL recommended) for transactions, row locks, FKs, constraints
- Full recommended stack: Next.js + TS, Express + TS, PostgreSQL, Prisma, Zod, JWT + bcrypt/argon2, Vitest/Jest + Supertest, Tailwind, Pino, Docker Compose, REST API

Every non-mandated technology choice must be justified in the README: what was chosen, why it fits this MVP, and when you'd switch.

## 10. MVP scope boundaries

**In scope:** auth, passenger/driver roles, vehicle capacity, ride request, simple matching, pool membership, individual fare, ride lifecycle, cancellation, history, transaction-safe capacity, tests, Docker, documentation.

**Out of scope (bonus/future):** live Google Maps routing, real GPS tracking, real payment gateways, live traffic API, weather-based pricing, ML matching, Kubernetes, Kafka, microservices, distributed infrastructure.

> Correctness first, enhancement second. A small, clean, tested, instruction-following MVP scores higher than a feature-bloated one that breaks process.

## 11. Assumptions to document (examples)
- Pooling requires same pickup zone + compatible destination corridor
- Departure window: 5 minutes
- `STARTED` rides cannot be cancelled by the passenger
- A passenger has at most one active ride at a time
- A pool does not start before the driver accepts
- Completed fares are immutable
- No live GPS in MVP — manual status updates only

## 12. Deliverables checklist (submission)
Public repo · working frontend/backend/DB · `docker compose up` works · `.env.example` (no secrets) · migrations · seed data with story characters · architecture diagram · ERD · `master`/`pre-release`/`release/v1.0.0` branches · meaningful commit history · capacity/transition/fare/authorization/cancellation/concurrency tests · complete README · demo credentials · deployment link or documented limitation · 6-minute demo video · AI Usage section · known limitations.
