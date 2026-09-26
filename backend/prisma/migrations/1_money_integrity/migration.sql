-- CreateEnum
CREATE TYPE "LedgerAccount" AS ENUM ('USER_AVAILABLE', 'WITHDRAWAL_PENDING', 'MONNIFY_RECEIVABLE', 'MONNIFY_PAYABLE', 'PLATFORM_FEE_REVENUE', 'WITHDRAWAL_FEE_REVENUE', 'TAX_PAYABLE');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "tips" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "platform_fee" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "processing_fee" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "net_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "total_charged" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "withdrawals" ADD COLUMN     "account_number_encrypted" TEXT,
ADD COLUMN     "account_number_hash" TEXT,
ADD COLUMN     "account_number_last4" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "fee" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "net_amount" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "estimated_tax" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "account_number" DROP NOT NULL;

-- AlterTable
ALTER TABLE "teams" ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(18,2);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "entry_group_id" TEXT NOT NULL,
    "account" "LedgerAccount" NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balance_after" DECIMAL(18,2),
    "entry_type" TEXT NOT NULL,
    "user_id" TEXT,
    "tip_id" TEXT,
    "withdrawal_id" TEXT,
    "reference" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "user_id" TEXT,
    "request_hash" TEXT NOT NULL,
    "response_status" INTEGER,
    "response_body" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'monnify',
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processed',
    "error" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_runs" (
    "id" TEXT NOT NULL,
    "run_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "checked_count" INTEGER NOT NULL DEFAULT 0,
    "discrepancy_count" INTEGER NOT NULL DEFAULT 0,
    "summary" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ledger_entries_entry_group_id_idx" ON "ledger_entries"("entry_group_id");

-- CreateIndex
CREATE INDEX "ledger_entries_entry_group_id_account_idx" ON "ledger_entries"("entry_group_id", "account");

-- CreateIndex
CREATE INDEX "ledger_entries_user_id_created_at_idx" ON "ledger_entries"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ledger_entries_reference_idx" ON "ledger_entries"("reference");

-- CreateIndex
CREATE INDEX "ledger_entries_entry_type_idx" ON "ledger_entries"("entry_type");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_scope_key_key" ON "idempotency_keys"("scope", "key");

-- CreateIndex
CREATE INDEX "processed_webhook_events_received_at_idx" ON "processed_webhook_events"("received_at");

-- CreateIndex
CREATE UNIQUE INDEX "processed_webhook_events_provider_event_id_key" ON "processed_webhook_events"("provider", "event_id");

-- CreateIndex
CREATE INDEX "reconciliation_runs_run_type_started_at_idx" ON "reconciliation_runs"("run_type", "started_at");

-- CreateIndex
CREATE INDEX "withdrawals_status_idx" ON "withdrawals"("status");

-- CreateIndex
CREATE INDEX "withdrawals_account_number_hash_idx" ON "withdrawals"("account_number_hash");

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_tip_id_fkey" FOREIGN KEY ("tip_id") REFERENCES "tips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "withdrawals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ===========================================================================
-- Hand-written. Everything above was generated by `prisma migrate diff`;
-- Prisma's drift detection does not cover this section.
-- ===========================================================================

