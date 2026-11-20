-- =====================================================================
-- Boundless Archive: Winter Writing Sprint (20 Nov 2026 to 5 Jan 2027).
--
-- Writers join the sprint, then every published chapter of 300+ words in
-- the window counts. Three tiers earn winter badges (and Sparks, but only
-- if you set the reward amounts; they start at 0).
-- Reusable: add another row to writing_sprints for the next season.
-- Safe to run more than once.
--
-- To set Sparks rewards later (0 to 500 each), run for example:
--   update writing_sprints set reward_tier1 = 10, reward_tier2 = 25,
--     reward_tier3 = 60 where slug = 'winter-2026';
-- =====================================================================

-- ---------- tables -----------------------------------------------------
create table if not exists public.writing_sprints (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  min_words integer not null default 300 check (min_words between 0 and 5000),
  tier1_goal integer not null default 5 check (tier1_goal > 0),
  tier2_goal integer not null default 15 check (tier2_goal > 0),
  tier3_goal integer not null default 30 check (tier3_goal > 0),
  reward_tier1 integer not null default 0 check (reward_tier1 between 0 and 500),
  reward_tier2 integer not null default 0 check (reward_tier2 between 0 and 500),
  reward_tier3 integer not null default 0 check (reward_tier3 between 0 and 500),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (tier1_goal < tier2_goal and tier2_goal < tier3_goal)
);

alter table public.writing_sprints enable row level security;
drop policy if exists writing_sprints_read on public.writing_sprints;
create policy writing_sprints_read on public.writing_sprints for select using (true);
revoke insert, update, delete on public.writing_sprints from anon, authenticated;

