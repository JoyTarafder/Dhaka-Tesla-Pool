# AGENTS.md — Standing Rules for Dhaka Tesla Pool

> Read this file at the start of every session, before writing any code. Also read `Memory.md` first for full project context — this file governs *how* you work, `Memory.md` tells you *what the project currently is*.

## Tech stack (do not deviate without asking)
- Frontend: Next.js (App Router) + TypeScript, Tailwind CSS, Framer Motion
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL via Prisma
- Validation: Zod · Auth: JWT + bcrypt/argon2 · Testing: Vitest/Jest + Supertest
- Repo layout: separate `frontend/` and `backend/` folders (own `package.json`/`Dockerfile` each), root `docker-compose.yml`

## 1. Stick to scope — no extra/unrequested code
Only implement exactly what the current task asks for. No speculative features, no extra endpoints/components "while I'm in here." If something extra genuinely seems required, say so and ask before adding it.

## 2. Never commit to git without explicit permission
Never run `git commit`, `git push`, or open a PR on your own initiative. `git status`/`git diff`/staging is fine if asked. The actual commit requires the user to explicitly say so — every time, not just once.

## 3. Explain what was executed and where
After running any command, script, migration, test, or build, state clearly: what ran, in which file/folder, and the result (pass/fail/output). Never execute silently.

## 4. No hardcoded config or secrets — always `.env` via `dotenv`
Never hardcode API keys, DB URLs, ports, or JWT secrets in source. Every such value goes into `.env` (mirrored as a placeholder in `.env.example`) and is read via `process.env.X`.

## 5. Keep code clean
Follow the project's lint/prettier config, use meaningful names, keep functions small and focused, no duplicated logic, no leftover `console.log` debugging in committed code.

## 6. Always update `Memory.md` after meaningful changes
Any change to architecture, scope, tech stack, current phase, or an open decision must be reflected in `Memory.md` (§4 rules, §6 status, §7 open decisions) in the same session. Reading `Memory.md` alone must always be enough to understand and continue the project — never let it go stale.

## 7. No garbage or dead code
No commented-out old code, no unused functions/variables/imports, no leftover scaffolding files that aren't part of the delivered feature. When code is replaced, delete the old version.

## 8. Every non-trivial piece of code must be commented
Comments explain *why*, not just restate *what*. Every function gets a short purpose comment; every non-obvious business rule (capacity enforcement, fare formula, transition rules, concurrency handling) gets an inline comment explaining the reasoning.

## 9. Touching core business logic requires touching its tests too
Any change to capacity checks, fare calculation, or status transitions must come with an add/updated test in the same task — never "write the test later." These are the highest-scoring risk areas in this project.

## 10. Status transitions go through one central function only
Never set `status = 'STARTED'` (or any status) directly at a call site. All transitions go through a single `transitionStatus()`-style function that checks the allowed-transition map, so invalid transitions can't leak in from a random place in the codebase.

## 11. Ask before adding a new dependency
Every non-mandated library needs a justification in the README (what/why/when-to-switch, per PRD.md §9/§22-equivalent). Don't silently `npm install` something new — propose it and wait.

## 12. No `any` in TypeScript without an explicit, commented exception
Untyped escape hatches undermine the type safety the schema/API design is supposed to guarantee. If `any` is truly unavoidable, comment exactly why.

## 13. All seat/fare arithmetic is integer-only, never float
Fares are stored and calculated in integer poisha (see PRD.md §7). Never introduce floating-point math for money or seat counts in new code.

## 14. Never leak raw DB errors or stack traces into API responses
Every catch block returns the project's standard error shape (`{ success: false, error: { code, message } }`) — never the raw exception.

## 15. Ask before deleting files or migrations
Deleting a file, a migration, or dropping/altering a table is a destructive action — same permission bar as a git commit (Rule 2).

## 16. Security check on every change — call out issues explicitly
For any code touching auth, input handling, database queries, or user-supplied data, actively check for: SQL/NoSQL injection, missing ownership checks (a user acting on another user's data), XSS in rendered output, missing/weak input validation, secrets or tokens ending up in logs or responses, missing rate limiting on sensitive endpoints (login, ride-request, matching), and outdated/vulnerable dependencies. If anything is found — even something small, even outside the current task's scope — state it explicitly rather than staying silent or quietly fixing it without mentioning it.

## 17. Design against hacking — don't just make it work, make it hard to break
Treat every input as hostile: validate and sanitize on the backend regardless of what the frontend already checks. Never trust a client-supplied user ID, role, or price — always re-derive from the authenticated session/DB on the server. Use parameterized queries/ORM methods only (never string-concatenated SQL). Enforce authorization checks server-side for every state-changing endpoint (see Rule 10's transition function and security.md §2). Prefer denying by default over allowing by default when a permission check is ambiguous.

## 18. Keep performance in mind while writing code
Avoid N+1 database queries (batch/join instead of looping queries), add indexes for any new frequently-filtered/sorted column (see Architecture.md §7), avoid unnecessary re-renders in React (memoization only where it demonstrably matters — don't over-optimize prematurely), and keep API responses paginated/limited rather than returning unbounded lists. When a performance trade-off is made, note it briefly (e.g. in a comment or `Memory.md` §7) rather than leaving it undocumented.

## Optional good practices (encouraged, not mandatory)
- One commit = one logical change, so Git history reads as a real engineering journey.
- When a new API endpoint is added, update the endpoint list in `Architecture.md` in the same task.

## Per-task checklist
- [ ] Confirm exact scope before starting (Rule 1)
- [ ] Write with comments, no hardcoded config, no untyped `any` (Rules 4, 8, 12)
- [ ] Remove dead code, keep formatting clean, integer-only money/seat math (Rules 5, 7, 13)
- [ ] Add/update tests for any capacity/fare/transition change (Rule 9), route transitions through the central function (Rule 10)
- [ ] Report exactly what ran and what happened (Rule 3); never leak raw errors (Rule 14)
- [ ] Run a security check and explicitly flag any issues found (Rule 16); validate/authorize everything server-side (Rule 17)
- [ ] Check for obvious performance issues — N+1 queries, missing indexes, unbounded lists (Rule 18)
- [ ] Update `Memory.md` if anything project-level changed (Rule 6)
- [ ] Ask before adding a dependency or deleting a file/migration (Rules 11, 15)
- [ ] Stage if asked — do **not** commit until explicitly told (Rule 2)
