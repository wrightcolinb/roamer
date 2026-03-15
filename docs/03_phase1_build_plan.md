# roamer — Phase 1 Build Plan

## How to Use This Document
Work through tasks sequentially. Do not skip ahead. Each task has a clear Definition of Done — do not move to the next task until the current one meets it. At the start of every Cursor session, paste in `00_app_overview.md` and `01_technical_spec.md` as context before giving Claude Code any instructions.

---

## Pre-Build Setup (Do This Yourself — Not Claude Code)

### Step 1 — Supabase
1. Create a new project at supabase.com
2. Go to SQL Editor and run this exactly:
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
3. Go to Settings > API
4. Copy Project URL and anon public key — you'll need these shortly
  URL: <your-supabase-url>
  API: <your-supabase-anon-key>
5. Do NOT enable Row Level Security
6. Do NOT touch auth settings

### Step 2 — Mapbox
1. Create an account at mapbox.com
2. Go to Tokens > Create a token
3. Copy the token — you'll need it shortly
  Token: <your-mapbox-token>
4. Note the map style to use: `mapbox://styles/mapbox/dark-v11`

### Step 3 — Google Cloud
1. Go to console.cloud.google.com
2. Create a new project
3. Enable Places API and Geocoding API
4. Go to Credentials > Create API Key
5. Restrict the key to Places API and Geocoding API only
6. Copy the key — you'll need it shortly
  Key: <your-google-api-key>

### Step 4 — GitHub
1. Create a new empty repository at github.com
2. Do not initialise with any files

---

## Build Tasks

---

### Task 1 — Project Scaffold

**Prompt for Claude Code:**
> "Create a new Next.js 14 project using the App Router with TypeScript and Tailwind CSS. Use the project structure defined in the technical spec. Create the following empty files with the correct folder structure: `app/page.tsx`, `app/layout.tsx`, `components/Map.tsx`, `components/SearchBar.tsx`, `components/Sidebar.tsx`, `components/Pin.tsx`, `lib/supabase.ts`, `lib/types.ts`, `styles/globals.css`. Do not add any functionality yet — just the scaffold with correct imports and empty component shells."

**Definition of Done:**
- Project runs locally with `npm run dev` without errors
- All files exist in the correct locations
- No extra files or dependencies added beyond what is specified

---

### Task 2 — Supabase Client & Types

**Prompt for Claude Code:**
> "Set up the Supabase client in `/lib/supabase.ts` using the environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. In `/lib/types.ts` define a single TypeScript type called `Destination` with these fields: id (string), name (string), place_id (string, optional), lat (number), lng (number), status (union type: 'been' | 'planning' | 'dreaming'), notes (string), created_at (string). Do not add anything else."

**Definition of Done:**
- `.env.local` created with correct variable names (you fill in the values)
- Supabase client initialises without errors
- `Destination` type exported from `types.ts`
- No extra tables, functions, or Supabase features added

---

### Task 3 — Basic Map

**Prompt for Claude Code:**
> "Build the Map component in `/components/Map.tsx` using react-map-gl and the Mapbox token from `NEXT_PUBLIC_MAPBOX_TOKEN`. The map should fill the full viewport, use the dark-v11 style, and initialise centered on coordinates 20, 0 (centre of the world) at zoom level 2. Wire it into `app/page.tsx` so it renders on load. Do not add pins, search, or sidebar yet."

**Definition of Done:**
- Map renders full screen on `localhost:3000`
- Map is interactive — zoom and pan work
- No console errors
- No extra UI elements added yet

---

### Task 4 — Load & Display Pins from Supabase

**Prompt for Claude Code:**
> "In `app/page.tsx`, fetch all destinations from the Supabase `destinations` table on load. Pass them to the Map component. In `Map.tsx`, render a circular marker for each destination at its lat/lng coordinates. Color the marker based on status: been = blue (#3B82F6), planning = green (#22C55E), dreaming = purple (#A855F7). Use the Pin component in `/components/Pin.tsx` for the marker. Do not add click handlers or sidebar yet."

**Definition of Done:**
- Manually insert one row into Supabase for each status type via the Supabase dashboard
- All three pins appear on the map in the correct colors
- No console errors

---

### Task 5 — Sidebar Component

