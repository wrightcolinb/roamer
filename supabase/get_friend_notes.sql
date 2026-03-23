-- Run in the Supabase SQL editor.
-- Called from Sidebar.tsx via supabase.rpc('get_friend_notes', { ... })
--
-- If you change the RETURNS TABLE columns, Postgres requires dropping the old
-- function first (CREATE OR REPLACE cannot change the row type).

drop function if exists get_friend_notes(uuid, text, text, text);

create or replace function get_friend_notes(
  p_user_id     uuid,
  p_place_id    text,
  p_name        text,
  p_country_code text
)
returns table (
  id               uuid,
  place_name       text,
  note             text,
  sentiment        text,
  display_name     text,
  visit_year       integer,
  author_id        uuid,
  destination_name text,
  created_at       timestamptz,
  category_emoji   text
)
language sql
stable
as $$
  select
    pn.id,
    pn.place_name,
    pn.note,
    pn.sentiment,
    u.display_name,
    (
      select max(v.year_start)
      from visits v
      where v.destination_id = d.id
    ) as visit_year,
    u.id as author_id,
    d.name as destination_name,
    pn.created_at,
    pn.category_emoji
  from places pn
  join destinations d on d.id = pn.destination_id
  join users        u on u.id  = pn.user_id
  where
    pn.user_id <> p_user_id
    and pn.note <> ''
    and (
      (p_place_id is not null and p_place_id <> '' and d.place_id = p_place_id)
      or (p_country_code is not null and d.name = p_name and d.country_code = p_country_code)
    )
  order by
    case pn.sentiment
      when 'recommend' then 1
      when 'meh' then 2
      when 'skip' then 3
      else 4
    end,
    pn.created_at desc;
$$;
