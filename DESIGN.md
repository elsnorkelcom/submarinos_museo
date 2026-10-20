---
name: Submarine Museums of the World
description: A confidential naval archive that assigns the reader a preserved submarine, plots every contact and opens the file.
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
  paper: "#f2efe6"
  paper-1: "#eae6da"
  paper-ink: "#101a20"
  paper-amber: "#a15a00"
  diesel: "#ffb648"
  nuclear: "#7dffb2"
  electric: "#5bc8ff"
  hand-crank: "#d8c9a3"
  afloat: "#8b90a3"
  water: "#1a8cff"
  land: "#da00da"
  enclosed: "#00d933"
  monument: "#b52000"
typography:
  display:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(46px, 12.2vw, 138px)"
    fontWeight: 700
    lineHeight: 0.82
    letterSpacing: "-0.028em"
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
    lineHeight: 1.55
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
  button-solid:
    backgroundColor: "{colors.paper-ink}"
    textColor: "{colors.paper}"
    padding: "15px 22px"
    rounded: "{rounded.none}"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    padding: "15px 22px"
    rounded: "{rounded.none}"
  switch:
    backgroundColor: "rgb(4 7 10 / 0.38)"
    textColor: "{colors.text-dim}"
    padding: "0 9px"
    height: "38px"
    rounded: "{rounded.none}"
  mission:
    backgroundColor: "rgb(4 7 10 / 0.45)"
    textColor: "{colors.text}"
    padding: "13px 14px 14px"
    rounded: "{rounded.none}"
  panel:
    backgroundColor: "rgb(5 10 14 / 0.9)"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.text-dim}"
    padding: "5px 8px"
    rounded: "{rounded.none}"
  input-search:
    backgroundColor: "rgb(4 7 10 / 0.6)"
    textColor: "{colors.text}"
    height: "38px"
    rounded: "{rounded.none}"
---

# Design System: Submarine Museums of the World

## Overview

**Creative North Star: "The Assignment"**

The archive is framed as a confidential briefing. On arrival the interface does not ask the reader to browse: it hands them a destination — one preserved submarine, its museum, its coordinates — and treats the rest of the register as the evidence behind that order. The tone is mission/game, but the content is a real naval record. Nothing is invented; the fiction is only the frame.

The visual language underneath is still the **Acoustic Plot**: near-black sea, cool instrument readouts, amber for whatever is live. That language now lives in a bounded map section instead of a fixed backdrop, so the home reads as three decisive blocks — **Hero · Map · Detail** — and the rest of the archive moves to its own pages. On mobile the map is the stage: the tactical filter panel rises from its bottom edge, and the assigned file sits directly beneath it.

Headlines are heavy, condensed and uppercase. Everything the instrument would measure — codes, counts, ranges, bearings, labels — is set in mono at small size with wide tracking. Colour carries meaning and nothing else: amber is live data and selection, red is a locked contact, and the propulsion/situation hues are the only other colours.

**Key Characteristics:**
- **Three-block home**: hero with the assigned mission, the plot with its tactical panel, the dossier of the assigned contact.
- **One assignment per visit**: a mission ticket names a submarine, its museum and the distance; the detail block becomes `MISSION TARGET`.
- **Map as the only control surface**: propulsion, era, situation, country, search and media filters live in a bottom panel shaped like a submarine tactical board.
- **Two printed states**: night plot (default) and `DECLASSIFIED PAPER` (light), both using the same tokens and the same data encoding.
- **Pages, not an endless scroll**: eras, featured contacts, register and archive notes each have a single job.
- Zero radius, one-pixel hairlines, tonal elevation instead of shadows.
- Archivo condensed display + Azeret Mono data labels; no third face.

## Colors