-- 1. Lock the status vocabularies.
--
-- Both columns are free-text TEXT, so a typo like 'complteted' is accepted
-- silently and then matches none of the ~15 queries filtering on these values.
-- The tip still exists and the balance is still right; it just never shows up
-- in the creator's history again. Sets taken from every write site in
-- src/routes/tips.ts, withdrawals.ts, admin.ts and src/jobs/*.
--
-- NOT VALID: Postgres enforces these against new and updated rows immediately
-- but skips the initial table scan, which would otherwise need an ACCESS
-- EXCLUSIVE lock on a live table. The VALIDATE pass at the end checks history
-- without blocking reads or writes.
ALTER TABLE "tips"
  ADD CONSTRAINT "tips_status_check"
  CHECK ("status" IN ('pending', 'completed', 'failed', 'expired')) NOT VALID;

ALTER TABLE "withdrawals"
  ADD CONSTRAINT "withdrawals_status_check"
  CHECK ("status" IN ('pending', 'processing', 'completed', 'failed', 'reversed')) NOT VALID;

-- 2. Money cannot be negative on the row that represents it.
--
-- Deliberately NOT applied to users.total_amount. Reversing a tip uses an
-- atomic decrement precisely so a balance that cannot absorb it goes negative
-- and gets reported, rather than being clamped to zero by MAX(0, ...) where it
-- becomes invisible unrecoverable debt. A CHECK here would reintroduce that
-- clamp and turn an honest negative balance into a failed transaction.
ALTER TABLE "tips"
  ADD CONSTRAINT "tips_amounts_non_negative"
  CHECK (
    "amount"         >= 0 AND
    "platform_fee"   >= 0 AND
    "processing_fee" >= 0 AND
    "net_amount"     >= 0 AND
    "total_charged"  >= 0
  ) NOT VALID;

ALTER TABLE "withdrawals"
  ADD CONSTRAINT "withdrawals_amounts_non_negative"
  CHECK (
    "amount"         > 0 AND
    "fee"           >= 0 AND
    "net_amount"    >= 0 AND
    "estimated_tax" >= 0
  ) NOT VALID;

-- New table, so these are checked inline rather than NOT VALID.
ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_amount_positive"
  CHECK ("amount" > 0);

-- balance_after is only meaningful for the customer account, and a credit
-- there can never leave the balance negative.
ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_balance_consistent"
  CHECK (
    "balance_after" IS NULL
    OR ("account" <> 'USER_AVAILABLE')
    OR ("direction" = 'CREDIT' AND "balance_after" >= 0)
    OR ("direction" = 'DEBIT'  AND "balance_after" <= 0)
  );

-- The customer account must always name its owner, and no platform account may
-- borrow one. Without this a mis-coded entry silently posts to nobody.
ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_user_account_has_user"
  CHECK (("account" = 'USER_AVAILABLE') = ("user_id" IS NOT NULL));

-- 3. Make the ledger append-only.
--
-- A ledger that can be rewritten is not a ledger. This is what makes a
-- duplicate credit detectable afterwards instead of permanent: even if
-- application code regresses, Postgres rejects the UPDATE or DELETE, so the
-- only available correction is a reversing entry.
--
-- This can reject every update because the foreign keys above are Restrict,
-- so no ON DELETE cascade ever touches these rows. An earlier draft used
-- SetNull plus a trigger that allowed back-references to be cleared; that let
-- the check above reject the cascade itself, making any paid user impossible
-- to delete. Restrict plus blocking all updates is simpler and stronger.
--
-- TRUNCATE is not blocked, as it fires no row-level triggers. That is how a
-- test database gets torn down; see src/__tests__/helpers.ts.
CREATE OR REPLACE FUNCTION "ledger_entries_prevent_mutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION
    'ledger_entries is append-only: post a reversing entry instead of % (entry_group_id=%, entry_type=%)',
    TG_OP, OLD."entry_group_id", OLD."entry_type"
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ledger_entries_append_only"
  BEFORE UPDATE OR DELETE ON "ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION "ledger_entries_prevent_mutation"();

-- 4. Check existing history against the new constraints.
--
-- VALIDATE CONSTRAINT takes only SHARE UPDATE EXCLUSIVE, so reads and writes
-- continue during the scan. A violation here fails the statement and names the
-- constraint, which is a real data problem worth seeing before deploy.
ALTER TABLE "tips" VALIDATE CONSTRAINT "tips_status_check";
ALTER TABLE "tips" VALIDATE CONSTRAINT "tips_amounts_non_negative";
ALTER TABLE "withdrawals" VALIDATE CONSTRAINT "withdrawals_status_check";
ALTER TABLE "withdrawals" VALIDATE CONSTRAINT "withdrawals_amounts_non_negative";
