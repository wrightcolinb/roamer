# TravelMind — Ideas Parking Lot

This document captures ideas, musings, and feature concepts that are explicitly out of scope for current build phases but worth revisiting. Nothing here should influence active development. Review this document when starting a new phase to see if anything is ready to graduate.

---

## Visual & Identity Ideas

### Map Style Selector
Users could choose between different visual styles for their map — vintage atlas, minimal modern, illustrated/playful. Each produces a different aesthetic for the shareable image. The illustrated/playful style is the default for Phase 1. Style selection as a personalisation feature belongs in a later phase once the core map is validated.

### The Worm / Trip Path Visual
Trips are not just collections of locations — they have an order, a flow, a shape. The visual metaphor of a "worm" or path on a map is compelling: nodes (destinations) connected by lines (travel between them), creating a creature-like trail across the globe. This could become a core part of the brand identity and map experience.

Questions to explore:
- Is the path a straight line between nodes, a great circle arc, or something more stylized?
- Does the worm animate when you interact with it?
- Could this be the thing that makes TravelMind visually distinctive vs every other travel map?
- What do you call it — a route, a journey, a trail? Naming matters for brand.

### Travel Wrapped — Spotify Wrapped for Travel
An annual (or on-demand) visual summary of your travel year. Could include:
- Countries / cities visited
- Total distance traveled
- Most common travel style or experience type
- First trip of the year, longest trip, most adventurous destination
- A shareable card or video — social-native format
- "Your travel personality this year was..."

This is a strong acquisition and retention mechanic. People would share it. It also deepens the value of having rich travel history in the app — the more you log, the better your Wrapped.

### Travel DNA Profile
As visit notes accumulate, the AI builds an analytical profile of how you travel — the kinds of restaurants you love, whether you prefer museums or outdoor experiences, how you balance tourist landmarks with local discovery. Surfaced as a "your travel style" summary. The Pandora Music Genome analogy is right: data-forward language that tells you something you felt but hadn't articulated. Strong retention mechanic.

---

## Data Model & Architecture Ideas

### Sub-Places (Places Within Destinations)
When a user mentions a specific place within a destination — a restaurant, museum, neighborhood — the AI should eventually recognize it as a named entity and capture it as a structured sub-place record linked to the destination. This is what makes friend recommendations genuinely useful (specific enough to act on) rather than generic. Notes are sufficient for Phase 1 and 2. Sub-places become important when the friend recommendation layer is built.

Key questions:
- Does a sub-place get its own coordinates and Google Places ID?
- Does it appear on the map at high zoom levels?
- How do you display a friend's sub-place recommendation when you're viewing a destination you haven't visited?

### Hierarchical Destinations
The idea that a pin for "Croatia" and a pin for "Dubrovnik" should have a parent-child relationship. Explored and deliberately deferred — the visit/intent model is the right foundation. Revisit once friction is felt firsthand.

### Trip Grouping & Multi-Destination Trips
One trip often spans multiple destinations (e.g. Croatia + Slovenia). The app currently stores destinations independently with no grouping concept.

Options to explore later:
- A "Trip" object that contains multiple destinations with an order and date range
- AI-assisted grouping — "these three destinations have visits in the same year, want to group them into a trip?"
- Manual drag-to-group on the map
- The worm visual naturally expresses trip grouping if destinations within a trip are connected

### AI-Assisted Trip Clustering
If a user says "I want to go to Albania, Croatia, and Slovenia someday" — the AI could suggest different possible trip groupings based on geography, travel time, and the user's typical trip length. This is a Phase 3/4 problem but worth keeping in mind when designing the AI memory layer.

---

## AI Feature Ideas

### Voice-First AI Conversation
The primary AI input mode should be voice, not text. People's raw spoken thoughts about travel are richer and more natural than typed notes. The magic is turning a free-flowing voice conversation into structured map data — pins dropping in real time as the AI understands what's being said. Text input should be supported but voice is the default. This is a Phase 2 feature.

