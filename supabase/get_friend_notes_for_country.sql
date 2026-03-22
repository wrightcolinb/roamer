-- Run in Supabase SQL editor after get_friend_notes.sql.
-- Aggregates other users' place notes for all destinations in a country.

drop function if exists get_friend_notes_for_country(uuid, text);

create or replace function get_friend_notes_for_country(
  p_user_id      uuid,
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
  from place_notes pn
  join destinations d on d.id = pn.destination_id
  join users        u on u.id  = pn.user_id
  where
    pn.user_id <> p_user_id
    and pn.note <> ''
    and p_country_code is not null
    and d.country_code = p_country_code
  order by
    case pn.sentiment
      when 'recommend' then 1
      when 'meh' then 2
      when 'skip' then 3
      else 4
    end,
    pn.created_at desc;
$$;
