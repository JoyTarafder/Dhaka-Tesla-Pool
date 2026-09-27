# Dhaka Tesla Pool PRD — A থেকে Z পূর্ণ বাংলা ব্যাখ্যা

## ১. এক কথায় প্রজেক্টটি কী?

**Dhaka Tesla Pool** হলো ঢাকার জন্য একটি ছোট **ride-pooling MVP**। এখানে “Tesla” বলতে Tesla কোম্পানির গাড়ি বোঝানো হয়নি—গল্পে এটি **Bullet নামের তিন আসনের ব্যাটারিচালিত রিকশা/যান**।

মূল ধারণা:

> কাছাকাছি pickup এবং compatible destination-এর একাধিক যাত্রী একই গাড়ি ভাগ করবে, প্রত্যেকে নিজের ভাড়া দেবে, আর গাড়ির capacity কোনো অবস্থায় অতিক্রম করা যাবে না।

এটি শুধু সুন্দর UI বানানোর challenge নয়। Evaluator মূলত দেখতে চায়:

- সমস্যা বোঝার ক্ষমতা
- architecture ও database design
- authentication ও authorization
- ride lifecycle
- pooling ও capacity enforcement
- concurrency/data consistency
- Git workflow
- testing
- Docker ও deployment
- documentation
- নিজের code ব্যাখ্যা ও পরিবর্তন করার সক্ষমতা

---

# ২. গল্পের চরিত্র ও তাদের ভূমিকা

PRD-তে ইচ্ছাকৃতভাবে নির্দিষ্ট কিছু চরিত্র দেওয়া হয়েছে।

| চরিত্র | ভূমিকা |
|---|---|
| **Jashim** | Driver |
| **Bullet** | Jashim-এর তিন আসনের battery-powered Tesla |
| **Nusrat** | Banani → Mohakhali যাত্রী |
| **Rafiq** | Banani → Gulshan 1 যাত্রী |
| **Shirin** | প্রায় একই সময়ে শেষ আসন নেওয়ার চেষ্টা করা যাত্রী |

### গল্পের পরিস্থিতি

- সকাল **৮:৪১**, Banani Road 11।
- Nusrat Mohakhali যাওয়ার ride request করে।
- দুই মিনিট পরে Rafiq Gulshan 1 যাওয়ার request করে।
- তাদের pickup কাছাকাছি এবং route আংশিকভাবে overlapping।
- সিস্টেমকে সিদ্ধান্ত নিতে হবে:
  - তারা একই Bullet-এ যেতে পারবে কি না;
  - কতটি seat লাগবে;
  - capacity অতিক্রম করবে কি না;
  - প্রত্যেকের ভাড়া কত হবে;
  - কার status কী হবে।
- এরপর Shirin প্রায় একই সময়ে শেষ seat নেওয়ার চেষ্টা করে।
- এখানেই **concurrency problem** তৈরি হয়।

### কেন এই চরিত্রগুলো গুরুত্বপূর্ণ?

Evaluator চায় seed data, test, demo এবং README-তে একই পরিচিত চরিত্র থাকুক। যেমন:

- `user1`
- `driver1`
- `test-user`

এই ধরনের generic নাম ব্যবহার না করে Jashim, Nusrat, Rafiq, Shirin ও Bullet ব্যবহার করা ভালো।

এতে বোঝা যায় প্রার্থী পুরো system-টি end-to-end চিন্তা করে বানিয়েছে।

---

# ৩. Product problem

সিস্টেমকে নিচের প্রশ্নগুলোর নির্ভরযোগ্য উত্তর দিতে হবে:

1. যাত্রী কীভাবে ride request করবে?
2. দুটি আলাদা destination-এর যাত্রী কখন একই pool-এ যেতে পারবে?
3. কোন গাড়িতে কত seat available?
4. দুইজন একই সময়ে শেষ seat চাইলে কে seat পাবে?
5. প্রত্যেক যাত্রীর নিজস্ব fare কীভাবে হিসাব হবে?
6. Driver কীভাবে assigned passengers দেখবে?
7. Ride কখন requested, matched, arrived, started বা completed?
8. Passenger কি অন্য যাত্রীর private fare/status দেখতে পারবে?
9. Ride শেষ হওয়ার পর কীভাবে ঘটনার history রাখা হবে?
10. ভুল বা unauthorized state change কীভাবে আটকানো হবে?

এখানে সবচেয়ে গুরুত্বপূর্ণ বিষয় হলো:

> Screen-এ available seat দেখানো যথেষ্ট নয়; database level-এও overbooking প্রতিরোধ করতে হবে।

---

# ৪. MVP-এর তিনটি প্রধান actor/domain

PRD তিনটি মূল অংশ ঘিরে MVP বানাতে বলেছে।

## ৪.১ Passenger

Passenger করতে পারবে:

- Sign up
- Sign in
- Pickup নির্বাচন
- Destination নির্বাচন
- প্রয়োজনীয় seat সংখ্যা দেওয়া
- Estimated fare দেখা
- Ride request করা
- Ride status track করা
- নিজের ride history দেখা
- নিয়ম অনুযায়ী ride cancel করা

Passenger-এর status সাধারণভাবে:

```text
REQUESTED
→ MATCHED
→ DRIVER_ARRIVED
→ STARTED
→ COMPLETED
```

প্রয়োজনে:

```text
REQUESTED / MATCHED
→ CANCELLED
```

Passenger শুধু নিজের:

- fare
- status
- request
- payment information

দেখবে। অন্য passenger-এর sensitive তথ্য দেখা উচিত নয়।

---

## ৪.২ Driver/Tesla

Driver করতে পারবে:

- Sign in
- Online/offline হওয়া
- নিজের vehicle দেখা
- relevant ride requests/pools দেখা
- ride বা pool accept করা
- assigned passengers ও booked seats দেখা
- arrival mark করা
- trip start করা
- trip complete করা
- ride history দেখা

Driver-এর Tesla/vehicle-এর থাকবে:

