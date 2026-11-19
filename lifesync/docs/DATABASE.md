# LifeSync – Database Schema

PostgreSQL 16, managed by Prisma migrations. Source of truth: `prisma/schema.prisma`
plus `prisma/migrations/*_integrity_constraints/migration.sql` (rules Prisma cannot express).

Verified state (local): **48 tables, 42 CHECK constraints, 2 partial unique indexes, 1 trigger.**

## Conventions
* `id`: cuid strings. Every household-owned row has `householdId` for scoping.
* Money `numeric(12,2)`; quantities `numeric(12,3)`; instants `timestamptz`; calendar dates `date`.
* Recurring templates: `isoWeekday` (1 = Mon … 7 = Sun) + `"HH:MM"` strings, interpreted in `Household.timezone`.

## Data domains (brief §26 mapping)

| Brief requirement | Tables |
|---|---|
| Users / Profiles | `User`, `Membership`, `UserPreference`, `Invitation`, `Session` |
| Work schedules (Job 1 / Job 2) | `Job` (unique per user+slot, `enabled` flag), `ShiftTemplate`, `Shift` |
| University schedules | `UniModule`, `UniSessionTemplate`, `UniSession` (attendance), `UniDeadline` (assignments/exams) |
| Placement schedules | `Placement`, `PlacementSessionTemplate`, `PlacementSession` (attendance, hours), `PlacementDeadline` |
| Personal commitments | `Commitment` (FIXED/FLEXIBLE; one-off or weekly) |
| Pasta / Filishake | `ActivityCategory` (system keys `PASTA`, `FILISHAKE`, user-defined `description`), `Activity` |
| Tasks | `Task`, `TaskRecurrence`, `TaskNote`, `TaskEvent` (status history) |
| Weekly plans | `WeeklyPlan` (versioned, input snapshot, diagnostics), `WeeklyPlanItem`, `PlanDecision` |
| Grocery products | `GroceryProduct` (current/min/preferred stock, unit) |
| Stock transactions | `StockTransaction` (append-only ledger with `balanceAfter`) |
| Shopping | `ShoppingList`, `ShoppingListItem` (source: manual / low-stock / forecast) |
| Food & other expenses | `Expense`, `ExpenseItem` (per-product lines) |
| Shared contributions | `ExpenseShare` (who benefited, amount owed), `Settlement` (repayments) |
| Travel | `Expense` (category `TRAVEL`) + `TravelDetail` (transport, from, to, purpose) |
| Rent & bills | `RecurringBill` (split config), `Bill`, `BillShare` (responsibility), `BillContribution` (payments) |
| Earnings | `Earning` (source, expected vs actual payment) |
| Budgets | `Budget` (per month, optional category) |
| Notifications | `Notification` (dedupe key), `NotificationPreference` |
| Behaviour history | `BehaviourEvent`, `Recommendation` (evidence + explanation) |
| Audit history | `AuditLog` (append-only via trigger) |

## Database-enforced integrity
* Household has at most 3 members: `Membership.seat BETWEEN 1 AND 3` + `UNIQUE(householdId, seat)`; one household per user (`Membership.userId` unique).
* E-mails lower-case; currency ISO-4217.
* Templates: valid `HH:MM`, weekday 1–7; uni/placement end > start; shifts may be overnight but never zero-length.
* All concrete intervals (`Shift`, `UniSession`, `PlacementSession`, `WeeklyPlanItem`, `Activity`, `Commitment`) have `endAt > startAt`.
* Stock never negative; transaction sign matches type (`STOCK_IN` > 0; `STOCK_OUT`/`WASTE`/`EXPIRED` < 0).
* Money never negative; contributions/settlements strictly positive; no self-settlement.
* `Task.status = COMPLETED` ⇒ `completedAt` set; `Earning.status = RECEIVED` ⇒ `actualPaymentDate` set.
* One live (DRAFT/APPROVED) `WeeklyPlan` per household-week (partial unique index); regenerating supersedes the old draft in the same transaction.
* One pending invitation per e-mail.
* `AuditLog` rows immutable (only the FK `SET NULL` of a deleted actor is allowed).
* Idempotent recurrence materialisation: `UNIQUE(templateId, startAt)` on `Shift`, `UniSession`, `PlacementSession`; `UNIQUE(recurringBillId, periodMonth)` on `Bill`.

## Service-layer invariants (enforced inside a DB transaction)
* `Σ ExpenseShare.amount = Expense.totalAmount` for shared expenses; `Σ ExpenseItem.lineTotal = totalAmount` when itemised.
* `GroceryProduct.currentStock` updated in the same transaction as the `StockTransaction` insert (row lock via `SELECT … FOR UPDATE`).
* After a stock decrease, if `currentStock < minimumStock` the product is added to the open shopping list (source `LOW_STOCK`) — never duplicated.
* Purchases add stock only when the user records them as stock-in; consumption is only what users log as stock-out (no assumptions).
* `Bill.status` recalculated from `BillContribution` totals.

## Key indexes
Time-range lookups per person (`Shift(userId,startAt)`, `UniSession(moduleId,startAt)`,
`Task(assigneeId,status,date)`), household reporting (`Expense(householdId,category,occurredAt)`,
`Earning(householdId,earnedDate)`), stock history (`StockTransaction(productId,occurredAt)`),
notifications inbox (`Notification(userId,readAt,scheduledFor)`), behaviour (`BehaviourEvent(userId,type,occurredAt)`).
