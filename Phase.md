# Dhaka Tesla Pool — Phase.md (Implementation Plan)

Git branch flow: `feature/*` → `master` → `pre-release` → `release/v1.0.0`.
Commit format: `<type>(<scope>): <short description>` — types: `feat, fix, refactor, test, docs, chore, build`.

## Phase 1 — Foundation
- [x] Repository initialize
- [x] TypeScript configuration
- [x] Frontend/backend project setup
- [x] PostgreSQL + Docker
- [x] `.env.example`
- [x] Lint/format/test tooling

## Phase 2 — Auth
- [x] User schema
- [x] Passenger/driver registration
- [x] Login
- [x] Password hashing (bcrypt/Argon2)
- [x] JWT/session issuing
- [x] Role middleware

## Phase 3 — Vehicle / Driver
- [x] Vehicle schema
- [x] Bullet seed data
- [x] Driver online/offline availability
- [x] Driver dashboard (basic)

## Phase 4 — Passenger request
- [x] Zone/area list
- [x] Ride request form
- [x] Fare estimation endpoint + UI
- [x] Ride history view

## Phase 5 — Pooling
- [x] Compatibility/matching rule
- [x] Pool creation
- [x] Pool membership
- [x] Capacity-safe transaction (row lock or atomic update)
- [x] Concurrent-booking protection test

## Phase 6 — Lifecycle
- [x] Driver accept
- [x] Arrival
- [x] Start
- [x] Complete
- [x] Passenger cancellation
- [x] Status history writes

## Phase 7 — UI hardening
- [x] Loading / error / empty states on every screen
- [x] Frontend access control (hide + backend-enforced)
- [x] Responsive layout
- [x] Confirmation dialogs (cancel, etc.)
- [x] Framer Motion pass (see Design.md) — stepper, seat indicator, conflict toast, fare reveal

## Phase 8 — Tests
- [x] Fare calculation
- [x] Status transition validity
- [x] Capacity enforcement
- [x] Ownership/authorization
- [x] Cancellation rules
- [x] Concurrency (last-seat race)

## Phase 9 — Documentation / release
- [x] Architecture diagram
- [x] ERD
- [x] README (all sections — see checklist in PRD.md §12 / §22)
- [x] Screenshots/GIFs placeholder & guide
- [x] AI Usage section
- [x] Known limitations
- [x] Merge to `pre-release` (created & pushed)
- [x] Tag `release/v1.0.0` (created & pushed tag `v1.0.0` + branch `release/v1.0.0`)
- [ ] Record 6-minute final video (user deliverable)

## Video structure reminder (max 6 minutes)
- `0:00–1:00` — Problem understanding (not a PRD read-aloud)
- `1:00–3:00` — Engineering: architecture, backend, frontend, ERD, lifecycle, one key decision, one trade-off
- `3:00–6:00` — Demo: passenger login → Nusrat request → Rafiq matched → individual fares → Jashim's pool view → arrive/start/complete → one edge case (concurrent last-seat claim) → deployed version if available

## Current status
_(update this line as work progresses)_
**Status:** Phase 9 (Documentation & Release Readiness) complete — Comprehensive README.md with ERD, Architecture, AI disclosure, and video breakdown created. Codebase 100% verified. Ready for video demo and final git cut-over.