- Unique ID
- Name, যেমন `Bullet`
- Fixed capacity, যেমন `3`
- Driver reference
- Online/offline status
- Availability status

একজন driver শুধু নিজের assigned pool-এর lifecycle update করতে পারবে।

---

## ৪.৩ Ride/Pool

Pool হলো একটি shared trip container।

একটি pool-এর মধ্যে একাধিক ride request থাকতে পারে:

```text
Pool A
├── Nusrat-এর request: 1 seat
├── Rafiq-এর request: 1 seat
└── Shirin-এর request: 1 seat
```

প্রধান business rule:

```text
sum(active booked seats) <= vehicle capacity
```

Bullet-এর capacity 3 হলে active members-এর total seat কখনো 3-এর বেশি হতে পারবে না।

প্রত্যেক passenger-এর:

- আলাদা request
- আলাদা fare
- আলাদা cancellation state
- pool membership

থাকবে।

---

# ৫. Ride lifecycle বা state machine

PRD-এর suggested lifecycle:

```text
REQUESTED
→ MATCHED/ACCEPTED
→ DRIVER_ARRIVED
→ STARTED
→ COMPLETED
```

এছাড়া:

```text
CANCELLED
```

## প্রতিটি status-এর অর্থ

### `REQUESTED`

Passenger request submit করেছে, কিন্তু এখনো কোনো vehicle/pool নিশ্চিত হয়নি।

### `MATCHED`

Matching rule অনুযায়ী compatible pool বা vehicle পাওয়া গেছে।

### `ACCEPTED`

Driver request বা pool গ্রহণ করেছে।

PRD-তে `MATCHED/ACCEPTED` একসঙ্গে দেখানো হয়েছে। Implementation-এ দুটি আলাদা status রাখা ভালো, কারণ:

- system match করতে পারে;
- driver পরে accept করতে পারে।

প্রস্তাবিত lifecycle:

```text
REQUESTED
→ MATCHED
→ ACCEPTED
→ DRIVER_ARRIVED
→ STARTED
→ COMPLETED
```

### `DRIVER_ARRIVED`

Driver pickup zone-এ পৌঁছেছে।

### `STARTED`

যাত্রা শুরু হয়েছে।

### `COMPLETED`

যাত্রা সফলভাবে শেষ হয়েছে।

### `CANCELLED`

Passenger বা অনুমোদিত ক্ষেত্রে driver/system ride বাতিল করেছে।

---

## Valid transition নির্ধারণ

Backend-এ একটি explicit transition map রাখা যেতে পারে:

```ts
const allowedTransitions = {
  REQUESTED: ["MATCHED", "CANCELLED"],
  MATCHED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["DRIVER_ARRIVED", "CANCELLED"],
  DRIVER_ARRIVED: ["STARTED", "CANCELLED"],
  STARTED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};
```

এর ফলে নিচের invalid operation reject হবে:

```text
REQUESTED → COMPLETED
COMPLETED → STARTED
CANCELLED → DRIVER_ARRIVED
STARTED → REQUESTED
```

সাধারণত `STARTED` হওয়ার পরে passenger cancellation অনুমোদন না করাই যুক্তিযুক্ত। তবে এটিকে assumption হিসেবে README-তে লিখতে হবে।

---

# ৬. Geography কীভাবে সহজ রাখতে হবে?

PRD স্পষ্টভাবে বলছে Google Maps-এর মতো routing engine বানাতে হবে না।

ব্যবহার করা যেতে পারে:

- predefined Dhaka area list;
- zone-based matching;
- static latitude/longitude;
- predefined route compatibility;
- lightweight free map।

উদাহরণ area:

- Banani
- Gulshan 1
- Gulshan 2
- Mohakhali
- Farmgate
- Dhanmondi
- Mirpur
- Uttara
- Bashundhara

---

## একটি সহজ matching rule

প্রস্তাবিত MVP rule:

একটি নতুন ride existing pool-এ যোগ হবে যদি:

1. Pickup zone একই হয়;
2. Destination pool-এর approved route corridor-এর মধ্যে থাকে;
3. Available seats পর্যাপ্ত থাকে;
4. Pool এখনো `STARTED` না হয়;
5. Departure time difference সর্বোচ্চ ৫ মিনিট হয়।

উদাহরণ:

```text
Allowed route corridor:
Banani → Mohakhali → Gulshan 1
```

তাহলে:

- Nusrat: Banani → Mohakhali
- Rafiq: Banani → Gulshan 1

একই pool-এ যেতে পারে।

### কেন?

- একই pickup zone;
- destination দুটো compatible corridor-এ;
- বড় detour প্রয়োজন নেই;
- capacity available।

### Shirin-এর ক্ষেত্রে

Shirin যদি 2 seats চায় এবং মাত্র 1 seat available থাকে, request reject বা নতুন pool-এ রাখতে হবে।

---

# ৭. Fare model

PRD সহজ, testable এবং হাতে হিসাব করা যায়—এমন fare formula চায়।

মূল উদাহরণ:

```text
passengerFare = baseFare + distanceCharge - poolDiscount
```

একটি concrete model হতে পারে:

```text
Base fare = 30 টাকা
Per km charge = 12 টাকা
Pool discount = gross fare-এর 20%
```

## Nusrat-এর উদাহরণ

ধরা যাক দূরত্ব 4 km:

```text
Gross fare = 30 + (4 × 12)
           = 78 টাকা

Pool discount = 78 × 20%
              = 15.60 টাকা

Final fare = 78 - 15.60
           = 62.40 টাকা
```

## Rafiq-এর উদাহরণ

ধরা যাক দূরত্ব 5 km:

```text
Gross fare = 30 + (5 × 12)
           = 90 টাকা

Pool discount = 90 × 20%
              = 18 টাকা

Final fare = 72 টাকা
```

এখানে Nusrat ও Rafiq একই গাড়িতে গেলেও fare আলাদা, কারণ তাদের distance আলাদা।

---

## টাকা কীভাবে database-এ রাখা উচিত?

