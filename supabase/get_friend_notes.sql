-- Run this once in the Supabase SQL editor.
-- Called from Sidebar.tsx via supabase.rpc('get_friend_notes', { ... })

create or replace function get_friend_notes(
  p_user_id     uuid,
  p_place_id    text,
  p_name        text,
  p_country_code text
)
returns table (
  id           uuid,
  place_name   text,
  note         text,
  sentiment    text,
  display_name text,
  visit_year   integer
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
    ) as visit_year
  from place_notes pn
  join destinations d on d.id = pn.destination_id
  join users        u on u.id  = pn.user_id
  where
    pn.user_id <> p_user_id
    and pn.note <> ''
    and (
      (p_place_id is not null and p_place_id <> '' and d.place_id = p_place_id)
      or (p_country_code is not null and d.name = p_name and d.country_code = p_country_code)
    )
  order by pn.created_at desc;
$$;