### Night plot (default)
- **Deep Plot Ink** (#04070a): page ground, map bed, footer.
- **Ink 1–3** (#060c11, #0a141b, #0e1c25): tonal steps for panels, media wells, hover surfaces.
- **Readout White** (#e8f1f5): primary text, headings, values.
- **Instrument Grey** (#93a9b2): secondary copy and labels.
- **Muted Grey** (#7d949e): tertiary metadata; the contrast floor for small text on ink.
- **Signal Amber** (#ffb648): live data, the assigned mission, selected filters, primary actions, sparklines.
- **Lock Alarm** (#ff4d3d): the currently locked contact and the clear-filters affordance. Nothing else.

### Declassified paper (light)
`html[data-theme="light"]` swaps the polarity of the same instrument:
- **Warm stock** (#f2efe6) page, with #eae6da / #e1dccd / #d6d0bf as tonal steps.
- **Ink text** (#101a20), **grey** (#465861 / #6a7a83) for secondary copy.
- **Ochre** (#a15a00) replaces signal amber so contrast survives on paper; **brick** (#b3261e) replaces alarm red.
- **Solid actions invert**: the primary button becomes ink on paper, with cream text.
- Map tiles switch to Esri `World_Light_Gray_Base` with a warm, desaturated filter; the dark theme uses `World_Dark_Gray_Base`.

### Data hues
Propulsion: Diesel (#ffb648), Nuclear (#7dffb2), Electric (#5bc8ff), Hand-crank (#d8c9a3). Situation: Afloat (#8b90a3), In water (#1a8cff), On land (#da00da), Enclosed (#00d933), Monument (#b52000). Situation also carries a badge glyph (coloured ring, light face, dark pictogram); the ring colour is the situation token.

### Named Rules
**The One Voice Rule.** Amber appears on ≤10% of any screen and always marks something alive or selected. If amber is already spent, use type weight or a hairline.

**The Encoding Rule.** A colour that encodes data never becomes a surface colour. It may appear as a dot, a badge, a border tint, a bar or text.

**The Paper Rule.** Light mode is a print of the same instrument, not a different brand. Every surface, hairline and data hue must remain legible in both themes; never hard-code a dark colour on a themed surface.

## Typography

**Display / Body:** Archivo (Helvetica Neue, Arial)
**Labels / Data:** Azeret Mono (ui-monospace, SFMono-Regular, Consolas)

**Character:** Archivo condensed to 76–85% width gives the archive its stencilled, official weight. Azeret Mono at 7–11px with 0.10–0.26em tracking makes every count, code and range read as an instrument label. One family for voice, one for measurement.

### Hierarchy
- **Display** (700, `clamp(46px, 12.2vw, 138px)`, 0.82, -0.028em): the home title only. The second line is outlined (`-webkit-text-stroke: 1.2px`) instead of filled.
- **Headline** (700, `clamp(34px, 5.6vw, 76px)`, 0.9): inner page titles and section titles.
- **Title** (700, `clamp(24px, 2.6vw, 34px)`, 0.95): dossier names, rail titles, era names.
- **Body** (400, 16px, 1.55): running copy, measure capped at 40–52ch; secondary copy is Instrument Grey.
- **Label** (500, 7–11px, 0.10–0.26em, uppercase, mono): field labels, panel heads, tags, counts, coordinates, table headers.

### Named Rules
**The Measurement Rule.** Mono is for anything the instrument would measure or name. Running prose and headings are always Archivo.

**The Tracking Rule.** Letterspacing is a function of size: 0.18–0.26em at 7–10px, 0.10–0.16em at 11px, negative tracking only on display/headline sizes.

## Layout

A 58px instrument rail across the top (54px below 720px) carries identity, navigation, theme, sound and language. Content uses `--gutter: clamp(20px, 4vw, 64px)` on every surface.

### Home (three blocks)
1. **Hero** — classified stamp and revision line, the two-line title, standfirst, stats (contacts, waters, films, propulsion types), the two entry actions, and the **mission ticket** in the right column on desktop. On mobile the mission ticket sits between the standfirst and the stats.
2. **Map** — a bounded `.plot-section`: a one-line HUD (title, count, lock state, readout, tiles credit), the Esri plot (`clamp(430px, 66svh, 720px)`), the boot terminal at its top-left, and the tactical panel pinned to its bottom edge.
3. **Detail** — the assigned dossier: code, name, type/situation tags, fact grid, description, media (photo, inline film or blueprint placeholder) and the three actions (locate, route, copy link). On desktop it is a two-column dossier inside a 1180px measure; on mobile the media moves above the name and the whole block stacks.

The home URL is deliberately not synchronised with the random mission, so a reload can assign a different target. Deep links (`?unit=<slug>`) still open a specific file.

### Tactical panel (the only filter surface)
- **Groups**: PROPULSION (4 switches, count each), ERA (6 switches), SITUATION (5 switches), SEARCH (query field, country select, media toggles), and a red CLEAR chip that only appears with active filters.
- **Desktop (≥861px)**: the panel is always open, four columns — `repeat(3, 1fr) minmax(250px, .95fr)` — across the bottom of the map.
- **Mobile (≤860px)**: it collapses to a 52px bar (`data-open`) showing the filter icon and the live count; opening reveals a board that grows upward from the bottom edge, capped at 58svh and scrollable.
- Every switch is a submarine board button: square, hairline, a small glowing propulsion dot or situation badge, and the count in mono.

### Inner pages
- **Eras** (`epocas.html`): a page head plus six era cards with sparkline, range and count; each opens the filtered register.
- **Featured** (`destacados.html`): a billboard contact with photograph and actions, then five rails (video, diesel, nuclear, electric, hand-crank) of five cards each. The billboard and rail order rotate on every visit.
- **Register** (`registro.html`): a full table (code, unit/museum, type, country, year) with a sticky dossier on desktop and a bottom sheet on mobile; filters, search and sort are in a single bar.
- **Archive** (`archivo.html`): briefing facade, telemetry bars, the numbers panel and the origin note.

## Two Themes

The theme is chosen before first paint from `localStorage` (`snk-theme`) with `prefers-color-scheme: light` as the fallback; the toggle updates `html[data-theme]`, the Esri tile layer, `<meta name="theme-color">` and the aria-label, and persists. The default is the night plot.

Theme changes are a **state change**, not a page reload: the map tiles swap, the paper tokens resolve, and the tactical panel, dossier and footer re-paint from the same variables. No component may assume a dark ground.

## Elevation & Depth

The system is flat by design: **there are no drop shadows on surfaces.** Depth comes from tonal ground steps, one-pixel hairlines, and `backdrop-filter: blur(10–14px)` on surfaces that float over the live map (tactical panel, boot terminal, mobile sheets).

Glow is reserved for live instrumentation: contact dots, the locked-contact ring, the HUD live dot, and the amber focus outline. These are signal, not elevation.

### Named Rules
**The Flat-By-Default Rule.** A surface never gains a shadow to look important. If it must separate, it gains a hairline, a tonal step or blur.

**The Glow-Is-Data Rule.** Halos exist only where something is transmitting.

## Shapes

Square by default: every panel, button, switch, tag, field, row and media well is `border-radius: 0`. The form language is the instrument face — rectangles divided by hairlines.

The only circles are data and controls: contact dots, situation badges, cluster discs, the recorded-video play disc, the theme toggle's sun/moon, and the focus outline.

## Motion

- **Instrument ease** `cubic-bezier(.2,.7,.2,1)` for colour/border/transform, 140–200ms.
- **Settle ease** `cubic-bezier(.16,1,.3,1)` for sheets, modal entry and reveals, 400–700ms.
- **Acquisition** — on every home load a 3px entry bar under the rail fills with the contact count while the boot terminal reports the secure link; once the plot is complete both fade out and leave the map interactive.
- **Lock ping** — 2.2s expanding ring on the assigned/locked contact only.
- **Video** — the modal opens full-screen on mobile (`100dvh`) with a 43px hint bar; `GIRAR` rotates a 16:9 player 90° in CSS and resets on close.
- `prefers-reduced-motion: reduce` removes the ping, boot log timing, reveals and sheet/panel transitions; the entry bar jumps to complete and fades.

## Components

### Buttons
- Square, 1px hairline or transparent border, uppercase mono label.
- **Primary (amber)**: Signal Amber ground, ink text, `15px 22px`. Hover lightens, lifts 1px.
- **Solid (ink)**: ink ground, cream text — the light-theme primary and the mission's "open file".
- **Line**: transparent ground, hairline border; hover swaps to amber.
- Focus: 2px amber outline, 3px offset, everywhere.

### Entry bar

A 3px amber bar fixed under the rail for the duration of the home acquisition. It has no label of its own: the `role="progressbar"` value and the boot terminal supply the context. It fades 650ms after the last contact, never before. On reduced motion it jumps to 100 and fades without a width transition.

### Tactical switches
38px tall, square, transparent ink ground with a hairline; a 5px propulsion dot (or 14px situation badge) and a 7px count. Pressed: border and text take the data hue at 60% / 13% mix, dot at full glow. The CLEAR chip is the only red control.

### Mission ticket (signature)
A bordered ticket with a 2px amber left rule, `MISIÓN ASIGNADA` and the dossier code on one line, the target name in condensed uppercase, the museum · city · country line in mono, and three actions: **open file**, **route** (Google Maps directions) and **another** (re-roll the assignment). It appears in the hero and is echoed by the `MISSION TARGET` state in the detail block.

### Dossier
Two-column on desktop: identity, facts and copy on the left; media and actions on the right. Media is a photograph if the sheet has one, an inline film on desktop, or a blueprint placeholder (`PLANO TÉCNICO // DIGITALIZACIÓN PENDIENTE`) otherwise. Tags carry propulsion and situation; the code stays amber.

### Video player (signature)
On mobile every film opens a fixed full-screen modal: title bar, the player filling the remaining height, and a bottom hint bar reading `GIRA EL MÓVIL O PULSA GIRAR` with a `GIRAR` button. Rotating swaps the player to `100dvh × 100vw` and 90°; the button becomes `VOLVER`. Closing restores the page and stops the player. Vertical-native films skip the rotate control.

### Navigation
- **HUD:** logo placeholder (typographic `elSnorkel / NAVAL ARCHIVE`), archive code, live dot, 10px mono links with a 1px amber underline, theme, sound, language, menu.
- **Mobile:** logo, theme, sound, menu; navigation moves to a full-height overlay with 01–05 entries.
- **Active state:** amber text plus the underline.

### Era Plate
Six chronological watches, as cards with a generated sparkline, the unit count and an "open watch" affordance; they link straight into the filtered register.

### Contact & Dossier
Contacts are 7px dots in their propulsion colour on a 30px hit area. Locking one turns it red, expands its ping, opens the dossier and updates the HUD/lock readout.

## Do's and Don'ts

### Do:
- **Do** assign a destination on arrival and let the detail block answer it.
- **Do** keep the map as the only filter surface; every control is reachable from the tactical panel.
- **Do** reserve amber for live data and selection, and red for the single locked contact.
- **Do** test both themes on every surface, especially sheets and media wells.
- **Do** set every code, count, year and range in mono with 0.10em+ tracking.
- **Do** use a hairline, a tonal step or blur to separate surfaces; keep corners at 0.
- **Do** generate every number from the JSON snapshot at runtime.
- **Do** honour `prefers-reduced-motion` by removing the ping, boot and reveals.

### Don't:
- **Don't** add border-radius to surfaces or buttons; only data marks are round.
- **Don't** add drop shadows to cards, panels or buttons.
- **Don't** use amber or red as a surface fill beyond the primary button and the lock tint.
- **Don't** hard-code dark colours inside themed components; use `--panel`, `--ink-*`, `--line`, `--txt`.
- **Don't** use mono for running prose, or Archivo for measurements.
- **Don't** animate layout properties, or animate anything that is not a state change, the acquisition sequence or the plot.
