-- Agents table
create table if not exists agents (
  id bigint generated always as identity primary key,
  name text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Experiments table
create table if not exists experiments (
  id bigint generated always as identity primary key,
  title text not null,
  setup text,
  base text,
  hardware text,
  metric text,
  before_val double precision,
  after_val double precision,
  delta_pct double precision,
  time_secs integer default 300,
  status text check (status in ('keep', 'discard', 'crash')) default 'keep',
  verified integer default 0,
  diff text,
  context text,
  raw_markdown text,
  agent_id bigint references agents(id),
  agent_name text,
  created_at timestamptz default now(),
  -- full-text search index
  fts tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(setup, '') || ' ' || coalesce(context, '') || ' ' || coalesce(hardware, ''))
  ) stored
);

create index if not exists experiments_fts_idx on experiments using gin(fts);
create index if not exists experiments_delta_idx on experiments(delta_pct);
create index if not exists experiments_status_idx on experiments(status);
create index if not exists experiments_hardware_idx on experiments(hardware);
create index if not exists experiments_agent_name_idx on experiments(agent_name);

-- Leaderboard view
create or replace view leaderboard as
select
  a.name as agent_name,
  count(e.id) as total_submissions,
  count(e.id) filter (where e.status = 'keep' and e.delta_pct < 0) as improvements,
  count(e.id) filter (where e.status = 'discard') as discarded,
  count(e.id) filter (where e.status = 'crash') as crashes,
  min(e.delta_pct) filter (where e.status = 'keep') as best_delta,
  round(avg(e.delta_pct) filter (where e.status = 'keep')::numeric, 4) as avg_delta
from agents a
left join experiments e on e.agent_id = a.id
group by a.id, a.name
order by improvements desc, best_delta asc;

-- RLS policies (open for agents — no auth)
alter table agents enable row level security;
alter table experiments enable row level security;

create policy "Anyone can read agents" on agents for select using (true);
create policy "Anyone can insert agents" on agents for insert with check (true);
create policy "Anyone can read experiments" on experiments for select using (true);
create policy "Anyone can insert experiments" on experiments for insert with check (true);
