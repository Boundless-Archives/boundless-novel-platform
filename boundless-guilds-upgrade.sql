-- =====================================================================
-- Boundless Archive: groups upgrade.
--   * emblem + banner, motto, rules
--   * officers (can moderate and pin), kick members, transfer ownership
--   * pinned discussion
--   * private groups with invite codes
-- Run AFTER the other guild files (guilds, cultivation, types, official,
-- events, messages). Safe to run more than once.
-- All functions are closed to the browser; the app calls them as the server.
-- =====================================================================

-- ---------- storage bucket for emblems and banners ---------------------
insert into storage.buckets (id, name, public)
values ('guild-images', 'guild-images', true)
on conflict (id) do nothing;

-- ---------- columns ------------------------------------------------------
alter table public.guilds
  add column if not exists emblem_url text,
  add column if not exists banner_url text,
  add column if not exists motto text,
  add column if not exists rules text,
  add column if not exists is_private boolean not null default false,
  add column if not exists invite_code text,
  add column if not exists pinned_post_id uuid references public.guild_posts(id) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'guilds_motto_len') then
    alter table public.guilds add constraint guilds_motto_len check (motto is null or char_length(motto) <= 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'guilds_rules_len') then
    alter table public.guilds add constraint guilds_rules_len check (rules is null or char_length(rules) <= 1500);
  end if;
end $$;

create unique index if not exists guilds_invite_code_idx on public.guilds (invite_code) where invite_code is not null;

-- members may now be officers
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.guild_members'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%role%'
  loop
    execute format('alter table public.guild_members drop constraint %I', c.conname);
  end loop;

  alter table public.guild_members
    add constraint guild_members_role_check check (role in ('owner', 'officer', 'member'));
end $$;

-- failed invite-code guesses, for throttling
create table if not exists public.guild_code_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index if not exists guild_code_attempts_idx on public.guild_code_attempts (user_id, attempted_at desc);
alter table public.guild_code_attempts enable row level security;
revoke all on public.guild_code_attempts from anon, authenticated;

