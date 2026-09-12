# Step 3.5 — Audit: referred consultations with no referral record

Read-only audit. Nothing was created, changed, or deleted.

## The two records

Both are from 27 Aug 2026, same doctor account, both patients now marked completed and out of the active queue.

1. **Priya Verma (P-2042, RF-88A3, 34 F, HIGH, score 72)** — consultation ended 27 Aug 06:25. Outcome "referred", diagnosis "Referred", notes "referred". No room/bed, no observation start — a normal consultation, not observation.
2. **Mohit Singh (P-2045, RF-88B2, 51 M, MODERATE, score 38)** — consultation ended 27 Aug 06:28. Outcome "referred", diagnosis "Referred back massage", notes "all good". Also a normal consultation, not observation.

## Why no referral exists

The referral records feature did not exist yet when these two consultations were completed. The referral table and the referral-creation step were added on 9 Sep 2026, and the earliest referral in the database was created 9 Sep 2026 10:13. Every referred consultation completed since that date has exactly one referral record.

So: **historical data exception, not a current workflow bug.** Nothing in today's flow can produce a referred consultation without a referral.

## Can they be reconstructed safely?

Partially. Patient identity, doctor, diagnosis, notes and timestamp are all reliably available. What is missing and cannot be recovered is the **referral destination** and a real **referral reason** — neither was ever captured, because those fields did not exist at the time. Any value there would be invented.

Recommendation: leave both as historical records. If you would rather see them in the Referrals list, they can be backfilled with an explicit "destination not recorded (pre-referral-tracking)" marker so nobody mistakes it for real data — your call, and it would be a separate step.

## Is a code change necessary?

**No.** The current Doctor referral path always creates the linked referral, and it is idempotent per consultation.

One genuine, separate gap worth noting (already flagged in Step 3, still unfixed): the **observation** exit-to-referral path creates the referral with an empty destination, because that screen never asks for one. It always creates the referral, so it cannot cause a missing record — but it does produce referrals with no destination. Fixing that would mean asking for a destination when referring a patient out of observation. Not part of this step.

## Proposed next step

No changes in this step. Await your decision on:
- leave the two 27 Aug records as-is (recommended), or backfill them with an explicit "not recorded" destination marker;
- whether to collect a destination on the observation referral path.
