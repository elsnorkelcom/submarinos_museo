import json
from pathlib import Path

PATH = Path("data/i18n.json")
data = json.loads(PATH.read_text(encoding="utf-8"))

updates_en = {
    "meta.title": "Submarine Museums of the World // Naval Archive",
    "meta.description": "A working register of 160 preserved submarines in 35 countries: tactical plot, numbered files and film.",
    "meta.ogTitle": "Submarine Museums of the World // Naval Archive",
    "meta.ogDescription": "160 preserved submarines. 35 countries. One plot. Lock a contact, read the file.",
    "filter.search": "SEARCH UNIT, MUSEUM OR CITY...",
    "filter.propulsion": "Filter by propulsion",
    "filter.situation": "Filter by situation",
    "filter.country": "Filter by country",
    "filter.media": "WITH PHOTO",
    "filter.video": "WITH FILM",
    "filter.coming": "COMING SOON",
    "dossier.emptyKicker": "NO CONTACT LOCKED",
    "dossier.emptyText": "Select a contact on the plot or in the log to open its file.",
    "section.featured.many": "UNITS",
    "rail.withVideo": "ON FILM",
}

updates_es = {
    "meta.title": "Submarinos Museo del Mundo // Archivo Naval",
    "meta.description": "Un registro vivo de 160 submarinos preservados en 35 países: plot táctico, expedientes numerados y vídeo.",
    "meta.ogTitle": "Submarinos Museo del Mundo // Archivo Naval",
    "meta.ogDescription": "160 submarinos preservados. 35 países. Un plot. Bloquea un contacto y lee su expediente.",
    "filter.search": "BUSCAR UNIDAD, MUSEO O CIUDAD...",
    "filter.propulsion": "Filtrar por propulsión",
    "filter.situation": "Filtrar por situación",
    "filter.country": "Filtrar por país",
    "filter.media": "CON FOTO",
    "filter.video": "CON VÍDEO",
    "filter.coming": "PRÓXIMAMENTE",
    "dossier.emptyKicker": "SIN CONTACTO BLOQUEADO",
    "dossier.emptyText": "Selecciona un contacto en el plot o en el registro para abrir su expediente.",
    "section.featured.many": "UNIDADES",
    "rail.withVideo": "EN VÍDEO",
}

