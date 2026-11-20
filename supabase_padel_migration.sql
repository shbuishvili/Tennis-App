-- Add a separate padel court without changing existing tennis bookings.
ALTER TABLE public.courts
  ADD COLUMN IF NOT EXISTS department varchar(50) NOT NULL DEFAULT 'tennis';

UPDATE public.courts SET department = 'tennis' WHERE department IS NULL;

INSERT INTO public.courts (name, type, department, is_active, status)
SELECT 'პადელის კორტი', 'Padel', 'padel', true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.courts WHERE department = 'padel');

INSERT INTO public.global_settings (key, value) VALUES
  ('padel_total_rackets', '8'),
  ('padel_weekday_open', '08:00'),
  ('padel_weekday_close', '22:00'),
  ('padel_weekend_open', '09:00'),
  ('padel_weekend_close', '23:00')
ON CONFLICT (key) DO NOTHING;
