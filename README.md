# Submarinos Museo del Mundo // Archivo Naval

Directorio táctico e interactivo de los submarinos preservados como museo en todo el mundo.
Sitio estático (HTML + CSS + JavaScript vanilla) con un mapa Leaflet y un dossier desplegable
para cada unidad, pensado primero para móvil.

- **Sitio en vivo:** https://submarinos-museo-del-mundo.elsnorkel.com
- **Repositorio:** https://github.com/elsnorkelcom/submarinos_museo

## Cómo funciona

- `index.html` — estructura de la página (héroe, mapa, dossier, destacados, registro, cronología, intel y origen).
- `assets/css/app.css` — sistema visual completo (táctico/oscuro, mobile first).
- `assets/js/app.js` — carga de datos, mapa, filtros, cronología, registro, dossier y compartir.
- `data/submarines.json` — 160 unidades normalizadas con coordenadas, tipo, país, museo y media.
- `data/config.json` — textos, logo, imagen de héroe, canal de vídeo y redes sociales.
- `data/i18n.json` — diccionario de la interfaz en español e inglés.
- `assets/data/borders-110m.geojson` — fronteras políticas Natural Earth 1:110m (dominio público).
- `scripts/import_sheets.py` — genera los JSON a partir de las hojas publicadas de Google Sheets.
- `scripts/make_coins.py` — genera las monedas SVG de las 5 situaciones del museo.

El orden de las secciones es: **héroe → 01 mapa → 02 expediente → 03 destacados → 04 registro →
05 cronología → 06 intel → 07 origen**. El mapa va justo debajo del héroe porque es la puerta de
entrada al archivo; el expediente lo acompaña para no perder de vista lo que se pulsa en el mapa.

El sitio **no** consulta Google Sheets en tiempo de ejecución: lee siempre los JSON locales,
por lo que la oferta puede actualizarse por lotes sin tocar el frontend.

### Héroe: visor de periscopio

El héroe monta tres capas decorativas (todas `aria-hidden`, sin coste de accesibilidad):

- **Canvas de ambiente** (`#hero-canvas`): nieve marina, burbujas y un eco de sonar dibujados
  en 2D. Se pausa cuando el héroe sale de pantalla, cuando la pestaña se oculta y con
  `prefers-reduced-motion` (dibuja un único fotograma fijo).
- **Visor de periscopio** (`.periscope`): cristal tintado, cáusticas, burbujas, un submarino
  de perfil (símbolo SVG `#i-sub-side`, dibujado a mano), anillo de demoras, retículo con
  cruz y corchetes, y las lecturas **BRG** / **DEP**.
- **Paralaje de scroll**: la variable `--hero-scroll` desplaza el fondo y el bloque de texto;
  las lecturas BRG/DEP se derivan del scroll para dar sensación de inmersión.

No usa imágenes de terceros: el perfil del submarino es un SVG propio y el resto se resuelve
con CSS y canvas.

#### Vídeo de fondo (opcional)

El héroe admite un vídeo de fondo, siguiendo el patrón de la Royal Navy: **una codificación de
escritorio y otra más liviana para móvil**, con la imagen del héroe como póster.

| Ajuste en la hoja | Efecto |
| --- | --- |
| `hero_video` | Vídeo que se usa a partir de 760 px. Deja el valor vacío para no usar vídeo. |
| `hero_video_mobile` | Vídeo alternativo por debajo de 760 px. Si está vacío se usa el de escritorio. |

El valor puede ser una URL `http(s)` o una ruta relativa dentro de `assets/` (por ejemplo
`assets/video/hero.mp4`). Si no hay vídeo configurado el `<video>` queda oculto y se ve la
imagen de siempre.

Comportamiento: el vídeo va dentro de `.hero__bg`, así que hereda el filtro, la opacidad y el
paralaje de la imagen. Se reproduce solo cuando el héroe está en pantalla, la pestaña está
visible y **no** hay `prefers-reduced-motion`; en cualquier otro caso se queda el póster.

### Mapa