new_en = {
    "meta.registerTitle": "The Register // Submarine Museums",
    "meta.registerDescription": "Every preserved submarine in one register: filter by propulsion, situation, era or country, and open the numbered file.",
    "skip": "Skip to the console",
    "register.skip": "Skip to the register",

    "gate.kicker": "NAVAL ARCHIVE // PUBLIC RECORD",
    "gate.title1": "SUBMARINE",
    "gate.title2": "MUSEUMS",
    "gate.sub": "160 preserved submarines. 35 countries. One working register of hulls, files and film.",
    "gate.stat1": "CONTACTS",
    "gate.stat2": "WATERS",
    "gate.stat3": "FILMS",
    "gate.enter": "ENTER THE ARCHIVE",
    "gate.fine": "Public record · No account · Sound on",
    "gate.skip": "Skip intro",
    "gate.foot": "OPEN RECORD",

    "hud.id": "NMMA // NAVAL ARCHIVE",
    "hud.live": "PLOT LIVE",
    "hud.sound": "Sound",
    "hud.menu": "Menu",

    "nav.plot": "PLOT",
    "nav.console": "CONSOLE",
    "nav.eras": "ERAS",
    "nav.register": "REGISTER",

    "cover.kicker": "ARCHIVE NMMA-26 // PUBLIC RECORD",
    "cover.title1": "SUBMARINE",
    "cover.title2": "MUSEUMS",
    "cover.sub": "Every preserved submarine on earth, plotted hull by hull: position, condition, file and film.",
    "cover.cta": "OPEN THE REGISTER",
    "cover.cta2": "WATCH THE BRIEFING",
    "cover.stat1": "CONTACTS",
    "cover.stat2": "WATERS",
    "cover.stat3": "ON FILM",
    "cover.stat4": "PROPULSION",
    "cover.acquiring": "ACQUIRING CONTACTS",
    "cover.watches": "WATCHES // 06",
    "cover.scroll": "SCROLL TO CONSOLE",

    "console.kicker": "// 01 — OPERATIONS CONSOLE",
    "console.title": "LOCK A CONTACT. READ THE FILE.",
    "console.note": "CONTACTS IN PLOT",
    "console.filters": "FILTERS",
    "console.flags": "FLAGS",
    "console.plotHint": "THE PLOT IS LIVE BEHIND THE PANELS",
    "console.log": "CONTACT LOG",
    "console.logMore": "OPEN FULL REGISTER",
    "console.telemetry": "TELEMETRY",

    "filter.lblPropulsion": "PROPULSION",
    "filter.lblSituation": "SITUATION",
    "filter.lblCountry": "COUNTRY",
    "filter.lblEra": "ERA",

    "eras.kicker": "// 02 — WATCHES",
    "eras.title": "THE ARCHIVE BY ERA",
    "eras.note": "Six watches, from 1850 to the present. Open one to narrow the register.",
    "eras.count": "CONTACTS",
    "eras.open": "OPEN WATCH",

    "featured.kicker": "// 03 — FEATURED",
    "featured.title": "FEATURED CONTACTS",

    "briefing.kicker": "// 04 — BRIEFING ROOM",
    "briefing.title": "THE FLEET IN MOTION",
    "briefing.note": "The elSnorkel film list, loaded only when you press play. Nothing is requested from YouTube before that.",
    "briefing.openList": "OPEN THE PLAYLIST",
    "briefing.play": "PLAY THE PLAYLIST",

    "origin.kicker": "// 05 — ORIGIN",
    "origin.title": "ABOUT THE ARCHIVE",
    "origin.stamp": "OPEN RECORD",

    "foot.rights": "© 2026 elSnorkel.com",

    "register.kicker": "// THE REGISTER",
    "register.title": "EVERY HULL ON RECORD",
    "register.note": "Filter the archive by propulsion, condition, era or country. Every row opens a numbered file.",
    "register.results": "CONTACTS ON RECORD",
    "register.back": "BACK TO PLOT",
    "register.emptySide": "Pick a row to open its file.",

    "boot.l1": "ARCHIVE NMMA-26 · PUBLIC RECORD",
    "boot.l2": "LOADING CONTACTS",
    "boot.l3": "VERIFYING HULLS",
    "boot.l4": "SYNCING FILMS",
    "boot.l5": "PLOT READY",
    "feed.acquired": "CONTACT {code} ACQUIRED",
    "feed.ready": "PLOT READY // {n} CONTACTS",
    "toast.lang": "LANGUAGE SWITCHED",
    "map.aria": "Plot of preserved submarines",
}