Floating-point/decimal rounding সমস্যা এড়াতে টাকা **integer poisha** হিসেবে রাখা সবচেয়ে নিরাপদ।

উদাহরণ:

```text
৳62.40 = 6240 poisha
৳72.00 = 7200 poisha
```

Database field:

```text
fare_amount_poisha INTEGER
```

### কেন float নয়?

Programming language-এ:

```js
0.1 + 0.2 !== 0.3
```

অর্থাৎ floating-point precision-এর কারণে financial calculation-এ ভুল হতে পারে।

Display করার সময়:

```text
6240 / 100 = ৳62.40
```

---

## Payment scope

MVP-তে প্রয়োজন:

- Cash অথবা
- Simulated `TeslaPay` wallet

প্রয়োজন নেই:

- bKash live gateway
- Nagad live gateway
- Stripe
- SSLCommerz
- real card payment

Payment simulation থাকলে status হতে পারে:

```text
PENDING
PAID
FAILED
REFUNDED
```

তবে payment optional; core pooling integrity আগে।

---

# ৮. Mandated technology stack

## Frontend

অবশ্যই:

- React অথবা
- Next.js

PRD Next.js App Router recommend করেছে, কিন্তু বাধ্যতামূলক নয়।

### ভালো নির্বাচন

```text
Next.js App Router + TypeScript
```

কারণ:

- built-in routing;
- layout support;
- loading/error UI;
- সহজ component organization;
- React ecosystem;
- future SSR capability।

---

## Backend

অবশ্যই:

```text
Node.js
```

Framework হিসেবে নেওয়া যায়:

- Express
- NestJS
- Fastify
- অন্য Node.js framework

### MVP-এর জন্য Express যুক্তিযুক্ত

কারণ:

- lightweight;
- সহজে বোঝা যায়;
- কম abstraction;
- REST API দ্রুত তৈরি করা যায়;
- internship-level MVP-এর জন্য যথেষ্ট।

তবে README-তে alternatives উল্লেখ করতে হবে:

- NestJS: বড় modular team/project হলে;
- Fastify: higher performance ও schema-based validation প্রয়োজন হলে।

---

## Database

Candidate নিজে নির্বাচন করতে পারবে। PRD relational database recommend করেছে:

- PostgreSQL
- MySQL
- SQLite

### PostgreSQL সবচেয়ে যুক্তিযুক্ত

Ride pooling-এ দরকার:

- transactions;
- row locking;
- foreign keys;
- unique constraints;
- check constraints;
- indexes;
- concurrent update safety।

MongoDB দিয়ে বানানো নিষিদ্ধ নয়, কিন্তু capacity এবং relational consistency ব্যাখ্যা করা PostgreSQL-এ সহজ ও শক্তিশালী।

---

## Recommended stack

এটি PRD-এর বাধ্যতামূলক stack নয়; একটি defendable recommendation:

| Layer | Recommended choice |
|---|---|
| Frontend | Next.js App Router + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Authentication | JWT + bcrypt/argon2 |
| Testing | Vitest/Jest + Supertest |
| Styling | Tailwind CSS |
| Logging | Pino |
| Containers | Docker Compose |
| API style | REST |

প্রতিটি নির্বাচনের কারণ README-তে দিতে হবে।

---

# ৯. REST না GraphQL?

এই MVP-এর জন্য REST সহজ ও যথেষ্ট।

উদাহরণ resource:

```text
/auth
/users
/vehicles
/ride-requests
/pools
/pool-members
/payments
/ride-events
```

### REST বেছে নেওয়ার কারণ

- domain resource পরিষ্কার;
- endpoint সহজে test করা যায়;
- Swagger/OpenAPI documentation সহজ;
- MVP-এর query complexity কম;
- frontend-এর প্রয়োজনীয় data predictable।

### কখন GraphQL বিবেচনা করা যেতে পারে?

- multiple clients-এর data requirement খুব আলাদা হলে;
- deeply nested dashboard queries থাকলে;
- mobile/web clients selective fields চাইলে।

---

# ১০. প্রস্তাবিত database design

নিচের schema একটি ভালো baseline।

## ১০.১ `users`

```text
id
name
email
password_hash
role
created_at
updated_at
```

`role`:

```text
PASSENGER
DRIVER
ADMIN
```

Constraints:

- email unique;
- password plain text নয়;
- valid role required।

---

## ১০.২ `vehicles`

```text
id
driver_id
name
registration_number
capacity
is_online
created_at
updated_at
```

Example:

```text
name = Bullet
capacity = 3
driver_id = Jashim
```

Constraints:

- `capacity > 0`
- registration unique
- driver foreign key

---

## ১০.৩ `ride_requests`

```text
id
passenger_id
pickup_zone
destination_zone
seat_count
estimated_distance_km
fare_amount_poisha
status
created_at
updated_at
cancelled_at
```

Constraints:

- `seat_count > 0`
- pickup এবং destination এক হতে পারবে না
- fare negative হতে পারবে না
- passenger foreign key

---

## ১০.৪ `pools`

```text
id
vehicle_id
driver_id
status
total_capacity
occupied_seats
pickup_zone
route_code
version
created_at
updated_at
started_at
completed_at
```

`version` optimistic locking-এর জন্য ব্যবহার করা যেতে পারে।

Rules:

```text
occupied_seats >= 0
occupied_seats <= total_capacity
```

---

## ১০.৫ `pool_memberships`

এটি ride request ও pool-এর join table।

```text
id
pool_id
ride_request_id
seats_reserved
fare_amount_poisha
membership_status
joined_at
left_at
```

Constraints:

- `(pool_id, ride_request_id)` unique;
- এক request একই pool-এ duplicateভাবে যোগ করা যাবে না;
- reserved seats positive হতে হবে।

---

## ১০.৬ `ride_status_history`

```text
id
ride_request_id
pool_id
from_status
to_status
changed_by_user_id
reason
created_at
```

এটি audit trail দেয়।

যেমন:

