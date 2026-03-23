-- One row per other user's destination in the country that has at least one visit
-- or at least one non-empty place_note. Used to build grouped "friends by location"
-- in the country panel (details open in the destination sidebar).
--
-- If you change the RETURNS TABLE columns, drop the old function first.

drop function if exists get_friend_country_activity(uuid, text);

create or replace function get_friend_country_activity(
  p_user_id      uuid,
  p_country_code text
)
returns table (
  destination_name text,
  place_id         text,
  country_code     text,
  country_name     text,
  lat              double precision,
  lng              double precision,
  continent        text,
  author_id        uuid,
  display_name     text,
  note_count       bigint,
  visit_label      text
)
language sql
stable
as $$
  select
    d.name as destination_name,
    d.place_id,
    d.country_code,
    d.country_name,
    d.lat,
    d.lng,
    d.continent,
    u.id as author_id,
    u.display_name,
    (
      select count(*)::bigint
      from places pn
      where pn.destination_id = d.id
        and pn.user_id = d.user_id
        and trim(coalesce(pn.note, '')) <> ''
    ) as note_count,
    (
      case
        when exists (
          select 1 from visits v
          where v.destination_id = d.id and v.type = 'lived'
        ) then
          'Lived in ' || coalesce(
            (
              select max(v.year_start)::text
              from visits v
              where v.destination_id = d.id and v.type = 'lived'
            ),
            '…'
          )
        when exists (
          select 1 from visits v
          where v.destination_id = d.id and v.type = 'visited'
        ) then
          'Visited in ' || coalesce(
            (
              select max(v.year_start)::text
              from visits v
              where v.destination_id = d.id and v.type = 'visited'
            ),
            '…'
          )
        else null
      end
    ) as visit_label
  from destinations d
  join users u on u.id = d.user_id
  where
    d.user_id <> p_user_id
    and p_country_code is not null
    and d.country_code = p_country_code
    and (
      exists (select 1 from visits v where v.destination_id = d.id)
      or exists (
        select 1 from places pn
        where pn.destination_id = d.id
          and pn.user_id = d.user_id
          and trim(coalesce(pn.note, '')) <> ''
      )
    )
  order by d.name asc, u.display_name asc;
$$;