- Leaflet 1.9.4 + Leaflet.markercluster.
- Noche: Esri `World_Dark_Gray_Base` con filtro azul-negro + `World_Dark_Gray_Reference`.
- Día: Esri `World_Street_Map` a color real (las etiquetas van dentro de la propia tesela).
- Fronteras políticas: capa vectorial local `assets/data/borders-110m.geojson` (Natural Earth 1:110m, dominio público). Se muestra hasta zoom 5 y se oculta después para no duplicar los límites de la base.
- Marcador = icono de situación del museo (o `unknown` si falta el dato); el aro luminoso que lo rodea = propulsión.
- Agrupación por zona y halo de selección para localizar una unidad incluso dentro de un clúster.

### Destacados

La sección `// 03 — DESTACADOS` funciona como un catálogo: un **cartel** grande con la unidad
más fotogénica y debajo **filas horizontales** con scroll-snap.

Se consideran destacadas **solo** las unidades marcadas con `Featured=TRUE` en la hoja (o en la
lista `featured_submarine_names`). Tener vídeo **no** convierte una unidad en destacada: el
vídeo tiene fila propia (*Con vídeo*), porque al rellenar los vídeos de la lista de YouTube
Destacados pasaba de 11 a 35 unidades. Cualquier tarjeta abre su dossier; el cartel ofrece
además *Ver en el mapa*.

Las filas se generan solas a partir de los datos:

| Grupo | Filas | Qué agrupa |
| --- | --- | --- |
| — | Destacados | Unidades marcadas en la hoja (6 fichas, las que tienen imagen primero). |
| — | Con vídeo | Unidades con `videoUrl` (o `URL` de YouTube): 27 hoy. |
| POR PROPULSIÓN | Diésel, Nuclear, Eléctrico, Manivela | El `typeKey` de cada unidad. |
| POR ÉPOCA | Precursores, Gran Guerra, Entreguerras, Segunda Guerra, Guerra Fría, Modernos | Derivadas del año de botadura. |

Cada fila muestra hasta **6 fichas** (`RAIL_LIMIT` en `app.js`). Las de tipo y época llevan el
total en el botón *Ver todas*, que limpia los filtros, aplica el de esa fila y baja al registro.
Las de *Destacados* y *Con vídeo* son filas de escaparate: no llevan *Ver todas* porque su
listado completo vive en el registro, que se filtra por `featured` y por vídeo en la página de
registro. En escritorio hay flechas `‹ ›` a los lados (se ocultan si la fila no desborda); en
móvil se desliza con el dedo.

#### Épocas

Las épocas se derivan de `launchYear`, así que **no hace falta ninguna columna nueva** en la
hoja: en cuanto una unidad tiene año, aparece en su fila y en el filtro.

| Época | Rango |
| --- | --- |
| `precursores` | ≤ 1899 |
| `gran-guerra` | 1900 – 1918 |
| `entreguerras` | 1919 – 1938 |
| `segunda-guerra` | 1939 – 1945 |
| `guerra-fria` | 1946 – 1991 |
| `modernos` | 1992 → |

Las filas y las opciones del filtro solo aparecen si el tramo tiene unidades. Hoy 65 de las 160
unidades no traen año, así que quedan fuera de las filas de época (sí están en las de propulsión
y en el registro).

### Situación del museo

Cada unidad puede marcarse con una **situación**, identificada por uno de los 5 iconos del
proyecto. En la hoja escribe la variable (o pega la URL del icono: el importador la reconoce):

| Variable | Significado | Color | Marcador |
| --- | --- | --- | --- |
| `flote` | A flote, en el agua | `#8b90a3` | `assets/img/situation/flote.svg` |
| `agua` | En el agua (varado/sumergido) | `#1a8cff` | `assets/img/situation/agua.svg` |
| `tierra` | En tierra, en seco y visitable | `#da00da` | `assets/img/situation/tierra.svg` |
| `cerrado` | Bajo techo / cerrado, no visitable | `#00d933` | `assets/img/situation/cerrado.svg` |
| `monumento` | Solo queda el monumento | `#b52000` | `assets/img/situation/monumento.svg` |