```text
REQUESTED → MATCHED
MATCHED → ACCEPTED
ACCEPTED → DRIVER_ARRIVED
```

পরে dispute হলে বোঝা যাবে:

- কে status বদলেছে;
- কখন বদলেছে;
- আগের status কী ছিল;
- কেন পরিবর্তন হয়েছে।

---

## ১০.৭ Optional `payments`

```text
id
ride_request_id
method
amount_poisha
status
transaction_reference
created_at
paid_at
```

Method:

```text
CASH
TESLA_PAY
```

---

## গুরুত্বপূর্ণ indexes

```text
users(email)
vehicles(driver_id)
vehicles(is_online)
ride_requests(passenger_id, created_at)
ride_requests(status, pickup_zone)
pools(status, pickup_zone)
pool_memberships(pool_id)
ride_status_history(ride_request_id, created_at)
```

Matching query দ্রুত করার জন্য `status + pickup_zone` composite index গুরুত্বপূর্ণ।

---

# ১১. Authentication ও authorization

## Authentication

প্রস্তাবিত flow:

1. User signup করবে;
2. password hash করা হবে;
3. login করলে access token দেওয়া হবে;
4. protected endpoint-এ bearer token পাঠাবে;
5. backend token verify করবে।

Password অবশ্যই:

- bcrypt বা Argon2 দিয়ে hash;
- log করা যাবে না;
- response-এ ফেরত দেওয়া যাবে না।

---

## Authorization/RBAC

Authentication বলছে **ব্যক্তিটি কে**।  
Authorization বলছে **সে কী করতে পারবে**।

### Passenger

পারবে:

- নিজের request create করতে;
- নিজের request দেখতে;
- valid অবস্থায় নিজের request cancel করতে।

পারবে না:

- অন্য passenger-এর request update করতে;
- driver arrival mark করতে;
- অন্যের fare দেখতে।

### Driver

পারবে:

- নিজের vehicle online/offline করতে;
- নিজের assigned pool দেখতে;
- নিজের pool accept/start/complete করতে।

পারবে না:

- অন্য driver-এর pool update করতে;
- random passenger-এর request modify করতে।

### গুরুত্বপূর্ণ security test

```text
Nusrat token দিয়ে Rafiq-এর ride cancel করার চেষ্টা
→ 403 Forbidden
```

শুধু frontend-এ button লুকানো security নয়। Backend-এ ownership check আবশ্যক।

---

# ১২. Backend organization

একটি পরিষ্কার structure:

```text
src/
├── config/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── vehicles/
│   ├── rides/
│   ├── pools/
│   └── payments/
├── middleware/
├── shared/
├── db/
├── app.ts
└── server.ts
```

প্রতিটি module-এ থাকতে পারে:

```text
controller
service
repository
validation schema
routes
types
tests
```

### দায়িত্ব বিভাজন

- **Controller:** request/response পরিচালনা
- **Service:** business rules
- **Repository/ORM:** database access
- **Validation:** input যাচাই
- **Middleware:** auth, role, error handling
- **Database constraints:** শেষ স্তরের integrity

Business logic controller-এর মধ্যে ছড়িয়ে দেওয়া উচিত নয়।

---

# ১৩. সম্ভাব্য API endpoints

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

## Passenger ride

```http
POST   /api/ride-requests
GET    /api/ride-requests/me
GET    /api/ride-requests/:id
POST   /api/ride-requests/:id/cancel
GET    /api/ride-requests/:id/history
```

## Fare estimate

```http
POST /api/fares/estimate
```

Example request:

```json
{
  "pickupZone": "BANANI",
  "destinationZone": "MOHAKHALI",
  "seatCount": 1,
  "isPooled": true
}
```

## Driver

```http
GET   /api/driver/vehicle
PATCH /api/driver/availability
GET   /api/driver/pools
POST  /api/pools/:id/accept
POST  /api/pools/:id/arrive
POST  /api/pools/:id/start
POST  /api/pools/:id/complete
```

## Health check

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

---

# ১৪. Validation ও error handling

প্রতিটি input backend-এ validate করতে হবে।

Reject করতে হবে যদি:

- pickup missing;
- destination missing;
- একই pickup ও destination;
- seat count 0 বা negative;
- vehicle capacity-এর চেয়ে বেশি seat;
- invalid enum;
- unauthorized user;
- invalid status transition;
- pool already started;
- insufficient capacity।

Standard error response:

```json
{
  "success": false,
  "error": {
    "code": "POOL_CAPACITY_EXCEEDED",
    "message": "Requested seats exceed the pool's available capacity."
  }
}
```

Useful HTTP status:

| পরিস্থিতি | Status |
|---|---:|
| সফল create | 201 |
| সফল read/update | 200 |
| invalid input | 400 |
| login প্রয়োজন | 401 |
| permission নেই | 403 |
| record নেই | 404 |
| duplicate/conflict | 409 |
| unexpected error | 500 |

Database error সরাসরি user-কে দেখানো উচিত নয়।

---

# ১৫. সবচেয়ে গুরুত্বপূর্ণ concurrency problem

পরিস্থিতি:

- Bullet-এর capacity 3।
- 2 seats ইতোমধ্যে occupied।
- মাত্র 1 seat বাকি।
- Nusrat এবং Shirin একই সময়ে সেই seat claim করে।
- দুজনই request-এর শুরুতে `availableSeats = 1` দেখে।

Naive implementation:

```text
Request A reads occupied = 2
Request B reads occupied = 2
A writes occupied = 3
B writes occupied = 3
```

উভয়ের membership insert হলে বাস্তবে 4 passenger হতে পারে, কিন্তু counter 3 দেখাতে পারে। এটি race condition।

---

## PostgreSQL transaction + row lock সমাধান

Transaction-এর ভেতরে:

```sql
BEGIN;

SELECT *
FROM pools
WHERE id = $1
FOR UPDATE;
```

এরপর আবার capacity check:

```text
available = total_capacity - occupied_seats
```

