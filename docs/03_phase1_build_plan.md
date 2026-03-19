# Roamer — Phase 1 Build Plan

## How to Use This Document
Work through tasks sequentially. Do not skip ahead. Each task has a clear Definition of Done — do not move to the next task until the current one meets it. At the start of every Cursor/Claude Code session, paste in `00_app_overview.md` and `01_technical_spec.md` as context before giving any instructions.

The previous build (single destinations table, globe projection, status enum) has been scrapped. Start fresh.

---

## Pre-Build Setup (Do This Yourself — Not Claude Code)

### Step 1 — Supabase
1. Create a new Supabase project at supabase.com (or wipe and recreate if reusing an existing one)
2. Go to SQL Editor and run this exactly:

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

3. Go to Settings > API, copy Project URL and anon public key
4. Do NOT enable Row Level Security
5. Do NOT touch auth settings

### Step 2 — Mapbox
1. Log in at mapbox.com
2. Go to Tokens — use existing token or create a new one
3. Note: map style will start as `mapbox://styles/mapbox/light-v11`, projection set to Mercator in code

### Step 3 — Google Cloud
1. Existing API key is fine if Places API and Geocoding API are already enabled
2. No changes needed if the previous project used the same APIs

### Step 4 — GitHub
1. Create a new empty repository (or wipe the existing one)
2. Do not initialise with any files

---

## Build Tasks

---

### Task 1 — Project Scaffold

**Prompt for Claude Code:**
> "Create a new Next.js 14 project using the App Router with TypeScript and Tailwind CSS. Use the project structure defined in the technical spec. Create the following empty files with the correct folder structure: `app/page.tsx`, `app/layout.tsx`, `components/Map.tsx`, `components/SearchBar.tsx`, `components/Sidebar.tsx`, `components/Pin.tsx`, `components/AddPlaceModal.tsx`, `components/ExportButton.tsx`, `lib/supabase.ts`, `lib/types.ts`, `lib/mapUtils.ts`, `styles/globals.css`. Do not add any functionality yet — just the scaffold with correct imports and empty component shells."

**Definition of Done:**
- Project runs locally with `npm run dev` without errors
- All files exist in the correct locations
- No extra files or dependencies beyond what is specified

---

### Task 2 — Types, Supabase Client, and Map Utilities

**Prompt for Claude Code:**
> "Set up the Supabase client in `/lib/supabase.ts` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. In `/lib/types.ts` define the following TypeScript types exactly as specified in the technical spec: `Destination`, `Visit`, `Intent`, `VisitType`, `IntentState`, `Continent`, `PinState`. In `/lib/mapUtils.ts` create a function `getPinState(destination: Destination): PinState` that returns the dominant visual state for a destination using this priority: if any visit has type 'lived' → return 'lived'; else if any visit exists → return 'visited'; else if intent state is 'planning' → return 'planning'; else → return 'on my list'. Do not add anything else."

**Definition of Done:**
- `.env.local` created with correct variable names (fill in the values yourself)
- Supabase client initialises without errors
- All types exported from `types.ts`
- `getPinState` function exported from `mapUtils.ts` and logically correct

---

### Task 3 — Basic Map (Flat 2D, Light Style)

**Prompt for Claude Code:**
> "Build the Map component in `/components/Map.tsx` using react-map-gl and the Mapbox token from `NEXT_PUBLIC_MAPBOX_TOKEN`. The map must use flat Mercator projection — set `projection='mercator'` on the Map component. Use the style `mapbox://styles/mapbox/light-v11`. The map should fill the full viewport and initialise centered on `[20, 20]` at zoom level 2. Wire it into `app/page.tsx` so it renders on load. Do not add pins, search, or sidebar yet."

**Definition of Done:**
- Map renders full screen on `localhost:3000` as a flat 2D world map
- Map is interactive — zoom and pan work
- Globe projection is NOT used under any circumstances
- No console errors
- No extra UI elements

---

### Task 4 — Load Destinations and Render Pins

**Prompt for Claude Code:**
> "In `app/page.tsx`, fetch all destinations from Supabase on load. For each destination, also fetch its associated visits and intents from the visits and intents tables. Assemble each destination with its visits array and optional intent into the Destination type from `lib/types.ts`. Pass the destinations array to the Map component. In `Map.tsx`, render a pin for each destination using the Pin component. Use `getPinState` from `lib/mapUtils.ts` to determine which visual state to render. Pin styles: visited = filled coral circle, lived = green house shape, on my list = outlined purple star, planning = filled purple star. Use SVG for pin shapes inside the Pin component. Do not add click handlers yet."

**Definition of Done:**
- Manually insert test data into Supabase: one destination per pin state (visited, lived, on my list, planning)
- All four pins appear on the map in correct shapes and colors
- No console errors

---

### Task 5 — Sidebar Component

**Prompt for Claude Code:**
> "Build the Sidebar component in `/components/Sidebar.tsx`. It receives a `destination` prop of type `Destination` (or null when closed). When a destination is passed, it slides in from the right on desktop and slides up from the bottom on mobile. It shows: destination name at the top; a list of all visit records (each showing type, year range, notes); the intent record if present (showing state, target year, notes); an 'Add another visit' button; an 'Add intent' button (only if no intent exists); and a delete destination button at the bottom. When destination is null, the sidebar is hidden. Do not wire up any data operations yet — just the UI and open/close behaviour."

**Definition of Done:**
- Sidebar opens and closes correctly
- All sections render with placeholder data
- Responsive behaviour works — right panel on desktop, bottom sheet on mobile
- No data operations yet

---

### Task 6 — Pin Click Opens Sidebar

