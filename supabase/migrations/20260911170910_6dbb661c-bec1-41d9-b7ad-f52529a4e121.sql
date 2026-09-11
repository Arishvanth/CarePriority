UPDATE public.referrals r
SET status = 'referred', updated_at = now()
FROM public.consultations c
WHERE c.id = r.consultation_id
  AND r.status = 'completed'
  AND (lower(c.outcome) = 'referred' OR lower(c.final_outcome) = 'referred');

UPDATE public.consultations
SET ended_at = COALESCE(ended_at, now())
WHERE ended_at IS NULL
  AND final_outcome <> '';