-- Enable Dashboard / Intelligence for a specific login (run in Supabase SQL Editor)
-- Replace the email below, then have the user sign out and sign back in.

update public.profiles p
set operations_available = true, updated_at = now()
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('you@company.com');

-- Or enable ALL existing auth users once (new sign-ups still default to false):
-- update public.profiles set operations_available = true where operations_available = false;
