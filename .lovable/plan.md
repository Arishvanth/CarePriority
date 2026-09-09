# Fix deterministic referral status persistence

## Diagnosis
The current client helper exits early whenever a referral already exists for the consultation. That preserves a stale `pending` row instead of reconciling it to `referred`. Client-side insertion alone also does not enforce the consultation-to-referral status invariant in the database.

## Changes
- Replace the read-then-insert referral write with one idempotent write keyed by `consultation_id` that explicitly persists `status = 'referred'` and returns the exact row.
- Verify the returned row is `referred`; if it is not, update that same row and fail clearly if persistence still disagrees.
- Add a safe database rule that forces a linked referral to `referred` only when its consultation outcome or final outcome is `referred`.
- Correct only existing `pending` referrals whose linked consultation is already marked referred.
- Keep the unique consultation constraint and retain `pending` for unrelated/future referral workflows.

## Validation
- Inspect live rows before and after the migration.
- Exercise a referred consultation write and confirm the linked referral remains `referred` after a fresh database read.
- Confirm affected dashboard counts classify the row as Referred and not Pending.