create table if not exists public.sprint_entries (
  sprint_id uuid not null references public.writing_sprints(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (sprint_id, user_id)
);

create index if not exists sprint_entries_user_idx on public.sprint_entries (user_id);
alter table public.sprint_entries enable row level security;
revoke all on public.sprint_entries from anon, authenticated;

-- ---------- winter badges ---------------------------------------------
insert into public.badges (slug, name, description, icon, badge_type)
select v.slug, v.name, v.description, v.icon, 'achievement'
  from (values
    ('winter_snowfall', 'Snowfall', 'Reached the first tier of the Winter Writing Sprint 2026.', 'Snowflake'),
    ('winter_blizzard', 'Blizzard', 'Reached the second tier of the Winter Writing Sprint 2026.', 'Wind'),
    ('winter_aurora', 'Aurora', 'Completed every tier of the Winter Writing Sprint 2026.', 'Sparkles')
  ) as v(slug, name, description, icon)
 where not exists (select 1 from public.badges b where b.slug = v.slug);

-- ---------- the 2026 sprint --------------------------------------------
insert into public.writing_sprints (slug, title, description, starts_at, ends_at)
values (
  'winter-2026',
  'Winter Writing Sprint',
  'Publish chapters between 20 November and 5 January. Every chapter of 300+ words counts. Reach each tier to earn a winter badge.',
  '2026-11-20 00:00:00+01',
  '2027-01-06 00:00:00+01'
)
on conflict (slug) do nothing;

-- ---------- counting ------------------------------------------------------
-- Published chapters of 300+ words (or the sprint's minimum) inside the window.
create or replace function public.sprint_chapter_count(p_sprint uuid, p_user uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
    from writing_sprints sp
    join stories s on s.author_id = p_user
    join chapters c on c.story_id = s.id
   where sp.id = p_sprint
     and c.status = 'Published'
     and c.published_at >= sp.starts_at
     and c.published_at < sp.ends_at
     and coalesce(array_length(regexp_split_to_array(
           nullif(trim(regexp_replace(coalesce(c.content, ''), '<[^>]*>', ' ', 'g')), ''),
           '\s+'), 1), 0) >= sp.min_words;
$$;

create or replace function public.sprint_standings(p_sprint uuid, p_limit integer default 25)
returns table (user_id uuid, chapters integer, joined_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select e.user_id, public.sprint_chapter_count(e.sprint_id, e.user_id), e.joined_at
    from sprint_entries e
   where e.sprint_id = p_sprint
   order by 2 desc, e.joined_at asc
   limit least(greatest(p_limit, 1), 100);
$$;

-- ---------- paying out tiers -------------------------------------------
create or replace function public.sprint_pay(
  p_user uuid, p_key text, p_scope uuid, p_amount integer,
  p_badge_slug text, p_title text, p_message text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_added integer;
  v_badge uuid;
  v_msg text := p_message;
begin
  insert into milestones_awarded (user_id, key, scope_id)
  values (p_user, p_key, p_scope)
  on conflict do nothing;

  get diagnostics v_added = row_count;
  if v_added = 0 then return; end if;

  select id into v_badge from badges where slug = p_badge_slug and is_active;
  if v_badge is not null then
    begin
      perform award_badge(p_user, v_badge);
    exception when others then
      raise warning 'sprint badge failed: %', sqlerrm;
    end;
  end if;

  if p_amount > 0 then
    perform award_sparks(p_user, p_amount, 'sprint', p_title);
    v_msg := v_msg || ' +' || p_amount || ' Sparks.';
  end if;

  insert into notifications (user_id, type, title, message, link)
  values (p_user, 'milestone', p_title, v_msg, '/sprint');
end;
$$;

-- Checks a writer's progress in one sprint and pays any tier they have reached.
create or replace function public.sprint_check(p_sprint uuid, p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  sp writing_sprints%rowtype;
  n integer;
begin
  select * into sp from writing_sprints where id = p_sprint;
  if not found then return 0; end if;

  n := public.sprint_chapter_count(p_sprint, p_user);

  if n >= sp.tier1_goal then
    perform public.sprint_pay(p_user, 'sprint:' || sp.slug || ':1', p_sprint, sp.reward_tier1,
      'winter_snowfall', 'Snowfall reached',
      sp.tier1_goal || ' chapters published in the ' || sp.title || '.');
  end if;
  if n >= sp.tier2_goal then
    perform public.sprint_pay(p_user, 'sprint:' || sp.slug || ':2', p_sprint, sp.reward_tier2,
      'winter_blizzard', 'Blizzard reached',
      sp.tier2_goal || ' chapters published in the ' || sp.title || '.');
  end if;
  if n >= sp.tier3_goal then
    perform public.sprint_pay(p_user, 'sprint:' || sp.slug || ':3', p_sprint, sp.reward_tier3,
      'winter_aurora', 'Aurora reached',
      'Every tier of the ' || sp.title || ' completed. Remarkable.');
  end if;

  return n;
end;
$$;

-- status: ok | already | closed | author | missing
create or replace function public.join_sprint(p_user uuid, p_sprint uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  sp writing_sprints%rowtype;
  v_added integer;
begin
  select * into sp from writing_sprints where id = p_sprint;
  if not found or p_user is null then return 'missing'; end if;
  if now() >= sp.ends_at then return 'closed'; end if;

  if not exists (select 1 from profiles where id = p_user and is_author) then
    return 'author';
  end if;

  insert into sprint_entries (sprint_id, user_id) values (p_sprint, p_user)
  on conflict do nothing;

  get diagnostics v_added = row_count;
  if v_added = 0 then return 'already'; end if;

  -- chapters already published in the window count straight away
  perform public.sprint_check(p_sprint, p_user);
  return 'ok';
end;
$$;

-- Every new published chapter re-checks the writer's open sprints.
create or replace function public.sprint_after_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
  r record;
begin
  begin
    select author_id into v_author from stories where id = new.story_id;
    if v_author is null then return new; end if;

    for r in
      select sp.id
        from writing_sprints sp
        join sprint_entries e on e.sprint_id = sp.id and e.user_id = v_author
       where now() >= sp.starts_at and now() < sp.ends_at
    loop
      perform public.sprint_check(r.id, v_author);
    end loop;
  exception when others then
    raise warning 'sprint_after_publish failed: %', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists chapters_sprint_progress on public.chapters;
create trigger chapters_sprint_progress
  after insert or update of status on public.chapters
  for each row
  when (new.status = 'Published')
  execute function public.sprint_after_publish();

-- ---------- permissions ------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array[
    'sprint_chapter_count(uuid, uuid)', 'sprint_standings(uuid, integer)',
    'sprint_pay(uuid, text, uuid, integer, text, text, text)',
    'sprint_check(uuid, uuid)', 'join_sprint(uuid, uuid)', 'sprint_after_publish()'
  ]
  loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
