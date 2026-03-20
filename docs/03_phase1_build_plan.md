# Roamer — Phase 1 Build Plan (v2)

## How to Use This Document
Work through tasks sequentially. Do not skip ahead. Each task has a clear Definition of Done — do not move to the next task until the current one meets it. At the start of every Cursor/Claude Code session, paste in `00_app_overview.md` and `01_technical_spec.md` as context before giving any instructions.

The v1 build has been archived to a separate branch. This is a clean rebuild.

---

## Pre-Build Setup (Do This Yourself — Not Claude Code)

### Step 1 — Supabase
1. Wipe existing project or create a new one at supabase.com
2. Go to SQL Editor and run this exactly:

```sql
create table countries (
  id uuid default gen_random_uuid() primary key,
  country_code text not null unique,
  country_name text not null,
  continent text,
  status text not null check (status in ('visited', 'lived')),
  created_at timestamp with time zone default now()
);

create table destinations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  place_id text,
  lat float not null,
  lng float not null,
  country_code text,
  country_name text,
  continent text,
  state text not null check (state in ('visited', 'lived', 'next_up')),
  year_start integer,
  year_end integer,
  created_at timestamp with time zone default now()
);

create table place_notes (
  id uuid default gen_random_uuid() primary key,
  destination_id uuid not null references destinations(id) on delete cascade,
  place_name text not null,
  place_id text,
  sentiment text not null check (sentiment in ('recommend', 'meh', 'skip')),
  note text default '',
  created_at timestamp with time zone default now()
);
```

3. Go to Settings > API, copy Project URL and anon public key
4. Do NOT enable Row Level Security
5. Do NOT touch auth settings

### Step 2 — Mapbox
Use existing token. No changes needed.

### Step 3 — Google Cloud
Use existing API key. No changes needed.

### Step 4 — GitHub
Create a new clean branch or repository for v2. The v1 build should already be archived.

---

## Build Tasks

---

### Task 1 — Project Scaffold

**Prompt for Claude Code:**
> "Create a new Next.js 14 project using the App Router with TypeScript and Tailwind CSS. Use the project structure defined in the technical spec. Create the following empty files with the correct folder structure: `app/page.tsx`, `app/layout.tsx`, `components/Map.tsx`, `components/CountryLayer.tsx`, `components/DestinationPin.tsx`, `components/SearchBar.tsx`, `components/Sidebar.tsx`, `components/CountryPanel.tsx`, `components/AddDestinationModal.tsx`, `components/PlaceNoteInput.tsx`, `components/ExportButton.tsx`, `components/ModeToggle.tsx`, `components/OnboardingCallout.tsx`, `lib/supabase.ts`, `lib/types.ts`, `lib/mapUtils.ts`, `lib/countryUtils.ts`, `styles/globals.css`. Do not add any functionality yet — just the scaffold with correct imports and empty component shells."

**Definition of Done:**
- Project runs locally with `npm run dev` without errors
- All files exist in the correct locations
- No extra files or dependencies beyond what is specified

---

### Task 2 — Types, Supabase Client, and Utilities

**Prompt for Claude Code:**
> "Set up the Supabase client in `/lib/supabase.ts` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. In `/lib/types.ts` define the following TypeScript types exactly as specified in the technical spec: `Country`, `Destination`, `PlaceNote`, `DestinationState`, `CountryStatus`, `Sentiment`, `Continent`, `MapMode`. In `/lib/mapUtils.ts` create two functions: (1) `getCountryStatus(destinations: Destination[]): CountryStatus | null` — takes all destinations for a country and returns the highest status ('lived' beats 'visited', next_up destinations are ignored, returns null if no visited/lived destinations); (2) `shouldPromoteCountry(existing: CountryStatus | null, newState: DestinationState): CountryStatus | null` — returns the new country status after adding a destination, or null if no promotion needed. In `/lib/countryUtils.ts` create a function `getCountryFromPlacesResult(result: any): { country_code: string, country_name: string, continent: string }` that extracts country code, name, and continent from a Google Places address_components array. Do not add anything else."

**Definition of Done:**
- `.env.local` created with correct variable names (fill in values yourself)
- Supabase client initialises without errors
- All types exported from `types.ts`
- Both functions exported from `mapUtils.ts` and logically correct
- `getCountryFromPlacesResult` exported from `countryUtils.ts`

---

### Task 3 — Basic Map (Flat 2D, Light Style)

