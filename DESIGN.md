---
name: Submarine Museums of the World
description: A public naval archive of every preserved submarine, plotted as a live acoustic contact board.
colors:
  ink: "#04070a"
  ink-1: "#060c11"
  ink-2: "#0a141b"
  ink-3: "#0e1c25"
  text: "#e8f1f5"
  text-dim: "#93a9b2"
  text-muted: "#7d949e"
  amber: "#ffb648"
  alarm: "#ff4d3d"
  diesel: "#ffb648"
  nuclear: "#7dffb2"
  electric: "#5bc8ff"
  hand-crank: "#d8c9a3"
  afloat: "#8ee2ff"
  water: "#2f9bff"
  land: "#d777ff"
  enclosed: "#3fe85f"
  monument: "#ff6a35"
typography:
  display:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(58px, 11.4vw, 172px)"
    fontWeight: 700
    lineHeight: 0.8
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(34px, 5.6vw, 76px)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(24px, 2.6vw, 34px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Azeret Mono, ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.18em"
rounded:
  none: "0px"
  dot: "50%"
spacing:
  gutter: "clamp(20px, 4vw, 64px)"
  rail: "58px"
  xs: "8px"
  sm: "16px"
  md: "28px"
  section: "clamp(64px, 9vw, 132px)"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    padding: "15px 22px"
    rounded: "{rounded.none}"
  button-primary-hover:
    backgroundColor: "#ffc76a"
    textColor: "{colors.ink}"
  button-line:
    backgroundColor: "rgba(6, 12, 17, 0.35)"
    textColor: "{colors.text}"
    padding: "15px 22px"
    rounded: "{rounded.none}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.text-dim}"
    padding: "8px 11px"
    rounded: "{rounded.none}"
  chip-active:
    backgroundColor: "rgba(255, 182, 72, 0.14)"
    textColor: "{colors.amber}"
    padding: "8px 11px"
    rounded: "{rounded.none}"
  panel:
    backgroundColor: "rgba(5, 10, 14, 0.9)"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.text-dim}"
    padding: "5px 8px"
    rounded: "{rounded.none}"
  input-search:
    backgroundColor: "rgba(4, 7, 10, 0.6)"
    textColor: "{colors.text}"
    height: "40px"
    rounded: "{rounded.none}"
---

# Design System: Submarine Museums of the World

## Overview

**Creative North Star: "Acoustic Plot"**

The archive behaves like the plot in a submarine's control room at night: a dark sea, a handful of cool instrument readouts, and amber reserved for whatever is live. Map tiles are literally the floor of the page — the sticky plot stays behind the cover, the operations console and the register while the archive scrolls over it. Nothing is decorated to look technical; the technical objects (coordinates, hull codes, years, counts) *are* the ornament.

The voice is a working naval record, not a war game. Headlines are heavy, condensed and uppercase; everything the instrument would measure — codes, counts, ranges, bearings, labels — is set in mono at small size with wide tracking. Colour carries meaning and nothing else: amber is live data and selection, red is a locked contact, and the five situation hues and four propulsion hues are the only other colours in the system.

Density is deliberate. Panels sit on hairline rules, corners are square, and the only curves are the contact dots, the sonar rings and the sweep. Space is generous above a heading and tight inside a readout, so the eye reads hierarchy without borders doing the work.

**Key Characteristics:**
- Full-bleed Esri dark plot, fixed behind every surface, with live contacts acquired on load.
- One dark ink field, one text colour, one live accent (amber), one alarm (red).
- Archivo condensed display + Azeret Mono data labels; no third face.
- Zero radius, one-pixel hairlines, tonal elevation instead of shadows.
- Sequential reveal: gate → boot telemetry → cover → console → watches → featured → briefing → origin.

## Colors

A night-water palette: near-black blue-green ink, cool off-white text, and a single warm amber that means "live".