El importador también acepta sinónimos (`afloat`, `water`, `on land`, `under cover`, `monument`)
y busca la variable en una columna `Situacion`/`Situation`, en `Icon URL` o en `Marker Icon`.

Con esa variable se filtra el mapa (chips con el icono), se tiñe el dossier y el registro, y
**la unidad usa el icono de situación como marcador del mapa**. Las unidades sin situación
documentada usan `assets/img/situation/unknown.svg` y conservan el aro de propulsión. Hoy la
hoja solo trae situación para 20 de las 160 unidades; las otras 140 quedan como *sin clasificar*
hasta rellenar la columna.

Las antiguas monedas tipo *challenge coin* siguen en `assets/img/coins/` como material legacy,
pero el mapa ya no las usa. Se generan con `python scripts/make_coins.py` a partir de los mismos
dibujos, en SVG sin recursos de terceros.

**Cambiar los iconos por un rediseño.** El script solo sobrescribe los SVG que llevan su sello,
así que el arte entregado a mano nunca se pierde:

```bash
# el diseñador deja sus 5 SVG ya terminados en assets/img/coins/<situacion>.svg
# (y su versión de marcador en assets/img/coins/marker/), y a partir de ahí el
# script los respeta y solo regenera lo que falte.
python scripts/make_coins.py

# si lo que quieres es volver a generar TODO desde los dibujos del script:
python scripts/make_coins.py --force
```

Si el rediseño llega como glifo vectorial sobre rejilla de 24×24, lo más cómodo es pegar cada
glifo en el diccionario `GLYPHS` de `scripts/make_coins.py` y ejecutar el script: la moneda y su
versión de marcador salen ya con el acabado metálico, las letras y el color de cada situación.

### Filtros

Sobre el mapa hay filtros combinables por tipo, país, búsqueda libre, situación y estado:

- **SITUACIÓN** — A flote, En el agua, En tierra, Bajo techo, Solo monumento (multi-selección).
- **ÉPOCA** — un tramo histórico derivado del año de botadura (solo los tramos con unidades).
- **CON MEDIA / CON VIDEO** — media disponible o video reproducible.
- **PRÓXIMAMENTE** — unidades anunciadas pero todavía no visitables.

### Dossier

Al seleccionar una unidad (en el mapa, en el registro o en destacados) se abre su expediente:
tipo con icono, estado, ubicación, especificaciones y media. La media admite imagen o
video público de YouTube; si no hay media se muestra una imagen provisional de «próximamente».

### Cronología

La sección `// 05 — CRONOLOGÍA` dibuja la línea de tiempo real del archivo: **una fila por época**
y, dentro de cada fila, **una columna por año** a escala (ancho fijo por año). Los puntos se apilan
hacia arriba, así que el alto de una columna es la densidad: cuántas unidades se botaron ese año.

- La fila arranca en el **primer año con unidad**, no en el inicio nominal de la época, para no
  arrastrar décadas vacías.
- Debajo de cada fila va la **regla de décadas**; las celdas parciales (menos de 3 años) van sin
  rótulo para que el ancho cuadre exactamente con las columnas de años.
- Una **lectura fija** (readout) muestra la unidad bajo el cursor o el foco: nombre, año, tipo y
  lugar. Se usa una lectura fija en vez de una tarjeta flotante porque en móvil la tarjeta se
  recortaba contra el borde.
- Pulsar un punto abre el expediente de esa unidad; `FILTRAR` aplica la época al mapa y al registro
  (la propia línea se atenúa y el aviso confirma la operación).
- Las unidades **sin fecha** van a una bandeja plegable `SIN FECHA` al final del eje, con sus chips
  clicables.

Las épocas son las mismas que las del filtro y se derivan de `launchYear` (ver la tabla en
*Destacados → Épocas*), así que no hace falta ninguna columna nueva en la hoja.

### Compartir y redes

Hay dos filas de compartir, y en ambas los destinos son **enlaces de verdad** (funcionan con clic
normal, teclado, «abrir en pestaña nueva» y menú contextual):

- En el **expediente** — comparte esa unidad concreta, con `?unit=<id>` en la URL.
- En el **pie** — comparte el archivo entero.

