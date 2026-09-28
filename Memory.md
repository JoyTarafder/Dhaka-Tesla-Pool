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
**Phase:** Phase 9 (Documentation & Release Readiness) complete — Comprehensive production README.md created fulfilling all 28 checklist items from PRD.md §22 (Architecture diagram, ERD, tech stack justifications, step-by-step Docker & local run instructions, AI disclosure & prompts, 6-minute video presentation script/breakdown, 1M users scaling plan). Test suite at 75/75 passing tests. Frontend compilation clean with 0 TypeScript errors. Ready for final review, demo video recording, and git branching.
**Last updated:** 2026-09-28 (Phase 9 Documentation & Master Audit Complete)

## 7. Open decisions / not yet finalized
- Final Git branch cut-over (`master`, `pre-release`, `release/v1.0.0`) pending explicit user go-ahead (Rule 2).
- Final 6-minute video recording to be recorded by the user following the script in README.md.

## 8. Update instructions for future sessions
When a decision changes, a phase completes, or scope shifts:
1. Update the relevant detail file (PRD/Design/Architecture/security/Phase.md) first.
2. Then update §4 (rules), §6 (status), and §7 (open decisions) in **this file** to match.
3. Bump the "Last updated" date in §6.
Do not let this file drift out of sync with the detail docs — it exists so nothing needs to be re-read from scratch.
