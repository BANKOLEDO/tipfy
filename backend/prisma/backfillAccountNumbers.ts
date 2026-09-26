// One-time: encrypt withdrawal account numbers that predate
// account_number_encrypted, then clear the plaintext column.
//
// Run with the app's env loaded, because the encryption key lives there:
//
//   npx tsx prisma/backfillAccountNumbers.ts          # dry run, changes nothing
//   npx tsx prisma/backfillAccountNumbers.ts --apply
//
// Safe to re-run: rows that already have ciphertext are skipped.

import { db } from '../src/lib/db'
import { encryptAccountNumber } from '../src/lib/crypto'

const apply = process.argv.includes('--apply')

async function main() {
  const pending = await db.withdrawal.findMany({
    where: { accountNumberEncrypted: null, accountNumber: { not: null } },
    select: {
      id: true,
      reference: true,
      accountNumber: true,
      accountNumberLast4: true,
    },
  })

  console.log(`${pending.length} withdrawal(s) still hold a plaintext account number.`)
  if (pending.length === 0) {
    console.log('Nothing to do.')
    return
  }

  let done = 0
  for (const row of pending) {
    const digits = (row.accountNumber ?? '').replace(/\D/g, '')
    if (digits.length < 10) {
      // Leave it alone and report it: silently dropping an unreadable row
      // would leave a withdrawal that can never be paid out.
      console.error(
        `  SKIP ${row.reference} (${row.id}): account number is ${digits.length} digits, ` +
          `expected 10. Resolve manually.`,
      )
      continue
    }

    const encrypted = encryptAccountNumber(digits)

    if (apply) {
      await db.withdrawal.update({
        where: { id: row.id },
        data: {
          accountNumberEncrypted: encrypted.ciphertext,
          accountNumberLast4: encrypted.last4,
          accountNumberHash: encrypted.lookupHash,
          // Cleared only after the ciphertext is written, in the same
          // transaction, so there is no window with neither copy.
          accountNumber: null,
        },
      })
    }
    done += 1
  }

  console.log(
    apply
      ? `Encrypted ${done} of ${pending.length} row(s).`
      : `Dry run: would encrypt ${done} row(s). Re-run with --apply to commit.`,
  )

  if (apply) {
    const remaining = await db.withdrawal.count({
      where: { accountNumberEncrypted: null },
    })
    console.log(`${remaining} row(s) still without ciphertext.`)
    if (remaining > 0) {
      console.warn(
        'Withdrawals with neither ciphertext nor plaintext cannot be paid out. ' +
          'Investigate before the next disbursement run.',
      )
    }
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
