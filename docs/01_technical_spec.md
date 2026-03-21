# Roamer — Technical Specification (v2)

## Overview
This document defines the technical architecture, stack decisions, and implementation details for Roamer Phase 1 v2. It is intended to be used as context for Claude Code and Cursor. All decisions in this document are locked for Phase 1. Do not deviate from this spec without explicit instruction.

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
- Country fill layer: click a country to cycle through visited / lived / reset. Choropleth fill driven by a dedicated countries table
- Destination pins: specific places (cities, neighborhoods, country centroids) with three states: visited / lived / next up
- Next Up destinations capped at 5
- Add a destination via Google Places search (autocomplete) — search is single-purpose: it adds destinations only
- Onboarding state on first load: country fill mode is active by default with a callout prompt. Toggle to deactivate when done
- Log a visit to a destination: type (visited / lived), year, notes
- Log a destination as Next Up: optional target year
- A destination can have both visit history and a Next Up record simultaneously (e.g. returning to a place)
- Sentiment notes per destination: three buckets (recommend / meh / skip), each item is a Google Places result with an optional short text note
- Clicking a destination pin opens a sidebar with full detail including sentiment notes
- Clicking a country (in explore mode) surfaces a country panel showing all destinations within that country and their sentiment notes
- Notes auto-save on blur
- Delete a destination entirely
- Shareable image export: full world view with country fill + destination pins + stat block
- All data persists in Supabase

**Out of scope for Phase 1:**
- User authentication
- Multiple users
- Friend notes or social layer
- AI conversation or AI features of any kind
- Photos or media
- Trip grouping
- Mobile app

---

## Database Schema

Four tables. No RLS policies in Phase 1.

```sql
-- Countries the user has visited or lived in
create table countries (
  id uuid default gen_random_uuid() primary key,
  country_code text not null unique,   -- ISO 3166-1 alpha-2 e.g. 'ES'
  country_name text not null,
  continent text,
  status text not null check (status in ('visited', 'lived')),
  created_at timestamp with time zone default now()
);

-- Specific destinations: cities, neighborhoods, or country centroids
create table destinations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  place_id text,
  lat float not null,
  lng float not null,
  country_code text,                   -- links to countries table by code
  country_name text,
  continent text,
  next_up boolean not null default false,  -- true if this is a Next Up destination
  next_up_year integer,                    -- optional target year for Next Up
  created_at timestamp with time zone default now()
);

-- Visit records: each destination can have multiple visits over time
create table visits (
  id uuid default gen_random_uuid() primary key,
  destination_id uuid not null references destinations(id) on delete cascade,
  type text not null check (type in ('visited', 'lived')),
  year_start integer,
  month_start integer check (month_start between 1 and 12),
  year_end integer,                    -- set for multi-year stays (lived), otherwise null
  month_end integer check (month_end between 1 and 12),
  notes text default '',               -- freetext personal context for this visit
  created_at timestamp with time zone default now()
);

-- Sentiment notes per destination: recommend / meh / skip items
create table place_notes (
  id uuid default gen_random_uuid() primary key,
  destination_id uuid not null references destinations(id) on delete cascade,
  place_name text not null,            -- name of the specific place (restaurant, museum, etc.)
  place_id text,                       -- Google Places ID for the specific place
  sentiment text not null check (sentiment in ('recommend', 'meh', 'skip')),
  note text default '',                -- optional short text note
  created_at timestamp with time zone default now()
);
```

