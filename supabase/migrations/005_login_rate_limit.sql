-- 005_login_rate_limit.sql
-- Additive migration for persistent shared serverless rate limiting across admin login attempts

create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null unique,
  failures int not null default 1,
  first_failure_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_login_attempts_identifier on public.login_attempts(identifier);

-- Restrict all public and anonymous access to login_attempts via RLS
alter table public.login_attempts enable row level security;

-- Only service role (server actions) can manage login attempts
create policy "Service role manage login_attempts"
  on public.login_attempts
  for all
  to service_role
  using (true)
  with check (true);
