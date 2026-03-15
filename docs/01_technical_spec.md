# roamer — Technical Specification

## Overview
This document defines the technical architecture, stack decisions, and implementation details for roamer Phase 1. It is intended to be used as a reference document for Claude Code and Cursor. All decisions in this document are locked for Phase 1. Do not deviate from this spec without explicit instruction.

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

Phase 1 is intentionally minimal. The only goal is a working map where destinations can be added, viewed, and categorized. There is no authentication, no AI, and no trip grouping.

**In scope:**
- Interactive Mapbox map as the main interface
- Add a destination via search (Google Places autocomplete)
- Add a destination via clicking directly on the map (reverse geocode to get place name)
- Each destination has a status: `been`, `planning`, or `dreaming`
- Pins are color-coded by status
- Clicking a pin opens a sidebar with destination details
- Sidebar shows name, status, notes, and date added
- Notes field is editable inline in the sidebar
- Status is editable inline in the sidebar
- Delete a destination from the sidebar
- All data persists in Supabase

**Out of scope for Phase 1:**
- User authentication
- Multiple users
- Trip grouping or hierarchical destinations
- AI features
- Photos or media
- Cost or timing information
- Mobile app

---

## Database Schema

Single table. No foreign keys. No RLS policies in Phase 1.

```sql
create table destinations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  place_id text,
  lat float not null,
  lng float not null,
  status text not null check (status in ('been', 'planning', 'dreaming')),
  notes text default '',
  created_at timestamp with time zone default now()
);
```

---

## Environment Variables

The following environment variables are required. Store in `.env.local` and in Vercel project settings.

```
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=
```

---

## Project Structure

```
/app
  /page.tsx              — main map page
  /layout.tsx            — root layout
/components
  /Map.tsx               — Mapbox map, pin rendering, click handler
  /SearchBar.tsx         — Google Places autocomplete input
  /Sidebar.tsx           — destination detail panel
  /Pin.tsx               — custom map pin component
/lib
  /supabase.ts           — Supabase client initialisation
  /types.ts              — TypeScript types
/styles
  /globals.css           — Tailwind base styles
```

---

## Key Interactions

### Adding a destination via search
1. User types in search bar
2. Google Places autocomplete returns suggestions
3. User selects a suggestion
4. App extracts name, place_id, lat, lng from Places response
5. Modal/prompt asks user to select status (been / planning / dreaming)
6. Destination saved to Supabase
7. Pin appears on map, map flies to location

### Adding a destination via map click
1. User clicks directly on the map
2. App reverse geocodes the clicked coordinates via Google Places API
3. Returns best matching place name for those coordinates
4. Modal/prompt asks user to confirm name and select status
5. Destination saved to Supabase
6. Pin appears on map

### Viewing a destination
1. User clicks a pin on the map
2. Sidebar slides open from the right (on desktop)
3. Sidebar slides up from the bottom (on mobile)
4. Sidebar shows: name, status (editable), notes (editable), date added
5. Changes to status or notes auto-save to Supabase on blur

### Deleting a destination
1. User clicks delete in the sidebar
2. Confirmation prompt appears
3. On confirm: destination removed from Supabase, pin removed from map, sidebar closes

---

## Pin Color Coding

| Status | Color |
|---|---|
| been | Blue |
| planning | Green |
| dreaming | Purple |

---

## Responsive Behaviour

- Desktop: sidebar opens on the right, map fills remaining width
- Mobile: sidebar slides up as a bottom sheet, map visible behind it
- Search bar: fixed position top-left on desktop, top full-width on mobile

---

## Supabase Setup Instructions

Follow these steps exactly. Do not let Claude Code make decisions about Supabase configuration.

1. Create a new Supabase project at supabase.com
2. Go to SQL Editor and run the schema above exactly as written
3. Go to Settings > API and copy the Project URL and anon public key
4. Paste into `.env.local` as shown above
5. Do NOT enable Row Level Security in Phase 1
6. Do NOT create any auth users or policies in Phase 1

---

## Mapbox Setup Instructions

1. Create an account at mapbox.com
2. Go to Tokens and create a new public token
3. Paste into `.env.local` as shown above
4. Default map style: `mapbox://styles/mapbox/dark-v11`

---

## Google Places Setup Instructions

1. Go to Google Cloud Console
2. Enable the following APIs: Places API, Geocoding API
3. Create an API key, restrict it to these two APIs
4. Paste into `.env.local` as shown above

---

## Notes for Claude Code

- Do not add authentication in Phase 1 under any circumstances
- Do not add Row Level Security to Supabase in Phase 1
- Do not create additional database tables beyond `destinations`
- Do not install additional dependencies without flagging them first
- Keep components small and single-purpose
- All Supabase calls go through `/lib/supabase.ts` only
- TypeScript types for all data structures defined in `/lib/types.ts`