**Notes on the schema:**
- `countries` is an independent table. It is not derived from destinations — it has its own lifecycle.
- Country status auto-promotes (nothing → visited → lived) when a visit record is added, but never auto-demotes. Deletions do not affect country status. The user fixes country status manually if needed.
- Country status promotion rule: if any visit for a destination in that country has type 'lived', promote country to 'lived'. If any visit has type 'visited' and country has no record yet, create it as 'visited'. Next Up destinations do not affect country status.
- A destination has no state field. Its visual state is derived from its visits array: lived (if any visit has type 'lived') > visited (if any visits exist) > next_up (if next_up = true and no visits). A destination can be both next_up and have visit history simultaneously (planning a return trip).
- A destination can have multiple visit records — e.g. visited 2008, lived 2012–2014, visited 2019. Each is a separate row in the visits table.
- Next Up is a boolean flag on the destination, not a visit record. It represents future intent, not a past chapter.
- Next Up destinations: enforce a maximum of 5 in application logic, not the DB.
- `on delete cascade` on visits and place_notes ensures child records are cleaned up when a destination is deleted.
- `country_code` and `country_name` are stored on destinations to enable stat calculations without joins. Populate from Google Places response when the destination is created.
- `month_start` and `month_end` on visits are stored as integers 1–12. Convert to display names (January, February etc.) in the frontend using `lib/formatUtils.ts`. Never store month names as strings in the DB.
- `notes` on visits is freetext personal context for that specific trip — why you were there, what the experience was like. This is distinct from place_notes which are structured sentiment items about specific places within the destination.

---

## Country Status Logic

Status only ever promotes, never demotes automatically.

Priority order: lived > visited > nothing

Auto-promotion rules (triggered when a visit record is saved):
- If visit.type = 'visited' and no country record exists → create country record with status 'visited'
- If visit.type = 'visited' and country record exists with status 'visited' → no change
- If visit.type = 'lived' and country record exists with any status → update to 'lived'
- Adding a Next Up destination (no visit record) → no change to country record

Manual override: the user can click a country directly to cycle its status. This always takes effect regardless of visit data. Cycling: nothing → visited → lived → nothing.

Deletions: deleting a destination or visit never changes the country record. User must manually reset if needed.

---

## Map Rendering — Two Layers

The map renders two distinct visual layers simultaneously:

**Layer 1 — Country choropleth fill**
- Uses Mapbox's built-in `country-boundaries` tileset or equivalent GeoJSON source
- Countries in the `countries` table are filled based on their status
- Visited: warm coral fill
- Lived: deep green fill
- All other countries: neutral warm gray (unvisited land)

**Layer 2 — Destination pins**
- Custom SVG markers placed at destination coordinates
- Pin style determined by destination state (see Pin Visual System below)

Both layers are always visible simultaneously. They are independent — a country can be filled with no pins inside it, and a pin can exist inside an unfilled country (though the country will auto-promote on pin creation for visited/lived destinations).

---

## Pin Visual System

Pin state is derived from the destination's visits array and next_up flag, not stored directly.

Priority order: lived > visited > next_up

| Derived State | Shape | Color |
|---|---|---|
| Visited | Filled circle | Coral / warm red |
| Lived | House shape | Deep green |
| Next Up | Filled star | Bright purple |

Derivation logic (lives in `lib/mapUtils.ts`):
- If any visit has type 'lived' → show lived pin
- Else if any visits exist → show visited pin
- Else if next_up = true → show next_up pin

A destination with both visit history and next_up = true shows the visit-derived pin (lived or visited) as primary, with a small purple dot overlay indicating it is also Next Up.

---

## Map Interaction Modes

The map has two distinct modes. Only one is active at a time.

**Country Fill Mode (default on first load)**
- Cursor shows a fill/paint indicator
- Clicking a country cycles its status: nothing → visited → lived → nothing
- Clicking a destination pin does nothing
- A prominent onboarding callout is shown on first load: "Click countries you've visited or lived in to fill your map"
- An indicator arrow points to the mode toggle with the label "Toggle off when you're done"
- The callout dismisses once the user toggles off, and does not appear again

**Explore Mode (default after onboarding)**
- Clicking a country opens the Country Panel (see below)
- Clicking a destination pin opens the Sidebar
- No country status changes on click

The mode toggle button is fixed in the UI, always visible, clearly indicating which mode is active.

---

## Add Destination Flow

Search is the only way to add destinations. Map click-to-add is removed in v2.

