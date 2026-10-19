# Submarine Museums — home plot + register

## Scope and mode
Two surfaces, one visual world: `index.html` (clearance gate → cover plot → operations console) and `registro.html` (the full register with dossier). Persuade at the cover, Operate inside the console and register. English is native; Spanish is the second version.

## Audience, job, action
Two visitors share one archive: the traveller who is near a museum hull and wants to know if it is worth the trip, and the naval enthusiast who wants the file — class, year, condition, film. The action is to open a contact and read its file; every route ends in a dossier.

## Proof and content
160 real units from the Google Sheet snapshot, 35 countries, 27 with a real video from the elSnorkel playlist, situation recorded for 20. No invented claims; counts come from the data at runtime.

## Constraints
Static HTML/CSS/vanilla JS, JSON as the only data source, Leaflet + Esri dark tiles, no build step, no copyrighted assets, mobile first, WCAG-minded (gate skippable, reduced motion honored, sound optional).

## Chosen direction and memorable moment
Acoustic plot: the archive behaves like a sonar watch. Contacts are acquired one by one across the plot; the console lets you lock one and read its numbered file. The memorable moment is the acquisition — 160 contacts arriving as the archive loads.

## Unresolved
Instagram URL pending; five situation glyphs pending redesign; four units and seven ambiguous videos pending.

## Direction contract

THESIS: An archive that behaves like a sonar watch — the category's map-plus-card-grid becomes a plot where contacts are acquired one by one and every contact opens as a numbered file.

OWN-WORLD: Near-black plot (#04070a), cool-white readouts (#e8f1f5), amber for live data (#ffb648), one alarm red (#ff4d3d). Hairline bearing rings, tick marks, a vertical waterfall trace, corner brackets. Archivo condensed uppercase for display, Azeret Mono for every number and label.

STORY: The visitor understands this is the complete, public register of preserved submarines; believes it because the instrument shows 160 acquired contacts and 27 films; enters the register, filters by era or propulsion, locks a contact and reads its file.

FIRST VIEWPORT: Full-bleed plot. Header rail 56px. Left: kicker, two-line title at clamp(56px, 11vw, 172px), one line of copy, amber primary action. Right: a telemetry column with contacts, waters, films, propulsion. Bottom: a six-plate era rack 150px tall. Contacts acquire across the plot as data loads; the acquisition counter sits under the stats.

FORM: Assigned direction 7 of 7 (acoustic plot). seed:7c88d2850336737c

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
