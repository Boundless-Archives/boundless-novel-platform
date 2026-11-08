-- =====================================================================
-- Boundless Archive: universe upgrades.
--
--   * Spoiler-safe entries (reveal after chapter N) and a timeline
--   * Shared universes: the owner can invite co-authors by username
--   * Fan suggestions: readers suggest new entries or edits, the owner
--     accepts or declines
--   * Milestone rewards, paid only when admin settings are above 0
--     (they default to 0, so nothing is minted until you decide)
--
-- Closed tables (RLS on, no write policies): the app works as the server
-- and passes the signed-in user. Safe to run more than once.
-- Run after boundless-insights.sql (milestones) and the messages file.
-- =====================================================================

-- ---------- entries: spoiler gate + timeline ---------------------------
alter table public.entities
  add column if not exists reveal_chapter integer,
  add column if not exists timeline_label text,
  add column if not exists timeline_order numeric;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'entities_reveal_chapter_check') then
    alter table public.entities add constraint entities_reveal_chapter_check
      check (reveal_chapter is null or reveal_chapter between 1 and 5000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'entities_timeline_label_check') then
    alter table public.entities add constraint entities_timeline_label_check
      check (timeline_label is null or char_length(timeline_label) <= 80);
  end if;
end $$;

-- ---------- admin settings: reward amounts (0 = off) -------------------
alter table public.platform_settings
  add column if not exists universe_reward_entries integer not null default 0,
  add column if not exists universe_reward_relationship integer not null default 0,
  add column if not exists universe_reward_contribution integer not null default 0;

do $$
declare c text;
begin
  foreach c in array array['universe_reward_entries', 'universe_reward_relationship', 'universe_reward_contribution']
  loop
    if not exists (select 1 from pg_constraint where conname = c || '_range') then
      execute format('alter table public.platform_settings add constraint %I check (%I between 0 and 500)', c || '_range', c);
    end if;
  end loop;
end $$;

-- ---------- co-authors --------------------------------------------------
create table if not exists public.universe_members (
  universe_id uuid not null references public.universes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (universe_id, user_id)
);

alter table public.universe_members enable row level security;
drop policy if exists universe_members_read on public.universe_members;
create policy universe_members_read on public.universe_members for select using (true);
revoke insert, update, delete on public.universe_members from anon, authenticated;

-- ---------- fan suggestions ---------------------------------------------
create table if not exists public.entity_suggestions (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universes(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  suggested_by uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('new', 'edit')),
  name text,
  entity_type text,
  summary text,
  content text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  reply text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (kind = 'new' or entity_id is not null)
);

create index if not exists entity_suggestions_universe_idx on public.entity_suggestions (universe_id, status, created_at desc);
create index if not exists entity_suggestions_user_idx on public.entity_suggestions (suggested_by, created_at desc);

alter table public.entity_suggestions enable row level security;
revoke all on public.entity_suggestions from anon, authenticated;

-- ---------- helpers -------------------------------------------------------
create or replace function public.can_edit_universe(p_user uuid, p_universe uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from universes where id = p_universe and owner_id = p_user)
      or exists (select 1 from universe_members where universe_id = p_universe and user_id = p_user);
$$;

