create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────────────────────────────
create table public.profiles (
  id                       uuid primary key references auth.users(id) on delete cascade,
  username                 text unique not null,
  balance                  numeric(12,2) not null default 0,
  tier                     text not null default 'basic'
                             check (tier in ('basic','tier1','tier2','tier3')),
  mining_start             timestamptz,
  withdrawal_code_verified boolean not null default false,
  created_at               timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ── ACTIVATION CODES (miner tiers) ────────────────────────────
-- Readable by service role only. One code per tier.
-- Multiple users can activate using the same code (it is a product key).
create table public.activation_codes (
  id    serial primary key,
  code  text unique not null,
  tier  text not null check (tier in ('tier1','tier2','tier3'))
);

alter table public.activation_codes enable row level security;
-- No select policy for anon/authenticated — service role only

-- ── WITHDRAWAL CODES ──────────────────────────────────────────
-- Each row is a valid code sold by the agent for ₦12,000.
-- Once a user verifies a code, their profile is permanently flagged.
create table public.withdrawal_codes (
  id         serial primary key,
  code       text unique not null,
  created_at timestamptz not null default now()
);

alter table public.withdrawal_codes enable row level security;
-- No select policy — service role only

-- ── WITHDRAWAL REQUESTS ───────────────────────────────────────
create table public.withdrawals (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  amount       numeric(12,2) not null default 350000,
  acct_number  text not null,
  bank_name    text not null,
  acct_holder  text not null,
  status       text not null default 'pending'
                 check (status in ('pending','approved','paid')),
  created_at   timestamptz not null default now()
);

alter table public.withdrawals enable row level security;

create policy "Users read own withdrawals"
  on public.withdrawals for select using (auth.uid() = user_id);

create policy "Users insert own withdrawals"
  on public.withdrawals for insert with check (auth.uid() = user_id);

-- ── TRIGGER: auto-create profile on signup ────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
