# Roamer — Claude Code Instructions

## Read This First — Every Session
the primary purpose of this coding project is instructional - the user would like each step clearly explained so that they learn more about coding using AI. 

Before doing anything else, read these two files in full:
- /docs/00_app_overview.md — what the app is, the data model, the vision
- /docs/01_technical_spec.md — stack, schema, component structure, locked decisions

Before starting any new build task, also read:
- /docs/03_phase1_build_plan.md — active task list and definitions of done

Only read when explicitly relevant:
- /docs/02_ideas_parking_lot.md — deferred ideas, do not let these influence Phase 1

## Rules
- Do not add authentication under any circumstances in Phase 1
- Do not enable Row Level Security in Supabase
- Do not create additional database tables
- Do not install additional dependencies without flagging them first
- Do not deviate from the stack defined in /docs/01_technical_spec.md
- Keep components small and single-purpose
- All Supabase calls go through /lib/supabase.ts only
- Pin state priority logic lives in /lib/mapUtils.ts — do not duplicate it in components
- The map must use flat Mercator projection — never globe
- A destination may have multiple visit records but only one intent record
- When uncertain, ask — do not improvise

## Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase (Postgres, no auth)
- Mapbox GL JS via react-map-gl
- Google Places API + Geocoding API
- Vercel
- Tailwind CSS
