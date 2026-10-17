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
- `scripts/import_sheets.py` — genera los JSON a partir de las hojas publicadas de Google Sheets.

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

### Filtros

Sobre el mapa hay filtros combinables por tipo, país, búsqueda libre y estado:

- **CON MEDIA / CON VIDEO** — media disponible o video reproducible.
- **A FLOTE / EN SECO** — mutuamente excluyentes; muestran unidades aún en el agua o ya en tierra.
- **PRÓXIMAMENTE** — unidades anunciadas pero todavía no visitables.

### Dossier

Al seleccionar una unidad (en el mapa, en el registro o en destacados) se abre su expediente:
tipo con icono, estado, ubicación, especificaciones y media. La media admite imagen o
video público de YouTube; si no hay media se muestra un plano técnico provisional.

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
assets/
  css/app.css
  js/app.js
  img/logo.jpg
  img/cobia.webp
scripts/
  import_sheets.py
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
