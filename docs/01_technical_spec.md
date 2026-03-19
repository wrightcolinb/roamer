# Roamer — Technical Specification

## Overview
This document defines the technical architecture, stack decisions, and implementation details for Roamer Phase 1. It is intended to be used as context for Claude Code and Cursor. All decisions in this document are locked for Phase 1. Do not deviate from this spec without explicit instruction.

---

## Stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) | React, TypeScript |
| Database | Supabase (Postgres) | No auth in Phase 1 |
| Map | Mapbox GL JS | Via react-map-gl wrapper |
| Places Search | Google Places API | Autocomplete + reverse geocode |
| Hosting | Vercel | Auto-deploy from GitHub |
| Styling | Tailwind CSS | Utility-first, mobile-friendly |

---

## Phase 1 Scope

Phase 1 has two goals: get the data model right, and get the visual right. No AI. No friends layer. No auth.

**In scope:**
- Flat 2D Mapbox map as the main interface (Mercator projection, warm illustrated style — see Map Style below)
- Add a destination via Google Places search (autocomplete)
- Add a destination via map click (reverse geocode, toggled mode — not on every click)
- Log a visit to a destination: type (visited / lived), year, notes
- Log an intent for a destination: state (on my list / planning), optional target date
- A destination can have both visit history and future intent simultaneously
- Pins are shape-coded and color-coded by state (see Pin System below)
- Clicking a pin opens a sidebar with full destination detail
- Sidebar shows: name, all visits (chronological), intent if present, add visit / add intent controls
- Notes editable inline, auto-save on blur
- Delete a visit or intent record individually
- Delete a destination entirely (removes all associated records)
- Shareable image export: map viewport + stat block (countries visited, continents, years traveling)
- All data persists in Supabase

**Out of scope for Phase 1:**
- User authentication
- Multiple users
- AI conversation or AI features of any kind
- Sub-places (restaurants, museums within a destination)
- Friend notes or social layer
- Photos or media
- Trip grouping
- Mobile app

---

## Database Schema

Three tables. Visits and intents are child records of destinations. No RLS policies in Phase 1.

```sql
create table destinations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  place_id text,
  lat float not null,
  lng float not null,
  country text,
  continent text,
  created_at timestamp with time zone default now()
);

create table visits (
  id uuid default gen_random_uuid() primary key,
  destination_id uuid not null references destinations(id) on delete cascade,
  type text not null check (type in ('visited', 'lived')),
  year_start integer,
  year_end integer,
  notes text default '',
  created_at timestamp with time zone default now()
);

create table intents (
  id uuid default gen_random_uuid() primary key,
  destination_id uuid not null references destinations(id) on delete cascade,
  state text not null check (state in ('on my list', 'planning')),
  target_year integer,
  notes text default '',
  created_at timestamp with time zone default now()
);
```

**Notes on the schema:**
- `country` and `continent` are stored on the destination to enable stat calculations without geocoding at read time. Populate from Google Places response when the destination is created.
- `year_start` / `year_end` on visits: for a single trip, set both to the same year. For a multi-year stay (lived), set the range. Both are optional — approximate is fine.
- A destination can have multiple visit records (e.g. visited 2008, lived 2012–2014, visited 2019).
- A destination can have at most one intent record. Enforce this in application logic, not the DB.
- `on delete cascade` ensures visit and intent records are cleaned up when a destination is deleted.

---

## Pin Visual System

Pins use distinct shapes per state, not just colors. The dominant state for a destination is determined by priority order: lived > visited for past states, planning > on my list for future states.

| State | Shape | Color |
|---|---|---|
| Visited | Filled circle | Coral / warm red |
| Lived | House shape | Deep green |
| On my list | Outlined star | Muted purple |
| Planning | Filled star | Bright purple |

If a destination has both a visit record and an intent record, render the visit pin shape as primary with a small intent indicator (dot or ring) overlaid.

---

## Map Style

The map should feel illustrated and warm — not a dark political map. Target aesthetic: bold continent fills in distinct regional colors, minimal label clutter, closer to a travel poster than a navigation tool.

