-- Roles ---------------------------------------------------------------
create type public.app_role as enum ('admin', 'customer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "admins read all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Profiles ------------------------------------------------------------
create table public.profiles (
  id uuid primary key,
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "admin profile read" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email, new.raw_user_meta_data ->> 'phone')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Studio setups -------------------------------------------------------
create table public.studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  equipment text[] not null default '{}',
  hourly_rate numeric(10,2) not null default 0,
  image_key text,
  capacity int not null default 4,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.studios to anon, authenticated;
grant all on public.studios to authenticated;
grant all on public.studios to service_role;
alter table public.studios enable row level security;
create policy "studios public read" on public.studios for select to anon, authenticated using (true);
create policy "studios admin write" on public.studios for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Packages ------------------------------------------------------------
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind text not null default 'hourly',
  price numeric(10,2) not null,
  duration_hours int not null default 1,
  includes text[] not null default '{}',
  highlight boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.packages to anon, authenticated;
grant all on public.packages to authenticated;
grant all on public.packages to service_role;
alter table public.packages enable row level security;
create policy "packages public read" on public.packages for select to anon, authenticated using (true);
create policy "packages admin write" on public.packages for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Blocked slots -------------------------------------------------------
create table public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid references public.studios(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);
grant select on public.blocked_slots to anon, authenticated;
grant all on public.blocked_slots to authenticated;
grant all on public.blocked_slots to service_role;
alter table public.blocked_slots enable row level security;
create policy "blocked public read" on public.blocked_slots for select to anon, authenticated using (true);
create policy "blocked admin write" on public.blocked_slots for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Bookings ------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  user_id uuid,
  studio_id uuid not null references public.studios(id),
  package_id uuid references public.packages(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  notes text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  total_price numeric(10,2) not null default 0,
  status text not null default 'confirmed',
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;

-- Prevent double bookings on the same studio for active bookings
create extension if not exists btree_gist;
alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (
    studio_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status <> 'cancelled');

create policy "own bookings read" on public.bookings for select to authenticated using (user_id = auth.uid());
create policy "admin bookings read" on public.bookings for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "own bookings insert" on public.bookings for insert to authenticated with check (user_id = auth.uid());
create policy "own bookings update" on public.bookings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin bookings update" on public.bookings for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Contact messages ----------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
grant insert on public.contact_messages to anon, authenticated;
grant select on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "anyone can send" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "admin reads messages" on public.contact_messages for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- Seed data -----------------------------------------------------------
insert into public.studios (name, slug, description, equipment, hourly_rate, image_key, capacity, sort_order) values
('Studio A — Seamless', 'studio-a', 'Infinite white cyclorama with two softboxes, backdrop stands and a full C-stand set. Our most versatile room.', array['White seamless paper','2× softbox','C-stand set','Backdrop stands','Reflector kit'], 85, 'seamless', 6, 1),
('Studio B — Sound Room', 'studio-b', 'Acoustically treated booth with a Neumann mic, pop filter and a clean 48V interface for podcasts and voiceover.', array['Neumann condenser mic','Pop filter','48V interface','Studio headphones','Acoustic panels'], 45, 'sound', 3, 2),
('Studio C — Chroma Bay', 'studio-c', 'Green screen wall with even LED panel lighting and a camera track for smooth moves and virtual sets.', array['Green screen wall','4× LED panels','Camera track','Teleprompter','4K cinema camera'], 65, 'chroma', 8, 3);

insert into public.packages (name, slug, kind, price, duration_hours, includes, highlight, sort_order) values
('Hourly', 'hourly', 'hourly', 45, 1, array['Any single setup','Basic lighting kit','1 camera body','Self-serve access'], false, 1),
('Half-day', 'half-day', 'half_day', 180, 4, array['Any setup, 4 hours','Full lighting + grip','Equipment swap on the hour','Priority booking window'], false, 2),
('Full-day', 'full-day', 'full_day', 320, 8, array['Full studio, 8 hours','All setups + storage','Dedicated tech on call','Green screen included'], false, 3),
('Creator', 'creator', 'creator', 85, 2, array['Studio A, up to 6 people','Full lighting + grip','2 cameras + gimbal','Sound room access'], true, 4),
('Business / Content', 'business', 'business', 140, 3, array['Full studio + green screen','On-site producer','Unlimited gear','Multi-cam recording'], false, 5);