যদি পর্যাপ্ত seat থাকে:

1. membership insert;
2. occupied seats update;
3. ride status update;
4. history insert;
5. commit।

না থাকলে rollback এবং `409 Conflict`।

```sql
COMMIT;
```

`FOR UPDATE` pool row-টি lock করবে। দ্বিতীয় concurrent request প্রথম transaction শেষ হওয়া পর্যন্ত অপেক্ষা করবে। তারপর updated capacity দেখে reject হবে।

---

## Alternative: atomic conditional update

```sql
UPDATE pools
SET occupied_seats = occupied_seats + $requestedSeats
WHERE id = $poolId
  AND occupied_seats + $requestedSeats <= total_capacity;
```

Affected row count `0` হলে capacity পাওয়া যায়নি।

এটিও শক্তিশালী পদ্ধতি। Membership insert ও seat update অবশ্যই একই transaction-এ করতে হবে।

---

## বড় scale-এ কী পরিবর্তন হতে পারে?

- optimistic locking/version column;
- retry policy;
- idempotency key;
- partitioned matching workers;
- short-lived reservation;
- queue/event processing;
- distributed lock—শুধু প্রয়োজন হলে।

MVP-তে Redis lock বা distributed architecture দরকার নেই।

---

# ১৬. Cancellation rules

PRD বলে passenger valid অবস্থায় cancel করতে পারবে। Exact rule candidate-কে নির্ধারণ করতে হবে।

একটি ভালো assumption:

| Current status | Passenger cancel করতে পারবে? |
|---|---|
| REQUESTED | হ্যাঁ |
| MATCHED | হ্যাঁ |
| ACCEPTED | হ্যাঁ |
| DRIVER_ARRIVED | হ্যাঁ, প্রয়োজনে cancellation note |
| STARTED | না |
| COMPLETED | না |
| CANCELLED | আবার নয় |

Cancellation transaction-এর মধ্যে হওয়া উচিত:

1. request status `CANCELLED`;
2. membership inactive/cancelled;
3. reserved seats release;
4. pool occupied seat update;
5. status history create।

একই request দুবার cancel করলে seat দুবার decrement করা যাবে না। Operation idempotent বা conflict-safe হতে হবে।

---

# ১৭. Frontend-এ কী কী screen প্রয়োজন?

## Public/Auth

- Landing page
- Sign up
- Sign in

## Passenger

- Passenger dashboard
- New ride request form
- Fare estimate
- Current ride/status tracker
- Ride details
- Ride history
- Cancel confirmation

## Driver

- Driver dashboard
- Online/offline toggle
- Available/relevant pool list
- Active pool
- Passenger/seat list
- Arrival/start/complete controls
- Driver history

---

## UI state অবশ্যই দেখাতে হবে

প্রতিটি screen-এ শুধু success state নয়:

### Loading

```text
Loading your active ride…
```

### Empty

```text
You do not have an active ride.
```

### Error

```text
We could not load the ride. Please retry.
```

### Capacity conflict

```text
The last seat was just booked by another passenger.
```

### Unauthorized

```text
You do not have permission to view this ride.
```

Evaluator polished animation-এর চেয়ে correct state ও reliable data flow বেশি গুরুত্ব দেবে।

---

# ১৮. Architecture diagram

Minimum architecture:

```text
Browser
   │
   ▼
Next.js / React Frontend
   │ HTTPS / REST
   ▼
Node.js API
   │ ORM / SQL
   ▼
PostgreSQL
```

আরও practical diagram:

```text
Passenger/Driver Browser
          │
          ▼
   Next.js Frontend
          │
          ▼
 Express REST API
 ├── Auth module
 ├── Ride module
 ├── Pool module
 ├── Fare service
 └── Audit/history
          │
          ▼
     PostgreSQL
```

PRD স্পষ্টভাবে বলে অকারণে এগুলো যোগ না করতে:

- microservices
- Kafka
- Kubernetes
- Redis
- queues

শুধু architecture-কে impressive দেখাতে technology যোগ করা negative signal।

---

# ১৯. ERD-তে কী দেখাতে হবে?

Core relationships:

```text
User (Driver) 1 ─── 1..N Vehicle

User (Passenger) 1 ─── N RideRequest

Vehicle 1 ─── N Pool

Pool 1 ─── N PoolMembership

RideRequest 1 ─── 0..1 PoolMembership

RideRequest 1 ─── N RideStatusHistory

RideRequest 1 ─── 0..1 Payment
```

ERD-তে দেখাতে হবে:

- primary key;
- foreign key;
- one-to-many;
- one-to-one/optional;
- important unique constraints;
- status/fare/seat fields।

Implementation ও ERD যেন একে অপরের সঙ্গে মেলে।

---

# ২০. Docker requirement

Project চালু হতে হবে:

```bash
docker compose up
```

Compose-এ সাধারণত:

```text
frontend
backend
postgres
```

থাকবে।

প্রয়োজনে frontend/backend এক app-এ হলেও acceptable, কিন্তু documentation পরিষ্কার হতে হবে।

## প্রয়োজনীয় ফাইল

```text
Dockerfile
docker-compose.yml
.env.example
migration files
seed script
README.md
```

## `.env.example`

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/dhaka_tesla_pool
JWT_SECRET=replace-with-a-local-secret
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

এখানে real secret থাকবে না।

## Health check

- PostgreSQL ready কি না;
- backend `/health` response দেয় কি না;
- frontend serve হচ্ছে কি না।

Startup order-এর পাশাপাশি readiness গুরুত্বপূর্ণ।

---

# ২১. Migration ও seed data

Migration database schema reproducibly তৈরি করবে।

Seed data-তে থাকতে পারে:

```text
Driver:
- Jashim

Vehicle:
- Bullet
- Capacity: 3

Passengers:
- Nusrat
- Rafiq
- Shirin

Areas/routes:
- Banani
- Mohakhali
- Gulshan 1
```

Demo credentials README-তে দেওয়া যায়, যেমন:

```text
Passenger: nusrat@example.com
Driver: jashim@example.com
```

কিন্তু production secret বা real password নয়।

Seed script একাধিকবার চালালে duplicate data তৈরি না করাই ভালো।

---

# ২২. Technology choice justification

শুধু “আমি Prisma/Tailwind/PostgreSQL ব্যবহার করেছি” লিখলে যথেষ্ট নয়।

প্রতিটি non-mandated technology-এর জন্য তিনটি প্রশ্নের উত্তর দিতে হবে:

1. **কী নির্বাচন করেছি?**
2. **কেন এই ride-pooling MVP-এর জন্য উপযুক্ত?**
3. **কোন পরিস্থিতিতে ভবিষ্যতে অন্য technology-তে switch করব?**

উদাহরণ:

### PostgreSQL

- বেছে নিয়েছি কারণ transaction, relation, constraint ও row locking দরকার।
- Alternative: MySQL, SQLite, MongoDB।
- SQLite local prototype-এর জন্য ভালো, কিন্তু concurrent production writes-এর জন্য PostgreSQL ভালো।
- extreme geospatial requirement এলে PostGIS যোগ করা যেতে পারে।

### Prisma

- type-safe query ও migration সুবিধা।
- Alternative: Drizzle, Sequelize, TypeORM, raw SQL।
- complex hand-optimized query বেশি হলে raw SQL বা Drizzle বিবেচনা করা যেতে পারে।

### JWT

- stateless MVP API-এর জন্য সহজ।
- Alternative: session cookie, managed auth।
- token revocation ও multi-device session গুরুত্বপূর্ণ হলে server-side session store নেওয়া যেতে পারে।

এই ধরনের reasoning interview-এ গুরুত্বপূর্ণ।

---

# ২৩. AI usage policy

AI ব্যবহার সম্পূর্ণ অনুমোদিত:

- ChatGPT
- Claude
- GitHub Copilot
- Cursor
- documentation
- Stack Overflow

কিন্তু AI usage লুকানো যাবে না।

README-তে `AI Usage` section থাকতে হবে:

## লিখতে হবে

- কোন AI tool ব্যবহার করা হয়েছে;
- কী কাজে ব্যবহার করা হয়েছে;
- একটি accepted suggestion;
- একটি rejected বা modified suggestion;
- কেন suggestion পরিবর্তন/reject করা হয়েছে।

উদাহরণ:

```text
Accepted:
AI suggested using a database transaction with row locking to
prevent pool overbooking. I adopted it after verifying the behavior
with a concurrency test.

Rejected/Changed:
AI suggested adding Redis and a queue for matching. I rejected it
because the MVP runs as one backend instance and PostgreSQL
transactions are sufficient for the required consistency.
```

মূলনীতি:

> AI code লিখলেও সেই code-এর দায় candidate-এর। Live interview-এ ব্যাখ্যা, debug এবং পরিবর্তন করতে হবে।

---

# ২৪. Git workflow

Required long-lived branches:

```text
master
pre-release
release/v1.0.0
```

Feature work করতে হবে:

```text
feature/passenger-auth
feature/tesla-pooling
feature/driver-flow
feature/fare-calculation
feature/docker-setup
```

## Expected flow

```text
feature/*
   ↓
master
   ↓
pre-release
   ↓
release/v1.0.0
```

### ধাপ

1. Feature branch তৈরি;
2. incremental logical commits;
3. কাজ ও test complete;
4. master-এ merge;
5. সব MVP feature integrate হলে `pre-release`;
6. integration fixes, docs, deployment verification;
7. সেখান থেকে `release/v1.0.0`;
8. ভিডিও/ডেমোতে সেই version দেখানো।

---

# ২৫. Commit message rules

Format:

```text
<type>(<scope>): <short description>
```

Allowed type:

```text
feat
fix
refactor
test
docs
chore
build
```

ভালো উদাহরণ:

```text
feat(auth): add passenger login endpoint
feat(pool): implement compatible route matching
feat(pool): enforce Bullet seat capacity
fix(pool): prevent concurrent overbooking
test(fare): verify Nusrat and Rafiq pooled fares
build(docker): add API and PostgreSQL services
docs(readme): document AI usage and trade-offs
```

খারাপ উদাহরণ:

```text
update
changes
fix
final
latest
working now
asdf
```

একটি giant initial commit করা যাবে না। আবার অকারণে শত শত meaningless micro-commit-ও করা উচিত নয়।

---

# ২৬. Testing requirements

PRD coverage percentage chase করতে বলেনি। Risky business behavior test করতে বলেছে।

## অবশ্যই test করা উচিত

### ১. Capacity

```text
Bullet capacity কখনো exceed করবে না।
```

### ২. Invalid transition

```text
REQUESTED → COMPLETED reject হবে।
```

### ৩. Fare calculation

```text
Nusrat ও Rafiq-এর expected pooled fare সঠিক।
```

### ৪. Authorization

```text
Nusrat, Rafiq-এর ride modify করতে পারবে না।
```

### ৫. Cancellation

```text
STARTED ride passenger cancel করতে পারবে না।
```

### ৬. Concurrency

```text
একটি seat-এর জন্য দুইটি concurrent request এলে
শুধু একটি success হবে।
```

---

## Testing levels

### Unit tests

- fare calculator
- status transition validator
- route compatibility
- cancellation policy

### Integration tests

- API + test database
- authentication
- authorization
- transaction behavior

### End-to-end tests

- passenger ride request;
- driver accept/start/complete;
- pooled ride flow।

সীমিত সময় হলে আগে unit + integration test-এ business-critical rules cover করা উচিত।

---

# ২৭. README-তে কী কী থাকতে হবে?

README নিজে বোঝা যায় এমন হতে হবে।

## Minimum sections