**Prompt for Claude Code:**
> "Wire up pin clicks in `Map.tsx`. When a pin is clicked, pass the corresponding destination to the Sidebar via state in `page.tsx`. Clicking the map background (not a pin) closes the sidebar. The sidebar should open and display the correct destination data including all visits and intent."

**Definition of Done:**
- Clicking a pin opens the sidebar with correct data
- Clicking map background closes the sidebar
- Works on desktop and mobile

---

### Task 7 — Add Place Modal

**Prompt for Claude Code:**
> "Build the AddPlaceModal component in `/components/AddPlaceModal.tsx`. It receives a `placeName` and `coordinates` prop and an `onSave` callback. The modal has two sections the user chooses between: 'I've been here' and 'I want to go here'. For 'I've been here': show a toggle for Visited / Lived, a year input (or year range for Lived), and a notes textarea. For 'I want to go here': show a toggle for On my list / Planning, an optional target year input, and a notes textarea. A save button calls `onSave` with the collected data. A cancel button closes the modal. Do not wire up Supabase saves yet — just the UI and data collection."

**Definition of Done:**
- Modal renders correctly with both sections
- Switching between sections works
- All fields collect data correctly
- Save button emits the correct data shape via `onSave`

---

### Task 8 — Search Bar with Google Places Autocomplete

**Prompt for Claude Code:**
> "Build the SearchBar component in `/components/SearchBar.tsx`. Render a text input fixed to the top-left on desktop and full-width at the top on mobile. As the user types, use the Google Places Autocomplete API (key from `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`) to show a dropdown of suggestions. When the user selects a suggestion, extract name, place_id, lat, lng, and attempt to extract country and continent from the Places response address components. Then open the AddPlaceModal with the resolved place name and coordinates. When the modal's onSave fires, save to Supabase: create a destination record, then create either a visit or intent record depending on what the user selected. Add the new destination (with its visit or intent) to the map. Close the modal and clear the search input. Map should fly to the new destination."

**Definition of Done:**
- Typing shows autocomplete suggestions
- Selecting a suggestion opens the modal
- Completing the modal saves destination + visit or intent to Supabase
- Pin appears on map in correct state
- Map flies to new destination
- Refresh confirms data persists

---

### Task 9 — Add Place Toggle (Map Click Mode)

**Prompt for Claude Code:**
> "Add an 'Add place' toggle button to the map UI, fixed to the bottom-right. When toggled on, the map cursor changes to a crosshair and the button shows as active. Clicking the map while the toggle is active reverse geocodes the clicked coordinates via the Google Geocoding API to get the best matching place name. Then opens the AddPlaceModal with the resolved name and coordinates. After the modal saves, the toggle deactivates. Clicking the map when the toggle is NOT active does not trigger the add flow. Clicking an existing pin while the toggle is active should open the sidebar, not the add modal."

**Definition of Done:**
- Toggle button visible and clearly indicates active/inactive state
- Map clicks only trigger add flow when toggle is active
- Reverse geocode resolves a reasonable place name at different zoom levels
- Modal flow works identically to search flow
- Toggle deactivates after save or cancel

---

### Task 10 — Edit and Delete from Sidebar

**Prompt for Claude Code:**
> "Wire up all edit and delete operations in `Sidebar.tsx`. Notes fields on visit and intent records should auto-save to Supabase on blur. Type (visited/lived) and state (on my list/planning) dropdowns should save immediately on change and update the pin on the map. Year fields should save on blur. The 'Add another visit' button should open a simplified version of the AddPlaceModal pre-set to 'I've been here'. The 'Add intent' button should open it pre-set to 'I want to go here'. Deleting an individual visit record should remove it from Supabase and update the sidebar. The 'Remove intent' option should delete the intent record. The delete destination button should show a confirm dialog ('Remove [name] from your map?'), then delete the destination from Supabase (cascade will clean up visits and intents), remove the pin from the map, and close the sidebar."

**Definition of Done:**
- All edits persist on refresh
- Pin state updates immediately when visit type or intent state changes
- Individual visit deletion works
- Destination deletion removes pin and closes sidebar

---

### Task 11 — Shareable Image Export

**Prompt for Claude Code:**
> "Build the ExportButton component in `/components/ExportButton.tsx`. Clicking it captures the current map as a PNG using `mapboxgl.Map.getCanvas()` and composites a stat block using HTML Canvas. The stat block shows: number of distinct countries in the destinations table (using the country field), number of distinct continents, and the year range (earliest visit year_start to current year). Style the stat block to match the map aesthetic — warm, clean, no corporate feel. The final image should be suitable for sharing on Instagram. Trigger a browser download of the PNG when export is complete."

**Definition of Done:**
- Export button produces a downloadable PNG
- Stat block shows correct numbers derived from real data
- The exported image looks good — not like a screenshot, like a designed artifact
- Works on desktop (mobile export can be a known limitation for now)

---

### Task 12 — Deploy to Vercel

**Do this yourself — not Claude Code:**
1. Push the project to your GitHub repository
2. Go to vercel.com and import the repository
3. Add all four environment variables in Vercel project settings
4. Deploy
5. Test all functionality on the live URL

**Definition of Done:**
- App loads on Vercel URL
- All functionality works identically to local
- No console errors in production

---

## After Phase 1 — What to Validate

Spend at least 1–2 weeks logging your own travel history before showing anyone else. Ask:

- Is the process of logging places you've been satisfying, or does it feel like data entry?
- Does the map look compelling enough to share? Would you post it?
- Is the distinction between visited / lived / on my list / planning clear and useful, or does it create confusion?
- Does the visit history model (multiple chapters per destination) feel right, or is it too complex for the UI?
- What's missing that you reach for every time you use it?

Then show 3–5 friends. The key question: when they see the exported map image, do they want one? If yes — the visual is working. If they shrug — the visual needs more work before anything else.

Answers to these questions drive Phase 2 scoping.