Destinos: WhatsApp, Telegram, X, Facebook, LinkedIn y correo electrónico, más **copiar enlace**.
En móvil aparece además un botón **Compartir…** que abre el menú nativo del sistema
(`navigator.share`). El expediente no repite el botón de copiar porque ya lo tiene en sus acciones.

> **Nota sobre las previsualizaciones.** Los enlaces `?unit=<id>` abren el expediente correcto,
> pero la tarjeta que muestran WhatsApp o X es la genérica del archivo: los rastreadores de esas
> redes no ejecutan JavaScript y solo leen las etiquetas `og:` del HTML. Para tener tarjetas por
> unidad haría falta prerenderizar una página estática por submarino; es una ampliación posible
> (un generador que escriba 160 HTML con sus propias `og:`), pero no está hecha.

Las **redes del proyecto** se pintan solas en el pie a partir de `data/config.json → social`
(y por tanto de la hoja de configuración):

| Ajuste en la hoja | Red |
| --- | --- |
| `website_url` | WEB |
| `facebook_url` | FACEBOOK |
| `instagram_url` | INSTAGRAM |
| `twitter_url` | X |
| `linkedin_url` | LINKEDIN |
| `youtube_url` | YOUTUBE |
| `tiktok_url` | TIKTOK |

Una casilla vacía simplemente no se pinta. El importador trae de respaldo las redes ya conocidas
del proyecto (`SOCIAL_DEFAULTS`), de modo que **regenerar los datos no borra los enlaces** si la
hoja todavía no tiene esas filas; la hoja siempre manda.

#### Canal de vídeo

Al final de `// 06 — INTEL` hay un panel con la **lista de reproducción de YouTube** del proyecto
(`youtube_playlist` en la hoja; por defecto la lista de *Submarinos Museos Del Mundo*). El panel
es una **fachada**: no se carga absolutamente nada de YouTube —ni cookies ni peticiones— hasta que
el visitante pulsa *Reproducir la lista*. En ese momento se inyecta el reproductor con
`youtube-nocookie.com` en 16:9.

`youtube_title` permite fijar el rótulo de la fachada; si se deja vacío se usa el nombre de la
lista por defecto.

### Idiomas (ES / EN)

El sitio es bilingüe. El conmutador `ES | EN` está en la cabecera y la elección se guarda en
`localStorage`; también se puede forzar con `?lang=en` (el parámetro se sincroniza en la URL).

El idioma se resuelve en este orden: `?lang=` → lo elegido antes → **el del navegador** → español.
Es decir, si el navegador viene en inglés el sitio entra directamente en inglés.

Cuando el navegador prefiere un idioma que no está catalogado (ruso, francés…) aparece abajo un
**aviso discreto** que ofrece el archivo en inglés, el idioma puente:

- **VER EN INGLÉS** cambia el idioma y lo recuerda.
- **AHORA NO** lo descarta y no vuelve a salir (se guarda en `snk-lang-nudge`).

El aviso nunca aparece si el idioma viene forzado por `?lang=` o si ya se eligió uno a mano, así
que no molesta a quien ya decidió. No se usa ningún traductor automático: las traducciones siguen
siendo las de `data/i18n.json`, escritas para la interfaz táctica.

- Los textos de la interfaz viven en `data/i18n.json` (`es` y `en`), aplicados por
  `data-i18n` / `data-i18n-attr` en el HTML y por la función `t()` en JavaScript.
- Los nombres de país se traducen con las claves `country.*`.
- Los textos de `data/config.json` (subtítulo del héroe, título y texto de «acerca de», pie)
  usan la versión inglesa de `config.*` cuando el idioma es `en`.
- El **contenido de las fichas** (nombre, museo, ciudad, clase y descripción) se muestra tal
  como llega de la hoja. Para traducirlo, añade columnas en inglés (por ejemplo
  `Name_EN`, `Description_EN`) y amplía `scripts/import_sheets.py`.

Para añadir otro idioma: copia el bloque `en` en `data/i18n.json`, traduce los valores y añade
el código a la lista `LANGS` de `assets/js/app.js` y un botón en el conmutador de la cabecera.