1. Project summary
2. Problem statement
3. Features implemented
4. Screenshots/GIFs
5. Architecture diagram
6. ERD
7. Tech stack
8. Project structure
9. Prerequisites
10. Environment variables
11. Local setup
12. Docker instructions
13. Migration instructions
14. Seed instructions
15. Frontend চালানোর নিয়ম
16. Backend চালানোর নিয়ম
17. Tests চালানোর নিয়ম
18. Demo credentials
19. API overview
20. Deployment URL
21. Key decisions
22. Trade-offs
23. Assumptions
24. Known limitations
25. Next improvements
26. AI Usage
27. Demo video link
28. Optional scaling discussion

আরেকজন engineer README দেখে project চালাতে পারা উচিত।

---

# ২৮. Deployment

শর্ত:

- paid service ব্যবহার করা যাবে না;
- free/free-tier হতে হবে;
- public deployment preferable;
- free backend hosting সম্ভব না হলে limitation document করতে হবে;
- Docker deployment reproducible হতে হবে।

সম্ভাব্য free-tier platform সময়ের সঙ্গে বদলাতে পারে। তাই submission-এর সময় availability verify করতে হবে।

Deployment না হলেও acceptable হতে পারে, যদি:

- কারণ পরিষ্কারভাবে লেখা থাকে;
- `docker compose up` নির্ভরযোগ্যভাবে কাজ করে;
- evaluator local environment-এ project চালাতে পারে।

---

# ২৯. ১ মিলিয়ন passenger scaling bonus

এটি bonus। MVP-তে এগুলো implement করা প্রয়োজন নেই; reasoning দেখাতে হবে।

Target:

```text
1M passengers
100k drivers
```

আলোচনার বিষয়:

## Load balancing

একাধিক stateless API instance-এর সামনে load balancer।

## Horizontal scaling

Traffic বাড়লে নতুন API/matching worker instance যোগ করা।

## Database indexing

Searchable columns-এ যথাযথ index।

## Read replicas

Ride history বা analytics read primary database থেকে সরানো।

## Caching

- static zones;
- pricing config;
- driver availability-এর short-lived cache।

তবে capacity-এর source of truth database-এ রাখা উচিত।

## Geospatial search

Production scale-এ:

- PostGIS;
- geohash;
- proximity query;
- spatial indexes।

## Queue/events

যেমন:

- notifications;
- analytics;
- payment reconciliation;
- non-critical event processing।

Core seat reservation synchronous transaction হওয়া ভালো।

## Real-time communication

- WebSocket;
- Server-Sent Events;
- push notification।

## Rate limiting

Login, ride request ও matching endpoint abuse প্রতিরোধ।

## Idempotency

Network retry হলে duplicate ride/payment যেন তৈরি না হয়।

## Observability

- structured logs;
- metrics;
- distributed tracing;
- alerts;
- error monitoring।

## DB contention

একই hot pool row-তে অতিরিক্ত lock contention কমাতে:

- reservation partitioning;
- smaller transaction;
- matching by zones;
- short lock duration।

## Retry/failure strategy

- bounded retries;
- exponential backoff;
- dead-letter handling;
- idempotent consumer।

## Security

- secret management;
- TLS;
- secure headers;
- access control;
- audit log;
- password hashing;
- dependency scanning;
- backup/recovery।

PRD বলছে reasoning box count-এর চেয়ে গুরুত্বপূর্ণ।

---

# ৩০. ছয় মিনিটের final video

Video সর্বোচ্চ **৬ মিনিট**।

## `0:00–1:00` — Problem understanding

বলতে হবে:

- সমস্যা কী;
- কারা user;
- pooling কীভাবে কাজ করে;
- কেন capacity ও fair fare গুরুত্বপূর্ণ।

PRD মুখস্থ পড়ে শোনানো যাবে না।

## `1:00–3:00` — Engineering

দেখাতে হবে:

- architecture;
- backend;
- frontend;
- database/ERD;
- ride lifecycle;
- একটি key decision;
- একটি trade-off।

উদাহরণ key decision:

```text
PostgreSQL transaction ব্যবহার করে capacity enforce করেছি।
```

Trade-off:

```text
MVP-তে live map routing করিনি; predefined zone compatibility ব্যবহার করেছি।
```

## `3:00–6:00` — Product demo

দেখাতে হবে:

1. Passenger login;
2. Nusrat ride request;
3. Rafiq একই pool-এ match;
4. individual fare;
5. Driver/Jashim-এর pool view;
6. arrival/start/complete;
7. একটি edge case;
8. deployment থাকলে deployed version।

সেরা edge case:

```text
শেষ seat-এর concurrent claim—একটি success, অন্যটি conflict।
```

---

# ৩১. Submission checklist

Submit করার আগে নিশ্চিত করতে হবে:

- [ ] Public/evaluator-accessible repository
- [ ] Working frontend
- [ ] Working backend
- [ ] Working database
- [ ] `docker compose up` দিয়ে চালু হয়
- [ ] `.env.example` আছে
- [ ] কোনো secret committed নয়
- [ ] Migration আছে
- [ ] Jashim/Nusrat/Rafiq seed data আছে
- [ ] Architecture diagram আছে
- [ ] ERD আছে
- [ ] `master` branch আছে
- [ ] `pre-release` branch আছে
- [ ] `release/v1.0.0` branch আছে
- [ ] Meaningful commit history আছে
- [ ] Capacity tests আছে
- [ ] Transition tests আছে
- [ ] Fare tests আছে
- [ ] Authorization tests আছে
- [ ] Cancellation tests আছে
- [ ] Concurrency test আছে
- [ ] Complete README আছে
- [ ] Demo credentials আছে
- [ ] Deployment link অথবা documented limitation আছে
- [ ] Six-minute video link আছে
- [ ] AI Usage section আছে
- [ ] Known limitations লেখা আছে

---

# ৩২. Evaluator কীভাবে score করবে?

## Product

- সমস্যা সঠিকভাবে বুঝেছে কি না;
- assumption যুক্তিসঙ্গত কি না।

## Process

- instructions অনুসরণ করেছে কি না;
- Git history বাস্তব engineering journey দেখায় কি না;
- changes trace করা যায় কি না।

