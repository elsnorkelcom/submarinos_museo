#!/usr/bin/env python3
"""Descarga la lista de vídeos de YouTube del proyecto y la cachea en data/.

La hoja de cálculo es la fuente de verdad del archivo (unidades, países,
años...), pero los vídeos de museo no están en la hoja: están en la lista
pública de YouTube. Este script los baja una vez y los deja en
`data/youtube.json` para que `match_youtube.py` pueda cruzarlos con las
unidades sin tener que volver a pedirlos a YouTube.

No usa la API de datos: lee la página pública y sigue los tokens de
continuación del reproductor. Es una extracción de un solo uso, así que la
fragilidad del scrapeo no afecta al sitio.

Uso:
    python scripts/import_youtube.py            # solo la lista curada
    python scripts/import_youtube.py --canal    # añade las subidas del canal
"""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "data" / "youtube.json"

LISTA_ID = "PL472EEE6B920640A5"
CANAL = "@elSnorkelcom"

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

CABECERAS = {
    "User-Agent": UA,
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

MAX_PAGINAS = 60
PAUSA = 0.6


def log(*partes):
    print(*partes, flush=True)


def descargar(url: str, datos: bytes | None = None, cabeceras: dict | None = None) -> str:
    peticion = urllib.request.Request(url, data=datos, headers={**CABECERAS, **(cabeceras or {})})
    with urllib.request.urlopen(peticion, timeout=45) as respuesta:
        return respuesta.read().decode("utf-8", "replace")


def datos_iniciales(html: str) -> dict | None:
    """Localiza el bloque ytInitialData contando llaves (el regex se corta)."""
    indice = html.find("ytInitialData")
    if indice == -1:
        return None

    inicio = html.find("{", indice)
    if inicio == -1:
        return None

    profundidad = 0
    en_cadena = False
    escapado = False

    for posicion in range(inicio, len(html)):
        caracter = html[posicion]

        if en_cadena:
            if escapado:
                escapado = False
            elif caracter == "\\":
                escapado = True
            elif caracter == '"':
                en_cadena = False
            continue

        if caracter == '"':
            en_cadena = True
        elif caracter == "{":
            profundidad += 1
        elif caracter == "}":
            profundidad -= 1
            if profundidad == 0:
                try:
                    return json.loads(html[inicio : posicion + 1])
                except json.JSONDecodeError as error:
                    log("  JSON inicial ilegible:", error)
                    return None

    return None


def configuracion(html: str) -> dict:
    clave = re.search(r'"INNERTUBE_API_KEY":"([^"]+)"', html)
    version = re.search(r'"INNERTUBE_CLIENT_VERSION":"([^"]+)"', html)
    return {
        "key": clave.group(1) if clave else "",
        "version": version.group(1) if version else "2.20240101.00.00",
    }


def cavar(nodo, *ruta, por_defecto=None):
    actual = nodo
    for clave in ruta:
        if isinstance(actual, dict) and clave in actual:
            actual = actual[clave]
        else:
            return por_defecto
    return actual


def texto(nodo) -> str:
    """Saca el texto de cualquiera de las formas que usa YouTube."""
    if isinstance(nodo, str):
        return nodo
    if isinstance(nodo, dict):
        if isinstance(nodo.get("content"), str):
            return nodo["content"]
        if isinstance(nodo.get("simpleText"), str):
            return nodo["simpleText"]
        carreras = nodo.get("runs")
        if isinstance(carreras, list):
            return "".join(carrera.get("text", "") for carrera in carreras if isinstance(carrera, dict))
    return ""


def etiquetas(nodo) -> list[str]:
    """Todas las cadenas visibles del bloque, en orden y sin repetir."""
    salida: list[str] = []

    def recorrer(actual):
        if isinstance(actual, dict):
            for clave, valor in actual.items():
                if clave in {"content", "simpleText", "text", "accessibilityText"}:
                    cadena = valor if isinstance(valor, str) else texto(valor)
                    if cadena and cadena not in salida:
                        salida.append(cadena)
                else:
                    recorrer(valor)
        elif isinstance(actual, list):
            for valor in actual:
                recorrer(valor)

    recorrer(nodo)
    return salida


def recorrer_buscando(nodo, clave: str, salida: list):
    if isinstance(nodo, dict):
        if clave in nodo:
            salida.append(nodo[clave])
        for valor in nodo.values():
            recorrer_buscando(valor, clave, salida)
    elif isinstance(nodo, list):
        for valor in nodo:
            recorrer_buscando(valor, clave, salida)
    return salida


def piezas(datos: dict) -> tuple[list[dict], list[str]]:
    """Extrae los vídeos y los tokens de continuación de una respuesta."""
    bloqueados = recorrer_buscando(datos, "lockupViewModel", [])
    planos = recorrer_buscando(datos, "playlistVideoRenderer", [])
    antiguos = recorrer_buscando(datos, "videoRenderer", [])

    videos: list[dict] = []

    for item in bloqueados:
        video_id = item.get("contentId") or ""
        if not video_id:
            continue
        meta = cavar(item, "metadata", "lockupMetadataViewModel", por_defecto={})
        titulo = texto(cavar(meta, "title", por_defecto={})) or texto(
            cavar(item, "metadata", "lockupMetadataViewModel", "title", por_defecto={})
        )
        videos.append(
            {
                "id": video_id,
                "titulo": titulo,
                "etiquetas": etiquetas(meta),
                "duracion": extraer_duracion(item),
                "url": f"https://www.youtube.com/watch?v={video_id}",
            }
        )

    for item in planos + antiguos:
        video_id = item.get("videoId") or ""
        if not video_id:
            continue
        videos.append(
            {
                "id": video_id,
                "titulo": texto(item.get("title", {})),
                "etiquetas": etiquetas(
                    {
                        "canal": item.get("shortBylineText") or item.get("ownerText"),
                        "publicado": item.get("publishedTimeText"),
                        "vistas": item.get("viewCountText"),
                    }
                ),
                "duracion": texto(item.get("lengthText", {})),
                "indice": item.get("index"),
                "url": f"https://www.youtube.com/watch?v={video_id}",
            }
        )

    tokens = [
        comando.get("token")
        for comando in recorrer_buscando(datos, "continuationCommand", [])
        if isinstance(comando, dict)
    ]

    return videos, [token for token in tokens if token]


def extraer_duracion(item: dict) -> str:
    insignias = recorrer_buscando(item, "thumbnailOverlayBadgeViewModel", [])
    for insignia in insignias:
        for texto_visible in recorrer_buscando(insignia, "text", []):
            cadena = texto(texto_visible)
            if cadena and ":" in cadena:
                return cadena
    return ""


def continuar(cfg: dict, token: str) -> dict | None:
    url = f"https://www.youtube.com/youtubei/v1/browse?key={cfg['key']}&prettyPrint=false"
    cuerpo = json.dumps(
        {
            "context": {
                "client": {
                    "clientName": "WEB",
                    "clientVersion": cfg["version"],
                    "hl": "es",
                    "gl": "ES",
                }
            },
            "continuation": token,
        }
    ).encode("utf-8")

    try:
        respuesta = descargar(
            url,
            datos=cuerpo,
            cabeceras={"Content-Type": "application/json", "X-Youtube-Client-Name": "1"},
        )
    except urllib.error.HTTPError as error:
        log("  continuación rechazada:", error.code)
        return None

    try:
        return json.loads(respuesta)
    except json.JSONDecodeError:
        return None


def recolectar(etiqueta: str, url: str) -> list[dict]:
    log(f"\n== {etiqueta} ==")
    log("  bajando", url)

    html = descargar(url)
    cfg = configuracion(html)
    datos = datos_iniciales(html)

    if datos is None:
        log("  no se encontró ytInitialData")
        return []

    if not cfg["key"]:
        log("  aviso: sin INNERTUBE_API_KEY, solo habrá la primera página")

    videos: list[dict] = []
    vistos: set[str] = set()
    usados: set[str] = set()

    def sumar(nuevos):
        anadidos = 0
        for video in nuevos:
            if video["id"] in vistos:
                continue
            vistos.add(video["id"])
            videos.append(video)
            anadidos += 1
        return anadidos

    nuevos, tokens = piezas(datos)
    sumar(nuevos)
    log(f"  página 1: {len(nuevos)} vídeos ({len(videos)} únicos)")

    pagina = 1
    while tokens and pagina < MAX_PAGINAS:
        token = next((candidato for candidato in tokens if candidato not in usados), "")
        if not token:
            break
        usados.add(token)

        time.sleep(PAUSA)
        respuesta = continuar(cfg, token)
        if respuesta is None:
            break

        nuevos, tokens = piezas(respuesta)
        anadidos = sumar(nuevos)
        pagina += 1
        log(f"  página {pagina}: +{anadidos} ({len(videos)} únicos, {len(tokens)} tokens)")

        if not anadidos:
            break

    return videos


def main() -> int:
    con_canal = "--canal" in sys.argv

    lista = recolectar("LISTA", f"https://www.youtube.com/playlist?list={LISTA_ID}")
    canal = recolectar("CANAL", f"https://www.youtube.com/{CANAL}/videos") if con_canal else []

    salida = {
        "fuente": {
            "lista_id": LISTA_ID,
            "lista_url": f"https://www.youtube.com/playlist?list={LISTA_ID}",
            "canal": CANAL,
            "canal_url": f"https://www.youtube.com/{CANAL}",
            "descargado": time.strftime("%Y-%m-%dT%H:%M:%S"),
        },
        "lista": lista,
        "canal": canal,
    }

    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    DESTINO.write_text(json.dumps(salida, ensure_ascii=False, indent=2), encoding="utf-8")

    log("\n== RESUMEN ==")
    log(f"  lista: {len(lista)} vídeos")
    if con_canal:
        log(f"  canal: {len(canal)} vídeos (segunda etapa)")
    log(f"  escrito: {DESTINO.relative_to(RAIZ)}")

    for video in lista[:5]:
        log("   ·", video["id"], "|", video["titulo"][:70])

    return 0


if __name__ == "__main__":
    sys.exit(main())
