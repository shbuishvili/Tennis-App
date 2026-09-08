-- ====================================================================
-- SUPABASE MIGRATION: კვადროციკლებისა და ბაგების ახალი სვეტები
-- ====================================================================
-- გაუშვით ეს კოდი Supabase Dashboard-ის SQL Editor-ში:

-- 1. ჯავშნების ცხრილში (bookings) ახალი ველების დამატება:
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS quads_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS buggies_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_extra_guest BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS extra_guests_count INT DEFAULT 0;

-- 2. არსებული კვადროს ჯავშნების სინქრონიზაცია (თუ უკვე არსებობს ჩანაწერები):
UPDATE bookings 
SET quads_count = COALESCE(horses_count, 0),
    buggies_count = COALESCE(ponies_count, 0)
WHERE activity_type = 'quad' 
  AND (quads_count = 0 OR quads_count IS NULL)
  AND (horses_count > 0 OR ponies_count > 0);

-- ====================================================================
