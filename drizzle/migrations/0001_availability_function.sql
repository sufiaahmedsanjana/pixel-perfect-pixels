-- Returns busy time ranges for a studio on a given day without exposing
-- customer details. Used by the public booking calendar.
create or replace function public.get_busy_ranges(_studio_id uuid, _day date)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select b.starts_at, b.ends_at
  from public.bookings b
  where b.studio_id = _studio_id
    and b.status <> 'cancelled'
    and b.starts_at::date = _day
  union all
  select s.starts_at, s.ends_at
  from public.blocked_slots s
  where (s.studio_id = _studio_id or s.studio_id is null)
    and s.starts_at::date = _day
$$;

grant execute on function public.get_busy_ranges(uuid, date) to anon, authenticated;