# LifeSync – Smart Shared Living Planner

*Three People. One Smart Plan. Better Everyday Life.*

Independent web app for a three-person household: tasks, two-job shifts, university,
placement, Pasta/Filishake activities, groceries & stock, rent/bills, expenses,
travel, earnings and an explainable weekly planner.

* Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
* Database: [`docs/DATABASE.md`](docs/DATABASE.md)
* Plan & status: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)

## Local setup
```bash
cp .env.example .env            # set DATABASE_URL and SESSION_SECRET
npm install
npm run db:migrate              # applies prisma/migrations
npm run bootstrap -- --household "Our Home" --admin-email you@example.com
npm run dev
```
The bootstrap command prints a one-time admin invitation link. No passwords are
seeded or hard-coded.

## Scripts
| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Unit + DB integration tests (uses `TEST_DATABASE_URL`, must end in `_test`) |