new_es = {
    "meta.title": "Submarinos Museo del Mundo // Archivo Naval",
    "meta.description": "Un registro vivo de 160 submarinos preservados en 35 países: plot táctico, expedientes numerados y vídeo.",
    "meta.ogTitle": "Submarinos Museo del Mundo // Archivo Naval",
    "meta.ogDescription": "160 submarinos preservados. 35 países. Un plot. Bloquea un contacto y lee su expediente.",
    "meta.registerTitle": "El Registro // Submarinos Museo",
    "meta.registerDescription": "Todos los submarinos preservados en un registro: filtra por propulsión, situación, época o país y abre el expediente.",
    "skip": "Saltar a la consola",
    "register.skip": "Saltar al registro",

    "gate.kicker": "ARCHIVO NAVAL // REGISTRO PÚBLICO",
    "gate.title1": "SUBMARINOS",
    "gate.title2": "MUSEO",
    "gate.sub": "160 submarinos preservados. 35 países. Un registro vivo de cascos, expedientes y vídeo.",
    "gate.stat1": "CONTACTOS",
    "gate.stat2": "AGUAS",
    "gate.stat3": "VÍDEOS",
    "gate.enter": "ENTRAR AL ARCHIVO",
    "gate.fine": "Registro público · Sin cuenta · Sonido activo",
    "gate.skip": "Saltar intro",
    "gate.foot": "REGISTRO ABIERTO",

    "hud.id": "NMMA // ARCHIVO NAVAL",
    "hud.live": "PLOT EN VIVO",
    "hud.sound": "Sonido",
    "hud.menu": "Menú",

    "nav.plot": "PLOT",
    "nav.console": "CONSOLA",
    "nav.eras": "ÉPOCAS",
    "nav.register": "REGISTRO",

    "cover.kicker": "ARCHIVO NMMA-26 // REGISTRO PÚBLICO",
    "cover.title1": "SUBMARINOS",
    "cover.title2": "MUSEO",
    "cover.sub": "Cada submarino preservado del mundo, trazado casco a casco: posición, estado, expediente y vídeo.",
    "cover.cta": "ABRIR EL REGISTRO",
    "cover.cta2": "VER EL BRIEFING",
    "cover.stat1": "CONTACTOS",
    "cover.stat2": "AGUAS",
    "cover.stat3": "EN VÍDEO",
    "cover.stat4": "PROPULSIÓN",
    "cover.acquiring": "ADQUIRIENDO CONTACTOS",
    "cover.watches": "GUARDIAS // 06",
    "cover.scroll": "BAJA A LA CONSOLA",

    "console.kicker": "// 01 — CONSOLA DE OPERACIONES",
    "console.title": "BLOQUEA UN CONTACTO. LEE EL EXPEDIENTE.",
    "console.note": "CONTACTOS EN EL PLOT",
    "console.filters": "FILTROS",
    "console.flags": "MARCAS",
    "console.plotHint": "EL PLOT ESTÁ VIVO DETRÁS DE LOS PANELES",
    "console.log": "REGISTRO DE CONTACTOS",
    "console.logMore": "ABRIR EL REGISTRO COMPLETO",
    "console.telemetry": "TELEMETRÍA",

    "filter.lblPropulsion": "PROPULSIÓN",
    "filter.lblSituation": "SITUACIÓN",
    "filter.lblCountry": "PAÍS",
    "filter.lblEra": "ÉPOCA",

    "eras.kicker": "// 02 — GUARDIAS",
    "eras.title": "EL ARCHIVO POR ÉPOCA",
    "eras.note": "Seis guardias, de 1850 al presente. Abre una para acotar el registro.",
    "eras.count": "CONTACTOS",
    "eras.open": "ABRIR GUARDIA",

    "featured.kicker": "// 03 — DESTACADOS",
    "featured.title": "CONTACTOS DESTACADOS",

    "briefing.kicker": "// 04 — SALA DE BRIEFING",
    "briefing.title": "LA FLOTA EN MOVIMIENTO",
    "briefing.note": "La lista de vídeos de elSnorkel, cargada solo al pulsar play. Nada se pide a YouTube antes.",
    "briefing.openList": "ABRIR LA LISTA",
    "briefing.play": "REPRODUCIR LA LISTA",

    "origin.kicker": "// 05 — ORIGEN",
    "origin.title": "SOBRE EL ARCHIVO",
    "origin.stamp": "REGISTRO ABIERTO",

    "foot.rights": "© 2026 elSnorkel.com",

    "register.kicker": "// EL REGISTRO",
    "register.title": "CADA CASCO EN EL REGISTRO",
    "register.note": "Filtra el archivo por propulsión, estado, época o país. Cada fila abre un expediente numerado.",
    "register.results": "CONTACTOS EN EL REGISTRO",
    "register.back": "VOLVER AL PLOT",
    "register.emptySide": "Elige una fila para abrir su expediente.",

    "boot.l1": "ARCHIVO NMMA-26 · REGISTRO PÚBLICO",
    "boot.l2": "CARGANDO CONTACTOS",
    "boot.l3": "VERIFICANDO CASCOS",
    "boot.l4": "SINCRONIZANDO VÍDEOS",
    "boot.l5": "PLOT LISTO",
    "feed.acquired": "CONTACTO {code} ADQUIRIDO",
    "feed.ready": "PLOT LISTO // {n} CONTACTOS",
    "toast.lang": "IDIOMA CAMBIADO",
    "map.aria": "Plot de submarinos preservados",
}

data["en"].update(updates_en)
data["en"].update(new_en)
data["es"].update(updates_es)
data["es"].update(new_es)

missing_en = sorted(k for k in data["es"] if k not in data["en"])
missing_es = sorted(k for k in data["en"] if k not in data["es"])
assert not missing_en and not missing_es, (missing_en, missing_es)

PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("en keys:", len(data["en"]), "es keys:", len(data["es"]))
