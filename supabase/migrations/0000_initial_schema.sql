-- 0000_initial_schema.sql
-- Enables UUID generation if not already enabled
create extension if not exists "uuid-ossp";

-----------------------------------------
-- 1. PROFILES (Extends auth.users)
-----------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  role text check (role in ('admin', 'reviewer', 'user', 'pastor', 'leader')) default 'user',
  created_at timestamptz default now()
);

-- Trigger to automatically create a profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'user');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-----------------------------------------
-- 2. FORMS
-----------------------------------------
create table if not exists public.forms (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  is_active boolean default true,
  start_at timestamptz,
  end_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-----------------------------------------
-- 3. FORM_BLOCKS (Sections)
-----------------------------------------
create table if not exists public.form_blocks (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid references public.forms(id) on delete cascade not null,
  key text,
  title text not null,
  "order" int default 0
);

-----------------------------------------
-- 4. QUESTIONS
-----------------------------------------
create table if not exists public.questions (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid references public.forms(id) on delete cascade not null,
  block_id uuid references public.form_blocks(id) on delete set null,
  key text not null,
  label text not null,
  type text check (type in ('text', 'textarea', 'radio', 'checkbox', 'points100', 'date', 'time', 'scale')) not null,
  options jsonb, -- e.g., ["Option 1", "Option 2"]
  required boolean default false,
  "order" int default 0,
  condition jsonb, -- e.g., { "when": "key", "equals": "value" }
  created_at timestamptz default now()
);

-----------------------------------------
-- 5. RESPONSES
-----------------------------------------
create table if not exists public.responses (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid references public.forms(id) on delete cascade not null,
  anonymous boolean default false,
  respondent_user_id uuid references public.profiles(id) on delete set null,
  respondent_name text,
  respondent_email text,
  need_1on1 boolean default false,
  preferred_date date,
  preferred_time time,
  status text check (status in ('new', 'reviewed', 'followup_pending', 'closed')) default 'new',
  assigned_to uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-----------------------------------------
-- 6. ANSWERS
-----------------------------------------
create table if not exists public.answers (
  id uuid primary key default uuid_generate_v4(),
  response_id uuid references public.responses(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  value jsonb, -- flexibly stores text, arrays, or objects like points100
  created_at timestamptz default now()
);

-----------------------------------------
-- 7. REVIEWER_ASSIGNMENTS
-----------------------------------------
create table if not exists public.reviewer_assignments (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid references public.forms(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  active boolean default true,
  created_at timestamptz default now()
);

-----------------------------------------
-- ROW LEVEL SECURITY (RLS) SETUP
-----------------------------------------
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.forms enable row level security;
alter table public.form_blocks enable row level security;
alter table public.questions enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;
alter table public.reviewer_assignments enable row level security;

-- NOTE: Since we are using NEXT.JS Server-Side Inserts (Service Role Key),
-- we do NOT need to grant insert privileges to anon or public here.
-- The service_role key bypasses RLS completely for inserting responses/answers. 
-- These policies control what authenticated users (Admins/Reviewers) can read/update from the client.

-- 1. Profiles: Users can read their own profile. Admins/Reviewers can read all.
create policy "Users can read own profile" on public.profiles
  for select using ( auth.uid() = id );

create policy "Admins and Reviewers can read all profiles" on public.profiles
  for select using ( 
    (select role from public.profiles where id = auth.uid()) in ('admin', 'reviewer', 'pastor', 'leader')
  );

-- 2. Forms/Blocks/Questions: Anyone can read active forms to fill them out.
create policy "Anyone can read active forms" on public.forms
  for select using ( is_active = true );

create policy "Admins can manage forms" on public.forms
  for all using ( (select role from public.profiles where id = auth.uid()) = 'admin' );

create policy "Anyone can read blocks" on public.form_blocks
  for select using ( true );

create policy "Anyone can read questions" on public.questions
  for select using ( true );

-- 3. Responses & Answers: 
-- ONLY Reviewers and Admins can read them.
create policy "Reviewers and Admins can view responses" on public.responses
  for select using (
    (select role from public.profiles where id = auth.uid()) in ('admin', 'reviewer', 'pastor', 'leader')
  );

create policy "Reviewers and Admins can view answers" on public.answers
  for select using (
    (select role from public.profiles where id = auth.uid()) in ('admin', 'reviewer', 'pastor', 'leader')
  );

-- Admin & Reviewers can UPDATE responses (e.g. to mark as 'reviewed')
create policy "Reviewers and Admins can update responses" on public.responses
  for update using (
    (select role from public.profiles where id = auth.uid()) in ('admin', 'reviewer', 'pastor', 'leader')
  );

-- (OPTIONAL PATH A FALLBACK) - If you DO want to allow direct client anon inserts, uncomment below:
-- create policy "Anon can insert responses" on public.responses for insert with check (true);
-- create policy "Anon can insert answers" on public.answers for insert with check (true);
