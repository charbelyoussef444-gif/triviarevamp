create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null unique,
  created_at timestamptz not null default now(),
  rating integer not null default 1000,
  total_matches integer not null default 0,
  total_wins integer not null default 0
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id),
  prompt text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('A','B','C','D')),
  difficulty integer not null default 1,
  is_active boolean not null default true
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('friends','ranked','survival')),
  status text not null check (status in ('waiting','in_progress','ended')),
  winner_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  user_id uuid not null references users(id),
  seat_index integer not null,
  is_alive boolean not null default true,
  placement integer,
  score integer not null default 0
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  round_number integer not null,
  target_user_id uuid references users(id),
  chosen_category_id uuid references categories(id),
  question_id uuid references questions(id),
  answered_correctly boolean,
  elimination_triggered boolean,
  eliminated_user_id uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists category_votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  voter_user_id uuid not null references users(id),
  category_id uuid not null references categories(id)
);

create table if not exists survival_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  score integer not null,
  rounds_survived integer not null,
  best_streak integer not null,
  created_at timestamptz not null default now()
);
