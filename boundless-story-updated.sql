-- Boundless: make stories.updated_at track the latest chapter publish.
-- Safe to run more than once.

create or replace function public.bump_story_on_chapter_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.stories
     set updated_at = greatest(coalesce(updated_at, now()), coalesce(new.published_at, now()))
   where id = new.story_id;
  return new;
end;
$$;

revoke all on function public.bump_story_on_chapter_publish() from public, anon, authenticated;

drop trigger if exists chapters_bump_story_updated on public.chapters;
create trigger chapters_bump_story_updated
  after insert or update of status on public.chapters
  for each row
  when (new.status = 'Published')
  execute function public.bump_story_on_chapter_publish();

-- Backfill from the real latest published chapter.
update public.stories s
   set updated_at = greatest(s.updated_at, m.last_pub)
  from (
    select story_id, max(published_at) as last_pub
      from public.chapters
     where status = 'Published' and published_at is not null
     group by story_id
  ) m
 where m.story_id = s.id
   and m.last_pub > s.updated_at;