### Ambiguous Place Handling
When a user mentions something vague ("I traveled around Southeast Asia for three months"), the AI should drop a placeholder pin — visually distinct, flagged as incomplete — at approximate coordinates for the region. This captures that something happened there without pretending to be precise. The placeholder invites the user to come back and add detail. Better than asking the user to be specific upfront and breaking the conversational flow.

### Travel Copilot — Core Vision
Not an itinerary generator. A thinking partner that:
- Knows everywhere you've been and how you traveled there
- Knows your list and planning destinations
- Understands your travel style, preferences, and past experiences
- Helps you think through timing, cost, and trip shape over months or years
- Surfaces relevant information proactively (best time of year, upcoming events, price drops)
- Becomes more useful the more history it has

### Building Block Itinerary Planning
Instead of spitting out a complete itinerary, the AI presents options at each decision point — multiple choice, selectable components, user-assembled pieces. The user decides, the AI fills gaps. Feels collaborative rather than prescriptive.

Example flow:
- "I want to do Switzerland by train for about 10 days"
- AI: "Here are 4 cities people love for that trip — pick the ones that interest you"
- User selects 3
- AI: "Here are some experiences in each — pick what resonates"
- User selects, AI fills in logistics, timing, transitions

### AI Destination Suggestions (Phase 4)
A separate map layer — visually distinct pins — for destinations the AI thinks you'd love based on your travel history and style.

UX considerations:
- Should feel like discovery, not a recommendation engine
- Small number of suggestions — maybe 3-5 at a time
- Easy to dismiss or shuffle for new suggestions
- Tapping one should explain *why* it was suggested in terms of your travel history

---

## Product & Business Ideas

### Friend Recommendation Layer
When viewing a destination you haven't visited, see notes from friends who have — what they loved, where they stayed, what they'd skip. Recency matters: surface more recent visits more prominently. Specificity matters: a friend who mentions the Musée d'Orsay by name is more useful than one who says "loved the museums."

This only works if friends have built their own maps with enough detail. The cold start problem is real — value from the app needs to be high enough for individual users before the social layer adds anything. Solve the individual value first.

### Intent Pins — Capped at What Matters
The places you want to go shouldn't be a list of 400 destinations. The map should show the places you'd actually go next — maybe 5 to 10 real candidates. The AI can help with this: "you have 40 places on your list — which ones are you actually thinking about in the next couple of years?" Intent as a curated shortlist, not a dumping ground.

### Browser Extension Distribution
The core product — a map, some pins, an AI you tap a microphone to talk to — is simple enough to live in a browser extension. Lower friction than a standalone app. Could be a later distribution strategy once the web app is validated. Do not build for this format until the product itself is proven.

### Validation Path
Current plan: build for personal use, share with a small group of friends, use engagement as signal. The shareable map image is the key test — if people who see it want one of their own, the visual is working. A landing page and waitlist would be the next step before any public launch.

---

## UX & Interaction Ideas

### Map as Home
The map is the default view — not a dashboard, not a feed. You always come back to the map. Everything else (sidebar, search, AI conversation) is layered on top of it. This is a strong UX principle to protect as the app grows.

### Mobile Bottom Sheet
On mobile, the sidebar becomes a bottom sheet that slides up when a pin is tapped. The map remains visible behind it. This pattern is well established (Google Maps uses it) and should feel native on mobile even as a web app.

### Filtering / Layering the Map
As destination count grows, the map could get cluttered. Future ideas:
- Toggle layers by state (show only planning destinations, hide visited)
- Filter by year or decade
- Cluster pins at low zoom levels, expand on zoom
- Highlight a specific trip's path as a connected route

### Placeholder Pins for Ambiguous Places
Visually distinct from confirmed pins — perhaps dashed outline, grayed fill, question mark overlay. Indicates that something happened in this region but the detail hasn't been captured yet. Tapping one prompts the user to add more detail or break it into specific destinations.

---

*Last updated: post-v1 redesign session*