## Desarrollo local

El sitio debe servirse por HTTP: `file://` bloquea la carga de los JSON.

```bash
python -m http.server 8000
# Abrir http://localhost:8000
```

## Regenerar los datos

```bash
python scripts/import_sheets.py
```

Opcionalmente con CSV locales:

```bash
python scripts/import_sheets.py --points-file puntos.csv --config-file config.csv
```

### Vídeos de la lista de YouTube

Los vídeos de museo no se escriben a mano uno a uno: están en la lista pública del proyecto.
Dos scripts los traen y los cruzan con el archivo. Ninguno usa la API de datos ni credenciales.

```bash
# 1) Baja la lista curada (60 vídeos) a data/youtube.json
python scripts/import_youtube.py

# 2) Cruza cada vídeo con su unidad y prepara la hoja con la columna Video rellena
python scripts/match_youtube.py --hoja

# 3) Con la hoja ya actualizada, regenera los JSON del sitio
python scripts/import_sheets.py
```

`import_youtube.py` lee la página pública de la lista y sigue los tokens de continuación del
reproductor. Es una extracción de un solo uso: si YouTube cambia su HTML, se retoca el
extractor y el sitio no se entera. Con `--canal` añade también las subidas propias (segunda
etapa; hoy no hay).

`match_youtube.py` puntúa cada vídeo contra las 160 unidades con cinco señales, de más a menos
fiable: nombre completo, numeral de casco (`U-995`, `Б-413`), nombre sin prefijo de armada,
museo y ciudad. Translitera cirílico y griego, pliega letras que NFKD no descompone (`ł`, `ø`,
`æ`) y exige que las coincidencias compactas sean ventanas de palabras enteras, para que
`marinemuseum` no case dentro de `submarinemuseum`.

| Archivo | Para qué |
| --- | --- |
| `data/youtube.json` | Los 60 vídeos en crudo (título, canal, vistas, URL). |
| `data/youtube_matches.csv` | La propuesta por vídeo: unidad, puntaje, señal y alternativas. |
| `data/youtube_matches.md` | El mismo informe para leerlo de un tirón. |
| `data/hoja_con_videos.csv` | La hoja publicada con la columna `Video` rellena. Fuera de git. |

Los casos que el automático no puede decidir (un Seehund en el museo del U-10, un U-17 en el
museo del U-9) se fijan a mano en la tabla `DECISIONES` del script: se revisan una vez y quedan
documentados con su motivo. Hoy queda en **42 vídeos para 27 unidades** (un vídeo por unidad,
el primero de la lista curada).

Ruta hasta la hoja, que sigue siendo la fuente de verdad:

1. En Sheets: **Archivo → Importar → Insertar hoja nueva** con `data/hoja_con_videos.csv`.
2. Copiar la columna `Video` a la hoja de datos que lee el importador.
3. Comprobar que la hoja publicada ya trae la columna (el importador lee la versión publicada).
4. `python scripts/import_sheets.py`.

Vídeos que la lista destapa y **no tienen ficha** en el archivo (candidatos a añadir):

| Unidad | Museo |
| --- | --- |
| B-39 | Maritime Museum of San Diego |
| HMAS Otama | Western Port, Australia |
| U-17 | Technik Museum Speyer / Sinsheim |
| B-380 | Museo del objeto 825 GTS, Balaclava |

También aparecieron dos fichas a revisar: `SNK-003 K-434` y `SNK-008 U-434` son el mismo barco
(B-515, Tango, Hamburgo) duplicado, y `SNK-094 South Korea[edit]` tiene los datos cruzados
(ciudad Çanakkale, país Corea del Sur).

### Esquema de `data/submarines.json`

