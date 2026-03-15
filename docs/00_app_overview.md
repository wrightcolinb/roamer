# roamer — App Overview

## What It Is
A personal AI travel copilot built around a living travel map. Not a trip generator — a long-term thinking partner that grows with your travel history and helps you plan on your own terms.

## The Core Problem
Most AI travel tools assume you want a finished itinerary. Real travel planning is messier — destinations live in your head for months or years before they become real trips. There's no good tool for that in-between space.

## The Core Loop
A map is the central interface. Every destination you've visited, plan to visit, or dream of visiting lives on it. That map is also the memory layer that makes the AI useful — it knows where you've been, how you travel, and what you're thinking about.

## Destination States
- **Been** — places you've visited
- **Planning** — trips you're actively working toward
- **Dreaming** — someday destinations
- *(Phase 4)* **AI Suggested** — surfaced based on your travel profile

## Build Philosophy
- Responsive web app, mobile-friendly
- Build for one user first, validate before scaling
- Add features in phases, never outpace validation
- Keep technical complexity ruthlessly low at each phase

## Tech Stack
- **Frontend:** Next.js (React)
- **Database:** Supabase (Postgres + Auth)
- **Map:** Mapbox GL JS
- **Places:** Google Places API
- **Hosting:** Vercel

## Phased Roadmap
- **Phase 1:** Map + destination profile (no AI)
- **Phase 2:** Trip context — notes, travel style, experiences
- **Phase 3:** AI companion informed by map memory
- **Phase 4:** AI destination suggestions

## Data Model — Phase 1
A single **Destination** object:
- `id` — uuid
- `name` — string (from Google Places)
- `place_id` — string (Google Places ID)
- `lat` / `lng` — coordinates
- `status` — enum: been | planning | dreaming
- `notes` — freetext string
- `created_at` — timestamp