**Prompt for Claude Code:**
> "Build the Sidebar component in `/components/Sidebar.tsx`. It receives a `destination` prop of type `Destination` (or null when closed). When a destination is passed, it slides in from the right on desktop and slides up from the bottom on mobile. It shows: destination name, status as an editable dropdown (been / planning / dreaming), notes as an editable textarea, date added formatted as a readable date, and a delete button. When destination is null the sidebar is hidden. Do not wire up any save or delete functionality yet — just the UI and open/close behaviour."

**Definition of Done:**
- Sidebar opens and closes correctly on desktop and mobile
- All fields render correctly with placeholder/test data
- Responsive behaviour works — right panel on desktop, bottom sheet on mobile
- No save or delete functionality yet

---

### Task 6 — Pin Click Opens Sidebar

**Prompt for Claude Code:**
> "Wire up pin clicks in `Map.tsx`. When a pin is clicked, pass the corresponding destination to the Sidebar component via state in `page.tsx`. The sidebar should open and display that destination's details. Clicking elsewhere on the map (not a pin) should close the sidebar."

**Definition of Done:**
- Clicking a pin opens the sidebar with the correct destination data
- Clicking the map background closes the sidebar
- Works correctly on both desktop and mobile

---

### Task 7 — Edit Status & Notes

**Prompt for Claude Code:**
> "Wire up the status dropdown and notes textarea in `Sidebar.tsx` to save changes back to Supabase. Use the Supabase client from `/lib/supabase.ts`. Status changes should save immediately on change. Notes should save on blur (when the user clicks away). After saving, update the pin color on the map if status changed. Show no loading states or success messages — just silent auto-save."

**Definition of Done:**
- Changing status in sidebar updates the pin color on the map immediately
- Editing notes and clicking away saves to Supabase
- Refresh the page — changes persist
- No console errors

---

### Task 8 — Delete Destination

**Prompt for Claude Code:**
> "Wire up the delete button in `Sidebar.tsx`. On click, show a simple browser confirm() dialog with the message 'Remove [destination name] from your map?'. On confirm, delete the destination from Supabase, remove the pin from the map, and close the sidebar. On cancel, do nothing."

**Definition of Done:**
- Confirm dialog appears on delete click
- Destination removed from Supabase on confirm
- Pin disappears from map immediately
- Sidebar closes after deletion

---

### Task 9 — Search Bar (Google Places Autocomplete)

**Prompt for Claude Code:**
> "Build the SearchBar component in `/components/SearchBar.tsx`. It should render a text input fixed to the top-left of the screen on desktop and full-width at the top on mobile. As the user types, use the Google Places Autocomplete API (key from `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`) to show a dropdown of suggestions. When the user selects a suggestion, extract the place name, place_id, and lat/lng from the Places response. Then show a small inline form asking the user to select a status (been / planning / dreaming) with three buttons. On selection, save the destination to Supabase and add the pin to the map. Close the search UI after saving."

**Definition of Done:**
- Typing in search bar shows Google Places suggestions
- Selecting a suggestion shows the status picker
- Selecting a status saves to Supabase and adds pin to map
- Map flies to the new destination
- Search input clears after saving

---

### Task 10 — Click to Add via Map

**Prompt for Claude Code:**
> "Add a click-to-add interaction to `Map.tsx`. When the user clicks on the map (not on an existing pin), reverse geocode the clicked coordinates using the Google Geocoding API to get the best matching place name. Show a small popup at the clicked location with the resolved place name and three status buttons (been / planning / dreaming). On status selection, save the destination to Supabase with the resolved name, place_id if available, and the clicked coordinates. Add the pin to the map and close the popup."

**Definition of Done:**
- Clicking the map shows a popup with a resolved place name
- Selecting a status saves to Supabase and renders the pin
- Clicking away from the popup without selecting cancels the action
- Works at different zoom levels — clicking a country resolves a country name, clicking a city resolves a city name

---

### Task 11 — Deploy to Vercel

**Do this yourself — not Claude Code:**
1. Push the project to your GitHub repository
2. Go to vercel.com and import the GitHub repository
3. Add all four environment variables in Vercel project settings
4. Deploy
5. Test all functionality on the live URL

**Definition of Done:**
- App loads on Vercel URL
- All functionality works identically to local
- No console errors in production

---

## After Phase 1 — What to Assess

Before starting Phase 2, spend at least 1-2 weeks using the app yourself. Ask:
- Is the map satisfying to interact with?
- Is the flat destination model causing friction? (If yes, hierarchy discussion is ready)
- Are you missing something obvious from your daily use?
- Have you shown it to any friends? What was their reaction?

Answers to these questions should drive Phase 2 scoping.
