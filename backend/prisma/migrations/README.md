# Database migrations

The database was originally created with `prisma db push`, so Prisma had no
migration history and no `_prisma_migrations` table. That is now fixed: this
directory holds a baseline plus the changes made since.

| Migration | What it does |
| --- | --- |
| `0_init_baseline` | Snapshot of the schema `db push` produced. **Already applied — never run it.** |
| `1_money_integrity` | Ledger, idempotency keys, webhook dedup, reconciliation runs, `Decimal(12,2)` → `(18,2)`, status/amount `CHECK` constraints, append-only trigger, encrypted account-number columns. |

## First deploy against the existing database

The baseline must be recorded as applied *without* being executed. Running it
would try to create every table and fail on the first one.

```bash
npm run db:baseline     # prisma migrate resolve --applied 0_init_baseline
npm run db:migrate:deploy
npm run db:migrate:status
```

`db:migrate:deploy` takes an `ACCESS EXCLUSIVE` lock while it alters the money
columns from `Decimal(12,2)` to `(18,2)`. On a large `users` or `tips` table
that is a brief write pause, so run it when writes can wait.

If `1_money_integrity` fails on `VALIDATE CONSTRAINT`, that means a row already
holds a bad status or a negative amount. The error names the constraint. Fix
the data rather than dropping the constraint.

## After deploying, once

```bash
npm run db:backfill:accounts          # dry run
npm run db:backfill:accounts -- --apply
```

Encrypts withdrawal account numbers that predate `account_number_encrypted` and
clears the plaintext column. Needs `ENCRYPTION_KEY` in the environment. Safe to
re-run; already-encrypted rows are skipped.

## Tests

`src/__tests__/setup.ts` refuses to run when `.env.test` and `.env` share a
`DATABASE_URL`, because the suite truncates tables. Point `.env.test` at a
throwaway Neon branch whose name contains `test` — `cleanupTestData` checks the
database name before truncating.

## Things Prisma does not know about

The hand-written tail of `1_money_integrity/migration.sql` is not covered by
`prisma migrate`'s drift detection:

- the `CHECK` constraints and which statuses they allow,
- the `ledger_entries_append_only` trigger,
- the deliberately absent `users.total_amount >= 0` check.

Changing any of those means editing the migration file by hand.
