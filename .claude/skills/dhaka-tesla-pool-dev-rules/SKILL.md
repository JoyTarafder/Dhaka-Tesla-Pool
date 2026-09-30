---
name: dhaka-tesla-pool-dev-rules
description: Use this skill whenever writing, editing, reviewing, testing, or committing code for the Dhaka Tesla Pool project (or any session working inside this repo). It enforces scope discipline, git-commit permission, execution transparency, env-based config, clean/comment-complete code, mandatory Memory.md syncing, test-with-logic-changes, centralized status transitions, dependency approval, strict typing, integer-only money math, safe error responses, destructive-action permission, explicit security-issue reporting, hardening against exploitation, and performance awareness. Trigger on any coding, refactoring, testing, git, dependency, security, performance, or "what did you just do" request in this repo.
---

# Dhaka Tesla Pool — Development Rules Skill

This skill is the standing contract for **any AI agent** (Claude, Antigravity, Cursor, Copilot, etc.) working on this codebase. Read it before writing a single line of code, and follow it for the rest of the session.

## The 8 rules

### 1. Stick to scope — no extra/unrequested code
Only implement exactly what was asked for in the current task. Do not add "nice to have" features, extra endpoints, extra components, or speculative abstractions that weren't requested. If something extra seems genuinely necessary (e.g. a missing type, a required helper), say so explicitly and ask before adding it — don't just add it silently.

### 2. Never commit to git without explicit permission
Never run `git commit`, `git push`, or open a PR on your own initiative. You may run `git status` / `git diff` / stage files if asked, but the actual commit action requires the user to explicitly say "commit this" (or equivalent) first, every time — a prior commit is not standing permission for the next one.

### 3. Explain what was executed and where
After running any command, script, migration, test, or build step, state plainly: what was run, in which file/folder, and what the result was (pass/fail, output summary). Don't silently execute things — the user should never have to ask "what did you just do?"

### 4. No hardcoded config/secrets — always use `.env` via `dotenv`
Never hardcode API keys, DB URLs, ports, JWT secrets, or any environment-specific value directly in source code. Every such value goes into `.env` (with a placeholder mirrored in `.env.example`) and is read via `process.env.X` / `dotenv`. If a value looks like it should be configurable, treat it as configurable — don't assume "just this once."

### 5. Keep code clean
Consistent formatting (follow the project's lint/prettier config), meaningful variable/function names, small focused functions, no duplicated logic, no leftover `console.log` debugging statements in committed code, and imports kept minimal/used.

### 6. Always update `Memory.md` after meaningful changes
After any change that affects architecture, scope, tech stack, current phase, or an open decision, update `Memory.md` (§4 rules, §6 status, §7 open decisions) so the file alone always reflects the true current state of the project. The whole point of `Memory.md` is that reading it once should be enough to understand and continue the project — never let it go stale.

### 7. No garbage/dead code
No commented-out old code left in place, no unused functions/variables/imports, no leftover scaffolding or placeholder files that aren't part of the actual delivered feature. If code is replaced, delete the old version — don't leave it "just in case."

### 8. Every non-trivial piece of code must be commented
Comments should explain *why*, not just restate *what* (the code already shows what). Every function needs a short purpose comment; any non-obvious business rule (e.g. capacity enforcement, fare formula, transition rules) needs an inline comment explaining the reasoning, so another developer — or the evaluator — can follow it without asking you.

### 9. Touching core business logic requires touching its tests too
Any change to capacity checks, fare calculation, or status transitions must come with an add/updated test in the same task — never "write the test later." Capacity, fare, and transition correctness are the highest-scoring risk areas for this project.

### 10. Status transitions go through one central function only
Never set a status directly at a call site (e.g. `status = 'STARTED'`). All transitions must go through a single `transitionStatus()`-style function that checks the allowed-transition map, so an invalid transition can never leak in from a random place in the codebase.

### 11. Ask before adding a new dependency
Every non-mandated library needs a "what/why/when-to-switch" justification in the README. Don't silently `npm install` something new mid-task — propose it and wait for confirmation.

### 12. No `any` in TypeScript without an explicit, commented exception
Untyped escape hatches undermine the type safety the schema/API design is meant to guarantee. If `any` is truly unavoidable, comment exactly why.

### 13. All seat/fare arithmetic is integer-only, never float
Fares are stored and calculated in integer poisha. Never introduce floating-point math for money or seat counts anywhere in the codebase.

### 14. Never leak raw DB errors or stack traces into API responses
Every catch block returns the project's standard error shape (`{ success: false, error: { code, message } }`) — never the raw exception or stack trace.

### 15. Ask before deleting files or migrations
Deleting a file, a migration, or dropping/altering a table is destructive — it requires the same explicit-permission bar as a git commit (Rule 2).

### 16. Security check on every change — call out issues explicitly
For any code touching auth, input handling, database queries, or user-supplied data, actively check for: SQL/NoSQL injection, missing ownership checks, XSS in rendered output, weak/missing input validation, secrets or tokens ending up in logs or responses, missing rate limiting on sensitive endpoints, and outdated/vulnerable dependencies. If anything is found — even minor, even outside the current task's scope — state it explicitly rather than silently fixing it or staying quiet.

### 17. Design against hacking — don't just make it work, make it hard to break
Treat every input as hostile: validate and sanitize server-side regardless of frontend checks. Never trust a client-supplied user ID, role, or price — re-derive it from the authenticated session/DB. Use parameterized queries/ORM methods only, never string-concatenated SQL. Enforce authorization for every state-changing endpoint server-side (see Rule 10, security.md §2). When a permission check is ambiguous, deny by default.

### 18. Keep performance in mind while writing code
Avoid N+1 database queries (batch/join instead of looping), add indexes for new frequently-filtered/sorted columns (see Architecture.md §7), avoid unnecessary React re-renders (memoize only where it demonstrably matters), and keep API responses paginated/limited rather than unbounded. Note any deliberate performance trade-off briefly (comment or `Memory.md` §7) instead of leaving it undocumented.

## Optional good practices (encouraged, not mandatory)
- One commit = one logical change, so Git history reads as a real engineering journey rather than a dump.
- When a new API endpoint is added, update the endpoint list in `Architecture.md` in the same task.

## How this plays out in practice (checklist for every task)
- [ ] Confirm the exact scope of the current ask before starting (Rule 1)
- [ ] Write/edit code with comments as you go (Rule 8), no hardcoded config (Rule 4), no untyped `any` (Rule 12)
- [ ] Remove anything dead/unused before finishing (Rule 7), keep formatting clean (Rule 5), integer-only money/seat math (Rule 13)
- [ ] Add/update tests for any capacity/fare/transition change (Rule 9); route status changes through the central transition function (Rule 10)
- [ ] Run tests/build/migration as needed and report exactly what ran and what happened (Rule 3); never leak raw errors to the client (Rule 14)
- [ ] Run a security check and explicitly flag any issues found (Rule 16); validate/authorize everything server-side, deny by default when ambiguous (Rule 17)
- [ ] Check for obvious performance issues — N+1 queries, missing indexes, unbounded lists, unnecessary re-renders (Rule 18)
- [ ] Update `Memory.md` if anything changed at the project level (Rule 6)
- [ ] Ask before adding a dependency or deleting a file/migration (Rules 11, 15)
- [ ] Stage changes if asked, but **do not commit** until the user explicitly says to (Rule 2)