**Mapbox configuration:**
- Projection: Mercator (flat 2D) — set `projection: 'mercator'` on map init
- Starting style base: `mapbox://styles/mapbox/light-v11` as the starting point, then customise via Mapbox Studio or style overrides
- Initial view: center `[20, 20]`, zoom `2`
- Ocean color: warm pale blue (#D4E8F0 or similar)
- Land color: use distinct warm fills per continent region if possible via style layers, otherwise a single warm neutral (#D8D4C8)
- Country borders: subtle, thin, warm gray — not bold political lines

**Style goal**: when a user exports their map as an image, it should look beautiful enough to post on Instagram without any additional design work.

---

## Shareable Image Export

A core Phase 1 feature. The export produces a single image containing:
- The current map viewport (or a fixed world view showing all pins)
- A stat block overlay with: number of countries visited, number of continents, years traveling (first visit year to present)
- The user's name or a default label ("My travel map")

Implementation approach: use `mapboxgl.Map.getCanvas()` to capture the map, then composite the stat block using an HTML Canvas overlay. Export as PNG.

The stat block should match the illustrated visual style — warm, clean, not corporate.

---

## Add Destination Flow

### Via search (default mode)
1. User types in search bar (Google Places autocomplete)
2. User selects a suggestion
3. App extracts name, place_id, lat, lng, country, continent from Places response
4. A modal asks: "Have you been here?" with options: Visited / Lived / On my list / Planning
5. If Visited or Lived: prompt for year(s) and optional notes
6. If On my list or Planning: prompt for optional target year
7. Records saved to Supabase (destination + visit or intent)
8. Pin appears on map, map flies to location

### Via map click (toggled mode)
- A clearly visible "Add place" toggle button arms the cursor for click-to-add mode
- The map does NOT trigger add-place on every click — only when the toggle is active
- When active, cursor changes to crosshair
- User clicks the map → reverse geocode to get place name → same modal flow as search
- Toggle deactivates after a place is added, or on explicit cancel

---

## Sidebar — Destination Detail

Slides in from the right on desktop, up from the bottom on mobile.

Displays:
- Destination name
- All visit records, chronological (type, year range, notes — each editable)
- Intent record if present (state, target year, notes — editable)
- "Add another visit" control (for return trips)
- "Add intent" control (if no intent record exists)
- "Remove intent" control (if intent record exists)
- Delete destination button (with confirm dialog)

Auto-save notes on blur. Status/type changes save immediately on change.

---

## Project Structure

```
/app
  /page.tsx              — main map page
  /layout.tsx            — root layout
/components
  /Map.tsx               — Mapbox map, pin rendering, add-place toggle
  /SearchBar.tsx         — Google Places autocomplete input
  /Sidebar.tsx           — destination detail panel
  /Pin.tsx               — custom map pin component (shape-coded)
  /AddPlaceModal.tsx     — modal for logging visit or intent after search/click
  /ExportButton.tsx      — triggers shareable image export
/lib
  /supabase.ts           — Supabase client initialisation
  /types.ts              — TypeScript types
  /mapUtils.ts           — pin state priority logic, export helpers
/styles
  /globals.css           — Tailwind base styles
```

---

## TypeScript Types

```typescript
// lib/types.ts

export type VisitType = 'visited' | 'lived'
export type IntentState = 'on my list' | 'planning'
export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania' | 'Antarctica'

export interface Destination {
  id: string
  name: string
  place_id?: string
  lat: number
  lng: number
  country?: string
  continent?: Continent
  created_at: string
  visits: Visit[]
  intent?: Intent
}

export interface Visit {
  id: string
  destination_id: string
  type: VisitType
  year_start?: number
  year_end?: number
  notes: string
  created_at: string
}

export interface Intent {
  id: string
  destination_id: string
  state: IntentState
  target_year?: number
  notes: string
  created_at: string
}

export type PinState = 'lived' | 'visited' | 'planning' | 'on my list'
```

---

## Responsive Behaviour

- Desktop: sidebar opens on the right, map fills remaining width
- Mobile: sidebar slides up as a bottom sheet, map visible behind it
- Search bar: fixed top-left on desktop, top full-width on mobile
- Add place toggle: fixed bottom-right on both breakpoints
- Export button: fixed top-right on both breakpoints

---

## Environment Variables

```
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=
```

---

## Supabase Setup Instructions

Follow these steps exactly. Do not let Claude Code make decisions about Supabase configuration.

1. Create a new Supabase project at supabase.com
2. Go to SQL Editor and run the three-table schema above exactly as written
3. Go to Settings > API and copy the Project URL and anon public key
4. Paste into `.env.local` as shown above
5. Do NOT enable Row Level Security in Phase 1
6. Do NOT create any auth users or policies in Phase 1

---

## Mapbox Setup Instructions

1. Create an account at mapbox.com
2. Go to Tokens and create a new public token
3. Paste into `.env.local` as shown above
4. Starting map style: `mapbox://styles/mapbox/light-v11`
5. Set projection to Mercator (flat 2D) on map initialisation

---

## Google Places Setup Instructions

1. Go to Google Cloud Console
2. Enable Places API and Geocoding API
3. Create an API key restricted to these two APIs
4. Paste into `.env.local` as shown above

---

## Notes for Claude Code

- Do not add authentication in Phase 1 under any circumstances
- Do not add Row Level Security to Supabase in Phase 1
- Do not create additional database tables beyond the three defined above
- Do not install additional dependencies without flagging them first
- Keep components small and single-purpose
- All Supabase calls go through `/lib/supabase.ts` only
- TypeScript types for all data structures defined in `/lib/types.ts`
- Pin state priority logic (lived > visited, planning > on my list) lives in `/lib/mapUtils.ts` — do not duplicate it in components
- The map must use flat Mercator projection — do not use globe projection
- The add-place click handler must only fire when the add-place toggle is active — do not make every map click trigger the add flow
- A destination may have multiple visit records but only one intent record — enforce this in application logic