| Campo | Descripción |
| --- | --- |
| `id` | Identificador estable (slug) usado en `?unit=`. |
| `dossier` | Código de archivo, por ejemplo `SNK-001`. |
| `name` | Nombre de la unidad. |
| `typeKey` / `typeLabel` | Tipo normalizado y etiqueta en español. |
| `class` | Clase del submarino. |
| `country`, `city`, `museum` | Ubicación y museo. |
| `nationality` | Armada u origen. |
| `lat`, `lng` | Coordenadas. |
| `launchYear` | Año de botadura. |
| `image`, `videoUrl`, `link` | Media y enlace de la fuente. |
| `situation`, `situationLabel` | Situación del museo (`flote`, `agua`, `tierra`, `cerrado`, `monumento`) y su etiqueta. |
| `featured`, `afloat` | Destacado (columna `Featured` o lista `featured_submarine_names`) y si sigue a flote. |
| `status` | `open` o `coming-soon`. |
| `description` | Texto breve autogenerado. |

### Columnas de la hoja

El importador busca la columna de video por nombre (`Video`, `Video URL`, `YouTube`, `Youtube`,
`video_url`), así que se puede añadir cuando haga falta sin tocar el código. Van separadas:

- **`Video`** → vídeo (YouTube o fichero). Es lo que muestra el dossier y lo que llena la fila
  *Con vídeo* de Destacados.
- **`URL`** → enlace de *+Info* (el artículo del blog o la web del museo). Si `Video` está vacío
  y `URL` es un enlace de YouTube, el sitio lo usa como vídeo: así sigue funcionando la ficha
  que ya tenía el vídeo en `URL` antes de que existiera la columna.

Los destacados de la hoja de configuración (`featured_submarine_names`) se marcan
automáticamente junto con `Featured=TRUE`. El año del `footer_text` se normaliza al año actual
en cada importación.

En la hoja de **configuración** (columna `Setting` / `Value`) también se leen:

| Ajuste | Para qué |
| --- | --- |
| `hero_video` / `hero_video_mobile` | Vídeo de fondo del héroe (escritorio y móvil). |
| `youtube_playlist` | Lista de reproducción del panel de INTEL. |
| `youtube_title` | Rótulo de la fachada de esa lista (opcional). |
| `*_url` | Redes del pie (`website_url`, `facebook_url`, `instagram_url`, `twitter_url`, `linkedin_url`, `youtube_url`, `tiktok_url`). |

Los ajustes de vídeo y lista solo aceptan URLs `http(s)` o rutas `assets/...`, así que un valor
raro se ignora en vez de acabar en el atributo `src`. Los ajustes nuevos se buscan ignorando
mayúsculas y separadores (`youtube_playlist`, `Youtube Playlist` y `youtube-playlist` son lo
mismo), de modo que se pueden escribir con el nombre que resulte más cómodo en la hoja.

## Estructura

```text
index.html
favicon.png
CNAME
data/
  submarines.json
  config.json
  i18n.json
  youtube.json          # caché de la lista curada (60 vídeos)
  youtube_matches.csv   # propuesta de cruce vídeo -> unidad
  youtube_matches.md    # el mismo informe, legible
  hoja_con_videos.csv   # hoja con la columna Video rellena (fuera de git)
assets/
  css/app.css
  js/app.js
  img/logo-elsnorkel-2025.png
  img/placeholder-coming-soon.svg
  img/cobia.webp
  img/coins/          # monedas SVG por situación (moneda completa)
  img/coins/marker/   # versión de marcador para el mapa
  img/situation/      # iconos originales de referencia (legacy/)
scripts/
  import_sheets.py
  import_youtube.py
  match_youtube.py
  make_coins.py
```

## Créditos y licencias

Proyecto de [elSnorkel.com](https://www.elsnorkel.com). Los datos se mantienen en una hoja
de cálculo propia y se publican como JSON estático.

Componentes de terceros usados en el frontend:

- Leaflet v1.9.4 https://leafletjs.com (BSD-2-Clause)
- Leaflet.markercluster https://github.com/Leaflet/Leaflet.markercluster (MIT)
- Teselas de Esri (Canvas World Dark Gray para la noche, World Street Map para el día), sujetas a los términos de Esri.
- Tipografías Barlow Condensed, IBM Plex Mono e Inter vía Google Fonts (SIL OFL).

El diseño toma como referencia el lenguaje visual de los HUD militares/tácticos; no incluye
imágenes ni recursos con derechos de terceros.
