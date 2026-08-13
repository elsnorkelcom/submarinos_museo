Scaffold: Portal Submarinos — React + Node

This scaffold adds a client (Vite + React 18 + Tailwind) and a server (Express) with two main endpoints:
- GET /api/sheet/fetch?url=<google_sheet_base_url>  -> fetches Points sheet as CSV and returns JSON
- POST /api/intelligence/dossier -> stub that returns an AI briefing (requires GENAI_KEY to enable)

Client includes basic components: MapView (react-leaflet), SearchBar, DossierModal, AudioSynth.

Run:
  cd client && npm install
  cd ../server && npm install
  cd ../server && npm run dev
  cd ../client && npm run dev

Notes:
- Tailwind must be initialized (postcss/tailwind configs included). Install dependencies as listed in package.json files.
- The intelligence endpoint is a stub; fill server/.env with GENAI_KEY to enable integration.