**Prompt for Claude Code:**
> "Build the Map component in `/components/Map.tsx` using react-map-gl and the Mapbox token from `NEXT_PUBLIC_MAPBOX_TOKEN`. The map must use flat Mercator projection — set `projection='mercator'` on the Map component. Use the style `mapbox://styles/mapbox/light-v11`. The map should fill the full viewport and initialise centered on `[20, 20]` at zoom level 2. Wire it into `app/page.tsx` so it renders on load. Accept a `mode` prop of type `MapMode` ('fill' or 'explore') — do not implement mode behaviour yet, just accept the prop. Do not add pins, choropleth, search, or panels yet."

**Definition of Done:**
- Map renders full screen on `localhost:3000` as a flat 2D world map
- Map is interactive — zoom and pan work
- Globe projection is NOT used under any circumstances
- No console errors
- No extra UI elements

---

### Task 4 — Country Choropleth Layer

**Prompt for Claude Code:**
> "Build the CountryLayer component in `/components/CountryLayer.tsx`. It receives a `countries` prop (array of Country type) and `mode` prop (MapMode). Use Mapbox GL's `fill` layer on top of a world countries GeoJSON source to render country fills. Countries in the `countries` array should be filled: status 'visited' = coral (#E8735A), status 'lived' = deep green (#2D6A4F). All other countries render as warm neutral (#D8D4C8). In `app/page.tsx`, fetch all countries from Supabase on load and pass them to CountryLayer. In `Map.tsx` render CountryLayer as a child layer. Do not wire up click interactions yet."

**Definition of Done:**
- Manually insert two test rows into the countries table (one visited, one lived)
- Both countries appear on the map in correct fill colors
- All other countries render in warm neutral
- No console errors

---

### Task 5 — Destination Pins

**Prompt for Claude Code:**
> "Build the DestinationPin component in `/components/DestinationPin.tsx`. It renders a custom SVG marker for a destination based on its state: visited = filled coral circle, lived = deep green house shape, next_up = filled purple star. In `app/page.tsx`, fetch all destinations from Supabase on load. Pass the destinations array to `Map.tsx`. In `Map.tsx` render a DestinationPin marker for each destination at its coordinates. Do not add click handlers yet."

**Definition of Done:**
- Manually insert three test destinations into Supabase (one per state)
- All three pins appear on the map in correct shapes and colors
- No console errors

---

### Task 6 — Mode Toggle and Onboarding Callout

**Prompt for Claude Code:**
> "Build the ModeToggle component in `/components/ModeToggle.tsx`. It renders a fixed bottom-right button that toggles between 'fill' mode and 'explore' mode. In fill mode the button shows an active/paint state. In explore mode it shows a neutral state. Wire the mode state into `app/page.tsx` and pass it down to Map and CountryLayer. Build the OnboardingCallout component in `/components/OnboardingCallout.tsx`. It renders a dismissible callout prompt that says 'Click countries you've visited or lived in to fill your map' with an indicator arrow pointing toward the ModeToggle button. It appears on first load only (use localStorage to track if it has been dismissed). It dismisses permanently when the user toggles from fill mode to explore mode for the first time. The default mode on first load is 'fill'."

**Definition of Done:**
- Toggle button visible and switches between fill and explore mode correctly
- Onboarding callout appears on first load
- Callout dismisses when user toggles to explore mode
- Callout does not reappear on page refresh
- Mode prop flows correctly to Map and CountryLayer

---

### Task 7 — Country Fill Mode Click Interaction

**Prompt for Claude Code:**
> "Wire up country click behaviour in fill mode. In `CountryLayer.tsx`, when mode is 'fill', clicking a country cycles its status: if no record exists → create 'visited'; if status is 'visited' → update to 'lived'; if status is 'lived' → delete the record (reset to unfilled). Use the country_code from the clicked GeoJSON feature to identify the country. All changes save to Supabase immediately and update the map fill in real time. When mode is 'explore', clicks on countries do nothing in this task — that is wired up in Task 9."

**Definition of Done:**
- Clicking an unfilled country in fill mode fills it as visited (coral)
- Clicking a visited country promotes it to lived (green)
- Clicking a lived country resets it to unfilled
- Changes persist on page refresh
- No changes occur when clicking countries in explore mode

---

### Task 8 — Search Bar and Add Destination Modal

