# LifeSync – Architecture

> "Three People. One Smart Plan. Better Everyday Life."

LifeSync is a standalone application. It shares no code, database, authentication
or hosting configuration with any other project in this repository (the
`week8` Vite exercises at the repo root are untouched).

## 1. Technology choices

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript (strict)** | One codebase for UI and secure server code (Server Components, Server Actions, Route Handlers); first-class mobile-responsive SSR. |
| Database | **PostgreSQL 16** via **Prisma 6** | The brief needs relational integrity: money, split ledgers, stock balances, transactions, CHECK constraints and audit history. Postgres enforces these in the database, not just in the UI. |
| Auth | **Own session auth**: bcrypt password hashes, invitation-only sign-up, random 256-bit session tokens in `HttpOnly; Secure; SameSite=Lax` cookies, stored hashed (SHA-256) in `Session` | No passwords are hard-coded or seeded. The admin and members set their own passwords via one-time invitation links. Login lockout after repeated failures. |
| Validation | **Zod 4** schemas in `src/lib/validation` | Single source of truth, reused by forms (client) and Server Actions (server). |
| Styling | **Tailwind CSS 4** + design tokens (CSS variables) for light/dark | Consistent spacing/radius/typography, premium minimal look. |
| Charts | Recharts (Phase 3) | Responsive, accessible SVG charts. |
| Exports | CSV (native streaming) + PDF (`@react-pdf/renderer`, server-side) | Phase 11. |
| Planner | **Deterministic rule-based constraint scheduler** (always available) + **optional AI assist** (Claude API) when `ANTHROPIC_API_KEY` is set | Meets "no fake AI": the app is fully functional without an API key. |
| Tests | Vitest (unit + DB integration against a dedicated `*_test` database), Playwright (E2E, mobile + desktop viewports) | |

Firebase was considered (the brief allows it). PostgreSQL was chosen because shared
expense splitting, bill contributions and stock ledgers need multi-row ACID
transactions and database-level constraints; Firestore rules cannot express
"shares must sum to the total" or "stock never negative" as robustly.

## 2. Folder structure

```
lifesync/
├─ prisma/
│  ├─ schema.prisma                 # data model (48 tables)
│  └─ migrations/                   # init + integrity_constraints (CHECKs, triggers, partial indexes)
├─ scripts/bootstrap.ts             # one-time: create household + admin invitation link
├─ src/
│  ├─ app/                          # Next.js routes
│  │  ├─ (auth)/sign-in, invite/[token]
│  │  └─ (app)/dashboard, tasks, planner, work, university, placement,
│  │         household, grocery, expenses, earnings, reports, settings
│  ├─ components/                   # reusable UI (ui/ primitives, layout/, charts/)
│  ├─ lib/                          # framework-agnostic, unit-tested
│  │  ├─ db.ts                      # Prisma singleton
│  │  ├─ money.ts                   # pence arithmetic, split algorithms
│  │  ├─ permissions.ts             # role + per-member permission resolution
│  │  ├─ tokens.ts                  # token generation/hashing
│  │  ├─ time/                      # timezone-aware intervals, overlap detection (Phase 5–6)
│  │  └─ validation/                # Zod schemas
│  ├─ server/                       # server-only services (DB access, authorisation)
│  │  ├─ auth/                      # sessions, invitations, guards (Phase 4)
│  │  ├─ services/<module>.ts       # tasks, shifts, stock, expenses, bills, earnings …
│  │  ├─ planner/                   # rule engine, AI adapter, explainers (Phase 9)
│  │  └─ analytics/                 # behaviour aggregates & recommendations (Phase 10)
│  └─ styles/
└─ tests/ unit/ integration/ e2e/
```

## 3. Request flow & security model

```
Browser ──► Next.js Server Action / Route Handler
              │ 1. requireSession()        – cookie → SHA-256 → Session row, not expired
              │ 2. requireMembership()     – user ↔ household, active
              │ 3. requirePermission(p)    – role defaults + admin overrides
              │ 4. zod.parse(input)        – centralised validation
              │ 5. service(tx)             – every query filtered by householdId
              │                              (+ userId for personal data)
              │ 6. auditLog.create(tx)     – same transaction
              ▼
           PostgreSQL (CHECK constraints, FKs, unique/partial indexes, immutable audit)
```

* **No client-side DB access.** The browser never holds DB credentials; all reads
  and writes go through server code that enforces the guards above.
* **Privacy tiers**
  * *Personal*: earnings, personal expenses, personal travel, schedules → owner only.
    Combined household earnings include a member only if they enable
    `shareEarningsWithHousehold`.
  * *Shared*: household tasks, shared expenses/bills, grocery stock, shopping lists → all 3 members.
  * Admin manages household finances and members but does **not** gain access to
    another member's personal earnings.
