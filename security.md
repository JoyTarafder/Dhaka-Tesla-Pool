# Dhaka Tesla Pool — security.md

## 1. Authentication
Flow:
1. User signs up
2. Password hashed (bcrypt or Argon2) before storage
3. Login issues an access token (JWT)
4. Protected endpoints require a bearer token
5. Backend verifies the token on every protected request

Rules:
- Never log a plaintext password
- Never return `password_hash` in any API response
- Hash with bcrypt/Argon2 — never roll your own hashing or store plaintext

## 2. Authorization / RBAC
Authentication = who you are. Authorization = what you're allowed to do.

### Passenger — allowed
- Create their own ride request
- View their own request
- Cancel their own request while in a valid state

### Passenger — forbidden
- Update another passenger's request
- Mark driver arrival
- View another passenger's fare/status

### Driver — allowed
- Toggle their own vehicle online/offline
- View their own assigned pool
- Accept/start/complete their own pool

### Driver — forbidden
- Update another driver's pool
- Modify an arbitrary passenger's request

### Required security test
```
Nusrat's token used to cancel Rafiq's ride → 403 Forbidden
```
Hiding a button on the frontend is **not** security. Every ownership check must be enforced on the backend.

## 3. Input validation & error handling
Reject requests when:
- pickup or destination is missing
- pickup equals destination
- seat count is 0 or negative
- requested seats exceed vehicle capacity
- an enum value is invalid
- the user is unauthorized for the action
- the requested status transition is invalid
- the pool has already started
- there is insufficient capacity

Standard error shape:
```json
{
  "success": false,
  "error": {
    "code": "POOL_CAPACITY_EXCEEDED",
    "message": "Requested seats exceed the pool's available capacity."
  }
}
```

HTTP status usage:

| Situation | Status |
|---|---:|
| Successful create | 201 |
| Successful read/update | 200 |
| Invalid input | 400 |
| Login required | 401 |
| No permission | 403 |
| Record not found | 404 |
| Duplicate/conflict | 409 |
| Unexpected error | 500 |

Never expose raw database errors to the client.

## 4. Concurrency safety (also a security property)
Overbooking a vehicle is a data-integrity failure with real-world safety implications (a 3-seat vehicle physically cannot carry 4 people). Enforce capacity at the database layer using a transaction with `SELECT ... FOR UPDATE`, or an atomic conditional `UPDATE ... WHERE occupied_seats + n <= total_capacity`. See Architecture.md §8 for the full pattern. Membership insert and seat-count update must always happen in the same transaction.

## 5. Cancellation integrity
| Current status | Passenger can cancel? |
|---|---|
| REQUESTED | Yes |
| MATCHED | Yes |
| ACCEPTED | Yes |
| DRIVER_ARRIVED | Yes (optionally with a note) |
| STARTED | No |
| COMPLETED | No |
| CANCELLED | No (already terminal) |

Cancellation must, within one transaction: set request status to `CANCELLED`, mark membership inactive, release reserved seats, update pool occupied count, and write a history record. Double-cancellation must not double-decrement seats — the operation must be idempotent/conflict-safe.

## 6. Secrets & environment
- No API keys, passwords, or tokens committed to the repo
- `.env` never committed; `.env.example` ships with placeholder values only
- `JWT_SECRET` must be a local placeholder in `.env.example`, replaced per-deployment
- No paid infrastructure required or assumed

## 7. Additional hardening (mention in README even if only partially implemented)
- **Rate limiting** on login, ride-request, and matching endpoints to prevent abuse
- **Idempotency keys** so network retries don't create duplicate rides/payments
- **Audit logging** via `ride_status_history` — who changed what, when, from/to which status, and why
- **Observability** — structured logs, basic metrics, error monitoring
- **TLS** in any real deployment; secure headers on the API
- **Dependency scanning** and routine `npm audit`
- **Backup/recovery** plan documented even if not implemented for the MVP

## 8. Security test checklist
- [ ] Cross-user ownership violation returns 403 (not 200/404-that-leaks-existence)
- [ ] Invalid state transitions are rejected (e.g. `REQUESTED → COMPLETED`)
- [ ] Password never appears in any response payload or log
- [ ] Capacity cannot be exceeded under concurrent requests
- [ ] Cancelling an already-cancelled ride is a no-op, not a double seat-release
- [ ] JWT expiry/invalid-token cases return 401
- [ ] Driver cannot act on another driver's pool