create or replace function public.universe_slugify(p_name text, p_universe uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text := trim(both '-' from regexp_replace(lower(coalesce(p_name, '')), '[^a-z0-9]+', '-', 'g'));
  v_slug text;
begin
  if v_base = '' then v_base := 'entry'; end if;
  v_slug := v_base;
  if exists (select 1 from entities where universe_id = p_universe and slug = v_slug) then
    v_slug := v_base || '-' || substr(md5(random()::text), 1, 6);
  end if;
  return v_slug;
end;
$$;

-- One-time milestone payout. Always notifies; pays Sparks only when amount > 0.
create or replace function public.universe_pay(
  p_user uuid, p_key text, p_scope uuid, p_amount integer, p_title text, p_message text, p_link text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_added integer;
  v_msg text := p_message;
begin
  insert into milestones_awarded (user_id, key, scope_id)
  values (p_user, p_key, coalesce(p_scope, '00000000-0000-0000-0000-000000000000'))
  on conflict do nothing;

  get diagnostics v_added = row_count;
  if v_added = 0 then return 0; end if;

  if p_amount > 0 then
    perform award_sparks(p_user, p_amount, 'universe', p_title);
    v_msg := v_msg || ' +' || p_amount || ' Sparks.';
  end if;

  insert into notifications (user_id, type, title, message, link)
  values (p_user, 'milestone', p_title, v_msg, p_link);

  return greatest(p_amount, 0);
end;
$$;

-- Checks a writer's universe milestones. Cheap to call after any change.
create or replace function public.award_universe_progress(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_set platform_settings%rowtype;
  v_entries integer;
  v_total integer := 0;
  v_n integer;
begin
  select * into v_set from platform_settings limit 1;

  -- only entries with a real summary and body count, so empty stubs can't farm this
  select count(*) into v_entries
    from entities
   where created_by = p_user
     and char_length(coalesce(summary, '')) >= 20
     and char_length(coalesce(content, '')) >= 50;

  foreach v_n in array array[5, 15, 30]
  loop
    if v_entries >= v_n then
      v_total := v_total + universe_pay(
        p_user, 'universe_entries_' || v_n, null, coalesce(v_set.universe_reward_entries, 0),
        v_n || ' wiki entries written',
        'Your universe now has ' || v_n || ' fleshed-out entries.',
        '/my-universe');
    end if;
  end loop;

  if exists (select 1 from entity_relationships where created_by = p_user) then
    v_total := v_total + universe_pay(
      p_user, 'universe_relationship', null, coalesce(v_set.universe_reward_relationship, 0),
      'First connection drawn',
      'You linked two entries together, so your web of connections has begun.',
      '/my-universe');
  end if;

  return v_total;
end;
$$;

-- ---------- co-authors ----------------------------------------------------
create or replace function public.universe_invite_member(p_owner uuid, p_universe uuid, p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uni universes%rowtype;
  v_target uuid;
begin
  select * into v_uni from universes where id = p_universe;
  if not found or v_uni.owner_id <> p_owner then return 'forbidden'; end if;

  select id into v_target from profiles where lower(username) = lower(trim(p_username));
  if v_target is null then return 'missing'; end if;
  if v_target = p_owner then return 'self'; end if;
  if exists (select 1 from universe_members where universe_id = p_universe and user_id = v_target) then return 'already'; end if;
  if (select count(*) from universe_members where universe_id = p_universe) >= 10 then return 'full'; end if;

  insert into universe_members (universe_id, user_id) values (p_universe, v_target);

  insert into notifications (user_id, actor_id, type, title, message, link)
  values (v_target, p_owner, 'announcement', 'You were added as a co-author',
          'You can now add entries to "' || v_uni.name || '".', '/my-universe');

  return 'ok';
end;
$$;

create or replace function public.universe_remove_member(p_actor uuid, p_universe uuid, p_member uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner from universes where id = p_universe;
  if v_owner is null then return 'forbidden'; end if;
  if p_actor <> v_owner and p_actor <> p_member then return 'forbidden'; end if;
  delete from universe_members where universe_id = p_universe and user_id = p_member;
  return 'ok';
end;
$$;

-- ---------- fan suggestions -----------------------------------------------
create or replace function public.submit_entity_suggestion(
  p_user uuid, p_universe uuid, p_entity uuid, p_kind text,
  p_name text, p_type text, p_summary text, p_content text, p_note text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uni universes%rowtype;
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_summary text := nullif(trim(coalesce(p_summary, '')), '');
  v_content text := nullif(trim(coalesce(p_content, '')), '');
  v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  select * into v_uni from universes where id = p_universe;
  if not found then return 'missing'; end if;
  if public.can_edit_universe(p_user, p_universe) then return 'own'; end if;

  if p_kind not in ('new', 'edit') then return 'invalid'; end if;
  if char_length(coalesce(v_name, '')) > 80 or char_length(coalesce(v_summary, '')) > 400
     or char_length(coalesce(v_content, '')) > 6000 or char_length(coalesce(v_note, '')) > 500 then
    return 'invalid';
  end if;

  if p_kind = 'new' then
    if v_name is null or char_length(v_name) < 2 or v_summary is null then return 'invalid'; end if;
    if p_type is null or p_type not in ('character','location','faction','item','event','concept','species','alternate_universe','alternate_timeline') then
      return 'invalid';
    end if;
  else
    if p_entity is null or not exists (select 1 from entities where id = p_entity and universe_id = p_universe) then return 'missing'; end if;
    if v_summary is null and v_content is null then return 'invalid'; end if;
  end if;

  if (select count(*) from entity_suggestions where suggested_by = p_user and universe_id = p_universe and status = 'pending') >= 3 then
    return 'limit';
  end if;
  if (select count(*) from entity_suggestions where suggested_by = p_user and created_at > now() - interval '1 day') >= 5 then
    return 'limit';
  end if;

  insert into entity_suggestions (universe_id, entity_id, suggested_by, kind, name, entity_type, summary, content, note)
  values (p_universe, case when p_kind = 'edit' then p_entity end, p_user, p_kind,
          v_name, case when p_kind = 'new' then p_type end, v_summary, v_content, v_note);

  insert into notifications (user_id, actor_id, type, title, message, link)
  values (v_uni.owner_id, p_user, 'announcement', 'New suggestion for your universe',
          case when p_kind = 'new' then 'A reader suggested a new entry: ' || v_name
               else 'A reader suggested an edit to one of your entries.' end,
          '/my-universe');

  return 'ok';
end;
$$;

create or replace function public.resolve_entity_suggestion(
  p_owner uuid, p_id uuid, p_accept boolean, p_origin_story uuid, p_reply text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  s entity_suggestions%rowtype;
  v_uni universes%rowtype;
  v_entity uuid;
  v_set platform_settings%rowtype;
  v_reply text := nullif(trim(coalesce(p_reply, '')), '');
  v_title text;
  v_accepted_before integer;
begin
  select * into s from entity_suggestions where id = p_id for update;
  if not found then return 'missing'; end if;

  select * into v_uni from universes where id = s.universe_id;
  if v_uni.owner_id <> p_owner then return 'forbidden'; end if;
  if s.status <> 'pending' then return 'done'; end if;
  if char_length(coalesce(v_reply, '')) > 300 then v_reply := left(v_reply, 300); end if;

  if p_accept then
    if s.kind = 'new' then
      if p_origin_story is null or not exists (select 1 from stories where id = p_origin_story and author_id = p_owner) then
        return 'story';
      end if;
      insert into entities (universe_id, origin_story_id, entity_type, name, slug, summary, content, created_by)
      values (s.universe_id, p_origin_story, s.entity_type, s.name,
              public.universe_slugify(s.name, s.universe_id), s.summary, s.content, p_owner)
      returning id into v_entity;
      insert into entity_appearances (entity_id, story_id) values (v_entity, p_origin_story);
      v_title := s.name;
    else
      update entities
         set summary = coalesce(s.summary, summary),
             content = coalesce(s.content, content),
             updated_at = now()
       where id = s.entity_id and universe_id = s.universe_id
       returning name into v_title;
      if v_title is null then return 'missing'; end if;
    end if;
  end if;

  update entity_suggestions
     set status = case when p_accept then 'accepted' else 'declined' end,
         reply = v_reply, resolved_at = now()
   where id = p_id;

  insert into notifications (user_id, actor_id, type, title, message, link)
  values (s.suggested_by, p_owner, 'announcement',
          case when p_accept then 'Your suggestion was accepted' else 'Your suggestion was declined' end,
          coalesce(v_title, s.name, 'Your suggestion') || ' · ' || v_uni.name
            || coalesce(': ' || v_reply, ''),
          '/wiki/' || v_uni.slug);

  if p_accept then
    select * into v_set from platform_settings limit 1;
    -- reward is capped to the first 10 accepted suggestions per person
    select count(*) into v_accepted_before from milestones_awarded
     where user_id = s.suggested_by and key = 'universe_contribution';
    if v_accepted_before < 10 then
      perform universe_pay(
        s.suggested_by, 'universe_contribution', s.id, coalesce(v_set.universe_reward_contribution, 0),
        'Contribution accepted',
        'Your suggestion to ' || v_uni.name || ' was accepted.',
        '/wiki/' || v_uni.slug);
    end if;
  end if;

  return 'ok';
end;
$$;

-- ---------- permissions ----------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array[
    'can_edit_universe(uuid, uuid)', 'universe_slugify(text, uuid)',
    'universe_pay(uuid, text, uuid, integer, text, text, text)', 'award_universe_progress(uuid)',
    'universe_invite_member(uuid, uuid, text)', 'universe_remove_member(uuid, uuid, uuid)',
    'submit_entity_suggestion(uuid, uuid, uuid, text, text, text, text, text, text)',
    'resolve_entity_suggestion(uuid, uuid, boolean, uuid, text)'
  ]
  loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