* **Three-member limit** enforced by `Membership.seat ∈ {1,2,3}` + `UNIQUE(householdId, seat)` and `User.membership` being 1:1.
* **Sensitive data is never only in localStorage**; localStorage is used only for UI
  preferences (sidebar collapsed, theme fallback).
* CSRF: Server Actions use Next.js origin checks; Route Handlers that mutate require same-origin + session.
* Rate-limited sign-in and lockout (`User.failedLoginCount`, `lockedUntil`).
* Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy) in `next.config.ts` (Phase 4).

## 4. Time model

* All instants stored as `timestamptz` (UTC). Household timezone (default `Europe/London`)
  converts wall-clock templates (`isoWeekday` + `"HH:MM"`) into concrete instants,
  correctly across BST/GMT changes.
* Recurring templates (shifts, uni sessions, placement sessions, commitments, task
  recurrences) are **materialised** into concrete rows per week. `UNIQUE(templateId, startAt)`
  makes materialisation idempotent, so re-running a week never duplicates, and
  edits during the week change single occurrences without regenerating everything.

## 5. Smart weekly planner (core feature)

Pipeline (pure functions in `src/server/planner`, fully unit-testable):

1. **Collect** for the target week and each member: materialised FIXED items
   (shifts, uni sessions, placement sessions, fixed commitments), FLEXIBLE items
   (open tasks, deadlines, household chores, Pasta/Filishake activities, shopping
   need from low stock), and preferences (day window, load caps, rest, travel).
2. **Validate fixed items** – detect overlaps between fixed commitments
   (e.g. shift vs. lecture) and insufficient travel time between consecutive
   locations. These are **reported, never silently moved**.
3. **Build free-time map** – per member per day: day window minus fixed items,
   minus travel buffers before/after located commitments, minus minimum rest gaps.
4. **Score & order flexible work** – by deadline urgency, priority, estimated
   duration (learned: median actual/estimated ratio per category), and postponement
   history (tasks frequently postponed are placed earlier / split / flagged).
5. **Place** greedily into free slots with constraints: no overlaps (hard),
   daily load cap (hard), learned preferred times (soft, from `PlanDecision`
   history and completion times), even distribution across days (soft),
   household chores balanced across the three members by recent load.
6. **Add** study blocks (free gaps ≥ `studyBlockMinutes` on uni weeks),
   rest blocks, and a recommended shopping day (preferred days ∩ free time ∩
   historical shopping weekday, triggered by low stock).
7. **Explain** – every item gets `reason`, `confidence`, and `needsConfirmation`
   (true when based on inferred data, e.g. learned durations with < 3 samples).
   Anything that cannot fit is listed in `diagnostics.unscheduled` with the reason.
8. **Review** – users approve / edit / reject each item (`PlanDecision`).
   Approving converts accepted items into `Task` rows → daily To-do lists.

The engine **never invents schedules**: if a member has not entered a week's
schedule, the plan says so and asks rather than assuming last week's.

**AI-assisted mode** (optional): the rule engine's feasible plan + aggregates
(no names/e-mails/financial details) are sent to Claude for re-ordering
suggestions and natural-language explanations. Every AI suggestion is re-validated
by the rule engine's hard constraints before being shown; invalid ones are dropped.

## 6. Behaviour analysis

Computed from real rows only (`TaskEvent`, `Shift`, `UniSession.attendance`,
`PlacementSession`, `StockTransaction`, `Expense`, `PlanDecision`, `BehaviourEvent`).
Each `Recommendation` stores `evidence` (exact aggregates + sample size) and a
plain-language `explanation`. Minimum sample thresholds prevent unsupported
suggestions. Members can disable analysis (`behaviourAnalysisEnabled`), which stops
event capture and excludes their data from household-level aggregates.

## 7. Finance model

Separate measurements, never mixed:
* **Earnings** (income, `Earning`) – expected vs. received.
* **Spending** (`Expense` + `ExpenseItem` lines) – by category.
* **Obligations** (`Bill` + `BillShare`) vs. **payments** (`BillContribution`).
* **Shared balance** – per member: Σ paid for others − Σ owed to others − settlements.
* **Budget remaining** – `Budget` − spending for the month.

All money arithmetic uses integer pence (`src/lib/money.ts`); splits always sum
exactly to the total (deterministic remainder distribution).

## 8. Deployment

* App: any Node 20+ host (Vercel, Render, Fly.io, a VPS with Docker).
* DB: managed PostgreSQL (Neon, Supabase, RDS, Render).
* Steps: set `DATABASE_URL`, `SESSION_SECRET`, `APP_URL`; `npm run db:migrate`;
  `npm run bootstrap -- --household "…" --admin-email …`; admin opens the link,
  sets a password, invites the other two members.
* Scheduled reminders: a cron hitting `/api/cron/notifications` (secret-protected)
  every 5 minutes to materialise due notifications.
