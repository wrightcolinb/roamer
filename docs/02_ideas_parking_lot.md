# roamer — Ideas Parking Lot

This document captures ideas, musings, and feature concepts that are explicitly out of scope for current build phases but worth revisiting. Nothing here should influence active development. Review this document when starting a new phase to see if anything is ready to graduate.

---

## Visual & Identity Ideas

### The Worm / Trip Path Visual
Trips are not just collections of locations — they have an order, a flow, a shape. The visual metaphor of a "worm" or path on a map is compelling: nodes (destinations) connected by lines (travel between them), creating a creature-like trail across the globe. This could become a core part of the brand identity and map experience.

Questions to explore:
- Is the path a straight line between nodes, a great circle arc, or something more stylized?
- Does the worm animate when you interact with it?
- Could this be the thing that makes roamer visually distinctive vs every other travel map?
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

---

## Data Model & Architecture Ideas

### Hierarchical Destinations
The idea that a pin for "Croatia" and a pin for "Dubrovnik" should have a parent-child relationship. Explored and deliberately deferred — flat storage is correct for Phase 1. Revisit in Phase 2 once friction is felt firsthand.

Considerations when revisiting:
- Does the hierarchy need to be explicit in the DB or can it be inferred from geo-containment?
- How does status inheritance work? If Croatia is "dreaming" and Dubrovnik is "planning", what does that mean?
- How do you visualize nested destinations on a map without it becoming cluttered?

### Trip Grouping & Multi-Destination Trips
One trip often spans multiple destinations (e.g. Croatia + Slovenia). The app currently stores destinations independently with no grouping concept. 

Options to explore later:
- A "Trip" object that contains multiple destinations with an order
- AI-assisted grouping — "these three destinations are geographically close and all planning status, want to group them into a trip?"
- Manual drag-to-group on the map

### AI-Assisted Trip Clustering
If a user says "I want to go to Albania, Croatia, and Slovenia someday" — the AI could suggest different possible trip groupings based on geography, travel time, and the user's typical trip length. This is a Phase 3/4 problem but worth keeping in mind when designing the AI memory layer.

---

## AI Feature Ideas

### Travel Copilot — Core Vision
Not an itinerary generator. A thinking partner that:
- Knows everywhere you've been and how you traveled there
- Knows your dreaming and planning destinations
- Understands your travel style, preferences, and past experiences
- Helps you think through timing, cost, and trip shape over months or years
- Surfaces relevant information proactively (best time of year, upcoming events, price drops)

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

### Social / Sharing Layer
Travel is inherently social. Future possibilities:
- Share your map with friends (view only)
- See where friends have been / are going
- Friend recommendations — "X has been here and thinks you'd love it"
- Public profiles for frequent travelers or travel creators

### Validation Path
Current plan: build for personal use, share with friends informally, use engagement as signal. If friends use it unprompted and return to it — that's meaningful signal. A landing page and waitlist would be the next step before any public launch.

---

## UX & Interaction Ideas

### Map as Home
The map is the default view — not a dashboard, not a feed. You always come back to the map. Everything else (sidebar, search, AI chat) is layered on top of it. This is a strong UX principle to protect as the app grows.

### Mobile Bottom Sheet
On mobile, the sidebar becomes a bottom sheet that slides up when a pin is tapped. The map remains visible behind it. This pattern is well established (Google Maps uses it) and should feel native on mobile even as a web app.

### Filtering / Layering the Map
As destination count grows, the map could get cluttered. Future ideas:
- Toggle layers by status (show only "planning", hide "been")
- Filter by region or trip
- Cluster pins at low zoom levels
- Highlight a specific trip's path

---

*Last updated: project kickoff*