1. User types in search bar (Google Places autocomplete)
2. User selects a suggestion
3. App extracts name, place_id, lat, lng, country_code, country_name, continent from Places response
4. A modal asks the user: Visited / Lived / Next Up
5. If Visited or Lived: prompt for year_start (required) and year_end (optional, for lived stays)
6. If Next Up: prompt for optional target year. Check current Next Up count — if already at 5, prompt user to remove one first
7. Save destination record to Supabase
8. If Visited or Lived: save a visit record linked to the destination
9. Run country auto-promotion logic — if promotion needed, upsert the country record
10. Pin appears on map, map flies to location

---

## Sidebar — Destination Detail

Slides in from the right on desktop, up from the bottom on mobile. Opens when a destination pin is clicked in Explore Mode.

Displays (top to bottom):
- Destination name and country
- Next Up toggle — if destination has no visits, shows as the primary state. If destination has visits, shows as a secondary checkbox ("Also planning a return?"). Saves immediately on change.
- Visit history section: each visit shown as a clean non-editable card by default. Card displays: type pill (Visited/Lived in appropriate color), formatted date string (e.g. "March 2012", "2012", "Feb–June 2012", "2012–2014"), notes text if present. Small edit icon switches card into edit mode. Edit mode shows: type toggle, month_start select (optional), year_start input, month_end select (optional, lived only), year_end input (optional, lived only), notes textarea, save button, delete button. Save returns card to display state.
- "Add visit" button — inline form with same fields as edit mode above. Save writes to visits table and returns to display state.
- Place Notes section (below visit history, clear visual separator): three columns (Recommend / Meh / Skip)
  - Each column shows logged place notes for this destination
  - Add button per column: opens PlaceNoteInput — Google Places autocomplete scoped to destination area, optional short text note, save button
  - Each note item shows place name + note text, with a delete button
- Delete destination button with confirm dialog ("Remove [name] from your map?")

Visit saves are explicit (save button click), not auto-save on blur. Next Up toggle saves immediately.

---

## Country Panel

Opens when a country is clicked in Explore Mode. Simpler than the Sidebar.

Displays:
- Country name and current status (visited / lived)
- Status toggle (visited / lived / remove) — saves immediately
- List of all destination pins within this country, each linking to open its Sidebar
- In a future phase: friend notes for this country will appear here. Leave a placeholder section in the UI labelled "Friends who've been here" with a coming soon state.

---

## Shareable Image Export

The export produces a single image containing:
- Full world view (zoom level 2, centered on [20, 20]) showing all country fills and destination pins
- Stat block overlay: number of countries visited/lived, number of continents, years traveling (earliest year_start to present)
- A default label ("My travel map") — user name field deferred to when auth exists

Implementation: use `mapboxgl.Map.getCanvas()` to capture the map, composite the stat block using HTML Canvas. Export as PNG.

The choropleth fill makes this export significantly more visually compelling than v1 — the filled countries read immediately as a travel history at a glance.

---

## Project Structure

```
/app
  /page.tsx                   — main map page
  /layout.tsx                 — root layout
/components
  /Map.tsx                    — Mapbox map, choropleth layer, pin rendering, mode management
  /CountryLayer.tsx           — Mapbox layer component for country choropleth fill
  /DestinationPin.tsx         — custom SVG pin component, state derived from visits
  /SearchBar.tsx              — Google Places autocomplete, single-purpose add destination
  /Sidebar.tsx                — destination detail panel including visit history
  /VisitCard.tsx              — individual visit record display and edit
  /AddVisitForm.tsx           — inline form for adding a new visit to an existing destination
  /CountryPanel.tsx           — country detail panel (status + destination list)
  /AddDestinationModal.tsx    — modal for setting state/year after search selection
  /PlaceNoteInput.tsx         — Google Places autocomplete scoped for adding sentiment notes
  /ExportButton.tsx           — triggers shareable image export
  /ModeToggle.tsx             — country fill mode vs explore mode toggle
  /OnboardingCallout.tsx      — first-load prompt pointing to mode toggle
/lib
  /supabase.ts                — Supabase client initialisation
  /types.ts                   — TypeScript types
  /mapUtils.ts                — pin state derivation logic, country promotion logic, export helpers
  /countryUtils.ts            — ISO country code helpers, continent mapping
  /formatUtils.ts             — date/month formatting helpers (month integer to name, visit date display string)
/styles
  /globals.css                — Tailwind base styles
```

