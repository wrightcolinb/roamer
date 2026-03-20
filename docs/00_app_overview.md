# Roamer — App Overview

## What It Is
A personal travel map that grows with you. Not a trip generator — a living record of everywhere you've been, everywhere you've called home, and everywhere you're headed next. The map is the product. Everything else serves it.

## The Core Problem
Most AI travel tools assume you want a finished itinerary. Real travel is messier — destinations accumulate over a lifetime, each with its own history and context. There's no good tool for capturing that story, and no good way to share it with friends who are planning their own trips.

## The Core Insight
Your relationship with a place isn't a status — it's a history. You might have visited Paris in 2008, lived there from 2012 to 2014, and be planning to go back in 2026. That's three chapters of the same story, each with different context and different notes. The app captures all of it.

## The Shareable Visual
The map is designed to be exported and shared — a single image that shows your entire travel history at a glance, with a stat block (countries visited, continents, years traveling). This is the acquisition mechanic. Someone sees your map, wants one of their own.

## The Friend Layer (Phase 3)
When you're planning a trip to somewhere you haven't been, the most useful information comes from friends who have. Tap a destination on your map and see notes from friends who've been there — what they loved, where they stayed, what they'd skip. Recency matters: a friend's 2024 notes beat their 2015 notes.

## The AI Layer (Phase 3)
A voice-first AI companion that populates your map through conversation. Tell it about your travels — where you've been, what you loved, what you'd do differently — and watch pins drop in real time. The AI captures structured notes from free-flowing conversation, identifies specific places you mention (restaurants, museums, neighborhoods), and builds a rich travel profile over time that makes it an increasingly useful planning partner.

## Data Model
A destination is a place. Your relationship to it is captured in separate records:

**Destination** — the place itself
- name, coordinates, place_id — geography only

**Visit** — a past chapter at a destination
- type: visited | lived
- year or date range (approximate is fine)
- notes (freetext, eventually parsed for sub-places)

**Intent** — a future chapter at a destination
- state: on my list | planning
- optional target date
- can coexist with visit history (planning a return trip)

A destination gets one pin on the map. The pin's visual treatment reflects the richest state across all visits and intents.

## Pin Visual System
Distinct shapes per state — not just colors:

| State | Pin style |
|---|---|
| Visited | Filled circle |
| Lived | House shape |
| On my list | Outlined star |
| Planning | Filled star |

A destination with both visit history and future intent shows the visit state as the primary pin style, with a secondary indicator for the intent.

## Map Visual Style
Illustrated, colorful, warm. Continent fills in distinct regional colors. Not a dark political map — closer to a travel poster. Flat 2D Mercator projection. Designed to be beautiful enough to export and share.

## Build Philosophy
- Responsive web app, mobile-friendly
- Build for one user first, validate before scaling
- Start with the visual — if the map isn't compelling to look at and share, nothing else matters
- Add features in phases, never outpace validation
- Keep technical complexity ruthlessly low at each phase
- All architecture decisions made with the AI layer in mind, even before it's built

## Tech Stack
- **Frontend:** Next.js (React, TypeScript)
- **Database:** Supabase (Postgres)
- **Map:** Mapbox GL JS via react-map-gl
- **Places:** Google Places API
- **Hosting:** Vercel
- **Styling:** Tailwind CSS

## Phased Roadmap

**Phase 1 — The map and your history**
Log where you've been and where you want to go. Get the visual right. Build the shareable image. Validate with a small group of friends.

**Phase 2 — The AI conversation layer**
Voice-first AI that populates your map through conversation. Pins drop in real time as you talk. Notes captured and structured automatically.

**Phase 3 — Friends and planning**
Surface friend notes when you're planning a trip. Deep planning tools for active trips (itinerary help, recommendations). Travel DNA profile built from your full history.

**Phase 4 — AI suggestions**
Destinations you'd probably love, surfaced based on your travel history and style. A separate visual layer on the map — distinct from your own pins.