-- ---------- helpers ------------------------------------------------------
create or replace function public.guild_role(p_user uuid, p_guild uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from guild_members where guild_id = p_guild and user_id = p_user;
$$;

create or replace function public.can_moderate_guild(p_user uuid, p_guild uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user is not null
     and (public.is_superadmin(p_user)
          or coalesce(public.guild_role(p_user, p_guild), '') in ('owner', 'officer'));
$$;

create or replace function public.guild_new_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v text;
begin
  loop
    v := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    exit when not exists (select 1 from guilds where invite_code = v);
  end loop;
  return v;
end;
$$;

-- ---------- moderation now includes officers -------------------------------
create or replace function public.delete_guild_post(p_user uuid, p_post uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guild uuid;
  v_author uuid;
begin
  select guild_id, author_id into v_guild, v_author from guild_posts where id = p_post;
  if v_guild is null then return 'missing'; end if;

  if not (v_author = p_user or public.can_moderate_guild(p_user, v_guild)) then
    return 'denied';
  end if;

  delete from guild_posts where id = p_post;
  update guilds set post_count = greatest(post_count - 1, 0) where id = v_guild;
  return 'ok';
end;
$$;

create or replace function public.delete_guild_reply(p_user uuid, p_reply uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guild uuid;
  v_author uuid;
  v_post uuid;
begin
  select guild_id, author_id, post_id into v_guild, v_author, v_post
    from guild_replies where id = p_reply;
  if v_guild is null then return 'missing'; end if;

  if not (v_author = p_user or public.can_moderate_guild(p_user, v_guild)) then
    return 'denied';
  end if;

  delete from guild_replies where id = p_reply;
  update guild_posts set reply_count = greatest(reply_count - 1, 0) where id = v_post;
  return 'ok';
end;
$$;

-- ---------- joining: private groups need a code ----------------------------
create or replace function public.join_guild(p_user uuid, p_guild uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_added integer;
  v_private boolean;
begin
  select is_private into v_private from guilds where id = p_guild;
  if p_user is null or v_private is null then return 'missing'; end if;

  if v_private and not public.is_superadmin(p_user) then
    return 'private';
  end if;

  insert into guild_members (guild_id, user_id) values (p_guild, p_user)
  on conflict do nothing;

  get diagnostics v_added = row_count;
  if v_added = 0 then return 'already'; end if;

  update guilds set member_count = member_count + 1 where id = p_guild;
  return 'ok';
end;
$$;

-- status: ok | already | invalid | limit
create or replace function public.join_guild_with_code(p_user uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  v_guild guilds%rowtype;
  v_added integer;
begin
  if p_user is null then return jsonb_build_object('status', 'invalid'); end if;

  if (select count(*) from guild_code_attempts
       where user_id = p_user and attempted_at > now() - interval '1 hour') >= 10 then
    return jsonb_build_object('status', 'limit');
  end if;

  select * into v_guild from guilds where invite_code = v_code and v_code <> '';

  if not found then
    insert into guild_code_attempts (user_id) values (p_user);
    delete from guild_code_attempts where attempted_at < now() - interval '1 day';
    return jsonb_build_object('status', 'invalid');
  end if;

  insert into guild_members (guild_id, user_id) values (v_guild.id, p_user)
  on conflict do nothing;

  get diagnostics v_added = row_count;
  if v_added > 0 then
    update guilds set member_count = member_count + 1 where id = v_guild.id;
  end if;

  return jsonb_build_object(
    'status', case when v_added > 0 then 'ok' else 'already' end,
    'slug', v_guild.slug
  );
end;
$$;

-- ---------- profile: motto, rules, privacy, images -------------------------
-- p_emblem / p_banner: null keeps the current image, '' removes it.
-- status: ok | denied | missing | invalid
create or replace function public.update_guild_profile(
  p_user uuid, p_guild uuid,
  p_description text, p_motto text, p_rules text, p_private boolean,
  p_emblem text, p_banner text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  g guilds%rowtype;
  v_desc text := left(trim(coalesce(p_description, '')), 500);
  v_motto text := nullif(left(trim(coalesce(p_motto, '')), 80), '');
  v_rules text := nullif(left(trim(coalesce(p_rules, '')), 1500), '');
begin
  select * into g from guilds where id = p_guild;
  if not found then return 'missing'; end if;
  if not (g.owner_id = p_user or public.is_superadmin(p_user)) then return 'denied'; end if;

  update guilds set
    description = v_desc,
    motto = v_motto,
    rules = v_rules,
    is_private = coalesce(p_private, is_private),
    invite_code = case
      when coalesce(p_private, is_private) then coalesce(invite_code, public.guild_new_code())
      else null end,
    emblem_url = case when p_emblem is null then emblem_url else nullif(p_emblem, '') end,
    banner_url = case when p_banner is null then banner_url else nullif(p_banner, '') end
  where id = p_guild;

  return 'ok';
end;
$$;

create or replace function public.regenerate_guild_code(p_user uuid, p_guild uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_code text;
begin
  if not exists (
    select 1 from guilds where id = p_guild and is_private
       and (owner_id = p_user or public.is_superadmin(p_user))
  ) then
    return null;
  end if;

  v_code := public.guild_new_code();
  update guilds set invite_code = v_code where id = p_guild;
  return v_code;
end;
$$;

-- ---------- officers, removing members, ownership --------------------------
create or replace function public.set_guild_role(p_user uuid, p_guild uuid, p_member uuid, p_role text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target text;
begin
  if p_role not in ('officer', 'member') then return 'invalid'; end if;

  if not exists (
    select 1 from guilds where id = p_guild and (owner_id = p_user or public.is_superadmin(p_user))
  ) then
    return 'denied';
  end if;

  v_target := public.guild_role(p_member, p_guild);
  if v_target is null then return 'missing'; end if;
  if v_target = 'owner' then return 'denied'; end if;

  if p_role = 'officer' and v_target <> 'officer'
     and (select count(*) from guild_members where guild_id = p_guild and role = 'officer') >= 5 then
    return 'limit';
  end if;

  update guild_members set role = p_role where guild_id = p_guild and user_id = p_member;
  return 'ok';
end;
$$;

create or replace function public.remove_guild_member(p_actor uuid, p_guild uuid, p_member uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target text := public.guild_role(p_member, p_guild);
  v_actor text := public.guild_role(p_actor, p_guild);
  v_super boolean := public.is_superadmin(p_actor);
begin
  if v_target is null then return 'missing'; end if;
  if v_target = 'owner' then return 'denied'; end if;

  if not (
    v_super
    or v_actor = 'owner'
    or (v_actor = 'officer' and v_target = 'member')
  ) then
    return 'denied';
  end if;

  delete from guild_members where guild_id = p_guild and user_id = p_member;
  update guilds set member_count = greatest(member_count - 1, 0) where id = p_guild;
  return 'ok';
end;
$$;

-- status: ok | denied | missing | limit
create or replace function public.transfer_guild(p_owner uuid, p_guild uuid, p_new uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from guilds where id = p_guild and owner_id = p_owner) then return 'denied'; end if;
  if p_new = p_owner or public.guild_role(p_new, p_guild) is null then return 'missing'; end if;

  if not public.is_superadmin(p_new)
     and (select count(*) from guilds where owner_id = p_new) >= 2 then
    return 'limit';
  end if;

  update guild_members set role = 'officer' where guild_id = p_guild and user_id = p_owner;
  update guild_members set role = 'owner' where guild_id = p_guild and user_id = p_new;
  update guilds set owner_id = p_new where id = p_guild;

  insert into notifications (user_id, actor_id, type, title, message, link)
  select p_new, p_owner, 'announcement', 'You now lead a group',
         'You were given ownership of "' || name || '".', '/guilds/' || slug
    from guilds where id = p_guild;

  return 'ok';
end;
$$;

-- ---------- pinned discussion ------------------------------------------------
create or replace function public.pin_guild_post(p_user uuid, p_guild uuid, p_post uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_moderate_guild(p_user, p_guild) then return 'denied'; end if;

  if p_post is not null
     and not exists (select 1 from guild_posts where id = p_post and guild_id = p_guild) then
    return 'missing';
  end if;

  update guilds set pinned_post_id = p_post where id = p_guild;
  return 'ok';
end;
$$;

-- ---------- permissions ---------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array[
    'guild_role(uuid, uuid)', 'can_moderate_guild(uuid, uuid)', 'guild_new_code()',
    'delete_guild_post(uuid, uuid)', 'delete_guild_reply(uuid, uuid)',
    'join_guild(uuid, uuid)', 'join_guild_with_code(uuid, text)',
    'update_guild_profile(uuid, uuid, text, text, text, boolean, text, text)',
    'regenerate_guild_code(uuid, uuid)', 'set_guild_role(uuid, uuid, uuid, text)',
    'remove_guild_member(uuid, uuid, uuid)', 'transfer_guild(uuid, uuid, uuid)',
    'pin_guild_post(uuid, uuid, uuid)'
  ]
  loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