---

## TypeScript Types

```typescript
// lib/types.ts

export type VisitType = 'visited' | 'lived'
export type CountryStatus = 'visited' | 'lived'
export type PinState = 'visited' | 'lived' | 'next_up'
export type Sentiment = 'recommend' | 'meh' | 'skip'
export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania' | 'Antarctica'
export type MapMode = 'fill' | 'explore'

export interface Country {
  id: string
  country_code: string
  country_name: string
  continent?: Continent
  status: CountryStatus
  created_at: string
}

export interface Destination {
  id: string
  name: string
  place_id?: string
  lat: number
  lng: number
  country_code?: string
  country_name?: string
  continent?: Continent
  next_up: boolean
  next_up_year?: number
  created_at: string
  visits: Visit[]
  place_notes?: PlaceNote[]
}

export interface Visit {
  id: string
  destination_id: string
  type: VisitType
  year_start?: number
  month_start?: number        // 1–12, optional
  year_end?: number           // lived stays only
  month_end?: number          // 1–12, optional
  notes: string               // freetext personal context
  created_at: string
}

export interface PlaceNote {
  id: string
  destination_id: string
  place_name: string
  place_id?: string
  sentiment: Sentiment
  note: string
  created_at: string
}
```

---

## Responsive Behaviour

- Desktop: sidebar and country panel open on the right, map fills remaining width
- Mobile: sidebar and country panel slide up as bottom sheet, map visible behind
- Search bar: fixed top-left on desktop, top full-width on mobile
- Mode toggle: fixed bottom-right on both breakpoints
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

1. Create a new Supabase project (or wipe existing)
2. Go to SQL Editor and run the four-table schema above exactly as written
3. Go to Settings > API and copy the Project URL and anon public key
4. Paste into `.env.local` as shown above
5. Do NOT enable Row Level Security in Phase 1
6. Do NOT create any auth users or policies in Phase 1

---

## Mapbox Setup Instructions

1. Use existing Mapbox token
2. Starting map style: `mapbox://styles/mapbox/light-v11`
3. Set projection to Mercator (flat 2D) on map initialisation
4. Country boundaries source: use Mapbox's `mapbox-countries` tileset for the choropleth layer, or load a world GeoJSON. The layer must support per-country fill color driven by the countries table data.

---

## Google Places Setup Instructions

Unchanged from v1. Existing API key with Places API and Geocoding API enabled is fine.

---

## Notes for Claude Code

- Do not add authentication in Phase 1 under any circumstances
- Do not add Row Level Security to Supabase in Phase 1
- Do not create additional database tables beyond the four defined above
- Do not install additional dependencies without flagging them first
- Keep components small and single-purpose
- All Supabase calls go through `/lib/supabase.ts` only
- TypeScript types for all data structures defined in `/lib/types.ts`
- Pin state is always derived from a destination's visits array and next_up flag — never stored directly. Derivation logic lives in `lib/mapUtils.ts` as `getPinState(destination: Destination): PinState` — do not duplicate this logic in components
- Country status promotion logic lives in `/lib/mapUtils.ts` — do not duplicate it in components
- The map must use flat Mercator projection — never globe
- Search bar is single-purpose: it adds destinations only. It does not trigger exploration or open panels
- Next Up destinations are capped at 5 — enforce in application logic before saving
- A destination with visits and next_up = true is valid — it means planning a return trip
- Map click behaviour depends entirely on which mode is active — country fill mode and explore mode are mutually exclusive
- The onboarding callout appears on first load only and is dismissed permanently once the user toggles to explore mode
- When uncertain, ask — do not improvise