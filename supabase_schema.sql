-- ============================================================
-- LEARNING CONNECT — Supabase Schema
-- Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- 1. ENABLE UUID EXTENSION
create extension if not exists "uuid-ossp";

-- 2. DROP TABLE IF EXISTS (clean slate)
drop table if exists public.users;

-- 3. CREATE USERS TABLE
create table public.users (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  role            text not null check (role in ('student', 'educator')),
  interest        text not null,
  level           text not null check (level in ('beginner', 'intermediate', 'advanced')),
  bio             text,
  contact_link    text,
  profile_photo   text,

  -- Social links
  instagram_link  text,
  youtube_link    text,
  facebook_link   text,

  -- System fields
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 4. AUTO-UPDATE updated_at ON ROW CHANGE
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- 5. ROW LEVEL SECURITY — allow anon read/write (no auth used)
alter table public.users enable row level security;

-- Allow anyone to INSERT (registration)
create policy "allow_insert" on public.users
  for insert with check (true);

-- Allow anyone to SELECT approved users (matchmaking page)
create policy "allow_select_approved" on public.users
  for select using (true);

-- Allow anyone to UPDATE (admin panel uses service key OR anon for demo)
create policy "allow_update" on public.users
  for update using (true);

-- Allow anyone to DELETE (admin only — enforce in frontend)
create policy "allow_delete" on public.users
  for delete using (true);

-- 6. INDEXES FOR FAST FILTERING
create index idx_users_status   on public.users(status);
create index idx_users_role     on public.users(role);
create index idx_users_level    on public.users(level);
create index idx_users_interest on public.users(interest);
create index idx_users_created  on public.users(created_at desc);

-- 7. SEED DEMO DATA (optional — remove in production)
insert into public.users (name, role, interest, level, bio, contact_link, profile_photo, instagram_link, youtube_link, facebook_link, status) values
(
  'Priya Sharma', 'student', 'Machine Learning', 'intermediate',
  'Passionate about AI and data science. Looking for study partners to crack ML interviews together!',
  'https://wa.me/919876543210',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
  'https://instagram.com', null, null, 'approved'
),
(
  'Rahul Mehta', 'educator', 'Web Development', 'advanced',
  'Full-stack developer with 8 years of experience. Teaching React, Node.js & modern web on YouTube.',
  'https://t.me/rahulmehta',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
  'https://instagram.com/rahulmehta', 'https://youtube.com/@rahulmehta', 'https://facebook.com/rahulmehta', 'approved'
),
(
  'Ananya Patel', 'student', 'UI/UX Design', 'beginner',
  'Design enthusiast exploring Figma and user research. Looking for a mentor to guide me into the industry!',
  'https://wa.me/919123456789',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya',
  'https://instagram.com/ananyauxdesign', null, null, 'approved'
),
(
  'Vikram Singh', 'educator', 'Data Science', 'advanced',
  'IIT alumnus, data scientist at a FAANG company. Mentoring 100+ students. Let''s connect!',
  'https://t.me/vikramds',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
  null, 'https://youtube.com/@vikramds', null, 'approved'
),
(
  'Sneha Gupta', 'student', 'Python Programming', 'beginner',
  'Just started coding. Love problem-solving. Want a study buddy for DSA prep!',
  'https://wa.me/918888888888',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
  null, null, null, 'pending'
);

-- ============================================================
-- DONE. Your database is ready.
-- ============================================================