**Prompt for Claude Code:**
> "Build the SearchBar component in `/components/SearchBar.tsx`. Render a text input fixed top-left on desktop, full-width top on mobile. As the user types, use the Google Places Autocomplete API to show a dropdown of suggestions. When a suggestion is selected, extract name, place_id, lat, lng, country_code, country_name, continent using `getCountryFromPlacesResult` from `lib/countryUtils.ts`, then open the AddDestinationModal. Build the AddDestinationModal in `/components/AddDestinationModal.tsx`. It shows three state options: Visited / Lived / Next Up. If Visited or Lived: show year_start input (required) and year_end input (optional, for lived). If Next Up: show optional target year input. On save: (1) check if Next Up and count already at 5 — if so show error and block save; (2) save destination to Supabase; (3) run country auto-promotion logic using `shouldPromoteCountry` from `lib/mapUtils.ts` — if promotion needed, upsert the country record; (4) add pin to map and fly to location; (5) close modal and clear search."

**Definition of Done:**
- Typing in search shows autocomplete suggestions
- Selecting a suggestion opens the modal
- All three states work correctly
- Next Up blocks at 5 with a clear message
- Destination saves to Supabase and pin appears on map
- Country auto-promotes correctly (verify in Supabase)
- Map flies to new destination
- Refresh confirms all data persists

---

### Task 9 — Sidebar and Country Panel

**Prompt for Claude Code:**
> "Build the Sidebar component in `/components/Sidebar.tsx`. It receives a destination prop (or null). When open it slides in from the right on desktop, up from bottom on mobile. It shows: destination name; state dropdown (visited/lived/next_up) that saves immediately on change; year_start and year_end fields that save on blur; a sentiment notes section with three columns (Recommend / Meh / Skip) — each column shows existing place_notes for that sentiment, with a delete button per note, and an Add button that opens PlaceNoteInput; a delete destination button with confirm dialog. Build PlaceNoteInput in `/components/PlaceNoteInput.tsx` — a Google Places autocomplete input scoped to the destination's country, plus a short text note field, plus a save button. On save it writes a place_notes record to Supabase. Build CountryPanel in `/components/CountryPanel.tsx`. It receives a country_code and shows: country name, status toggle (visited/lived/remove) that saves immediately, list of destination names in this country each clickable to open their Sidebar, and a placeholder section 'Friends who've been here' with a 'Coming soon' state. Wire up click handlers in `Map.tsx` for explore mode: clicking a destination pin opens Sidebar; clicking a country opens CountryPanel. Clicking the map background closes whichever panel is open."

**Definition of Done:**
- Clicking a destination pin in explore mode opens the Sidebar with correct data
- State and year edits persist on refresh
- Adding a place note saves and appears in the correct sentiment column
- Deleting a place note removes it
- Deleting a destination removes the pin, closes the sidebar
- Clicking a country in explore mode opens the CountryPanel
- Country status changes from CountryPanel persist on refresh
- Destination list in CountryPanel shows correct destinations
- Clicking map background closes panels
- Responsive behaviour works on mobile

---

### Task 10 — Shareable Image Export

**Prompt for Claude Code:**
> "Build the ExportButton component in `/components/ExportButton.tsx`. Clicking it captures the map at full world view (zoom 2, center [20, 20]) as a PNG using `mapboxgl.Map.getCanvas()`, then composites a stat block using HTML Canvas. The stat block shows: number of distinct countries in the countries table, number of distinct continents, years traveling (earliest year_start across all destinations to current year). Style the stat block warmly — clean, not corporate, matches the map aesthetic. Trigger a browser download of the PNG. The choropleth fill should be visible in the export — this is the primary visual."

**Definition of Done:**
- Export button produces a downloadable PNG
- Country fills are visible in the export
- Destination pins are visible in the export
- Stat block shows correct numbers from real data
- The exported image looks designed, not like a raw screenshot
- Works on desktop

---

### Task 11 — Deploy to Vercel

**Do this yourself — not Claude Code:**
1. Push v2 to GitHub
2. Import to Vercel (or update existing project to point to new branch)
3. Add all four environment variables in Vercel project settings
4. Deploy
5. Test all functionality on live URL

**Definition of Done:**
- App loads on Vercel URL
- All functionality works identically to local
- No console errors in production

---

## After Phase 1 — What to Validate

Spend at least 1–2 weeks filling in your own map before showing anyone else. Ask:

- Does clicking through countries feel fast and satisfying, or does it create friction?
- Does the exported map image look compelling enough to share on Instagram?
- Do you actually use the sentiment notes, or does it feel like data entry?
- Is the three-bucket sentiment model (recommend / meh / skip) the right granularity, or does it feel too coarse or too structured?
- Does the visited / lived / next_up distinction feel natural, or does anything feel ambiguous?
- What do you reach for that isn't there?

Then show 3–5 friends. The key question: when they see the exported map image, do they want one of their own? If yes — the visual is working and Phase 2 (friends layer) is worth building. If they shrug — the visual needs more work before anything else.
