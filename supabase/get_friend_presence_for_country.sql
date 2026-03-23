-- Run in Supabase SQL editor.
-- Friends who have at least one visit in this country but no non-empty place_notes
-- on that destination (so the viewer can ask them for tips).

create or replace function get_friend_presence_for_country(
  p_user_id      uuid,
  p_country_code text
)
returns table (
  destination_id   uuid,
  destination_name text,
  display_name     text,
  author_id        uuid,
  visit_year       integer
)
language sql
stable
as $$
  select
    d.id as destination_id,
    d.name as destination_name,
    u.display_name,
    u.id as author_id,
    (
      select max(v2.year_start)
      from visits v2
      where v2.destination_id = d.id
    ) as visit_year
  from destinations d
  join users u on u.id = d.user_id
  where
    d.user_id <> p_user_id
    and p_country_code is not null
    and d.country_code = p_country_code
    and exists (
      select 1 from visits v where v.destination_id = d.id
    )
    and not exists (
      select 1 from places pn
      where pn.destination_id = d.id
        and pn.user_id = d.user_id
        and trim(coalesce(pn.note, '')) <> ''
    )
  order by
    u.display_name asc,
    d.name asc;
$$;
