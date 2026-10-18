# Submarinos Museo del Mundo // Archivo Naval

Directorio táctico e interactivo de los submarinos preservados como museo en todo el mundo.
Sitio estático (HTML + CSS + JavaScript vanilla) con un mapa Leaflet y un dossier desplegable
para cada unidad, pensado primero para móvil.

- **Sitio en vivo:** https://submarinos-museo-del-mundo.elsnorkel.com
- **Repositorio:** https://github.com/elsnorkelcom/submarinos_museo

## Cómo funciona

- `index.html` — estructura de la página (héroe, destacados, mapa, dossier, registro, intel y acerca de).
- `assets/css/app.css` — sistema visual completo (táctico/oscuro, mobile first).
- `assets/js/app.js` — carga de datos, mapa, filtros, registro y dossier.
- `data/submarines.json` — 160 unidades normalizadas con coordenadas, tipo, país, museo y media.
- `data/config.json` — textos, logo, imagen de héroe y redes sociales.
- `data/i18n.json` — diccionario de la interfaz en español e inglés.
- `scripts/import_sheets.py` — genera los JSON a partir de las hojas publicadas de Google Sheets.
- `scripts/make_coins.py` — genera las monedas SVG de las 5 situaciones del museo.

El sitio **no** consulta Google Sheets en tiempo de ejecución: lee siempre los JSON locales,
por lo que la oferta puede actualizarse por lotes sin tocar el frontend.

### Mapa

- Leaflet 1.9.4 + Leaflet.markercluster.
- Teselas oscuras de Esri (`World_Dark_Gray_Base` + `World_Dark_Gray_Reference`).
- Marcadores con icono por tipo (diésel, nuclear, eléctrico, manivela) y agrupación por zona.
- Halo de selección para localizar una unidad incluso dentro de un clúster.

### Destacados

La sección `// 01 — DESTACADOS` reúne las unidades clave. Se consideran destacadas las que
tienen `Featured=TRUE` en la hoja **y** las que aportan media reproducible (video). Cada tarjeta
abre el dossier correspondiente y centra el mapa en la unidad.

### Situación del museo

Cada unidad puede marcarse con una **situación**, identificada por uno de los 5 iconos del
proyecto. En la hoja escribe la variable (o pega la URL del icono: el importador la reconoce):

| Variable | Significado | Moneda |
| --- | --- | --- |
| `flote` | A flote, en el agua | `assets/img/coins/flote.svg` |
| `agua` | En el agua (varado/sumergido) | `assets/img/coins/agua.svg` |
| `tierra` | En tierra, en seco y visitable | `assets/img/coins/tierra.svg` |
| `cerrado` | Bajo techo / cerrado, no visitable | `assets/img/coins/cerrado.svg` |
| `monumento` | Solo queda el monumento | `assets/img/coins/monumento.svg` |

El importador también acepta sinónimos (`afloat`, `water`, `on land`, `under cover`, `monument`)
y busca la variable en una columna `Situacion`/`Situation`, en `Icon URL` o en `Marker Icon`.

Con esa variable se filtra el mapa (chips con el icono) y se marca el dossier, el registro y el
propio marcador. Las monedas tipo *challenge coin* se generan con `python scripts/make_coins.py`
a partir de los mismos dibujos, en SVG sin recursos de terceros.

### Filtros

Sobre el mapa hay filtros combinables por tipo, país, búsqueda libre, situación y estado:

- **SITUACIÓN** — A flote, En el agua, En tierra, Bajo techo, Solo monumento (multi-selección).
- **CON MEDIA / CON VIDEO** — media disponible o video reproducible.
- **PRÓXIMAMENTE** — unidades anunciadas pero todavía no visitables.

### Dossier

Al seleccionar una unidad (en el mapa, en el registro o en destacados) se abre su expediente:
tipo con icono, estado, ubicación, especificaciones y media. La media admite imagen o
video público de YouTube; si no hay media se muestra un plano técnico provisional.

### Idiomas (ES / EN)

El sitio es bilingüe. El conmutador `ES | EN` está en la cabecera y la elección se guarda en
`localStorage`; también se puede forzar con `?lang=en` (el parámetro se sincroniza en la URL).

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

El importador busca la columna de video por nombre (`Video`, `Video URL`, `YouTube`, etc.),
así que puedes añadirla cuando quieras sin tocar el código. Los destacados de la hoja de
configuración (`featured_submarine_names`) se marcan automáticamente junto con `Featured=TRUE`.
El año del `footer_text` se normaliza al año actual en cada importación.

## Estructura

```text
index.html
favicon.png
CNAME
data/
  submarines.json
  config.json
  i18n.json
assets/
  css/app.css
  js/app.js
  img/logo.jpg
  img/cobia.webp
  img/coins/          # monedas SVG por situación
  img/situation/      # iconos originales de referencia (legacy/)
scripts/
  import_sheets.py
  make_coins.py
```

## Créditos y licencias

Proyecto de [elSnorkel.com](https://www.elsnorkel.com). Los datos se mantienen en una hoja
de cálculo propia y se publican como JSON estático.

Componentes de terceros usados en el frontend:

- Leaflet v1.9.4 https://leafletjs.com (BSD-2-Clause)
- Leaflet.markercluster https://github.com/Leaflet/Leaflet.markercluster (MIT)
- Teselas de Esri (Canvas World Dark Gray), sujetas a los términos de Esri.
- Tipografías Barlow Condensed, IBM Plex Mono e Inter vía Google Fonts (SIL OFL).

El diseño toma como referencia el lenguaje visual de los HUD militares/tácticos; no incluye
imágenes ni recursos con derechos de terceros.