### Primary
- **Signal Amber** (#ffb648): live data and interaction. Acquisition counter, live HUD dot, active filter chips, locked-contact rules, focus outlines, era sparklines, primary buttons. It is the only warm colour in the interface.

### Secondary
- **Lock Alarm** (#ff4d3d): one job only — the currently locked contact (marker ring, log row, register row) and the destructive "clear filters" affordance. Never used for emphasis or decoration.

### Tertiary
- **Propulsion hues** — Diesel (#ffb648), Nuclear (#7dffb2), Electric (#5bc8ff), Hand-crank (#d8c9a3) — and **situation hues** — Afloat (#8ee2ff), In water (#2f9bff), On land (#d777ff), Enclosed (#3fe85f), Monument (#ff6a35). These appear as 6–7px dots, tag text and telemetry bars; they are data encoding, not palette decoration.

### Neutral
- **Deep Plot Ink** (#04070a): page ground, gate, footer.
- **Ink 1–3** (#060c11, #0a141b, #0e1c25): tonal steps for panel grounds, media wells and hover surfaces.
- **Readout White** (#e8f1f5): primary text, headings, values.
- **Instrument Grey** (#93a9b2): secondary copy, labels, inactive navigation.
- **Muted Grey** (#7d949e): tertiary metadata; the floor for text contrast on ink (≥4.5:1 at body sizes).
- **Hairlines** — `rgba(232,241,245,0.13)` and `rgba(232,241,245,0.07)` — are the only borders in the system.

### Named Rules
**The One Voice Rule.** Amber appears on ≤10% of any screen and always marks something alive or selected. If a surface needs emphasis and amber is already spent, use type weight or a hairline, not another colour.

**The Encoding Rule.** A colour that encodes data (propulsion, situation) never becomes a surface colour. It may appear as a dot, a border tint, a bar or text — never as a panel background.

## Typography

**Display Font:** Archivo (with Helvetica Neue, Arial)
**Body Font:** Archivo (with Helvetica Neue, Arial)
**Label/Mono Font:** Azeret Mono (with ui-monospace, SFMono-Regular, Consolas)

**Character:** A grotesque condensed to 76–85% width for headlines gives the archive its stencilled, official weight; Azeret Mono at 9–11px with 0.12–0.26em tracking makes every count, code and range read as an instrument label. The pairing is one family for voice, one for measurement.

### Hierarchy
- **Display** (700, `clamp(58px, 11.4vw, 172px)`, 0.8, -0.025em, uppercase): the cover title only. The second line is outlined (`-webkit-text-stroke: 1.5px rgba(232,241,245,0.55)`) instead of filled.
- **Headline** (700, `clamp(34px, 5.6vw, 76px)`, 0.9, -0.02em, uppercase): section titles and the console title.
- **Title** (700, `clamp(24px, 2.6vw, 34px)`, 0.95, -0.015em, uppercase): dossier names, rail titles, era names.
- **Body** (400, 16px, 1.6): running copy, measure capped at 40–52ch; secondary copy is Instrument Grey.
- **Label** (500, 9–11px, 0.12–0.26em, uppercase, mono): field labels, panel heads, tags, counts, coordinates, table headers.

### Named Rules
**The Measurement Rule.** Mono is for anything the instrument would measure or name: codes, years, counts, ranges, coordinates, labels, table cells. Running prose and headings are always Archivo.

**The Tracking Rule.** Letterspacing is a function of size: 0.18–0.26em at 9–10px, 0.12–0.16em at 11px, and negative tracking only on display and headline sizes (-0.015em to -0.025em).

## Layout

A fixed 58px instrument rail across the top (54px below 720px) carries identity, navigation, sound and language. Content uses `--gutter: clamp(20px, 4vw, 64px)` on every surface.

The home is one continuous scroll over a sticky plot: `.stage` pins the Leaflet map at `calc(100svh - 58px)` while `.stage__scroll` pulls the content up over it with a negative margin. The cover fills exactly one viewport minus the rail and is a two-column instrument layout — lead column (title, standfirst, actions) and a 196–228px telemetry column with hairline-separated stats and the acquisition bar — over a six-plate era rack pinned to the bottom edge. Below 720px the stage becomes a static 82svh map with an ink fade at its base, the cover collapses to one column, and the stats become a 2×2 grid.

The operations console is a three-column grid `minmax(250px,300px) · 1fr · minmax(300px,380px)` — filters, a deliberate empty void of live map, and a sticky dossier — with the contact log and telemetry beneath. Below 980px it becomes two equal columns and the void is removed; below 720px every panel stacks full width.

Sections are separated by a single hairline and `clamp(64px, 9vw, 132px)` of vertical padding. Interior rhythm is 8/16/28px. The register is a two-column layout (list + sticky dossier) that collapses to one column at 980px, with the dossier becoming a bottom sheet on demand.

## Elevation & Depth

The system is flat by design: **there are no drop shadows on surfaces.** Depth comes from three devices only — tonal ground steps (ink → ink-1 → ink-2 → ink-3), one-pixel hairlines that separate but do not lift, and `backdrop-filter: blur(10–14px)` on panels that float over the live map, so the plot is felt behind them without being readable.

Glow is reserved for live instrumentation: contact dots (`0 0 12px` of their own colour), the locked-contact ring (`0 0 22px rgba(255,77,61,0.8)`), the HUD live dot, and a 2px inset amber rule on the selected log/register row. These are signal, not elevation.

### Named Rules
**The Flat-By-Default Rule.** A surface never gains a shadow to look important. If it must separate from the plot, it gains a hairline, a tonal step, or blur — never a cast shadow.

**The Glow-Is-Data Rule.** Halos exist only where something is transmitting: contacts, locks, the live indicator. A halo on a button or a card is a bug.

## Shapes

Square by default: every panel, button, chip, tag, field, row and media well is `border-radius: 0`. The form language is the instrument face — rectangles divided by hairlines, with corner brackets on the plot frame (16px from each corner) and a 72px grid on the gate.

The only circles in the system are data: 6–7px contact and legend dots, 34px cluster discs, the sonar rings and the sweep, and the 1px focus outline (offset 3px). The occupied-contact ping is a 1px expanding ring, never a filled badge.

## Components

### Buttons
- **Shape:** square, 1px transparent or hairline border, uppercase mono label at 11px/0.22em.
- **Primary:** Signal Amber ground, Deep Plot Ink text, `15px 22px` (large: `19px 28px`). Hover lightens to #ffc76a and lifts 1px; active returns to 0.
- **Secondary / Ghost:** transparent ground with a hairline border and Readout White text; hover swaps border and text to amber. Small variant: `11px 15px`, 10px label.
- **Focus:** 2px amber outline, 3px offset, everywhere.

### Chips (filters)
- **Style:** 1px hairline, transparent ground, Instrument Grey uppercase mono at 10px; a 7px dot in the data colour and a 9px count.
- **State:** pressed turns text and border amber on `rgba(255,182,72,0.14)`; the reset chip is the only red chip.

### Cards / Containers
- **Corner Style:** square (0).
- **Background:** panels `rgba(5,10,14,0.9)` with 14px blur; plotted panels carry a top-to-bottom ink gradient so the map reads through the edges.
- **Border:** 1px hairline; hover raises the border to `rgba(255,182,72,0.4)` on unit cards and era plates.
- **Internal Padding:** 18–24px panels, 12–14px media cards.

### Inputs / Fields
- **Style:** 40px tall, hairline border, `rgba(4,7,10,0.6)` ground, mono 10–11px uppercase; selects hide the native arrow and use a rotated chevron.
- **Focus:** the wrapper border turns amber on `:focus-within`; the field itself has no outline.

### Navigation
- **HUD:** fixed rail with logo (greyscale, screen blend), archive code, blinking live dot, anchor links in 10px mono with a 1px amber underline that wipes in from the left on hover; sound toggle and EN/ES language switch at the right.
- **Mobile:** the rail collapses to logo, sound, language and a menu button; navigation moves to a full-height overlay with 01–05 numbered entries.
- **Active state:** amber text plus the amber underline.

### Era Plate (signature)
The six chronological watches appear twice: as a bottom rack of six hairline-separated columns on the cover (index, name, range, amber acquisition bar), and as 3-up cards in the archive body with a generated sparkline, the unit count and an "open watch" affordance. Both link straight into the filtered register.

### Contact & Dossier (signature)
Contacts are 7px dots in their propulsion colour on a 30px hit area. Locking one turns it red, expands its ping ring, opens the dossier (code, name, status tags, 16:9 media, six-row fact table) and re-renders the console log with the selected row marked by a 2px inset amber rule.

## Do's and Don'ts

### Do:
- **Do** keep the plot full-bleed and visible behind the cover, console and register; it is the page's ground, not an illustration.
- **Do** reserve amber for live data and selection, and red for the single locked contact.
- **Do** set every code, count, year and range in mono with 0.12em+ tracking.
- **Do** use a hairline, a tonal step or blur to separate surfaces; keep corners at 0.
- **Do** let headings sit directly on the section — the title carries the section, and a mono note beside it carries the count.
- **Do** generate every number from the JSON snapshot at runtime; never hard-code counts into copy.
- **Do** honour `prefers-reduced-motion` by removing the sweep, the reveals and the boot sequence.

### Don't:
- **Don't** add border-radius to surfaces or buttons; only data marks are round.
- **Don't** add drop shadows to cards, panels or buttons.
- **Don't** use amber or red as a surface fill beyond the primary button and the lock tint.
- **Don't** place a kicker, eyebrow or numbered label above a heading; section identity comes from the headline itself.
- **Don't** use mono for running prose, or Archivo for measurements.
- **Don't** put a coloured left/right border thicker than 1px on cards or callouts.
- **Don't** animate layout properties, or animate anything that is not a state change or the boot/plot sequence.
