# Step 6 — System-wide audit (read-only)

No code or data was changed. Findings below come from reading every workflow file and from read-only queries against live records (18 patients, 12 consultations, 3 referrals, 14 alerts, 2 observation events).

## BLOCKER
None.

## HIGH

**H1 — A consultation can be completed without any consultation record being saved**
`src/routes/_authenticated/app.doctor.tsx` (`finish` mutation). The consultation id only exists in page state (`activeConsultId`). If the doctor reloads the page, switches device, or picks a patient who is already "in consult" from an earlier session, that id is null, and then: no notes/diagnosis/outcome are saved, the consultation is never closed, and a referral is created with no consultation link — which bypasses the one-referral-per-consultation safeguard and the database rule that forces the "Referred" status. The patient is still marked completed, so the record is silently lost.
Recommendation: before completing, look up the patient's open consultation (or create one) instead of relying on page state.

**H2 — Observation exit attaches to the wrong (or no) consultation**
`src/routes/_authenticated/app.observation.tsx` (`exit`). It picks the patient's most recent consultation out of the last 100 fetched. On a repeat visit this can finalise an older/newer visit, and if none is found the referral is created unlinked — again losing duplicate protection. Live data already shows one observation-origin referral with an empty destination (pre-fix record) and one consultation whose `outcome` is blank while `final_outcome` is "referred".
Recommendation: carry the consultation id from the observation admission event (it is already stored there) rather than re-searching.

## MEDIUM

**M1 — Queue position is never recalculated** (`app.reception.tsx`). It is set once as "number of active patients in the same priority + 1" and never renumbered when patients leave, when vitals change the priority, or after an emergency override. Live rows already contain repeated positions within the same priority. Reception lanes sort on this value, so ordering can be arbitrary.

**M2 — Leftover observation fields after exit** (`app.observation.tsx`). Discharge/refer sets status to completed but leaves room, bed and observation start time on the patient. Confirmed live: patient P-5221 is completed yet still carries an observation start time; it shows up in Patient History.

**M3 — "Seen today" counts everything ever** (`app.doctor.tsx`, `completedToday`). It counts all completed patients with no date filter.

**M4 — Live sync only covers patients and alerts** (`src/hooks/use-care-data.ts`). Consultations, referrals and observation events refresh only after the acting user's own action, so a second staff member sees stale Referrals / History / Observation until reload — the "Live sync active" badge overstates this.

**M5 — Fetch caps will silently truncate** (`src/data/*.ts`): consultations 100, referrals 500, observation events 500, alerts 60. Analytics wait-time and Patient History both read the capped consultation list, so numbers will quietly drift once the clinic passes 100 consultations.

**M6 — Nurse role can create work it cannot see.** Nurses may open the Doctor console and choose Observation or Referred, but Observation and Referrals are admin/doctor only (`src/lib/rbac.ts`). Needs a product decision: either grant nurses read access or restrict those outcomes.

**M7 — Overflow alert has no dedupe** (`app.reception.tsx`). Every registration above the threshold raises another "approaching capacity" alert.

## LOW

- Two consultations from 27 Aug are marked referred with no referral record (pre-dates the referrals table) — previously agreed to leave as-is.
- One referral has a blank destination (created before destination capture was added).
- Analytics "Today" range still renders the full 7-day heatmap grid, so six rows are always empty on that range.
- Doctor RFID "scan" button is a simulated scan that just loads the top of the queue.

## CLEAN (validated)

- Role protection: all seven console routes call `requireRole` in `beforeLoad`, the sidebar filters by role, and unauthorised direct access redirects to the role's home. Receptionists cannot reach Analytics, Observation, Referrals or History by URL or menu.
- Referral integrity: all 3 referrals have status "referred", none duplicated, each linked to a distinct consultation; the database trigger plus unique consultation link hold.
- No consultation is left open (0 unclosed), no patient is stuck in "in consult", no orphaned referral or observation rows, all alerts acknowledged.
- No duplicate patient codes and no duplicate RFID tags.
- Triage scoring is deterministic and explainable; thresholds match the HIGH/MODERATE/LOW bands; emergency override records original priority, reason, actor and time.
- Patient History detail is read-only, opens in a bounded scrollable dialog, keeps the Referrals link.
- Mobile: dialogs use viewport-bounded widths and internal scrolling; no obvious overflow risks found in the code.

## Suggested fix order (not implemented)

1. H1, then H2 — these are the only findings that can lose or corrupt clinical records.
2. M1 and M2 — queue ordering and post-observation cleanup.
3. M4 and M5 — live sync coverage and fetch caps.
4. M3, M6, M7 and the LOW items.