## Backend/Database

- API design;
- validation;
- state machine;
- relationships;
- constraints;
- data integrity;
- concurrency safety।

## Frontend

- passenger/driver flow সঠিক;
- loading/error/empty state;
- API integration;
- maintainable components।

## Docker/Deployment

- অন্য machine-এ project চলে কি না;
- শুধু code নয়, usableভাবে ship করা হয়েছে কি না।

## Testing/Documentation

- risky behavior test হয়েছে কি না;
- অন্য engineer operate করতে পারবে কি না।

## Ownership

- নিজের সিদ্ধান্ত explain করতে পারে;
- code modify/debug করতে পারে;
- trade-off defend করতে পারে।

PRD-এর অত্যন্ত গুরুত্বপূর্ণ বক্তব্য:

> ১২০টি feature বানিয়ে process ভাঙার চেয়ে ছোট কিন্তু clean, tested এবং instruction-following MVP বেশি score করতে পারে।

---

# ৩৩. কী করা যাবে না?

- Paid infrastructure ব্যবহার করা যাবে না।
- API key/password/token commit করা যাবে না।
- `.env` repository-তে দেওয়া যাবে না।
- finished project একটি giant initial commit হিসেবে push করা যাবে না।
- সব feature সরাসরি master-এ করা যাবে না।
- diagram সুন্দর করার জন্য অপ্রয়োজনীয় technology যোগ করা যাবে না।
- core data integrity ভাঙা রেখে animation polish করা যাবে না।
- AI usage লুকানো যাবে না।
- না বোঝা AI-generated code submit করা যাবে না।
- story cast বাদ দিয়ে শুধু generic user ব্যবহার করা যাবে না।

---

# ৩৪. Assumption কীভাবে handle করতে হবে?

PRD ইচ্ছাকৃতভাবে কিছু requirement অসম্পূর্ণ রেখেছে।

সঠিক approach:

```text
Unclear requirement
→ reasonable assumption
→ README-তে document
→ consistently implement
→ interview-এ explain
```

উদাহরণ assumptions:

- pickup zone একই হলে এবং destination compatible corridor-এ হলে pooling হবে;
- departure window ৫ মিনিট;
- `STARTED` ride cancel করা যাবে না;
- এক passenger এক সময়ে একটিমাত্র active ride রাখতে পারবে;
- driver accept করার আগে pool start হবে না;
- completed fare পরিবর্তন হবে না;
- MVP-তে live GPS নয়, manual status update থাকবে।

Assumption লুকানো যাবে না।

---

# ৩৫. একটি বাস্তবসম্মত implementation plan

## Phase 1 — Foundation

- Repository initialize
- TypeScript configuration
- Frontend/backend setup
- PostgreSQL + Docker
- `.env.example`
- lint/format/test setup

## Phase 2 — Auth

- User schema
- Passenger/driver registration
- Login
- Password hashing
- JWT/session
- Role middleware

## Phase 3 — Vehicle/Driver

- Vehicle schema
- Bullet seed
- Driver availability
- Driver dashboard

## Phase 4 — Passenger request

- Area list
- Ride request form
- Fare estimation
- Ride history

## Phase 5 — Pooling

- Compatibility rule
- Pool creation
- Pool membership
- Capacity transaction
- Concurrent booking protection

## Phase 6 — Lifecycle

- Driver accept
- Arrival
- Start
- Complete
- Passenger cancellation
- Status history

## Phase 7 — UI hardening

- loading/error/empty states
- access control
- responsive design
- confirmation dialogs

## Phase 8 — Tests

- fare
- transition
- capacity
- ownership
- cancellation
- concurrency

## Phase 9 — Documentation/release

- Architecture
- ERD
- README
- screenshots
- AI usage
- known limitations
- pre-release
- release/v1.0.0
- final video

---

# ৩৬. MVP scope এবং over-engineering-এর সীমা

## MVP-তে থাকা উচিত

- authentication;
- passenger/driver roles;
- vehicle capacity;
- ride request;
- simple matching;
- pool membership;
- individual fare;
- ride lifecycle;
- cancellation;
- history;
- transaction-safe capacity;
- tests;
- Docker;
- documentation।

## MVP-তে না থাকলেও চলে

- live Google Maps routing;
- actual GPS tracking;
- real payment gateway;
- live traffic API;
- weather pricing;
- advanced machine-learning matching;
- Kubernetes;
- Kafka;
- microservices;
- production-grade distributed infrastructure।

প্রথমে correctness, তারপর enhancement।

---

# ৩৭. এই PRD-এর আসল উদ্দেশ্য

এই challenge আসলে শুধু ride-sharing app বানানোর পরীক্ষা নয়। এটি দেখতে চায় candidate সম্পূর্ণ engineering lifecycle বুঝতে পারে কি না:

```text
Understand
→ Design
→ Build
→ Commit
→ Test
→ Ship
→ Explain
→ Debug
→ Change
```

সবচেয়ে গুরুত্বপূর্ণ technical বিষয়গুলো:

1. Pool capacity কখনো exceed না করা;
2. Valid state transition enforce করা;
3. User ownership ও privacy;
4. Individual, explainable fare;
5. Concurrent request নিরাপদে handle করা;
6. Database history/audit রাখা;
7. Reproducible Docker environment;
8. Meaningful Git journey;
9. নিজের architecture defend করা;
10. AI ব্যবহার করলেও code পুরোপুরি বোঝা।

## চূড়ান্ত সারাংশ

একটি শক্তিশালী submission হবে:

> ছোট কিন্তু সম্পূর্ণ working ride-pooling system, যেখানে Nusrat ও Rafiq একই Bullet share করতে পারে, Jashim পুরো pool lifecycle পরিচালনা করতে পারে, Shirin-এর concurrent seat request data corrupt করতে পারে না, প্রত্যেক passenger নিজের fare/status দেখে, এবং পুরো system Docker, tests, Git history, README, diagrams ও video দিয়ে যাচাই করা যায়।