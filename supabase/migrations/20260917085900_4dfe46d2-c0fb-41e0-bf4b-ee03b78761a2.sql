CREATE UNIQUE INDEX IF NOT EXISTS alerts_one_active_overflow
  ON public.alerts ((kind))
  WHERE kind = 'overflow' AND acknowledged_at IS NULL;