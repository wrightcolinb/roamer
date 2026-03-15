# roamer — Claude Code Instructions

## What This Project Is
A personal AI travel copilot built around a living travel map.
See /docs/00_app_overview.md for full context.

## Current Phase
Phase 1 — Map and destination management only. No AI. No auth.
See /docs/03_phase1_build_plan.md for the active task list.

## Rules — Read Before Every Task
- Do not add authentication under any circumstances in Phase 1
- Do not enable Row Level Security in Supabase
- Do not create additional database tables
- Do not install additional dependencies without flagging them first
- Do not deviate from the stack in /docs/01_technical_spec.md
- Keep components small and single-purpose
- All Supabase calls go through /lib/supabase.ts only
- When uncertain, ask — do not improvise

## Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase (Postgres, no auth)
- Mapbox GL JS via react-map-gl
- Google Places API
- Vercel

## Full Specs
- /docs/00_app_overview.md
- /docs/01_technical_spec.md
- /docs/02_ideas_parking_lot.md
- /docs/03_phase1_build_plan.md
```

