# Memory.md — Project Context (read this file first, always kept current)

> **Purpose:** This is the single entry-point file for any AI assistant (Antigravity, Claude, Copilot, etc.) working on this repo. Read this once to get full project context instead of re-reading every doc every session. **This file must be updated whenever a meaningful decision, phase change, or scope change happens** — treat it as living project memory, not a one-time snapshot.

---

## 1. What this project is
**Dhaka Tesla Pool** — a ride-pooling MVP coding challenge/assessment for Dhaka. "Tesla" = in-story nickname for **Bullet**, a 3-seat battery-powered vehicle, not the car brand. Multiple passengers with nearby pickups and compatible destinations share one vehicle; capacity must never be exceeded; each passenger has an individually calculated fare.

Full requirements: see **PRD.md**.

## 2. Story cast (use in code, seed data, tests — never generic `user1`)
- **Jashim** — driver
- **Bullet** — Jashim's 3-seat vehicle
- **Nusrat** — passenger, Banani → Mohakhali
- **Rafiq** — passenger, Banani → Gulshan 1
- **Shirin** — passenger who triggers the last-seat concurrency scenario

## 3. Confirmed tech stack
| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Auth | JWT + bcrypt/argon2 |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Testing | Vitest/Jest + Supertest |
| Containers | Docker Compose |

Full rationale and alternatives: see **Architecture.md** §2.

## 4. Core technical rules that must never be violated
1. `sum(active booked seats) <= vehicle.capacity` — enforced at the **database transaction level**, not just in the UI (see Architecture.md §8 — row lock or atomic conditional update).
2. Ride status transitions follow an explicit allowed-transition map (`REQUESTED → MATCHED → ACCEPTED → DRIVER_ARRIVED → STARTED → COMPLETED`, plus `CANCELLED`) — see PRD.md §5.
3. A passenger can only ever see/modify **their own** request, fare, and status — enforced server-side (see security.md §2).
4. Money is stored as **integer poisha**, never float (see PRD.md §7).
5. `STARTED` rides cannot be cancelled by the passenger.
6. **Frontend and backend live in separate top-level folders** (`frontend/`, `backend/`), each with its own `package.json`/`Dockerfile` — not a single combined app. See Architecture.md §3.
7. Full 18-rule dev-agent contract (scope discipline, no commit without permission, execution transparency, `.env`-only config, clean code, Memory.md syncing, no dead code, mandatory comments, test-with-logic-changes, centralized status transitions, dependency approval, no untyped `any`, integer-only money math, safe error responses, destructive-action permission, explicit security-issue reporting, hardening against hacking, performance awareness) lives in **AGENTS.md** / **SKILL.md** — read those before writing any code.

## 5. Document map
- **PRD.md** — full product requirements, actors, lifecycle, fare model, scope boundaries
- **Design.md** — visual direction, screens, required UI states, Framer Motion patterns
- **Architecture.md** — system diagram, stack, module structure, API endpoints, DB schema, ERD, concurrency solution
- **security.md** — auth, RBAC, validation, concurrency-as-security, secrets, test checklist
- **Phase.md** — 9-phase implementation plan with checkboxes and current status
- **SKILL.md** — same dev rules, in Claude Skill format (for Claude Code: `.claude/skills/dhaka-tesla-pool-dev-rules/SKILL.md`)
- **AGENTS.md** — same dev rules, in the cross-tool format Antigravity (v1.20.3+), Cursor, and Claude Code all read directly from the repo root — this is the one to use for Antigravity

## 6. Current status
**Phase:** Phase 8 (Tests) complete — Comprehensive test coverage (75/75 passing vitest tests across 8 suites) verifying: (1) exact integer poisha arithmetic and reference fares; (2) central state machine transition rules; (3) database-level capacity enforcement (<= 3 seats); (4) cross-user ownership and RBAC security checks; (5) cancellation locking on STARTED rides with atomic seat rollback and double-cancellation protection; (6) last-seat concurrency race condition prevention (the Shirin scenario). Interactive Payment Selection modal (`PaymentModal.tsx` for Online/Cash) integrated. Fixed screen & button click blink/flicker, completed end-to-end mobile responsive overhaul, added "Back to Home" navigation on auth screens, password visibility show/hide toggles, styled Sign Out buttons in red with responsive `LogOut` icon layout for mobile, and eliminated page scrollbar on auth login/registration with compact viewport-fitting UI. Added Driver Payment History page with live telemetry and completed pool breakdowns. **Fare Decimal Rounding & Fare Estimate UI Overhaul:** Implemented whole-number rounding rule (<= .50 rounds down, >= .51 rounds up; final payable amount is always an integer whole Taka amount with no decimal, e.g. 62.40 -> ৳62), updated all fare engine suites, eliminated vertical gap/void in Fare Estimate card with a balanced route distance chip, clean dividers, and a prominent emerald-accented Individual Payable Total callout container. Ready for Phase 9 (Documentation & Release Deliverables).
**Last updated:** 2026-09-28 (Whole-Number Fare Rounding & Fare Estimate UI Overhaul)

## 7. Open decisions / not yet finalized
- Exact deployment target (free-tier host) — not yet chosen
- Final Git branch cut-over dates for `pre-release` / `release/v1.0.0`

## 8. Update instructions for future sessions
When a decision changes, a phase completes, or scope shifts:
1. Update the relevant detail file (PRD/Design/Architecture/security/Phase.md) first.
2. Then update §4 (rules), §6 (status), and §7 (open decisions) in **this file** to match.
3. Bump the "Last updated" date in §6.
Do not let this file drift out of sync with the detail docs — it exists so nothing needs to be re-read from scratch.
