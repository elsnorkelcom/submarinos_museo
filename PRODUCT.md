# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dos audiencias, con el viajero como puerta de entrada:

- **Viajero / curioso (entrada mayoritaria).** Llega buscando «submarino museo cerca de mí». Quiere saber qué unidad tiene cerca, en qué estado físico está (en el agua, en tierra…) y si hay vídeo, para decidir la visita.
- **Aficionado naval hispanohablante (núcleo fiel).** Recorre el archivo completo, compara unidades, tipos y épocas, y se queda por el expediente y los vídeos.

## Product Purpose

Reunir en un solo archivo todos los submarinos que se conservan como museo en el mundo: dónde están, qué son y cómo se pueden ver. El éxito es que alguien pase de «¿hay un submarino museo cerca?» a un expediente completo sin salir del sitio.

## Positioning

Mapa, expediente y vídeo en la misma página, bilingüe y sin salir del sitio. Lo que otro no puede copiar sin el mismo trabajo es la combinación: geolocalización real de cada unidad, su situación física actual, ficha técnica y vídeo, todo colgando del mismo archivo curado a mano.

## Operating Context

- Los datos viven en una hoja de Google («Submarinos Museos SNK 2025», publicada) que se edita a mano y se importa a JSON con `scripts/import_sheets.py`. El sitio nunca consulta la hoja en tiempo de ejecución: lee `data/*.json`.
- Los vídeos salen de la lista de YouTube del proyecto, curada por el autor (`scripts/import_youtube.py`, `scripts/match_youtube.py`), con un vídeo por unidad.
- Se publica como sitio estático en GitHub Pages con dominio propio: `submarinos-museo-del-mundo.elsnorkel.com`, repositorio `elsnorkelcom/submarinos_museo`, rama `main`.
- Se consulta sobre todo desde el móvil.

## Capabilities and Constraints

**Confirmado**

- 160 unidades en 35 países, con coordenadas, país, ciudad, museo, tipo, clase, año de botadura, descripción y enlace.
- Tipos: Diésel 119 · Nuclear 24 · Eléctrico 14 · Manivela 3.
- Situación física conocida en 20 de 160 unidades: 9 en el agua y 11 en tierra. El sistema define además a flote, cerrado y solo monumento, todavía sin datos.
- 20 unidades con imagen y 27 con vídeo verificado.
- Bilingüe EN/ES completo (336 claves por idioma, paridad exigida). El inglés es el idioma nativo y el español la segunda versión.
- Mapa con clústeres, filtros por tipo, situación y época, orden, cronología y enlaces profundos por unidad (`?lang=es&unit=…`).
- Sin build, sin backend y sin API keys: HTML, CSS propio, JS vanilla, Leaflet por CDN y JSON.

**Abierto / pendiente**

- URL de Instagram del proyecto: sin definir.
- Cobertura no exhaustiva: faltan unidades conocidas (B-39 San Diego, HMAS Otama, U-17 Speyer/Sinsheim, B-380 Balaclava) y hay dos fichas por corregir (K-434 y U-434 duplicadas; SNK-094 con datos cruzados).
- Las descripciones largas de las fichas llegan desde la hoja solo en español.

## Brand Commitments

- La marca **elSnorkel** firma el archivo: nombre, logo y redes (web, Facebook, X, LinkedIn y YouTube). No es un producto anónimo.
- El vídeo es siempre la lista de YouTube del proyecto: no se aloja ni se sube vídeo propio.
- Voz de archivo naval (unidad, expediente, registro, situación), sobria y técnica, con el inglés como idioma nativo y el español como segunda versión.
- Solo material propio, cedido o enlazado; nada de assets con copyright ajeno. La iconografía de situación y los marcadores son propios.

## Evidence on Hand

- Hoja publicada «Submarinos Museos SNK 2025»: 160 filas y 25 columnas tras añadir `Video`.
- `data/submarines.json` (160 unidades, 27 con `videoUrl`), `data/config.json`, `data/i18n.json` (ES/EN) y `data/youtube.json` (60 vídeos de la lista).
- `data/youtube_matches.md`: informe legible del cruce vídeo↔unidad, con los casos dudosos y su motivo.
- 20 fotos reales de unidades, el logo del proyecto y los cinco iconos de situación en SVG.

**No existe** y no debe inventarse: testimonios, cifras de audiencia, precios, acreditaciones de museos ni datos que no estén en la hoja.

## Product Principles

1. **La hoja manda.** Un dato dudoso se corrige en la hoja y se reimporta; el código no inventa ni reescribe hechos.
2. **Se entra por el mapa y se queda por el expediente.** La primera pregunta es «¿dónde?»; el valor está en el detalle de la unidad.
3. **El estado físico es el dato diferencial.** A flote, en el agua, en tierra, cerrado o solo monumento: sin eso es otro listado de pines.
4. **Tiene que aguantar un móvil con prisa.** Estático, bilingüe y legible en la puerta del museo, con datos que cargan rápido.
5. **Lo firma elSnorkel.** Ante la duda entre una decisión anónima y una que reconozca el archivo y su comunidad, gana la segunda.

## Accessibility & Inclusion

- No hay un estándar formal declarado (WCAG u otro).
- Requisitos confirmados: bilingüe EN/ES con inglés primero y uso prioritario en móvil.
