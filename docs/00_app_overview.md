# Roamer — App Overview

## What It Is
A personal travel map that grows with you. Not a trip generator — a living record of everywhere you've been, everywhere you've called home, and everywhere you're headed next. The map is the product. Everything else serves it.

## The Core Problem
Most AI travel tools assume you want a finished itinerary. Real travel is messier — destinations accumulate over a lifetime, each with its own history and context. There's no good tool for capturing that story, and no good way to share it with friends who are planning their own trips.

## The Core Insight
Your relationship with a place isn't a status — it's a history. You might have visited Paris in 2008, lived there from 2012 to 2014, and be planning to go back in 2026. That's three chapters of the same story, each with different context and different notes. The app captures all of it.

## The Shareable Visual
The map is designed to be exported and shared — a single image that shows your entire travel history at a glance, with a stat block (countries visited, continents, years traveling). This is the acquisition mechanic. Someone sees your map, wants one of their own.

## Data Model
A destination is a place. Your relationship to it is captured in separate records:

**Users** — one row per Roamer user
- slug (URL-safe, e.g. `colin` → `/u/colin`), display_name
- email and auth_id reserved for Phase 2 auth upgrade, unused in Phase 1

**Countries** — countries the user has visited or lived in
- country_code, country_name, continent, status (visited | lived)
- Status only ever promotes (nothing → visited → lived), never auto-demotes
- Driven by visit records and manual map clicks

**Destinations** — specific places (cities, neighborhoods, country centroids)
- name, coordinates, place_id — geography + ownership
- next_up boolean flag + optional next_up_year — represents future intent
- A destination can be both next_up and have visit history (planning a return trip)

**Visits** — past chapters at a destination
- type: visited | lived
- year_start, month_start, year_end, month_end (approximate is fine)
- notes: freetext personal context for this specific trip
- A destination can have multiple visits (visited 2008, lived 2012–2014, visited 2019)

**Place Notes** — sentiment items about specific places within a destination
- sentiment: recommend | meh | skip
- place_name + optional Google Places ID
- optional short text note
- category_emoji auto-assigned, user-overridable

A destination gets one pin on the map. The pin's visual treatment is derived from its visit history and next_up flag — never stored directly.

## Pin Visual System
Pin state is derived, not stored. Priority: lived > visited > next_up.

| Derived State | Shape | Color |
|---|---|---|
| Visited | Filled circle | Coral / warm red |
| Lived | House shape | Deep green |
| Up Next | Filled star | Bright purple |

A destination with both visit history and next_up = true shows the visit-derived pin as primary, with a small purple dot overlay indicating it is also Up Next. Up Next destinations are capped at 5.

## Map Visual Style
Illustrated, colorful, warm. Visited countries filled in coral, lived-in countries in deep green. Not a dark political map — closer to a travel poster. Flat 2D Mercator projection. Designed to be beautiful enough to export and share.

## Build Philosophy
- Responsive web app, mobile-friendly
- Build for one user first, validate before scaling
- Start with the visual — if the map isn't compelling to look at and share, nothing else matters
- Add features in phases, never outpace validation
- Keep technical complexity ruthlessly low at each phase
- All architecture decisions made with the AI layer in mind, even before it's built

## Tech Stack
- **Frontend:** Next.js 14 (App Router, TypeScript)
- **Database:** Supabase (Postgres, no auth in Phase 1)
- **Map:** Mapbox GL JS via react-map-gl
- **Places:** Google Places API
- **Hosting:** Vercel
- **Styling:** Tailwind CSS

## Phased Roadmap

**Phase 1 — The map, your history, and a placeholder friends layer**
Log where you've been and where you want to go. Get the visual right. Build the shareable image. Multi-user support via URL slugs (no login). Placeholder "Friends who've been here" sections in the UI — data model ready, social features not yet wired. Validate with a small group of friends.

**Phase 2 — Auth and profile**
Add real authentication (Google SSO or similar). Connect the existing `auth_id` and `email` fields on the users table. User profile page. Enable Row Level Security in Supabase. Activate the friends layer using the existing data model.

**Phase 3 — The AI conversation layer**
Voice-first AI companion that populates your map through conversation. Pins drop in real time as you talk. Notes captured and structured automatically. Builds a rich travel profile over time that makes it an increasingly useful planning partner.
