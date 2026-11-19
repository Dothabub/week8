# LifeSync – Implementation Plan & Status

Status legend: ✅ done & tested · 🟡 partial · ⬜ not started

| Phase | Scope | Status |
|---|---|---|
| 1 | New independent project (`lifesync/`, Next.js 15 + TS + Tailwind 4, own DB) | ✅ |
| 2 | Architecture, database schema (48 tables + integrity migration), core libs (money/split, permissions, tokens, validation), bootstrap CLI, tests | ✅ |
| 3 | Premium UI shell: design tokens, light/dark, collapsible sidebar + mobile bottom nav, 12 nav sections, dashboard layout, empty/loading states | ⬜ |
| 4 | Accounts: invitation acceptance, sign-in/out, sessions, lockout, guards, admin member & permission management, profile photo, security headers | ⬜ |
| 5 | Tasks (CRUD, assign, statuses, notes, reminders, recurrence, day/week/month views), timezone utilities, weekly routine input page | ⬜ |
| 6 | Jobs (enable Job 1/2), shift templates & materialisation, earnings expectation, university timetable & deadlines, placement sessions & hours, conflict detection (overlap, travel time, uni/placement clashes) | ⬜ |
| 7 | Household tasks & rotation, grocery products, stock in/out ledger, low-stock auto shopping list, expiry tracking, smart shopping list | ⬜ |
| 8 | Expenses (itemised food), splitting & balances, settlements, travel, rent & bills with contributions, earnings, budgets, financial dashboard | ⬜ |
| 9 | Planner engine (rule-based) + review/approve/edit/reject + daily To-do generation; optional Claude-assisted mode | ⬜ |
| 10 | Behaviour analysis + explained recommendations, opt-out | ⬜ |
| 11 | Notifications, reports (PDF/CSV), full test suite (unit, integration, Playwright mobile + desktop, permission tests) | ⬜ |
| 12 | Deployment config & verification (requires your hosting + DB choice/credentials) | ⬜ |

## Testing matrix (brief §28) → where it will be covered
| # | Scenario | Test location |
|---|---|---|
| 1 | Three members sign in | `tests/integration/auth.test.ts`, E2E |
| 2–3 | Personal & shared dashboards | E2E |
| 4–6 | Weekly routine input, planning, daily To-dos | `tests/unit/planner/*.test.ts`, integration |
| 7–10 | Jobs, university, placement, conflicts | `tests/unit/time/*.test.ts`, integration |
| 11–13 | Grocery list, stock counter, low-stock | integration |
| 14–18 | Bills, food expenses, travel, earnings, splitting | unit (`money.test.ts` ✅) + integration |
| 19 | Behaviour analysis uses real records | integration |
| 20 | Mobile & desktop UI | Playwright (375px, 768px, 1440px) |
| 21 | Security permissions | unit (`permissions.test.ts` ✅) + integration (cross-member access denied) |

## Open decisions for the project owner
1. Hosting target (e.g. Vercel + Neon Postgres) for Phase 12.
2. Whether to enable the optional Claude-assisted planner (needs an API key).
3. E-mail delivery for invitations/reminders (e.g. Resend/SMTP); until configured, invite links are shown to the admin to share manually and reminders are in-app.
